import React, { useMemo, useState } from 'react';
import { Mail, Search, Trash2 } from 'lucide-react';
import { PanelHeader } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, Spinner } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Field';
import { controlClasses } from '../../components/ui/controlClasses';
import { Modal } from '../../components/ui/Modal';
import { useFeedback } from '../../components/ui/Feedback';
import { useCollection } from '../../hooks/useCollection';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../config/roles';
import { addRole, cancelInvite, inviteByEmail, removeRole, roleInvitesCollection, usersCollection } from '../../services/users';
import { cn } from '../../lib/cn';
import type { AppUser, RoleInvite, UserRole } from '../../types';

export const UsersPanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { toast, confirm } = useFeedback();
  const [search, setSearch] = useState('');
  const [inviting, setInviting] = useState(false);

  const { data: users, loading } = useCollection<AppUser>(usersCollection(), []);
  const { data: invites } = useCollection<RoleInvite>(roleInvitesCollection(), []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const sorted = [...users].sort((a, b) => (a.name ?? a.email ?? '').localeCompare(b.name ?? b.email ?? '', 'ca'));
    if (!needle) return sorted;
    return sorted.filter((user) =>
      `${user.name ?? ''} ${user.email ?? ''}`.toLowerCase().includes(needle),
    );
  }, [users, search]);

  const toggleRole = async (user: AppUser, role: UserRole, enabled: boolean) => {
    // Evita que el superadmin es tregui el propi accés i deixi la web sense ningú.
    if (!enabled && role === 'superadmin' && user.id === currentUser?.uid) {
      toast('No et pots treure el rol de Super-Admin a tu mateix.', 'error');
      return;
    }
    await (enabled ? addRole(user.id, role) : removeRole(user.id, role));
  };

  const handleCancelInvite = async (invite: RoleInvite) => {
    const ok = await confirm({
      title: 'Cancel·lar la invitació',
      message: `${invite.id} deixarà de rebre els rols reservats quan entri per primer cop.`,
      confirmLabel: 'Cancel·lar-la',
      destructive: true,
    });
    if (ok) await cancelInvite(invite.id);
  };

  return (
    <>
      <PanelHeader
        title="Usuaris i rols"
        description="Qui entra a la web hi apareix automàticament. Assigna't els rols que necessiti cadascú; es poden combinar."
        actions={
          <Button onClick={() => setInviting(true)}>
            <Mail size={16} /> Convidar per email
          </Button>
        }
      />

      <div className="mb-6 flex max-w-sm items-center gap-2 border border-hairline bg-white px-3">
        <Search size={16} className="shrink-0 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cercar per nom o email"
          aria-label="Cercar usuaris"
          className="w-full bg-transparent py-2.5 text-sm text-ink outline-none"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="Cap usuari coincideix amb la cerca" />
      ) : (
        <ul className="border-t border-hairline">
          {filtered.map((user) => (
            <li key={user.id} className="flex flex-col gap-4 border-b border-hairline py-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{user.name ?? 'Sense nom'}</p>
                <p className="truncate text-sm text-muted">{user.email ?? user.id}</p>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {ROLES.map((role) => {
                  const enabled = (user.roles ?? []).includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(user, role, !enabled)}
                      title={ROLE_DESCRIPTIONS[role]}
                      aria-pressed={enabled}
                      className={cn(
                        'rounded border px-3 py-1.5 text-xs font-semibold transition-colors',
                        enabled
                          ? 'border-ink bg-ink text-paper'
                          : 'border-hairline text-muted hover:border-ink hover:text-ink',
                      )}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}

      {invites.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-[0.14em] text-brand">
            Invitacions pendents
          </h2>
          <p className="mb-4 text-sm text-muted">
            Aquestes persones encara no han entrat mai. Els rols se&apos;ls aplicaran sols el primer cop que
            iniciïn sessió amb aquest email.
          </p>
          <ul className="border-t border-hairline">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-4 border-b border-hairline py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{invite.id}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {invite.roles.map((role) => (
                      <Badge key={role}>{ROLE_LABELS[role]}</Badge>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCancelInvite(invite)}
                  aria-label={`Cancel·lar la invitació de ${invite.id}`}
                  className="rounded p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <InviteModal open={inviting} onClose={() => setInviting(false)} />
    </>
  );
};

const InviteModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { toast } = useFeedback();
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || roles.length === 0) return;

    setSaving(true);
    try {
      await inviteByEmail(email, roles, user.uid);
      toast('Invitació desada. Els rols s\'aplicaran quan entri amb aquest email.');
      setEmail('');
      setRoles([]);
      onClose();
    } catch (error) {
      console.error(error);
      toast("No s'ha pogut desar la invitació.", 'error');
    }
    setSaving(false);
  };

  return (
    <Modal open={open} title="Convidar algú que encara no té compte" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Email de Google"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nom@gmail.com"
          required
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold text-ink">Rols a reservar</legend>
          {ROLES.map((role) => (
            <label key={role} className={cn(controlClasses, 'flex cursor-pointer items-start gap-3')}>
              <input
                type="checkbox"
                checked={roles.includes(role)}
                onChange={(event) =>
                  setRoles((prev) => (event.target.checked ? [...prev, role] : prev.filter((r) => r !== role)))
                }
                className="mt-1 accent-[var(--color-brand)]"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">{ROLE_LABELS[role]}</span>
                <span className="block text-xs text-muted">{ROLE_DESCRIPTIONS[role]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <p className="text-sm text-muted">
          No s&apos;envia cap correu automàticament: passa-li l&apos;enllaç de la web i digues-li que entri amb
          aquest compte de Google.
        </p>

        <Button type="submit" size="lg" disabled={saving || roles.length === 0}>
          {saving ? 'Desant…' : 'Reservar els rols'}
        </Button>
      </form>
    </Modal>
  );
};
