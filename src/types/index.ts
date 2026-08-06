import type { Timestamp } from 'firebase/firestore';

/** Un document de Firestore sempre arriba amb el seu id afegit pels hooks. */
export interface WithId {
  id: string;
}

// ---------------------------------------------------------------- Usuaris

export type UserRole = 'superadmin' | 'admin_futbol' | 'admin_basquet' | 'barista';

export interface AppUser extends WithId {
  email: string | null;
  name: string | null;
  photoURL?: string | null;
  roles: UserRole[];
}

/** Rols reservats per a un email que encara no ha iniciat mai sessió. */
export interface RoleInvite extends WithId {
  roles: UserRole[];
  invitedBy?: string;
  createdAt?: Timestamp;
}

// ---------------------------------------------------------------- Tornejos

export type Sport = 'futbol' | 'basquet';

export type TournamentPhase = 'inscripcions' | 'grups' | 'eliminatories' | 'finalitzat';
export type TournamentFormat = 'groups_knockout' | 'knockout';

/** Punts de classificació; es defineixen per torneig, no per esport. */
export interface TournamentScoring {
  win: number;
  draw: number;
  loss: number;
}

export interface TournamentGroup {
  id: string;
  name: string;
  teamIds: string[];
}

export interface Tournament extends WithId {
  slug: string;
  name: string;
  sport: Sport;
  year: number;
  /** Rol que pot administrar aquest torneig (a banda del superadmin). */
  managerRole: UserRole;
  registrationOpen: boolean;
  minPlayers: number;
  maxPlayers: number;
  /** Si hi ha lligueta abans del quadre, o bé eliminatòria directa. */
  format?: TournamentFormat;
  /** Documents antics sense aquest camp usen 3/1/0. */
  scoring?: TournamentScoring;
  phase: TournamentPhase;
  groups: TournamentGroup[];
  /** Nombre d'equips que entren a l'eliminatòria. */
  knockoutSize: number;
  /** Classificats per grup que passen a l'eliminatòria. */
  qualifiersPerGroup: number;
  order: number;
}

// ---------------------------------------------------------------- Equips

export type TeamStatus = 'pending' | 'approved' | 'rejected';

export interface TeamMember {
  name: string;
  /** null quan és algú convidat pel capità que no té compte. */
  uid: string | null;
}

export interface Team extends WithId {
  tournamentId: string;
  name: string;
  status: TeamStatus;
  captainUid: string;
  /** Només els membres amb compte. Les regles de Firestore hi confien. */
  memberUids: string[];
  members: TeamMember[];
  inviteCode: string;
  inviteEnabled: boolean;
  createdAt?: Timestamp;
  createdBy: string;
}

// ---------------------------------------------------------------- Partits

export type MatchPhase = 'group' | 'knockout';
export type MatchStatus = 'scheduled' | 'live' | 'finished';
export type KnockoutRound = 'setzens' | 'vuitens' | 'quarts' | 'semis' | 'tercer' | 'final';

/** D'on surt un equip que encara no es coneix quan es genera el quadre. */
export type MatchSource =
  | { type: 'groupPos'; groupId: string; pos: number }
  | { type: 'winner'; matchId: string }
  | { type: 'loser'; matchId: string };

export interface Match extends WithId {
  tournamentId: string;
  phase: MatchPhase;
  groupId: string | null;
  round: KnockoutRound | null;
  /** Ordre dins de la ronda; determina l'aparellament del quadre. */
  slot: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeSource: MatchSource | null;
  awaySource: MatchSource | null;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  scheduledAt: Timestamp | null;
  pitch: string | null;
  updatedAt?: Timestamp;
  updatedBy?: string;
}

/** Fila de classificació, sempre derivada dels partits acabats. */
export interface Standing {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  scored: number;
  conceded: number;
  diff: number;
  points: number;
}

// ---------------------------------------------------------------- Barra

export interface BarProduct extends WithId {
  name: string;
  price: number;
  order: number;
}

// ---------------------------------------------------------------- Contingut

export interface ProgramEntry {
  day: string;
  time: string;
  title: string;
  detail?: string;
  order?: number;
}

export interface SiteContent {
  hero_title: string;
  hero_subtitle: string;
  info_text: string;
  programa_intro?: string;
  programa?: ProgramEntry[];
}
