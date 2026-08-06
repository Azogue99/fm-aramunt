import React, { useState } from 'react';
import { Plus, Radio, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Input, Select } from '../../../components/ui/Field';
import { Modal } from '../../../components/ui/Modal';
import { useFeedback } from '../../../components/ui/Feedback';
import { sourceLabel } from '../../../components/tournament/sourceLabel';
import { useAuth } from '../../../context/AuthContext';
import {
  ROUND_LABELS,
  createMatch,
  deleteMatch,
  saveResult,
  setMatchStatus,
  updateMatchSchedule,
} from '../../../services/matches';
import { formatDayTime, toDateTimeLocal } from '../../../lib/format';
import type { Match, Team, Tournament } from '../../../types';

interface MatchesTabProps {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  teamName: (id: string | null) => string | null;
  groupName: (id: string) => string;
}

function bySchedule(a: Match, b: Match) {
  const left = a.scheduledAt?.toMillis() ?? Number.MAX_SAFE_INTEGER;
  const right = b.scheduledAt?.toMillis() ?? Number.MAX_SAFE_INTEGER;
  return left - right || a.slot - b.slot;
}

export const MatchesTab: React.FC<MatchesTabProps> = ({ tournament, teams, matches, teamName, groupName }) => {
  const [editing, setEditing] = useState<Match | null>(null);
  const [creating, setCreating] = useState(false);

  const sorted = [...matches].sort(bySchedule);

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button variant="ghost" onClick={() => setCreating(true)} disabled={teams.length < 2}>
          <Plus size={16} /> Partit solt
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="Cap partit encara"
          description="Genera la lligueta des de la pestanya Grups, o afegeix un partit solt."
        />
      ) : (
        <ul className="border-t border-hairline">
          {sorted.map((match) => (
            <AdminMatchRow
              key={match.id}
              match={match}
              teamName={teamName}
              groupName={groupName}
              onEdit={() => setEditing(match)}
            />
          ))}
        </ul>
      )}

      <MatchEditor match={editing} onClose={() => setEditing(null)} teamName={teamName} />
      <NewMatchModal
        open={creating}
        onClose={() => setCreating(false)}
        tournament={tournament}
        teams={teams}
      />
    </>
  );
};

const AdminMatchRow: React.FC<{
  match: Match;
  teamName: (id: string | null) => string | null;
  groupName: (id: string) => string;
  onEdit: () => void;
}> = ({ match, teamName, groupName, onEdit }) => {
  const { user } = useAuth();
  const { confirm } = useFeedback();
  const played = match.status === 'finished' && match.homeScore != null && match.awayScore != null;

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Esborrar partit',
      message: 'El partit i el seu resultat desapareixeran de la classificació.',
      confirmLabel: 'Esborrar',
      destructive: true,
    });
    if (ok) await deleteMatch(match.id);
  };

  return (
    <li className="flex flex-col gap-3 border-b border-hairline py-4 lg:flex-row lg:items-center lg:gap-6">
      <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 lg:w-64">
        <span className="text-xs text-muted">{formatDayTime(match.scheduledAt)}</span>
        {match.pitch && <span className="text-xs text-muted">· {match.pitch}</span>}
        {match.status === 'live' && <Badge tone="live">Directe</Badge>}
      </div>

      <div className="flex min-w-0 flex-grow items-center gap-2 text-sm sm:gap-3">
        <span className="min-w-0 flex-1 break-words text-right text-ink">
          {teamName(match.homeTeamId) ?? sourceLabel(match.homeSource, groupName)}
        </span>
        <span className="shrink-0 min-w-[3.5rem] text-center font-mono text-base font-bold text-ink">
          {played ? `${match.homeScore}-${match.awayScore}` : '·'}
        </span>
        <span className="min-w-0 flex-1 break-words text-ink">
          {teamName(match.awayTeamId) ?? sourceLabel(match.awaySource, groupName)}
        </span>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge>{match.phase === 'group' ? groupName(match.groupId ?? '') : ROUND_LABELS[match.round ?? 'final']}</Badge>
        {user && match.status !== 'finished' && (
          <Button
            variant="ghost"
            size="sm"
            aria-label={match.status === 'live' ? 'Aturar el directe' : 'Marcar en directe'}
            onClick={() => setMatchStatus(match.id, match.status === 'live' ? 'scheduled' : 'live', user.uid)}
          >
            <Radio size={14} />
          </Button>
        )}
        <Button size="sm" onClick={onEdit}>
          {played ? 'Editar' : 'Resultat'}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete} aria-label="Esborrar partit">
          <Trash2 size={14} />
        </Button>
      </div>
    </li>
  );
};

