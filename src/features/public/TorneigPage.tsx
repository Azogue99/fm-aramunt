import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PublicLayout';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, Spinner } from '../../components/ui/EmptyState';
import { LinkButton } from '../../components/ui/Button';
import { StandingsTable } from '../../components/tournament/StandingsTable';
import { MatchRow } from '../../components/tournament/MatchRow';
import { BracketView } from '../../components/tournament/BracketView';
import { useGroupStandings, useMatches, useTeams, useTournamentBySlug } from '../../hooks/useTournament';
import { cn } from '../../lib/cn';
import type { Match, Team } from '../../types';

type Tab = 'classificacio' | 'partits' | 'quadre';

const TABS: { id: Tab; label: string }[] = [
  { id: 'classificacio', label: 'Classificació' },
  { id: 'partits', label: 'Partits' },
  { id: 'quadre', label: 'Quadre' },
];

/** Ordena per hora; els partits sense hora van al final. */
function bySchedule(a: Match, b: Match) {
  const left = a.scheduledAt?.toMillis() ?? Number.MAX_SAFE_INTEGER;
  const right = b.scheduledAt?.toMillis() ?? Number.MAX_SAFE_INTEGER;
  return left - right || a.slot - b.slot;
}

export const TorneigPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<Tab>('classificacio');

  const { tournament, loading } = useTournamentBySlug(slug);
  const { data: allTeams } = useTeams(tournament?.id);
  const { data: matches } = useMatches(tournament?.id);

  // A la web pública només hi surten els equips aprovats.
  const teams = useMemo(() => allTeams.filter((team) => team.status === 'approved'), [allTeams]);
  const groupStandings = useGroupStandings(tournament, teams, matches);

  const teamName = useMemo(() => {
    const names = new Map(teams.map((team: Team) => [team.id, team.name]));
    return (id: string | null) => (id ? (names.get(id) ?? 'Equip esborrat') : null);
  }, [teams]);

  const groupName = useMemo(() => {
    const names = new Map((tournament?.groups ?? []).map((group) => [group.id, group.name]));
    return (id: string) => names.get(id) ?? `Grup ${id}`;
  }, [tournament]);

  if (loading) return <Spinner />;
  if (!tournament) {
    return (
      <EmptyState
        title="Aquest torneig no existeix"
        description="Pot ser que l'enllaç estigui caducat."
        action={<LinkButton to="/tornejos" variant="ghost">Veure tots els tornejos</LinkButton>}
      />
    );
  }

  const scoreLabel = tournament.sport === 'basquet' ? 'Punts' : 'Gols';
  const groupMatches = matches.filter((match) => match.phase === 'group').sort(bySchedule);
  const knockoutMatches = matches.filter((match) => match.phase === 'knockout');
  const scheduled = [...matches].sort(bySchedule);

  return (
    <>
      <PageHeader
        title={tournament.name}
        lead={`${teams.length} equips · ${tournament.minPlayers}–${tournament.maxPlayers} jugadors`}
        actions={
          tournament.registrationOpen ? (
            <LinkButton to="/participa">Inscriure el meu equip</LinkButton>
          ) : undefined
        }
      />

      <div className="mb-8 flex gap-6 border-b border-hairline" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm font-semibold uppercase tracking-wide transition-colors',
              tab === item.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'classificacio' &&
        (groupStandings.length === 0 ? (
          <EmptyState
            title="Encara no hi ha grups"
            description="Quan es tanquin les inscripcions, la comissió repartirà els equips i apareixerà la classificació."
          />
        ) : (
          <div className="flex flex-col gap-12">
            {groupStandings.map(({ group, standings }) => (
              <section key={group.id}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-brand">{group.name}</h2>
                <StandingsTable
                  standings={standings}
                  qualifiers={tournament.qualifiersPerGroup}
                  scoreLabel={scoreLabel}
                />
              </section>
            ))}
            {tournament.qualifiersPerGroup > 0 && (
              <p className="text-xs text-muted">
                La línia taronja marca els {tournament.qualifiersPerGroup} equips de cada grup que passen a
                l&apos;eliminatòria.
              </p>
            )}
          </div>
        ))}

      {tab === 'partits' &&
        (scheduled.length === 0 ? (
          <EmptyState title="Encara no hi ha cap partit programat" />
        ) : (
          <>
            {groupMatches.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-brand">Fase de grups</h2>
                <ul className="border-t border-hairline">
                  {groupMatches.map((match) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      teamName={teamName}
                      groupName={groupName}
                      actions={match.groupId ? <Badge>{groupName(match.groupId)}</Badge> : undefined}
                    />
                  ))}
                </ul>
              </section>
            )}
            {knockoutMatches.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-brand">Eliminatòries</h2>
                <ul className="border-t border-hairline">
                  {[...knockoutMatches].sort(bySchedule).map((match) => (
                    <MatchRow key={match.id} match={match} teamName={teamName} groupName={groupName} />
                  ))}
                </ul>
              </section>
            )}
          </>
        ))}

      {tab === 'quadre' && (
        <BracketView matches={knockoutMatches} teamName={teamName} groupName={groupName} />
      )}
    </>
  );
};
