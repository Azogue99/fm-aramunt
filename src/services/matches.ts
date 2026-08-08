import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { KnockoutRound, Match, MatchSource, MatchStatus } from '../types';

export const MATCHES = 'matches';

export const matchesByTournamentQuery = (tournamentId: string) =>
  query(collection(db, MATCHES), where('tournamentId', '==', tournamentId));

/** Nom de la ronda segons quants equips hi entren. */
const ROUND_BY_SIZE: Record<number, KnockoutRound> = {
  32: 'setzens',
  16: 'vuitens',
  8: 'quarts',
  4: 'semis',
  2: 'final',
};

export const ROUND_LABELS: Record<KnockoutRound, string> = {
  setzens: 'Setzens',
  vuitens: 'Vuitens',
  quarts: 'Quarts de final',
  semis: 'Semifinals',
  tercer: '3r i 4t lloc',
  final: 'Final',
};

/** Ordre de presentació del quadre, d'esquerra a dreta. */
export const ROUND_ORDER: KnockoutRound[] = [
  'setzens',
  'vuitens',
  'quarts',
  'semis',
  'tercer',
  'final',
];

export const KNOCKOUT_SIZES = [2, 4, 8, 16] as const;

export function roundForSize(size: number): KnockoutRound | null {
  return ROUND_BY_SIZE[size] ?? null;
}

// ------------------------------------------------------------ CRUD bàsic

export interface MatchDraft {
  tournamentId: string;
  phase: Match['phase'];
  groupId?: string | null;
  round?: KnockoutRound | null;
  slot?: number;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeSource?: MatchSource | null;
  awaySource?: MatchSource | null;
  scheduledAt?: Date | null;
  pitch?: string | null;
}

