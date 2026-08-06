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

  return [...rows.values()]
    .map((row) => ({ ...row, diff: row.scored - row.conceded }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.diff - a.diff ||
        b.scored - a.scored ||
        a.teamName.localeCompare(b.teamName, 'ca'),
    );
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
