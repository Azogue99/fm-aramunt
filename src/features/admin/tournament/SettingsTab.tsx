import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Field';
import { useFeedback } from '../../../components/ui/Feedback';
import { scoringFor } from '../../../hooks/useTournament';
import { KNOCKOUT_SIZES } from '../../../services/matches';
import { updateTournament } from '../../../services/tournaments';
import type { Tournament, TournamentFormat } from '../../../types';

interface SettingsTabProps {
  tournament: Tournament;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ tournament }) => {
  const { toast } = useFeedback();
  const [name, setName] = useState(tournament.name);
  const [year, setYear] = useState(tournament.year);
  const [format, setFormat] = useState<TournamentFormat>(tournament.format ?? 'groups_knockout');
  const [minPlayers, setMinPlayers] = useState(tournament.minPlayers);
  const [maxPlayers, setMaxPlayers] = useState(tournament.maxPlayers);
  const [qualifiers, setQualifiers] = useState(tournament.qualifiersPerGroup);
  const [knockoutSize, setKnockoutSize] = useState(tournament.knockoutSize);
  const [win, setWin] = useState(scoringFor(tournament).win);
  const [draw, setDraw] = useState(scoringFor(tournament).draw);
  const [loss, setLoss] = useState(scoringFor(tournament).loss);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const scoring = scoringFor(tournament);
    setName(tournament.name);
    setYear(tournament.year);
    setFormat(tournament.format ?? 'groups_knockout');
    setMinPlayers(tournament.minPlayers);
    setMaxPlayers(tournament.maxPlayers);
    setQualifiers(tournament.qualifiersPerGroup);
    setKnockoutSize(tournament.knockoutSize);
    setWin(scoring.win);
    setDraw(scoring.draw);
    setLoss(scoring.loss);
  }, [tournament]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (maxPlayers < minPlayers) return;
    setSaving(true);
    try {
      await updateTournament(tournament.id, {
        name: name.trim(),
        year,
        format,
        minPlayers,
        maxPlayers,
        qualifiersPerGroup: format === 'groups_knockout' ? qualifiers : 0,
        knockoutSize,
        scoring: { win, draw, loss },
      });
      toast('Configuració del torneig desada.');
    } catch (error) {
      console.error(error);
      toast("No s'ha pogut desar la configuració.", 'error');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-7">
      <section className="grid gap-4 sm:grid-cols-2">
        <Input label="Nom visible" value={name} onChange={(event) => setName(event.target.value)} required />
        <Input label="Any" type="number" min={2020} max={2100} value={year} onChange={(event) => setYear(Number(event.target.value))} required />
        <Input label="Mínim de jugadors per equip" type="number" min={1} value={minPlayers} onChange={(event) => setMinPlayers(Number(event.target.value))} required />
        <Input label="Màxim de jugadors per equip" type="number" min={minPlayers} value={maxPlayers} onChange={(event) => setMaxPlayers(Number(event.target.value))} required />
      </section>

      <section className="border-t border-hairline pt-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-brand">Format</h3>
        <Select label="Sistema de competició" value={format} onChange={(event) => setFormat(event.target.value as TournamentFormat)}>
          <option value="groups_knockout">Fase de grups i eliminatòries</option>
          <option value="knockout">Eliminatòria directa</option>
        </Select>
        {format === 'groups_knockout' && (
          <Input className="mt-4" label="Classificats per grup" type="number" min={1} value={qualifiers} onChange={(event) => setQualifiers(Number(event.target.value))} required />
        )}
        <Select className="mt-4" label="Mida del quadre eliminatori" value={knockoutSize} onChange={(event) => setKnockoutSize(Number(event.target.value))}>
          {KNOCKOUT_SIZES.map((size) => <option key={size} value={size}>{size} equips</option>)}
        </Select>
      </section>

      <section className="border-t border-hairline pt-6">
        <h3 className="mb-1 text-sm font-bold uppercase tracking-[0.14em] text-brand">Puntuació de la lligueta</h3>
        <p className="mb-4 text-sm text-muted">Per exemple, bàsquet habitual: derrota 0, empat 1, victòria 3.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Victòria" type="number" min={0} value={win} onChange={(event) => setWin(Number(event.target.value))} required />
          <Input label="Empat" type="number" min={0} value={draw} onChange={(event) => setDraw(Number(event.target.value))} required />
          <Input label="Derrota" type="number" min={0} value={loss} onChange={(event) => setLoss(Number(event.target.value))} required />
        </div>
      </section>

      <Button type="submit" size="lg" disabled={saving || maxPlayers < minPlayers || !name.trim()}>
        {saving ? 'Desant…' : 'Desar configuració'}
      </Button>
    </form>
  );
};
