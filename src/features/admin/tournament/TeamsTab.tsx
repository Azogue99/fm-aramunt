import React, { useState } from 'react';
import { Check, Link2, Trash2, UserPlus, X } from 'lucide-react';
import { Badge, type BadgeTone } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Input } from '../../../components/ui/Field';
import { useFeedback } from '../../../components/ui/Feedback';
import {
  addGuestMember,
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
  const sorted = [...teams].sort(
    (a, b) =>
      Number(b.status === 'pending') - Number(a.status === 'pending') ||
      a.name.localeCompare(b.name, 'ca'),
  );

  if (teams.length === 0) {
    return (
      <EmptyState
        title="Cap equip inscrit encara"
        description="Quan algú creï un equip des del panell de participant, apareixerà aquí per validar."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {sorted.map((team) => (
        <TeamCard key={team.id} team={team} tournament={tournament} />
      ))}
    </ul>
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
              className="flex items-end gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                await renameTeam(team.id, name);
                setEditing(false);
                toast('Nom actualitzat.');
              }}
            >
              <Input label="Nom de l'equip" value={name} onChange={(event) => setName(event.target.value)} />
              <Button type="submit" size="sm">
                Desar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
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
            className="flex items-center gap-2 border border-hairline px-2.5 py-1 text-sm"
          >
            <span className={member.uid ? 'text-ink' : 'text-muted'}>{member.name}</span>
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
          className="flex flex-grow items-end gap-2"
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
          <Button type="submit" variant="secondary" size="sm" disabled={!guestName.trim()}>
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
