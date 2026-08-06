import React, { useMemo } from 'react';
import { ROUND_LABELS, ROUND_ORDER } from '../../services/matches';
import { sourceLabel } from './sourceLabel';
import { formatDayTime } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { KnockoutRound, Match } from '../../types';

interface BracketViewProps {
  matches: Match[];
  teamName: (id: string | null) => string | null;
  groupName?: (id: string) => string;
}

/**
 * Columnes per ronda. No dibuixem les línies del quadre: amb 4-8 equips la
 * lectura per columnes és més clara i no es trenca en mòbil.
 */
export const BracketView: React.FC<BracketViewProps> = ({ matches, teamName, groupName }) => {
  const columns = useMemo(() => {
    const byRound = new Map<KnockoutRound, Match[]>();
    for (const match of matches) {
      if (!match.round) continue;
      const list = byRound.get(match.round) ?? [];
      list.push(match);
      byRound.set(match.round, list);
    }
    for (const list of byRound.values()) list.sort((a, b) => a.slot - b.slot);

    return ROUND_ORDER.filter((round) => byRound.has(round)).map((round) => ({
      round,
      matches: byRound.get(round)!,
    }));
  }, [matches]);

  if (columns.length === 0) {
    return <p className="py-6 text-sm text-muted">L&apos;eliminatòria encara no està generada.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-4">
        {columns.map(({ round, matches: roundMatches }) => (
          <section key={round} className="flex w-60 shrink-0 flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{ROUND_LABELS[round]}</h3>
            {roundMatches.map((match) => (
              <BracketCard key={match.id} match={match} teamName={teamName} groupName={groupName} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
};

const BracketCard: React.FC<{
  match: Match;
  teamName: (id: string | null) => string | null;
  groupName?: (id: string) => string;
}> = ({ match, teamName, groupName }) => {
  const played = match.status === 'finished' && match.homeScore != null && match.awayScore != null;

  const side = (teamId: string | null, score: number | null, source: Match['homeSource'], won: boolean) => (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <span className={cn('truncate text-sm', won ? 'font-bold text-ink' : 'text-muted')}>
        {teamName(teamId) ?? sourceLabel(source, groupName)}
      </span>
      <span className="font-mono text-sm font-bold text-ink">{played ? score : '·'}</span>
    </div>
  );

  return (
    <article className="divide-y divide-hairline border border-hairline bg-white">
      {side(match.homeTeamId, match.homeScore, match.homeSource, played && match.homeScore! > match.awayScore!)}
      {side(match.awayTeamId, match.awayScore, match.awaySource, played && match.awayScore! > match.homeScore!)}
      <p className="px-3 py-1.5 text-[0.7rem] text-muted">{formatDayTime(match.scheduledAt)}</p>
    </article>
  );
};
