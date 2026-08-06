import React, { useMemo, useState } from 'react';
import { Shuffle, Wand2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useFeedback } from '../../../components/ui/Feedback';
import { StandingsTable } from '../../../components/tournament/StandingsTable';
import { useAuth } from '../../../context/AuthContext';
import { computeStandings } from '../../../hooks/useTournament';
import { buildGroupFixtures, deleteMatchesWhere, writeDrafts } from '../../../services/matches';
import { distributeIntoGroups, setGroups } from '../../../services/tournaments';
import { cn } from '../../../lib/cn';
import type { Match, Team, Tournament, TournamentGroup } from '../../../types';

interface GroupsTabProps {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
}

export const GroupsTab: React.FC<GroupsTabProps> = ({ tournament, teams, matches }) => {
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const [groupCount, setGroupCount] = useState(Math.max(tournament.groups.length, 1));
  const [busy, setBusy] = useState(false);

  const approved = useMemo(() => teams.filter((team) => team.status === 'approved'), [teams]);
  const assigned = useMemo(
    () => new Set(tournament.groups.flatMap((group) => group.teamIds)),
    [tournament.groups],
  );
  const unassigned = approved.filter((team) => !assigned.has(team.id));

  const scoreLabel = tournament.sport === 'basquet' ? 'Punts' : 'Gols';

  const handleAutoDistribute = async () => {
    if (approved.length === 0) return;
    const ok = await confirm({
      title: 'Repartir els equips',
      message: `Es repartiran els ${approved.length} equips aprovats en ${groupCount} grups. Si ja hi havia grups, es reescriuran (els partits no s'esborren).`,
      confirmLabel: 'Repartir',
    });
    if (!ok) return;

    const shuffled = [...approved].sort(() => Math.random() - 0.5).map((team) => team.id);
    await setGroups(tournament.id, distributeIntoGroups(shuffled, groupCount));
    toast('Equips repartits.');
  };

  const moveTeam = async (teamId: string, targetGroupId: string | null) => {
    const groups: TournamentGroup[] = tournament.groups.map((group) => ({
      ...group,
      teamIds: group.teamIds.filter((id) => id !== teamId),
    }));

    if (targetGroupId) {
      const target = groups.find((group) => group.id === targetGroupId);
      target?.teamIds.push(teamId);
    }

    await setGroups(tournament.id, groups);
  };

  const handleGenerateFixtures = async () => {
    if (!user) return;
    const existing = matches.filter((match) => match.phase === 'group');

    const ok = await confirm({
      title: 'Generar els partits de la lligueta',
      message:
        existing.length > 0
          ? `S'esborraran els ${existing.length} partits de grup actuals (amb els seus resultats) i se'n generaran de nous, tots contra tots dins de cada grup.`
          : 'Es crearà un partit per cada parella d\'equips dins de cada grup. Després els podràs posar hora i pista.',
      confirmLabel: 'Generar',
      destructive: existing.length > 0,
    });
    if (!ok) return;

    setBusy(true);
    try {
      if (existing.length > 0) {
        await deleteMatchesWhere(tournament.id, (match) => match.phase === 'group');
      }
      const drafts = tournament.groups.flatMap((group) =>
        buildGroupFixtures(tournament.id, group.id, group.teamIds),
      );
      if (drafts.length > 0) await writeDrafts(drafts, user.uid);
      toast(`${drafts.length} partits generats.`);
    } catch (error) {
      console.error(error);
      toast('No s\'han pogut generar els partits.', 'error');
    }
    setBusy(false);
  };

  if (approved.length === 0) {
    return (
      <EmptyState
        title="Encara no hi ha equips aprovats"
        description="Ves a la pestanya Equips i aprova'ls primer; només els aprovats entren als grups."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border border-hairline bg-white p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="group-count" className="text-sm font-semibold text-ink">
              Nombre de grups
            </label>
            <input
              id="group-count"
              type="number"
              min={1}
              max={8}
              value={groupCount}
              onChange={(event) => setGroupCount(Math.max(1, Number(event.target.value)))}
              className="w-24 rounded border border-hairline bg-white px-3 py-2.5 text-ink focus:border-brand focus:outline-none"
            />
          </div>
          <Button variant="secondary" onClick={handleAutoDistribute}>
            <Shuffle size={16} /> Repartir a l&apos;atzar
          </Button>
        </div>

        <Button onClick={handleGenerateFixtures} disabled={busy || tournament.groups.length === 0}>
          <Wand2 size={16} /> {busy ? 'Generant…' : 'Generar els partits'}
        </Button>
      </div>

      {unassigned.length > 0 && (
        <section className="border border-dashed border-hairline p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-brand">Sense grup</h3>
          <ul className="flex flex-wrap gap-2">
            {unassigned.map((team) => (
              <li key={team.id}>
                <TeamChip team={team} groups={tournament.groups} onMove={moveTeam} currentGroupId={null} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {tournament.groups.length === 0 ? (
        <EmptyState
          title="Encara no hi ha grups"
          description="Tria quants en vols i reparteix els equips, o mou-los d'un en un un cop creats."
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {tournament.groups.map((group) => (
            <section key={group.id}>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-brand">
                {group.name} · {group.teamIds.length} equips
              </h3>

              <ul className="mb-4 flex flex-wrap gap-2">
                {group.teamIds.map((teamId) => {
                  const team = approved.find((item) => item.id === teamId);
                  if (!team) return null;
                  return (
                    <li key={teamId}>
                      <TeamChip
                        team={team}
                        groups={tournament.groups}
                        onMove={moveTeam}
                        currentGroupId={group.id}
                      />
                    </li>
                  );
                })}
              </ul>

              <StandingsTable
                standings={computeStandings(
                  group.teamIds,
                  approved,
                  matches.filter((match) => match.phase === 'group' && match.groupId === group.id),
                  tournament.sport,
                )}
                qualifiers={tournament.qualifiersPerGroup}
                scoreLabel={scoreLabel}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

/** Selector en línia per moure un equip de grup sense arrossegar res. */
const TeamChip: React.FC<{
  team: Team;
  groups: TournamentGroup[];
  currentGroupId: string | null;
  onMove: (teamId: string, groupId: string | null) => void;
}> = ({ team, groups, currentGroupId, onMove }) => (
  <span className={cn('flex items-center gap-2 border border-hairline bg-white py-1 pl-3 pr-1 text-sm')}>
    <span className="text-ink">{team.name}</span>
    <select
      value={currentGroupId ?? ''}
      onChange={(event) => onMove(team.id, event.target.value || null)}
      aria-label={`Grup de ${team.name}`}
      className="border-0 bg-transparent py-1 text-xs text-muted focus:outline-none"
    >
      <option value="">Sense grup</option>
      {groups.map((group) => (
        <option key={group.id} value={group.id}>
          {group.name}
        </option>
      ))}
    </select>
  </span>
);
