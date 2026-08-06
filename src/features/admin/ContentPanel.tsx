import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PanelHeader } from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import { useFeedback } from '../../components/ui/Feedback';
import { useSiteContent } from '../../hooks/useSiteContent';
import { saveContent } from '../../services/content';
import type { ProgramEntry, SiteContent } from '../../types';

export const ContentPanel: React.FC = () => {
  const { content, loading } = useSiteContent();
  const { toast } = useFeedback();
  const [draft, setDraft] = useState<SiteContent>(content);
  const [saving, setSaving] = useState(false);

  // Només sincronitzem un cop carregat, per no trepitjar el que s'està editant.
  useEffect(() => {
    if (!loading) setDraft(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const patch = (values: Partial<SiteContent>) => setDraft((prev) => ({ ...prev, ...values }));

  const patchEntry = (index: number, values: Partial<ProgramEntry>) =>
    patch({
      programa: (draft.programa ?? []).map((entry, i) => (i === index ? { ...entry, ...values } : entry)),
    });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveContent(draft);
      toast('Contingut desat. Ja es veu a la web.');
    } catch (error) {
      console.error(error);
      toast("No s'ha pogut desar.", 'error');
    }
    setSaving(false);
  };

  const entries = draft.programa ?? [];

  return (
    <form onSubmit={handleSubmit}>
      <PanelHeader
        title="Contingut de la web"
        description="Tot això surt directament a la portada, al programa i a la pàgina de la comissió."
        actions={
          <Button type="submit" disabled={saving}>
            {saving ? 'Desant…' : 'Desar canvis'}
          </Button>
        }
      />

      <div className="flex max-w-2xl flex-col gap-8">
        <section className="flex flex-col gap-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Portada</h2>
          <Input
            label="Títol principal"
            value={draft.hero_title}
            onChange={(event) => patch({ hero_title: event.target.value })}
            required
          />
          <Input
            label="Subtítol"
            hint="Aquí hi van les dates."
            value={draft.hero_subtitle}
            onChange={(event) => patch({ hero_subtitle: event.target.value })}
            required
          />
        </section>

        <section className="flex flex-col gap-5 border-t border-hairline pt-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brand">La Comi</h2>
          <Textarea
            label="Qui som"
            rows={10}
            value={draft.info_text}
            onChange={(event) => patch({ info_text: event.target.value })}
            required
          />
        </section>

        <section className="flex flex-col gap-5 border-t border-hairline pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Programa d&apos;actes</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                patch({ programa: [...entries, { day: '', time: '', title: '', detail: '' }] })
              }
            >
              <Plus size={14} /> Afegir acte
            </Button>
          </div>

          <Input
            label="Introducció del programa"
            value={draft.programa_intro ?? ''}
            onChange={(event) => patch({ programa_intro: event.target.value })}
          />

          {entries.length === 0 && (
            <p className="text-sm text-muted">
              Encara no hi ha cap acte. Mentre estigui buit, la web mostra només el cartell.
            </p>
          )}

          {entries.map((entry, index) => (
            <div key={index} className="flex flex-col gap-3 border border-hairline bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_7rem_auto] sm:items-end">
                <Input
                  label="Dia"
                  placeholder="Divendres 7 d'agost"
                  value={entry.day}
                  onChange={(event) => patchEntry(index, { day: event.target.value })}
                />
                <Input
                  label="Hora"
                  placeholder="23:00"
                  value={entry.time}
                  onChange={(event) => patchEntry(index, { time: event.target.value })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Esborrar acte"
                  onClick={() => patch({ programa: entries.filter((_, i) => i !== index) })}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <Input
                label="Acte"
                placeholder="Orquestra Mediterrània"
                value={entry.title}
                onChange={(event) => patchEntry(index, { title: event.target.value })}
              />
              <Input
                label="Detall (opcional)"
                placeholder="A la plaça. Entrada lliure."
                value={entry.detail ?? ''}
                onChange={(event) => patchEntry(index, { detail: event.target.value })}
              />
            </div>
          ))}
        </section>

        <div className="border-t border-hairline pt-6">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? 'Desant…' : 'Desar canvis'}
          </Button>
        </div>
      </div>
    </form>
  );
};
