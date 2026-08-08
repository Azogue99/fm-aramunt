import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/layout/PublicLayout';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { EmptyState, Spinner } from '../../components/ui/EmptyState';
import { LinkButton } from '../../components/ui/Button';
import { currentEditionYear, useTournaments } from '../../hooks/useTournament';
import { cn } from '../../lib/cn';
import type { Tournament, TournamentPhase } from '../../types';

const PHASE_LABEL: Record<TournamentPhase, string> = {
  inscripcions: 'Inscripcions',
  grups: 'Fase de grups',
  eliminatories: 'Eliminatòries',
  finalitzat: 'Finalitzat',
};

const PHASE_TONE: Record<TournamentPhase, BadgeTone> = {
  inscripcions: 'pending',
  grups: 'live',
  eliminatories: 'live',
  finalitzat: 'neutral',
};

export const TornejosPage: React.FC = () => {
  const { data: tournaments, loading } = useTournaments();

  // L'edició vigent va a dalt; les anteriors queden arxivades més avall perquè
  // no es confonguin amb les d'enguany quan hi hagi diverses temporades.
  const { current, past } = useMemo(() => {
    const year = currentEditionYear(tournaments);
    return {
      current: tournaments.filter((item) => item.year === year),
      past: tournaments.filter((item) => item.year !== year),
    };
  }, [tournaments]);

  return (
    <>
      <PageHeader
        title="Tornejos"
        lead="Munta el teu equip, convida qui vulguis i segueix els partits en directe."
        actions={<LinkButton to="/participa">El meu equip</LinkButton>}
      />

      {loading ? (
        <Spinner />
      ) : tournaments.length === 0 ? (
        <EmptyState
          title="Encara no hi ha cap torneig obert"
          description="Quan la comissió n'obri un, apareixerà aquí amb les inscripcions."
        />
      ) : (
        <>
          <ul className="flex flex-col border-t border-hairline">
            {current.map((tournament) => (
              <TournamentRow key={tournament.id} tournament={tournament} />
            ))}
          </ul>

          {past.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-brand">
                Edicions anteriors
              </h2>
              <ul className="flex flex-col border-t border-hairline">
                {past.map((tournament) => (
                  <TournamentRow key={tournament.id} tournament={tournament} past />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
};

const TournamentRow: React.FC<{ tournament: Tournament; past?: boolean }> = ({ tournament, past }) => (
  <li className="border-b border-hairline">
    <Link
      to={`/tornejos/${tournament.slug}`}
      className="group flex flex-col gap-3 py-6 transition-colors hover:bg-white sm:flex-row sm:items-center sm:justify-between sm:px-2"
    >
      <div className="min-w-0">
        <h2
          className={cn(
            'font-bold text-ink transition-colors group-hover:text-brand',
            past ? 'text-lg' : 'text-2xl',
          )}
        >
          {tournament.name}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {tournament.year} · {tournament.minPlayers}–{tournament.maxPlayers} jugadors per equip
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Badge tone={PHASE_TONE[tournament.phase]}>{PHASE_LABEL[tournament.phase]}</Badge>
        {tournament.registrationOpen && <Badge tone="positive">Inscripcions obertes</Badge>}
        <ArrowRight size={18} className="text-muted transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  </li>
);
