import React, { useState } from 'react';
import { Monitor, Plus, Trash2 } from 'lucide-react';
import { PanelHeader } from '../../components/layout/AdminLayout';
import { Button, LinkButton } from '../../components/ui/Button';
import { EmptyState, Spinner } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Field';
import { useFeedback } from '../../components/ui/Feedback';
import { useCollection } from '../../hooks/useCollection';
import { useAuth } from '../../context/AuthContext';
import { barProductsQuery, createProduct, deleteProduct, updateProduct } from '../../services/barProducts';
import { formatPrice } from '../../lib/format';
import type { BarProduct } from '../../types';

export const BarPanel: React.FC = () => {
  const { roles } = useAuth();
  const { toast, confirm } = useFeedback();
  const { data: products, loading } = useCollection<BarProduct>(barProductsQuery(), []);
  const [draft, setDraft] = useState({ name: '', price: '', order: '' });

  const isSuperAdmin = roles.includes('superadmin');

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const price = Number.parseFloat(draft.price);
    const order = Number.parseInt(draft.order || String(products.length + 1), 10);
    if (Number.isNaN(price) || Number.isNaN(order)) {
      toast('El preu i l\'ordre han de ser números.', 'error');
      return;
    }

    await createProduct({ name: draft.name.trim(), price, order });
    setDraft({ name: '', price: '', order: '' });
    toast('Producte afegit.');
  };

  const handleDelete = async (product: BarProduct) => {
    const ok = await confirm({
      title: 'Esborrar producte',
      message: `${product.name} desapareixerà del TPV.`,
      confirmLabel: 'Esborrar',
      destructive: true,
    });
    if (ok) await deleteProduct(product.id);
  };

  return (
    <>
      <PanelHeader
        title="Barra"
        description={
          isSuperAdmin
            ? 'Els productes i el seu ordre són els que surten al TPV, en aquest mateix ordre.'
            : 'Consulta la carta i obre el TPV per començar a cobrar.'
        }
        actions={
          <LinkButton to="/barra/tpv" variant="secondary">
            <Monitor size={16} /> Obrir el TPV
          </LinkButton>
        }
      />

      {!isSuperAdmin ? (
        loading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <EmptyState
            title="Encara no hi ha cap producte a la carta"
            description="Quan la comissió l'hagi preparada, els podràs cobrar des del TPV."
            action={
              <LinkButton to="/barra/tpv">
                <Monitor size={16} /> Obrir el TPV
              </LinkButton>
            }
          />
        ) : (
          <section className="max-w-3xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Carta</h2>
              <LinkButton to="/barra/tpv">
                <Monitor size={16} /> Obrir el TPV i cobrar
              </LinkButton>
            </div>
            <ul className="grid gap-px overflow-hidden border border-hairline bg-hairline sm:grid-cols-2">
              {products.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-4 bg-white px-5 py-4">
                  <span className="font-medium text-ink">{product.name}</span>
                  <span className="font-mono text-sm font-semibold text-ink">{formatPrice(product.price)}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      ) : (
        <>
          <form onSubmit={handleAdd} className="mb-8 grid max-w-2xl gap-3 sm:grid-cols-[1fr_7rem_6rem_auto] sm:items-end">
            <Input
              label="Nom"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Cervesa"
              required
            />
            <Input
              label="Preu (€)"
              type="number"
              step="0.01"
              min="0"
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: event.target.value })}
              required
            />
            <Input
              label="Ordre"
              type="number"
              min="0"
              value={draft.order}
              onChange={(event) => setDraft({ ...draft, order: event.target.value })}
              placeholder={String(products.length + 1)}
            />
            <Button type="submit" className="h-[46px]">
              <Plus size={16} /> Afegir
            </Button>
          </form>

          {loading ? (
            <Spinner />
          ) : products.length === 0 ? (
            <EmptyState title="Encara no hi ha cap producte" description="Afegeix-ne un per començar a cobrar." />
          ) : (
            <ul className="max-w-2xl border-t border-hairline">
              {products.map((product) => (
                <li key={product.id} className="flex items-center gap-4 border-b border-hairline py-3">
                  <input
                    type="number"
                    value={product.order}
                    onChange={(event) => updateProduct(product.id, { order: Number(event.target.value) })}
                    aria-label={`Ordre de ${product.name}`}
                    className="w-16 border border-hairline bg-white px-2 py-1.5 text-sm text-muted"
                  />
                  <span className="flex-grow font-medium text-ink">{product.name}</span>
                  <span className="font-mono text-sm text-muted">{formatPrice(product.price)}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(product)}
                    aria-label={`Esborrar ${product.name}`}
                    className="rounded p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
};
