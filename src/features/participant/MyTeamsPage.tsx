import React, { useMemo, useState } from 'react';
import { Check, Copy, LogOut, Plus, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import { PageHeader } from '../../components/layout/PublicLayout';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button, LinkButton } from '../../components/ui/Button';
import { EmptyState, Spinner } from '../../components/ui/EmptyState';
import { Input, Select } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { useFeedback } from '../../components/ui/Feedback';
import { MatchRow } from '../../components/tournament/MatchRow';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { useTeams, useTournaments } from '../../hooks/useTournament';
import { matchesByTournamentQuery } from '../../services/matches';
import {
  addGuestMember,
  createTeam,
  leaveTeam,
  myTeamsQuery,
  regenerateInviteCode,
  removeMemberAt,
  setInviteEnabled,
} from '../../services/teams';
import { inviteUrl } from '../../config/site';
import type { Match, Team, TeamStatus, Tournament } from '../../types';

const STATUS: Record<TeamStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pendent d'aprovació", tone: 'pending' },
  approved: { label: 'Aprovat', tone: 'positive' },
  rejected: { label: 'Rebutjat', tone: 'negative' },
};

export const MyTeamsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: tournaments } = useTournaments();
  const { data: teams, loading } = useCollection<Team>(user ? myTeamsQuery(user.uid) : null, [user?.uid]);
  const [creating, setCreating] = useState(false);

  const openTournaments = tournaments.filter((tournament) => tournament.registrationOpen);
  const byId = useMemo(() => new Map(tournaments.map((t) => [t.id, t])), [tournaments]);

  return (
    <>
      <PageHeader
        title="El meu equip"
        lead="Aquí gestiones els equips on jugues: qui hi és, com convidar gent i quan jugueu."
        actions={
          <>
            {openTournaments.length > 0 && (
              <Button onClick={() => setCreating(true)}>
                <Plus size={16} /> Crear equip
              </Button>
            )}
            <Button variant="ghost" onClick={() => void signOut()}>
              <LogOut size={16} /> Tancar sessió
            </Button>
          </>
        }
      />

      {loading ? (
        <Spinner />
      ) : teams.length === 0 ? (
        <EmptyState
          title="Encara no estàs a cap equip"
          description={
            openTournaments.length > 0
              ? "Crea'n un i comparteix l'enllaç amb qui vulguis, o demana l'enllaç a qui ja n'hagi creat un."
              : 'Ara mateix no hi ha inscripcions obertes. Fes una ullada als tornejos.'
          }
          action={
            openTournaments.length > 0 ? (
              <Button onClick={() => setCreating(true)}>Crear el meu equip</Button>
            ) : (
              <LinkButton to="/tornejos" variant="ghost">
                Veure els tornejos
              </LinkButton>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-12">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} tournament={byId.get(team.tournamentId) ?? null} />
          ))}
        </div>
      )}

      <CreateTeamModal open={creating} onClose={() => setCreating(false)} tournaments={openTournaments} />
    </>
  );
};

// ------------------------------------------------------------------ Crear

const CreateTeamModal: React.FC<{
  open: boolean;
  onClose: () => void;
  tournaments: Tournament[];
}> = ({ open, onClose, tournaments }) => {
  const { user } = useAuth();
  const { toast } = useFeedback();
  const [name, setName] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = tournamentId || tournaments[0]?.id || '';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !selected) return;

    setSaving(true);
    try {
      await createTeam({
        tournamentId: selected,
        name,
        captainUid: user.uid,
        captainName: user.displayName ?? user.email ?? 'Capità',
      });
      toast("Equip creat! Ja pots compartir l'enllaç amb la resta.");
      setName('');
      onClose();
    } catch (error) {
      console.error(error);
      toast("No s'ha pogut crear l'equip.", 'error');
    }
    setSaving(false);
  };

  return (
    <Modal open={open} title="Crear un equip" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Select
          label="Torneig"
          value={selected}
          onChange={(event) => setTournamentId(event.target.value)}
          required
        >
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </Select>

        <Input
          label="Nom de l'equip"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Els Barrufets"
          maxLength={40}
          required
        />

        <p className="text-sm text-muted">
          En crear-lo en seràs el capità. Després podràs convidar la resta amb un enllaç i afegir a mà qui no
          tingui compte.
        </p>

        <Button type="submit" disabled={saving || !selected} size="lg">
          {saving ? 'Creant…' : "Crear l'equip"}
        </Button>
      </form>
    </Modal>
  );
};

// ------------------------------------------------------------------ Fitxa

