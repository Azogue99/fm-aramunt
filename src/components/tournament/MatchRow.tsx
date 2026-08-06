import React from 'react';
import { Badge } from '../ui/Badge';
import { formatDayTime } from '../../lib/format';
import { cn } from '../../lib/cn';
import { sourceLabel } from './sourceLabel';
import type { Match } from '../../types';

interface MatchRowProps {
  match: Match;
  teamName: (id: string | null) => string | null;
  groupName?: (id: string) => string;
  actions?: React.ReactNode;
}

export const MatchRow: React.FC<MatchRowProps> = ({ match, teamName, groupName, actions }) => {
  const home = teamName(match.homeTeamId) ?? sourceLabel(match.homeSource, groupName);
  const away = teamName(match.awayTeamId) ?? sourceLabel(match.awaySource, groupName);
  const played = match.status === 'finished' && match.homeScore != null && match.awayScore != null;
  const homeWon = played && match.homeScore! > match.awayScore!;
  const awayWon = played && match.awayScore! > match.homeScore!;

  return (
    <li className="flex flex-col gap-3 border-b border-hairline py-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex shrink-0 flex-col gap-1 text-xs text-muted sm:w-52">
        <span>{formatDayTime(match.scheduledAt)}</span>
        <span className="flex items-center gap-2">
          {match.pitch && <span>{match.pitch}</span>}
          {match.status === 'live' && <Badge tone="live">En directe</Badge>}
        </span>
      </div>

      <div className="flex min-w-0 flex-grow items-center gap-2 sm:gap-3">
        <span className={cn('min-w-0 flex-1 break-words text-right', homeWon ? 'font-bold text-ink' : 'text-muted')}>{home}</span>
        <span className="shrink-0 min-w-[3.5rem] text-center font-mono text-lg font-bold text-ink">
          {played ? `${match.homeScore}-${match.awayScore}` : '·'}
        </span>
        <span className={cn('min-w-0 flex-1 break-words', awayWon ? 'font-bold text-ink' : 'text-muted')}>{away}</span>
      </div>

      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </li>
  );
};
