import React from 'react';
import { cn } from '../../lib/cn';
import type { Standing } from '../../types';

interface StandingsTableProps {
  standings: Standing[];
  /** Quantes places passen a l'eliminatòria; es marquen amb una línia. */
  qualifiers?: number;
  /** 'gols' per futbol, 'punts' per bàsquet. */
  scoreLabel?: string;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  qualifiers = 0,
  scoreLabel = 'Gols',
}) => {
  if (standings.length === 0) {
    return <p className="py-6 text-sm text-muted">Encara no hi ha equips en aquest grup.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="sr-only">Classificació</caption>
        <thead>
          <tr className="border-b border-hairline text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="w-8 py-2 text-center font-semibold">
              #
            </th>
            <th scope="col" className="py-2 font-semibold">
              Equip
            </th>
            <th scope="col" className="w-10 py-2 text-center font-semibold" title="Partits jugats">
              PJ
            </th>
            <th scope="col" className="w-10 py-2 text-center font-semibold" title="Guanyats">
              G
            </th>
            <th scope="col" className="w-10 py-2 text-center font-semibold" title="Empatats">
              E
            </th>
            <th scope="col" className="w-10 py-2 text-center font-semibold" title="Perduts">
              P
            </th>
            <th scope="col" className="w-16 py-2 text-center font-semibold" title={scoreLabel}>
              {scoreLabel}
            </th>
            <th scope="col" className="w-12 py-2 text-center font-semibold" title="Diferència">
              Dif
            </th>
            <th scope="col" className="w-12 py-2 text-center font-semibold">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => (
            <tr
              key={row.teamId}
              className={cn(
                'border-b border-hairline',
                qualifiers > 0 && index === qualifiers - 1 && 'border-b-2 border-b-brand',
              )}
            >
              <td className="py-3 text-center text-muted">{index + 1}</td>
              <td className="py-3 font-semibold text-ink">{row.teamName}</td>
              <td className="py-3 text-center text-muted">{row.played}</td>
              <td className="py-3 text-center text-muted">{row.won}</td>
              <td className="py-3 text-center text-muted">{row.drawn}</td>
              <td className="py-3 text-center text-muted">{row.lost}</td>
              <td className="py-3 text-center text-muted">
                {row.scored}:{row.conceded}
              </td>
              <td className="py-3 text-center text-muted">
                {row.diff > 0 ? `+${row.diff}` : row.diff}
              </td>
              <td className="py-3 text-center font-bold text-ink">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