const TeamCard: React.FC<{ team: Team; tournament: Tournament | null }> = ({ team, tournament }) => {
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const [guestName, setGuestName] = useState('');
  const [copied, setCopied] = useState(false);

  const isCaptain = user?.uid === team.captainUid;
  const status = STATUS[team.status];
  const full = tournament ? team.members.length >= tournament.maxPlayers : false;

  const { data: matches } = useCollection<Match>(
    team.tournamentId ? matchesByTournamentQuery(team.tournamentId) : null,
    [team.tournamentId],
  );
  const { data: rivals } = useTeams(team.tournamentId);

  const ourMatches = matches
    .filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id)
    .sort((a, b) => (a.scheduledAt?.toMillis() ?? Infinity) - (b.scheduledAt?.toMillis() ?? Infinity));

  const names = useMemo(() => new Map(rivals.map((item) => [item.id, item.name])), [rivals]);
  const teamName = (id: string | null) => (id ? (names.get(id) ?? 'Equip esborrat') : null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl(team.inviteCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Enllaç copiat! Envia'l per WhatsApp a qui vulguis.");
  };

  const handleAddGuest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!guestName.trim()) return;
    await addGuestMember(team, guestName);
    setGuestName('');
    toast('Membre afegit.');
  };

  const handleRemove = async (index: number) => {
    const member = team.members[index];
    const ok = await confirm({
      title: 'Treure del equip',
      message: `Segur que vols treure ${member.name} de ${team.name}?`,
      confirmLabel: 'Treure',
      destructive: true,
    });
    if (ok) await removeMemberAt(team, index);
  };

  const handleLeave = async () => {
    if (!user) return;
    const ok = await confirm({
      title: "Sortir de l'equip",
      message: `Deixaràs de formar part de ${team.name}. El capità et podrà tornar a convidar.`,
      confirmLabel: 'Sortir',
      destructive: true,
    });
    if (ok) await leaveTeam(team, user.uid);
  };

  return (
    <section className="border-t border-hairline pt-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-ink">{team.name}</h2>
          <p className="mt-1 text-sm text-muted">{tournament?.name ?? 'Torneig desconegut'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          {isCaptain && <Badge>Ets el capità</Badge>}
        </div>
      </header>

      {team.status === 'pending' && (
        <p className="mb-6 border-l-2 border-brand bg-white px-4 py-3 text-sm text-muted">
          La comissió ha de validar l&apos;equip abans que surti a la classificació pública. Mentrestant ja podeu
          anar-vos afegint.
        </p>
      )}

      {/* Membres */}
      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-brand">
        Membres ({team.members.length}
        {tournament ? `/${tournament.maxPlayers}` : ''})
      </h3>
      <ul className="mb-6 border-t border-hairline">
        {team.members.map((member, index) => (
          <li key={`${member.uid ?? 'guest'}-${index}`} className="flex min-w-0 items-center justify-between gap-3 border-b border-hairline py-3">
            <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
              <span className="min-w-0 break-words font-medium text-ink">{member.name}</span>
              {member.uid === team.captainUid && <Badge>Capità</Badge>}
              {member.uid === null && <Badge tone="neutral">Sense compte</Badge>}
            </span>
            {isCaptain && member.uid !== team.captainUid && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="rounded p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-700"
                aria-label={`Treure ${member.name}`}
              >
                <Trash2 size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {isCaptain && (
        <div className="mb-8 flex flex-col gap-6 border border-hairline bg-white p-5">
          {/* Enllaç d'invitació */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <UserPlus size={16} /> Convidar per enllaç
            </h4>
            <p className="mb-3 text-sm text-muted">
              Qui obri aquest enllaç i entri amb Google s&apos;afegirà sol a l&apos;equip.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="flex-grow overflow-x-auto border border-hairline bg-paper px-3 py-2.5 text-sm text-muted">
                {inviteUrl(team.inviteCode)}
              </code>
              <Button onClick={handleCopy} disabled={!team.inviteEnabled}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiat' : 'Copiar'}
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await regenerateInviteCode(team.id);
                  toast("Codi nou generat. L'enllaç antic ja no funciona.");
                }}
              >
                <RefreshCw size={14} /> Generar un codi nou
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInviteEnabled(team.id, !team.inviteEnabled)}
              >
                {team.inviteEnabled ? 'Tancar les invitacions' : 'Reobrir les invitacions'}
              </Button>
              {!team.inviteEnabled && <Badge tone="neutral">Invitacions tancades</Badge>}
              {full && <Badge tone="pending">Equip complet</Badge>}
            </div>
          </div>

          {/* Membre sense compte */}
          <form onSubmit={handleAddGuest} className="border-t border-hairline pt-5">
            <h4 className="mb-2 text-sm font-bold text-ink">Afegir algú que no té compte</h4>
            <p className="mb-3 text-sm text-muted">
              Per a qui no faci servir la web: n&apos;hi ha prou amb el nom.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Input
                label="Nom i cognoms"
                className="flex-grow"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Pocahontas"
                maxLength={60}
              />
              <Button type="submit" variant="secondary" disabled={!guestName.trim() || full}>
                Afegir
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Partits */}
      {ourMatches.length > 0 && (
        <>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-brand">Els vostres partits</h3>
          <ul className="mb-6 border-t border-hairline">
            {ourMatches.map((match) => (
              <MatchRow key={match.id} match={match} teamName={teamName} />
            ))}
          </ul>
        </>
      )}

      {!isCaptain && (
        <Button variant="ghost" size="sm" onClick={handleLeave}>
          <LogOut size={14} /> Sortir de l&apos;equip
        </Button>
      )}
    </section>
  );
};
