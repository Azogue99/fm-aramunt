import { useMemo } from 'react';
import { useCollection } from './useCollection';
import { matchesByTournamentQuery } from '../services/matches';
import { teamsByTournamentQuery } from '../services/teams';
import { tournamentsQuery } from '../services/tournaments';
import type { Match, Standing, Team, Tournament, TournamentScoring } from '../types';

export function useTournaments() {
  return useCollection<Tournament>(tournamentsQuery(), []);
}

export function useTournamentBySlug(slug: string | undefined) {
  const { data, loading, error } = useTournaments();
  const tournament = useMemo(() => data.find((item) => item.slug === slug) ?? null, [data, slug]);
  return { tournament, loading, error };
}

export function useTeams(tournamentId: string | undefined) {
  return useCollection<Team>(tournamentId ? teamsByTournamentQuery(tournamentId) : null, [tournamentId]);
}

export function useMatches(tournamentId: string | undefined) {
  return useCollection<Match>(tournamentId ? matchesByTournamentQuery(tournamentId) : null, [tournamentId]);
}

/** Índex ràpid id → nom, que es fa servir a totes les taules i al quadre. */
export function useTeamNames(teams: Team[]): Map<string, string> {
  return useMemo(() => new Map(teams.map((team) => [team.id, team.name])), [teams]);
}

/** Compatibilitat amb tornejos creats abans que la puntuació fos configurable. */
export function scoringFor(tournament: Tournament): TournamentScoring {
  return tournament.scoring ?? { win: 3, draw: 1, loss: 0 };
}

/**
 * La classificació no es desa enlloc: es deriva sempre dels partits acabats.
 * Així no hi ha cap camp `points` que un client pugui manipular ni que es
 * pugui desincronitzar del resultat real.
 */
export function computeStandings(
  teamIds: string[],
  teams: Team[],
  matches: Match[],
  tournament: Tournament,
): Standing[] {
  const scoring = scoringFor(tournament);
  const names = new Map(teams.map((team) => [team.id, team.name]));

  const rows = new Map<string, Standing>(
    teamIds.map((teamId) => [
      teamId,
      {
        teamId,
        teamName: names.get(teamId) ?? 'Equip esborrat',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        scored: 0,
        conceded: 0,
        diff: 0,
        points: 0,
      },
    ]),
  );

  // 1. Calculate overall stats
  for (const match of matches) {
    if (match.status !== 'finished' || match.homeScore == null || match.awayScore == null) continue;
    const home = match.homeTeamId ? rows.get(match.homeTeamId) : undefined;
    const away = match.awayTeamId ? rows.get(match.awayTeamId) : undefined;
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.scored += match.homeScore;
    home.conceded += match.awayScore;
    away.scored += match.awayScore;
    away.conceded += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      home.points += scoring.win;
      away.lost += 1;
      away.points += scoring.loss;
    } else if (match.awayScore > match.homeScore) {
      away.won += 1;
      away.points += scoring.win;
      home.lost += 1;
      home.points += scoring.loss;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += scoring.draw;
      away.points += scoring.draw;
    }
  }

  const baseStandings = [...rows.values()].map((row) => ({ ...row, diff: row.scored - row.conceded }));

  // 2. Group teams by overall points
  const pointsGroups = new Map<number, string[]>();
  for (const row of baseStandings) {
    const group = pointsGroups.get(row.points) ?? [];
    group.push(row.teamId);
    pointsGroups.set(row.points, group);
  }

  // 3. Calculate Head-to-Head (H2H) stats for tied teams
  const h2hStats = new Map<string, { points: number; diff: number; scored: number }>();
  for (const [, tiedTeamIds] of pointsGroups.entries()) {
    if (tiedTeamIds.length < 2) continue; // No tie

    // Initialize H2H stats for this group
    for (const teamId of tiedTeamIds) {
      h2hStats.set(teamId, { points: 0, diff: 0, scored: 0 });
    }

    // Filter matches played *only* between these tied teams
    const h2hMatches = matches.filter(
      (m) =>
        m.status === 'finished' &&
        m.homeScore != null &&
        m.awayScore != null &&
        m.homeTeamId &&
        m.awayTeamId &&
        tiedTeamIds.includes(m.homeTeamId) &&
        tiedTeamIds.includes(m.awayTeamId),
    );

    for (const match of h2hMatches) {
      const homeStats = h2hStats.get(match.homeTeamId!)!;
      const awayStats = h2hStats.get(match.awayTeamId!)!;
      const homeScore = match.homeScore!;
      const awayScore = match.awayScore!;

      homeStats.scored += homeScore;
      awayStats.scored += awayScore;
      homeStats.diff += homeScore - awayScore;
      awayStats.diff += awayScore - homeScore;

      if (homeScore > awayScore) {
        homeStats.points += scoring.win;
      } else if (awayScore > homeScore) {
        awayStats.points += scoring.win;
      } else {
        homeStats.points += scoring.draw;
        awayStats.points += scoring.draw;
      }
    }
  }

  // 4. Sort using the new FCF/UEFA criteria
  return baseStandings.sort((a, b) => {
    // Criteri 1: Punts generals
    if (b.points !== a.points) return b.points - a.points;

    // Criteri 2, 3 i 4: Mini-lliga (H2H) entre empatats
    const aH2H = h2hStats.get(a.teamId);
    const bH2H = h2hStats.get(b.teamId);
    if (aH2H && bH2H) {
      if (bH2H.points !== aH2H.points) return bH2H.points - aH2H.points;
      if (bH2H.diff !== aH2H.diff) return bH2H.diff - aH2H.diff;
      if (bH2H.scored !== aH2H.scored) return bH2H.scored - aH2H.scored;
    }

    // Criteri 5: Diferència de gols general
    if (b.diff !== a.diff) return b.diff - a.diff;

    // Criteri 6: Gols a favor general
    if (b.scored !== a.scored) return b.scored - a.scored;

    // Criteri 7: Ordre alfabètic
    return a.teamName.localeCompare(b.teamName, 'ca');
  });
}

/** Classificació de cada grup del torneig, en l'ordre en què estan definits. */
export function useGroupStandings(tournament: Tournament | null, teams: Team[], matches: Match[]) {
  return useMemo(() => {
    if (!tournament) return [];
    return tournament.groups.map((group) => ({
      group,
      standings: computeStandings(
        group.teamIds,
        teams,
        matches.filter((match) => match.phase === 'group' && match.groupId === group.id),
        tournament,
      ),
    }));
  }, [tournament, teams, matches]);
}
