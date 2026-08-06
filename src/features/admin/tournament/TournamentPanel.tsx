import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PanelHeader } from '../../../components/layout/AdminLayout';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState, Spinner } from '../../../components/ui/EmptyState';
import { useFeedback } from '../../../components/ui/Feedback';
import { useMatches, useTeams, useTournamentBySlug } from '../../../hooks/useTournament';
import { setPhase, setRegistrationOpen } from '../../../services/tournaments';
import { cn } from '../../../lib/cn';
import { TeamsTab } from './TeamsTab';
import { GroupsTab } from './GroupsTab';
import { MatchesTab } from './MatchesTab';
import { BracketTab } from './BracketTab';
import type { TournamentPhase } from '../../../types';

type Tab = 'equips' | 'grups' | 'partits' | 'quadre';

const TABS: { id: Tab; label: string }[] = [
  { id: 'equips', label: 'Equips' },
  { id: 'grups', label: 'Grups' },
  { id: 'partits', label: 'Partits' },
  { id: 'quadre', label: 'Quadre' },
];

const PHASES: { id: TournamentPhase; label: string }[] = [
  { id: 'inscripcions', label: 'Inscripcions' },
  { id: 'grups', label: 'Fase de grups' },
  { id: 'eliminatories', label: 'Eliminatòries' },
  { id: 'finalitzat', label: 'Finalitzat' },
];

/**
 * Un únic panell per a tots els tornejos, parametritzat pel slug de la ruta.
 * Substitueix FutbolPanel i BasquetPanel, que eren el mateix fitxer duplicat.
 */
export const TournamentPanel: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useFeedback();
  const [tab, setTab] = useState<Tab>('equips');

  const { tournament, loading } = useTournamentBySlug(slug);
  const { data: teams } = useTeams(tournament?.id);
  const { data: matches } = useMatches(tournament?.id);

  const teamName = useMemo(() => {
    const names = new Map(teams.map((team) => [team.id, team.name]));
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
        title="Aquest torneig encara no existeix a la base de dades"
        description={`Cal crear un document a la col·lecció "tournaments" amb slug "${slug}". Al README hi ha l'exemple complet.`}
      />
    );
  }

  const approved = teams.filter((team) => team.status === 'approved');
  const pending = teams.filter((team) => team.status === 'pending');

  return (
    <>
      <PanelHeader
        title={tournament.name}
        description={`${approved.length} equips aprovats · ${pending.length} pendents · ${matches.length} partits`}
        actions={
          <Button
            variant={tournament.registrationOpen ? 'ghost' : 'primary'}
            onClick={async () => {
              await setRegistrationOpen(tournament.id, !tournament.registrationOpen);
              toast(tournament.registrationOpen ? 'Inscripcions tancades.' : 'Inscripcions obertes.');
            }}
          >
            {tournament.registrationOpen ? 'Tancar inscripcions' : 'Obrir inscripcions'}
          </Button>
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="mr-2 text-sm font-semibold text-ink">Fase:</span>
        {PHASES.map((phase) => (
          <button
            key={phase.id}
            type="button"
            onClick={() => setPhase(tournament.id, phase.id)}
            aria-pressed={tournament.phase === phase.id}
            className={cn(
              'rounded border px-3 py-1.5 text-xs font-semibold transition-colors',
              tournament.phase === phase.id
                ? 'border-ink bg-ink text-paper'
                : 'border-hairline text-muted hover:border-ink hover:text-ink',
            )}
          >
            {phase.label}
          </button>
        ))}
        {pending.length > 0 && <Badge tone="pending">{pending.length} equips per validar</Badge>}
      </div>

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

      {tab === 'equips' && <TeamsTab tournament={tournament} teams={teams} />}
      {tab === 'grups' && <GroupsTab tournament={tournament} teams={teams} matches={matches} />}
      {tab === 'partits' && (
        <MatchesTab tournament={tournament} teams={approved} matches={matches} teamName={teamName} groupName={groupName} />
      )}
      {tab === 'quadre' && (
        <BracketTab tournament={tournament} teams={approved} matches={matches} teamName={teamName} groupName={groupName} />
      )}
    </>
  );
};