const MatchEditor: React.FC<{
  match: Match | null;
  onClose: () => void;
  teamName: (id: string | null) => string | null;
}> = ({ match, onClose, teamName }) => {
  const { user } = useAuth();
  const { toast } = useFeedback();
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [when, setWhen] = useState('');
  const [pitch, setPitch] = useState('');
  const [saving, setSaving] = useState(false);

  // Recarrega el formulari cada cop que canvia el partit obert.
  React.useEffect(() => {
    setHome(match?.homeScore != null ? String(match.homeScore) : '');
    setAway(match?.awayScore != null ? String(match.awayScore) : '');
    setWhen(toDateTimeLocal(match?.scheduledAt));
    setPitch(match?.pitch ?? '');
  }, [match]);

  if (!match) return null;

  const bothTeamsKnown = match.homeTeamId !== null && match.awayTeamId !== null;

  const handleSchedule = async () => {
    if (!user) return;
    await updateMatchSchedule(match.id, when ? new Date(when) : null, pitch, user.uid);
    toast('Horari desat.');
  };

  const handleResult = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const homeScore = Number.parseInt(home, 10);
    const awayScore = Number.parseInt(away, 10);
    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
      toast('Cal posar els dos resultats.', 'error');
      return;
    }
    if (match.phase === 'knockout' && homeScore === awayScore) {
      toast('A l\'eliminatòria no hi pot haver empat: cal un guanyador.', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveResult(match, homeScore, awayScore, user.uid);
      toast(
        match.phase === 'knockout'
          ? 'Resultat desat. El guanyador ja ha avançat al quadre.'
          : 'Resultat desat. La classificació s\'ha actualitzat.',
      );
      onClose();
    } catch (error) {
      console.error(error);
      toast('No s\'ha pogut desar el resultat.', 'error');
    }
    setSaving(false);
  };

  return (
    <Modal open title="Partit" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Horari i pista</h3>
          <Input label="Dia i hora" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          <Input
            label="Pista o camp"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder="Pista poliesportiva"
          />
          <Button variant="ghost" onClick={handleSchedule}>
            Desar l&apos;horari
          </Button>
        </div>

        <form onSubmit={handleResult} className="flex flex-col gap-3 border-t border-hairline pt-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Resultat</h3>

          {!bothTeamsKnown ? (
            <p className="text-sm text-muted">
              Encara no se sap qui juga aquest partit. Es completarà sol quan acabi la ronda anterior.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={teamName(match.homeTeamId) ?? 'Local'}
                  type="number"
                  min="0"
                  value={home}
                  onChange={(e) => setHome(e.target.value)}
                />
                <Input
                  label={teamName(match.awayTeamId) ?? 'Visitant'}
                  type="number"
                  min="0"
                  value={away}
                  onChange={(e) => setAway(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? 'Desant…' : 'Desar el resultat'}
              </Button>
            </>
          )}
        </form>
      </div>
    </Modal>
  );
};

const NewMatchModal: React.FC<{
  open: boolean;
  onClose: () => void;
  tournament: Tournament;
  teams: Team[];
}> = ({ open, onClose, tournament, teams }) => {
  const { user } = useAuth();
  const { toast } = useFeedback();
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [groupId, setGroupId] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !home || !away || home === away) {
      toast('Cal triar dos equips diferents.', 'error');
      return;
    }

    await createMatch(
      {
        tournamentId: tournament.id,
        phase: 'group',
        groupId: groupId || null,
        homeTeamId: home,
        awayTeamId: away,
      },
      user.uid,
    );
    toast('Partit creat.');
    setHome('');
    setAway('');
    onClose();
  };

  return (
    <Modal open={open} title="Nou partit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select label="Local" value={home} onChange={(e) => setHome(e.target.value)} required>
          <option value="">Tria un equip</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
        <Select label="Visitant" value={away} onChange={(e) => setAway(e.target.value)} required>
          <option value="">Tria un equip</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
        {tournament.groups.length > 0 && (
          <Select label="Grup" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Sense grup</option>
            {tournament.groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
        )}
        <Button type="submit" size="lg">
          Crear el partit
        </Button>
      </form>
    </Modal>
  );
};
