import React, { useState } from 'react';
import { Check, Link2, Trash2, UserPlus, X } from 'lucide-react';
import { Badge, type BadgeTone } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Input } from '../../../components/ui/Field';
import { Modal } from '../../../components/ui/Modal';
import { useFeedback } from '../../../components/ui/Feedback';
import { useAuth } from '../../../context/AuthContext';
import {
  addGuestMember,
  createTeamAsAdmin,
  deleteTeam,
  removeMemberAt,
  renameTeam,
  setTeamStatus,
} from '../../../services/teams';
import { inviteUrl } from '../../../config/site';
import type { Team, TeamStatus, Tournament } from '../../../types';

const STATUS_TONE: Record<TeamStatus, BadgeTone> = {
  pending: 'pending',
  approved: 'positive',
  rejected: 'negative',
};

const STATUS_LABEL: Record<TeamStatus, string> = {
  pending: 'Pendent',
  approved: 'Aprovat',
  rejected: 'Rebutjat',
};

interface TeamsTabProps {
  tournament: Tournament;
  teams: Team[];
}

export const TeamsTab: React.FC<TeamsTabProps> = ({ tournament, teams }) => {
  const [creating, setCreating] = useState(false);
  const sorted = [...teams].sort(
    (a, b) =>
      Number(b.status === 'pending') - Number(a.status === 'pending') ||
      a.name.localeCompare(b.name, 'ca'),
  );

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setCreating(true)}><UserPlus size={16} /> Afegir equip</Button>
      </div>
      {teams.length === 0 ? (
        <EmptyState
          title="Cap equip inscrit encara"
          description="Pots afegir-ne un manualment o esperar que els participants en creïn des de “El meu equip”."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {sorted.map((team) => (
            <TeamCard key={team.id} team={team} tournament={tournament} />
          ))}
        </ul>
      )}
      <CreateTeamModal open={creating} onClose={() => setCreating(false)} tournament={tournament} />
    </>
  );
};

const CreateTeamModal: React.FC<{ open: boolean; onClose: () => void; tournament: Tournament }> = ({ open, onClose, tournament }) => {
  const { user } = useAuth();
  const { toast } = useFeedback();
  const [name, setName] = useState('');
  const [firstMember, setFirstMember] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      await createTeamAsAdmin({ tournamentId: tournament.id, name, adminUid: user.uid, firstMemberName: firstMember });
      toast('Equip afegit i aprovat. Pots completar-ne els membres ara mateix.');
      setName('');
      setFirstMember('');
      onClose();
    } catch (error) {
      console.error(error);
      toast("No s'ha pogut afegir l'equip.", 'error');
    }
    setSaving(false);
  };

  return (
    <Modal open={open} title={`Afegir equip a ${tournament.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input label="Nom de l'equip" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required />
        <Input label="Primer participant (opcional)" value={firstMember} onChange={(event) => setFirstMember(event.target.value)} maxLength={60} hint="Es desa com a participant sense compte; després en pots afegir més." />
        <Button type="submit" size="lg" disabled={saving || !name.trim()}>{saving ? 'Afegint…' : 'Afegir equip'}</Button>
      </form>
    </Modal>
  );
};

const TeamCard: React.FC<{ team: Team; tournament: Tournament }> = ({ team, tournament }) => {
  const { toast, confirm } = useFeedback();
  const [guestName, setGuestName] = useState('');
  const [name, setName] = useState(team.name);
  const [editing, setEditing] = useState(false);

  const tooFew = team.members.length < tournament.minPlayers;

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Esborrar equip',
      message: `${team.name} i tots els seus membres desapareixeran. Els partits ja jugats hi quedaran com a "equip esborrat".`,
      confirmLabel: 'Esborrar',
      destructive: true,
    });
    if (ok) await deleteTeam(team.id);
  };

  const handleRemoveMember = async (index: number) => {
    const ok = await confirm({
      title: 'Treure membre',
      message: `Treure ${team.members[index].name} de ${team.name}?`,
      confirmLabel: 'Treure',
      destructive: true,
    });
    if (ok) await removeMemberAt(team, index);
  };

  return (
    <li className="border border-hairline bg-white p-5">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {editing ? (
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={async (event) => {
                event.preventDefault();
                await renameTeam(team.id, name);
                setEditing(false);
                toast('Nom actualitzat.');
              }}
            >
              <Input label="Nom de l'equip" value={name} onChange={(event) => setName(event.target.value)} />
              <Button type="submit" size="sm" className="self-end">
                Desar
              </Button>
              <Button variant="ghost" size="sm" className="self-end" onClick={() => setEditing(false)}>
                Cancel·lar
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-left text-lg font-bold text-ink transition-colors hover:text-brand"
              title="Clica per canviar el nom"
            >
              {team.name}
            </button>
          )}
          <p className="mt-1 text-sm text-muted">
            {team.members.length} membres
            {tooFew && ` · mínim ${tournament.minPlayers}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[team.status]}>{STATUS_LABEL[team.status]}</Badge>
          {tooFew && <Badge tone="pending">Incomplet</Badge>}

          {team.status !== 'approved' && (
            <Button size="sm" onClick={() => setTeamStatus(team.id, 'approved')}>
              <Check size={14} /> Aprovar
            </Button>
          )}
          {team.status !== 'rejected' && (
            <Button variant="ghost" size="sm" onClick={() => setTeamStatus(team.id, 'rejected')}>
              <X size={14} /> Rebutjar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDelete} aria-label={`Esborrar ${team.name}`}>
            <Trash2 size={14} />
          </Button>
        </div>
      </header>

      <ul className="mb-4 flex flex-wrap gap-2">
        {team.members.map((member, index) => (
          <li
            key={`${member.uid ?? 'guest'}-${index}`}
            className="flex min-w-0 items-center gap-2 border border-hairline px-2.5 py-1 text-sm"
          >
            <span className={member.uid ? 'min-w-0 break-words text-ink' : 'min-w-0 break-words text-muted'}>{member.name}</span>
            {member.uid === team.captainUid && <span className="text-xs text-brand">capità</span>}
            <button
              type="button"
              onClick={() => handleRemoveMember(index)}
              aria-label={`Treure ${member.name}`}
              className="text-muted transition-colors hover:text-red-700"
            >
              <X size={13} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:items-end">
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!guestName.trim()) return;
            await addGuestMember(team, guestName);
            setGuestName('');
            toast('Membre afegit.');
          }}
        >
          <Input
            label="Afegir membre (sense compte)"
            className="flex-grow"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="Nom i cognoms"
          />
          <Button type="submit" variant="secondary" size="sm" className="self-end" disabled={!guestName.trim()}>
            <UserPlus size={14} /> Afegir
          </Button>
        </form>

        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(inviteUrl(team.inviteCode));
            toast("Enllaç d'invitació copiat.");
          }}
        >
          <Link2 size={14} /> Copiar enllaç
        </Button>
      </div>
    </li>
  );
};
