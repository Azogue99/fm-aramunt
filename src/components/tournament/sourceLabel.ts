import type { MatchSource } from '../../types';

/** Text a mostrar en un slot del quadre quan encara no se sap quin equip l'ocuparà. */
export function sourceLabel(source: MatchSource | null, groupName?: (id: string) => string): string {
  if (!source) return 'Per determinar';
  if (source.type === 'groupPos') {
    const name = groupName?.(source.groupId) ?? `Grup ${source.groupId}`;
    return `${source.pos}r de ${name}`;
  }
  return source.type === 'winner' ? 'Guanyador' : 'Perdedor';
}
