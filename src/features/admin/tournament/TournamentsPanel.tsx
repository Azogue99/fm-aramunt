import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PanelHeader } from '../../../components/layout/AdminLayout';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState, Spinner } from '../../../components/ui/EmptyState';
import { Input, Select } from '../../../components/ui/Field';
import { Modal } from '../../../components/ui/Modal';
import { useFeedback } from '../../../components/ui/Feedback';
import { canManageTournament } from '../../../config/roles';
import { useAuth } from '../../../context/AuthContext';
import { useTournaments } from '../../../hooks/useTournament';
import { createTournament } from '../../../services/tournaments';
import type { Sport, Tournament, TournamentFormat, UserRole } from '../../../types';

const FORMAT_LABEL: Record<TournamentFormat, string> = {
  groups_knockout: 'Grups i eliminatòries',
  knockout: 'Eliminatòria directa',
};

export const TournamentsPanel: React.FC = () => {
  const { roles } = useAuth();
  const { data: tournaments, loading } = useTournaments();
  const [creating, setCreating] = useState(false);
  const manageable = useMemo(
    () => tournaments.filter((tournament) => canManageTournament(roles, tournament.managerRole)),
    [roles, tournaments],
  );
  const isSuperAdmin = roles.includes('superadmin');

  return (
    <>
      <PanelHeader
        title="Tornejos"
        description={
          isSuperAdmin
            ? 'Crea una edició nova cada any i assigna qui la gestiona.'
            : 'Tria el torneig que tens assignat per gestionar equips, format i partits.'
        }
        actions={
          isSuperAdmin ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} /> Crear torneig
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <Spinner />
      ) : manageable.length === 0 ? (
        <EmptyState
          title="No tens cap torneig assignat"
          description="Un superadministrador t'ha d'assignar com a responsable en crear l'edició."
        />
      ) : (
        <ul className="flex flex-col border-t border-hairline">
          {manageable.map((tournament) => (
            <TournamentRow key={tournament.id} tournament={tournament} />
          ))}
        </ul>
      )}

      <CreateTournamentModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
};

const TournamentRow: React.FC<{ tournament: Tournament }> = ({ tournament }) => (
  <li className="border-b border-hairline">
    <Link
      to={`/panell/tornejos/${tournament.slug}`}
      className="flex flex-col gap-3 py-5 transition-colors hover:bg-white sm:flex-row sm:items-center sm:justify-between sm:px-3"
    >
      <div>
        <h2 className="text-lg font-bold text-ink">{tournament.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {tournament.year} · {FORMAT_LABEL[tournament.format ?? 'groups_knockout']}
        </p>
      </div>
      <div className="flex gap-2">
        <Badge>{tournament.registrationOpen ? 'Inscripcions obertes' : 'Inscripcions tancades'}</Badge>
        <Badge tone="neutral">{tournament.phase}</Badge>
      </div>
    </Link>
  </li>
);

const CreateTournamentModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [sport, setSport] = useState<Sport>('futbol');
  const [managerRole, setManagerRole] = useState<UserRole>('admin_futbol');
  const [format, setFormat] = useState<TournamentFormat>('groups_knockout');
  const [minPlayers, setMinPlayers] = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [saving, setSaving] = useState(false);

  const changeSport = (next: Sport) => {
    setSport(next);
    setManagerRole(next === 'futbol' ? 'admin_futbol' : 'admin_basquet');
    setMinPlayers(next === 'futbol' ? 5 : 3);
    setMaxPlayers(next === 'futbol' ? 8 : 4);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const slug = `${sport}-${year}`;
    setSaving(true);
    try {
      await createTournament({
        name: name.trim() || `${sport === 'futbol' ? 'Futbol' : 'Bàsquet'} ${year}`,
        slug,
        sport,
        year,
        managerRole,
        minPlayers,
        maxPlayers,
        format,
        scoring: { win: 3, draw: 1, loss: 0 },
      });
      toast('Torneig creat. Ja en pots configurar els detalls.');
      onClose();
      navigate(`/panell/tornejos/${slug}`);
    } catch (error) {
      console.error(error);
      toast(error instanceof Error ? error.message : "No s'ha pogut crear el torneig.", 'error');
    }
    setSaving(false);
  };

  return (
    <Modal open={open} title="Crear una nova edició" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input label="Nom visible" value={name} onChange={(event) => setName(event.target.value)} placeholder="Futbol 5v5 2027" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Esport" value={sport} onChange={(event) => changeSport(event.target.value as Sport)}>
            <option value="futbol">Futbol</option>
            <option value="basquet">Bàsquet</option>
          </Select>
          <Input label="Any" type="number" min={2020} max={2100} value={year} onChange={(event) => setYear(Number(event.target.value))} required />
        </div>
        <Select label="Responsable" value={managerRole} onChange={(event) => setManagerRole(event.target.value as UserRole)}>
          <option value="admin_futbol">Admin Futbol</option>
          <option value="admin_basquet">Admin Bàsquet</option>
        </Select>
        <Select label="Format inicial" value={format} onChange={(event) => setFormat(event.target.value as TournamentFormat)}>
          <option value="groups_knockout">Grups i eliminatòries</option>
          <option value="knockout">Eliminatòria directa</option>
        </Select>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Mínim jugadors/equip" type="number" min={1} value={minPlayers} onChange={(event) => setMinPlayers(Number(event.target.value))} required />
          <Input label="Màxim jugadors/equip" type="number" min={minPlayers} value={maxPlayers} onChange={(event) => setMaxPlayers(Number(event.target.value))} required />
        </div>
        <p className="text-sm text-muted">L'identificador serà <code>{sport}-{year}</code>; així hi pot haver una edició diferent cada any.</p>
        <Button type="submit" size="lg" disabled={saving || maxPlayers < minPlayers}>
          {saving ? 'Creant…' : 'Crear torneig'}
        </Button>
      </form>
    </Modal>
  );
};