function draftToDoc(draft: MatchDraft, uid: string) {
  return {
    tournamentId: draft.tournamentId,
    phase: draft.phase,
    groupId: draft.groupId ?? null,
    round: draft.round ?? null,
    slot: draft.slot ?? 0,
    homeTeamId: draft.homeTeamId ?? null,
    awayTeamId: draft.awayTeamId ?? null,
    homeSource: draft.homeSource ?? null,
    awaySource: draft.awaySource ?? null,
    homeScore: null,
    awayScore: null,
    status: 'scheduled' satisfies MatchStatus,
    scheduledAt: draft.scheduledAt ? Timestamp.fromDate(draft.scheduledAt) : null,
    pitch: draft.pitch?.trim() || null,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
}

export function createMatch(draft: MatchDraft, uid: string) {
  return addDoc(collection(db, MATCHES), draftToDoc(draft, uid));
}

export function updateMatchSchedule(
  matchId: string,
  scheduledAt: Date | null,
  pitch: string | null,
  uid: string,
) {
  return updateDoc(doc(db, MATCHES, matchId), {
    scheduledAt: scheduledAt ? Timestamp.fromDate(scheduledAt) : null,
    pitch: pitch?.trim() || null,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export function setMatchTeams(matchId: string, homeTeamId: string | null, awayTeamId: string | null, uid: string) {
  return updateDoc(doc(db, MATCHES, matchId), {
    homeTeamId,
    awayTeamId,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export function setMatchStatus(matchId: string, status: MatchStatus, uid: string) {
  return updateDoc(doc(db, MATCHES, matchId), {
    status,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export function deleteMatch(matchId: string) {
  return deleteDoc(doc(db, MATCHES, matchId));
}

// ------------------------------------------------------------ Resultats

export function winnerOf(match: Pick<Match, 'status' | 'homeScore' | 'awayScore' | 'homeTeamId' | 'awayTeamId'>) {
  if (match.status !== 'finished' || match.homeScore == null || match.awayScore == null) return null;
  if (match.homeScore > match.awayScore) return match.homeTeamId;
  if (match.awayScore > match.homeScore) return match.awayTeamId;
  return null; // Empat: a l'eliminatòria cal desempatar canviant el resultat.
}

export function loserOf(match: Pick<Match, 'status' | 'homeScore' | 'awayScore' | 'homeTeamId' | 'awayTeamId'>) {
  const winner = winnerOf(match);
  if (!winner) return null;
  return winner === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
}

/** Quin equip aporta aquesta font, un cop es coneix el resultat del partit d'origen. */
function resolveSource(source: MatchSource | null, finished: Match): string | null | undefined {
  if (!source || source.type === 'groupPos' || source.matchId !== finished.id) return undefined;
  return source.type === 'winner' ? winnerOf(finished) : loserOf(finished);
}

/**
 * Desa el resultat i, si és d'eliminatòria, fa avançar el guanyador (i el
 * perdedor, cap al partit pel 3r lloc) als slots que en depenen.
 */
export async function saveResult(match: Match, homeScore: number, awayScore: number, uid: string) {
  await updateDoc(doc(db, MATCHES, match.id), {
    homeScore,
    awayScore,
    status: 'finished' satisfies MatchStatus,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });

  if (match.phase === 'knockout') {
    await propagate({ ...match, homeScore, awayScore, status: 'finished' });
  }
}

async function propagate(finished: Match) {
  if (!winnerOf(finished)) return;

  const snapshot = await getDocs(
    query(
      collection(db, MATCHES),
      where('tournamentId', '==', finished.tournamentId),
      where('phase', '==', 'knockout'),
    ),
  );

  const batch = writeBatch(db);
  let dirty = false;

  for (const docSnap of snapshot.docs) {
    if (docSnap.id === finished.id) continue;
    const target = { id: docSnap.id, ...docSnap.data() } as Match;

    const patch: Record<string, string | null> = {};
    const home = resolveSource(target.homeSource, finished);
    const away = resolveSource(target.awaySource, finished);

    if (home !== undefined && home !== target.homeTeamId) patch.homeTeamId = home;
    if (away !== undefined && away !== target.awayTeamId) patch.awayTeamId = away;

    if (Object.keys(patch).length > 0) {
      batch.update(doc(db, MATCHES, target.id), patch);
      dirty = true;
    }
  }

  if (dirty) await batch.commit();
}

// ------------------------------------------------------------ Generadors

/** Lligueta de tots contra tots dins d'un grup. */
export function buildGroupFixtures(tournamentId: string, groupId: string, teamIds: string[]): MatchDraft[] {
  const drafts: MatchDraft[] = [];
  let slot = 0;
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      drafts.push({
        tournamentId,
        phase: 'group',
        groupId,
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[j],
        slot: slot++,
      });
    }
  }
  return drafts;
}

export interface Seed {
  /** null si encara no se sap qui serà (el quadre es genera abans d'acabar els grups). */
  teamId: string | null;
  source: MatchSource | null;
}

interface PlannedMatch {
  id: string;
  draft: MatchDraft;
}

/**
 * Quadre estàndard: el 1r cap de sèrie contra l'últim, el 2n contra el penúltim…
 * i cada ronda següent enllaça els guanyadors de dos slots consecutius.
 *
 * Els ids es generen aquí (Firestore els deixa crear al client) perquè les
 * rondes posteriors puguin apuntar al partit d'origen abans de desar res.
 */
export function buildKnockoutPlan(tournamentId: string, seeds: Seed[]): PlannedMatch[] {
  const size = seeds.length;
  if (!roundForSize(size)) return [];

  const plan: PlannedMatch[] = [];
  let previousRoundIds: string[] = [];
  let teamsLeft = size;

  while (teamsLeft >= 2) {
    const round = roundForSize(teamsLeft);
    if (!round) break;

    const isFirstRound = previousRoundIds.length === 0;
    const currentRoundIds: string[] = [];

    for (let slot = 0; slot < teamsLeft / 2; slot++) {
      const id = doc(collection(db, MATCHES)).id;
      currentRoundIds.push(id);

      const draft: MatchDraft = isFirstRound
        ? {
            tournamentId,
            phase: 'knockout',
            round,
            slot,
            homeTeamId: seeds[slot].teamId,
            awayTeamId: seeds[size - 1 - slot].teamId,
            homeSource: seeds[slot].source,
            awaySource: seeds[size - 1 - slot].source,
          }
        : {
            tournamentId,
            phase: 'knockout',
            round,
            slot,
            homeSource: { type: 'winner', matchId: previousRoundIds[slot * 2] },
            awaySource: { type: 'winner', matchId: previousRoundIds[slot * 2 + 1] },
          };

      plan.push({ id, draft });
    }

    // El 3r i 4t lloc surt dels perdedors de les semifinals.
    if (round === 'semis') {
      plan.push({
        id: doc(collection(db, MATCHES)).id,
        draft: {
          tournamentId,
          phase: 'knockout',
          round: 'tercer',
          slot: 0,
          homeSource: { type: 'loser', matchId: currentRoundIds[0] },
          awaySource: { type: 'loser', matchId: currentRoundIds[1] },
        },
      });
    }

    previousRoundIds = currentRoundIds;
    teamsLeft = teamsLeft / 2;
  }

  return plan;
}

export async function writePlan(plan: PlannedMatch[], uid: string) {
  const batch = writeBatch(db);
  for (const { id, draft } of plan) {
    batch.set(doc(db, MATCHES, id), draftToDoc(draft, uid));
  }
  await batch.commit();
}

/**
 * Un slot del quadre pot estar en tres estats ben diferents, i confondre'ls és
 * el que feia que un equip guanyés rondes que encara no s'havien jugat:
 *  - ocupat per un equip,
 *  - BUIT: plaça sobrant del quadre (ningú hi arribarà mai) → l'altre passa per bye,
 *  - PENDENT: espera el resultat d'un partit anterior → no s'hi pot tocar.
 */
const BYE = Symbol('slot buit');
const PENDING = Symbol('slot pendent');
type Slot = string | typeof BYE | typeof PENDING;

interface Outcome {
  winner: Slot;
  loser: Slot;
}

/** Qui ocupa un costat d'un partit, mirant enrere pel quadre si cal. */
function occupantOf(
  teamId: string | null,
  source: MatchSource | null,
  byId: Map<string, Match>,
  cache: Map<string, Outcome>,
  seen: Set<string>,
): Slot {
  if (teamId) return teamId;
  // Sense equip i sense origen: és una plaça sobrant del quadre.
  if (!source) return BYE;
  // Els classificats de grup no es resolen mai automàticament.
  if (source.type === 'groupPos') return PENDING;

  const origin = byId.get(source.matchId);
  if (!origin) return BYE; // El partit d'origen s'ha esborrat (era un doble bye).

  const outcome = resolveOutcome(origin, byId, cache, seen);
  return source.type === 'winner' ? outcome.winner : outcome.loser;
}

function resolveOutcome(
  match: Match,
  byId: Map<string, Match>,
  cache: Map<string, Outcome>,
  seen: Set<string>,
): Outcome {
  const cached = cache.get(match.id);
  if (cached) return cached;
  if (seen.has(match.id)) return { winner: PENDING, loser: PENDING }; // guarda contra cicles

  seen.add(match.id);

  let outcome: Outcome;

  if (match.status === 'finished' && match.homeScore != null && match.awayScore != null) {
    const winner = winnerOf(match);
    outcome = winner
      ? { winner, loser: (winner === match.homeTeamId ? match.awayTeamId : match.homeTeamId) ?? BYE }
      : { winner: PENDING, loser: PENDING }; // empat sense desempatar
  } else {
    const home = occupantOf(match.homeTeamId, match.homeSource, byId, cache, seen);
    const away = occupantOf(match.awayTeamId, match.awaySource, byId, cache, seen);

    if (home === BYE && away === BYE) outcome = { winner: BYE, loser: BYE };
    else if (away === BYE && typeof home === 'string') outcome = { winner: home, loser: BYE };
    else if (home === BYE && typeof away === 'string') outcome = { winner: away, loser: BYE };
    else outcome = { winner: PENDING, loser: PENDING };
  }

  cache.set(match.id, outcome);
  return outcome;
}

/**
 * Resol les places sobrants d'una eliminatòria amb menys equips que slots.
 *
 * Ho calcula tot en memòria i ho desa en un sol batch: un partit només es dona
 * per guanyat quan el rival és una plaça sobrant confirmada, mai quan encara
 * s'espera el resultat d'una ronda anterior.
 */
export async function advanceByes(tournamentId: string, uid: string) {
  const snapshot = await getDocs(
    query(
      collection(db, MATCHES),
      where('tournamentId', '==', tournamentId),
      where('phase', '==', 'knockout'),
    ),
  );

  const matches = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Match);
  const byId = new Map(matches.map((match) => [match.id, match]));
  const cache = new Map<string, Outcome>();

  const batch = writeBatch(db);
  let dirty = false;

  for (const match of matches) {
    if (match.status === 'finished') continue;

    const home = occupantOf(match.homeTeamId, match.homeSource, byId, cache, new Set());
    const away = occupantOf(match.awayTeamId, match.awaySource, byId, cache, new Set());
    const ref = doc(db, MATCHES, match.id);

    // Partit fantasma: cap dels dos costats s'omplirà mai.
    if (home === BYE && away === BYE) {
      batch.delete(ref);
      dirty = true;
      continue;
    }

    // Un consol pel 3r lloc amb un sol aspirant no té sentit.
    if (match.round === 'tercer' && (home === BYE || away === BYE)) {
      batch.delete(ref);
      dirty = true;
      continue;
    }

    const patch: Record<string, unknown> = {};

    if (typeof home === 'string' && match.homeTeamId !== home) patch.homeTeamId = home;
    if (typeof away === 'string' && match.awayTeamId !== away) patch.awayTeamId = away;

    // Fixem el bye al document perquè la funció sigui idempotent: en una segona
    // passada el costat buit ja no arrossega cap origen pendent.
    if (home === BYE && match.homeSource !== null) patch.homeSource = null;
    if (away === BYE && match.awaySource !== null) patch.awaySource = null;

    // Passa de ronda només si el rival és una plaça sobrant confirmada.
    if (typeof home === 'string' && away === BYE) {
      patch.homeScore = 1;
      patch.awayScore = 0;
      patch.status = 'finished' satisfies MatchStatus;
    } else if (typeof away === 'string' && home === BYE) {
      patch.homeScore = 0;
      patch.awayScore = 1;
      patch.status = 'finished' satisfies MatchStatus;
    }

    if (Object.keys(patch).length > 0) {
      patch.updatedAt = serverTimestamp();
      patch.updatedBy = uid;
      batch.update(ref, patch);
      dirty = true;
    }
  }

  if (dirty) await batch.commit();
}

export async function writeDrafts(drafts: MatchDraft[], uid: string) {
  const batch = writeBatch(db);
  for (const draft of drafts) {
    batch.set(doc(collection(db, MATCHES)), draftToDoc(draft, uid));
  }
  await batch.commit();
}

export async function deleteMatchesWhere(tournamentId: string, predicate: (match: Match) => boolean) {
  const snapshot = await getDocs(query(collection(db, MATCHES), where('tournamentId', '==', tournamentId)));
  const batch = writeBatch(db);
  let dirty = false;

  for (const docSnap of snapshot.docs) {
    const match = { id: docSnap.id, ...docSnap.data() } as Match;
    if (predicate(match)) {
      batch.delete(doc(db, MATCHES, match.id));
      dirty = true;
    }
  }

  if (dirty) await batch.commit();
}
