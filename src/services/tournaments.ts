import { collection, doc, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Tournament, TournamentGroup, TournamentPhase } from '../types';

export const TOURNAMENTS = 'tournaments';

export const tournamentsQuery = () => query(collection(db, TOURNAMENTS), orderBy('order', 'asc'));

export const tournamentBySlugQuery = (slug: string) =>
  query(collection(db, TOURNAMENTS), where('slug', '==', slug));

export function updateTournament(id: string, patch: Partial<Tournament>) {
  return updateDoc(doc(db, TOURNAMENTS, id), patch);
}

export function setGroups(id: string, groups: TournamentGroup[]) {
  return updateDoc(doc(db, TOURNAMENTS, id), { groups });
}

export function setPhase(id: string, phase: TournamentPhase) {
  return updateDoc(doc(db, TOURNAMENTS, id), { phase });
}

export function setRegistrationOpen(id: string, registrationOpen: boolean) {
  return updateDoc(doc(db, TOURNAMENTS, id), { registrationOpen });
}

/**
 * Reparteix els equips en `count` grups en serpentina (1→N, N→1, …), que
 * és el repartiment més equilibrat quan la llista ve ordenada per algun criteri.
 */
export function distributeIntoGroups(teamIds: string[], count: number): TournamentGroup[] {
  const groups: TournamentGroup[] = Array.from({ length: count }, (_, i) => ({
    id: String.fromCharCode(65 + i),
    name: `Grup ${String.fromCharCode(65 + i)}`,
    teamIds: [],
  }));

  teamIds.forEach((teamId, index) => {
    const row = Math.floor(index / count);
    const col = index % count;
    const target = row % 2 === 0 ? col : count - 1 - col;
    groups[target].teamIds.push(teamId);
  });

  return groups;
}
