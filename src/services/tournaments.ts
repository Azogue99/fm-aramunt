import { collection, doc, getDoc, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Sport, Tournament, TournamentFormat, TournamentGroup, TournamentPhase, TournamentScoring, UserRole } from '../types';

export const TOURNAMENTS = 'tournaments';

export const tournamentsQuery = () => query(collection(db, TOURNAMENTS), orderBy('order', 'asc'));

export const tournamentBySlugQuery = (slug: string) =>
  query(collection(db, TOURNAMENTS), where('slug', '==', slug));

export interface CreateTournamentInput {
  name: string;
  slug: string;
  sport: Sport;
  year: number;
  managerRole: UserRole;
  minPlayers: number;
  maxPlayers: number;
  format: TournamentFormat;
  scoring: TournamentScoring;
}

/** El slug també és l'id del document: així no es poden duplicar tornejos del mateix any. */
export async function createTournament(input: CreateTournamentInput) {
  const slug = input.slug.trim().toLowerCase();
  const ref = doc(db, TOURNAMENTS, slug);
  if ((await getDoc(ref)).exists()) throw new Error('Ja existeix un torneig amb aquest identificador.');

  return setDoc(ref, {
    ...input,
    slug,
    name: input.name.trim(),
    registrationOpen: true,
    phase: 'inscripcions' satisfies TournamentPhase,
    groups: [],
    knockoutSize: 4,
    qualifiersPerGroup: 2,
    order: input.year * 10 + (input.sport === 'futbol' ? 1 : 2),
  });
}

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
