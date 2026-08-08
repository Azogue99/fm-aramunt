import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PublicLayout';
import { Button, LinkButton } from '../../components/ui/Button';
import { EmptyState, Spinner } from '../../components/ui/EmptyState';
import { useFeedback } from '../../components/ui/Feedback';
import { useAuth } from '../../context/AuthContext';
import { useTournaments } from '../../hooks/useTournament';
import { findTeamByInviteCode, joinTeam } from '../../services/teams';
import type { Team } from '../../types';

type Blocker = 'not-found' | 'closed' | 'registration-closed' | 'full' | 'already-in' | null;

export const JoinTeamPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: tournaments } = useTournaments();
  const { toast } = useFeedback();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      setTeam(await findTeamByInviteCode(code));
    } catch (error) {
      console.error(error);
      setTeam(null);
    }
    setLoading(false);
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || authLoading) return <Spinner />;

  if (!team) {
    return (
      <EmptyState
        title="Aquest enllaç no funciona"
        description="Pot ser que el capità n'hagi generat un de nou. Demana-li que te'l torni a enviar."
        action={
          <LinkButton to="/tornejos" variant="ghost">
            Veure els tornejos
          </LinkButton>
        }
      />
    );
  }

  const tournament = tournaments.find((item) => item.id === team.tournamentId) ?? null;
  const alreadyIn = user ? team.memberUids.includes(user.uid) : false;
  const full = tournament ? team.members.length >= tournament.maxPlayers : false;

  // Les regles de Firestore també exigeixen que el torneig tingui les
  // inscripcions obertes; sense comprovar-ho aquí, el botó fallava amb un error
  // genèric de permisos en comptes d'explicar què passa.
  const blocker: Blocker = alreadyIn
    ? 'already-in'
    : tournament && !tournament.registrationOpen
      ? 'registration-closed'
      : !team.inviteEnabled
        ? 'closed'
        : full
          ? 'full'
          : null;

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      await joinTeam(team.id, user.uid, user.displayName ?? user.email ?? 'Jugador');
      toast(`Ja ets a ${team.name}!`);
      navigate('/participa');
    } catch (error) {
      console.error(error);
      // Normalment vol dir que les regles han rebutjat l'escriptura perquè
      // l'equip s'ha omplert o s'han tancat les invitacions mentrestant.
      toast("No s'ha pogut completar la inscripció. Torna a provar-ho.", 'error');
      await load();
    }
    setJoining(false);
  };

  return (
    <>
      <PageHeader
        title={team.name}
        lead={
          tournament
            ? `T'han convidat a jugar el ${tournament.name}.`
            : "T'han convidat a unir-te a aquest equip."
        }
      />

      <div className="prose-column">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-brand">
          Qui hi ha ara mateix
        </h2>
        <ul className="mb-8 border-t border-hairline">
          {team.members.map((member, index) => (
            <li key={`${member.uid ?? 'guest'}-${index}`} className="border-b border-hairline py-3 text-sm text-ink">
              {member.name}
            </li>
          ))}
        </ul>

        {blocker === 'already-in' && (
          <Message text={`Ja formes part de ${team.name}.`} action={<LinkButton to="/participa">El meu equip</LinkButton>} />
        )}

        {blocker === 'closed' && (
          <Message text="El capità ha tancat les invitacions d'aquest equip. Parla-hi directament." />
        )}

        {blocker === 'registration-closed' && (
          <Message
            text={`Les inscripcions del ${tournament?.name ?? 'torneig'} ja estan tancades. Si hi voleu entrar igualment, parleu-ho amb la comissió.`}
          />
        )}

        {blocker === 'full' && (
          <Message text={`L'equip ja té els ${tournament?.maxPlayers} jugadors permesos.`} />
        )}

        {blocker === null &&
          (user ? (
            <Button size="lg" onClick={handleJoin} disabled={joining}>
              {joining ? 'Unint-te…' : `Unir-me a ${team.name}`}
            </Button>
          ) : (
            <>
              <p className="mb-4 text-muted">
                Per unir-te cal que entris amb el teu compte de Google. Així sabem qui ets i evitem inscripcions
                falses.
              </p>
              <LinkButton to={`/login?redirect=/unir-se/${code}`} size="lg">
                Entrar amb Google i unir-me
              </LinkButton>
            </>
          ))}
      </div>
    </>
  );
};

const Message: React.FC<{ text: string; action?: React.ReactNode }> = ({ text, action }) => (
  <div className="flex flex-col items-start gap-4 border-l-2 border-brand bg-white px-4 py-4">
    <p className="text-sm text-muted">{text}</p>
    {action}
  </div>
);
