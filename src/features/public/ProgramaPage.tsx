import React, { useMemo } from 'react';
import { PageHeader } from '../../components/layout/PublicLayout';
import { EmptyState } from '../../components/ui/EmptyState';
import { POSTER_IMAGE } from '../../config/site';
import { useSiteContent } from '../../hooks/useSiteContent';
import type { ProgramEntry } from '../../types';

function groupByDay(entries: ProgramEntry[]): [string, ProgramEntry[]][] {
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return a.time.localeCompare(b.time);
  });

  const byDay = new Map<string, ProgramEntry[]>();
  for (const entry of sortedEntries) {
    const list = byDay.get(entry.day) ?? [];
    list.push(entry);
    byDay.set(entry.day, list);
  }
  
  return [...byDay.entries()];
}

export const ProgramaPage: React.FC = () => {
  const { content, loading } = useSiteContent();
  const days = useMemo(() => groupByDay(content.programa ?? []), [content.programa]);

  return (
    <>
      <PageHeader title="Programa d'actes" lead={content.programa_intro} />

      {days.length === 0 ? (
        <div className="flex flex-col gap-10">
          <img src={POSTER_IMAGE} alt="Cartell de la Festa Major" className="w-full max-w-md" />
          {!loading && (
            <EmptyState
              title="Encara no hi ha el programa detallat"
              description="La comissió l'anirà publicant aquí. Mentrestant, tot el que se sap és al cartell i a l'Instagram."
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {days.map(([day, entries]) => (
            <section key={day}>
              <h2 className="mb-5 border-b border-hairline pb-2 text-sm font-bold uppercase tracking-[0.14em] text-brand">
                {day}
              </h2>
              <ul className="flex flex-col">
                {entries.map((entry, index) => (
                  <li
                    key={`${entry.time}-${index}`}
                    className="flex flex-col gap-1 border-b border-hairline py-4 sm:flex-row sm:gap-8"
                  >
                    <span className="shrink-0 font-mono text-sm text-muted sm:w-20 sm:pt-1">{entry.time}</span>
                    <div className="prose-column">
                      <p className="font-bold text-ink">{entry.title}</p>
                      {entry.detail && <p className="mt-1 text-sm leading-relaxed text-muted">{entry.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
};
