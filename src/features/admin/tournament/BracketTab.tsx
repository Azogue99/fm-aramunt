import React, { useMemo, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useFeedback } from '../../../components/ui/Feedback';
import { BracketView } from '../../../components/tournament/BracketView';
import { useAuth } from '../../../context/AuthContext';
import { useGroupStandings } from '../../../hooks/useTournament';
import {
  KNOCKOUT_SIZES,
  type Seed,
  buildKnockoutPlan,
  deleteMatchesWhere,
  roundForSize,
  writePlan,
} from '../../../services/matches';
import { updateTournament } from '../../../services/tournaments';
import type { Match, Team, Tournament } from '../../../types';

interface BracketTabProps {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  teamName: (id: string | null) => string | null;
  groupName: (id: string) => string;
}

export const BracketTab: React.FC<BracketTabProps> = ({
  tournament,
  teams,
  matches,
  teamName,
  groupName,
}) => {
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const [size, setSize] = useState(tournament.knockoutSize || 4);
  const [busy, setBusy] = useState(false);

  const groupStandings = useGroupStandings(tournament, teams, matches);
  const knockoutMatches = matches.filter((match) => match.phase === 'knockout');

  /**
   * Caps de sèrie intercalant grups: 1r A, 1r B, 2n A, 2n B… Així el 1r i el 2n
   * d'un mateix grup queden a meitats oposades del quadre i no es poden creuar
   * fins a la final.
   */
  const seeds: Seed[] = useMemo(() => {
    const perGroup = Math.max(tournament.qualifiersPerGroup, 1);
    const result: Seed[] = [];

    for (let position = 1; position <= perGroup; position++) {
      for (const { group, standings } of groupStandings) {
        result.push({
          teamId: standings[position - 1]?.teamId ?? null,
          source: { type: 'groupPos', groupId: group.id, pos: position },
        });
      }
    }

    return result.slice(0, size);
  }, [groupStandings, tournament.qualifiersPerGroup, size]);

  const enoughSeeds = seeds.length === size && roundForSize(size) !== null;

  const handleGenerate = async () => {
    if (!user || !enoughSeeds) return;

    const ok = await confirm({
      title: 'Generar l\'eliminatòria',
      message:
        knockoutMatches.length > 0
          ? `S'esborraran els ${knockoutMatches.length} partits d'eliminatòria actuals i se'n generarà un quadre nou de ${size} equips.`
          : `Es crearà el quadre de ${size} equips amb els classificats actuals de cada grup, més el partit pel 3r i 4t lloc.`,
      confirmLabel: 'Generar',
      destructive: knockoutMatches.length > 0,
    });
    if (!ok) return;

    setBusy(true);
    try {
      if (knockoutMatches.length > 0) {
        await deleteMatchesWhere(tournament.id, (match) => match.phase === 'knockout');
      }
      await writePlan(buildKnockoutPlan(tournament.id, seeds), user.uid);
      if (tournament.knockoutSize !== size) {
        await updateTournament(tournament.id, { knockoutSize: size });
      }
      toast('Quadre generat.');
    } catch (error) {
      console.error(error);
      toast('No s\'ha pogut generar el quadre.', 'error');
    }
    setBusy(false);
  };

  if (tournament.groups.length === 0) {
    return (
      <EmptyState
        title="Primer calen els grups"
        description="L'eliminatòria surt dels classificats de cada grup, així que abans has de crear els grups i jugar la lligueta."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border border-hairline bg-white p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="knockout-size" className="text-sm font-semibold text-ink">
              Equips a l&apos;eliminatòria
            </label>
            <select
              id="knockout-size"
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              className="w-32 rounded border border-hairline bg-white px-3 py-2.5 text-ink focus:border-brand focus:outline-none"
            >
              {KNOCKOUT_SIZES.map((option) => (
                <option key={option} value={option}>
                  {option} equips
                </option>
              ))}
            </select>
          </div>
          <p className="pb-3 text-sm text-muted">
            {tournament.qualifiersPerGroup} per grup × {tournament.groups.length} grups ={' '}
            {tournament.qualifiersPerGroup * tournament.groups.length} classificats
          </p>
        </div>

        <Button onClick={handleGenerate} disabled={busy || !enoughSeeds}>
          <Wand2 size={16} /> {busy ? 'Generant…' : 'Generar el quadre'}
        </Button>
      </div>

      {!enoughSeeds && (
        <p className="border-l-2 border-brand bg-white px-4 py-3 text-sm text-muted">
          Amb {tournament.groups.length} grups i {tournament.qualifiersPerGroup} classificats per grup surten{' '}
          {tournament.qualifiersPerGroup * tournament.groups.length} equips, i has demanat un quadre de {size}.
          Ajusta el nombre de grups, els classificats per grup o la mida del quadre.
        </p>
      )}

      {knockoutMatches.length === 0 ? (
        <EmptyState
          title="Encara no hi ha quadre"
          description="El pots generar abans que acabin els grups: els noms es completaran sols a mesura que es tanquin els partits."
        />
      ) : (
        <BracketView matches={knockoutMatches} teamName={teamName} groupName={groupName} />
      )}
    </div>
  );
};
