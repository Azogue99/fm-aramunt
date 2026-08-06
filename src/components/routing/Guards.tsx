import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canManageTournament, hasAnyRole, resolveHomePanel } from '../../config/roles';
import { useTournamentBySlug } from '../../hooks/useTournament';
import { Spinner } from '../ui/EmptyState';
import type { UserRole } from '../../types';

/** Només cal haver iniciat sessió. Serveix per al panell de participant. */
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
};

interface RequireRoleProps {
  allowed: UserRole[];
  children: React.ReactNode;
}

/**
 * Si l'usuari té sessió però no aquest rol, el porta al primer panell que sí
 * que pot veure; si no en té cap, al panell de participant.
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ allowed, children }) => {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (hasAnyRole(roles, allowed)) return <>{children}</>;

  return <Navigate to={resolveHomePanel(roles) ?? '/participa'} replace />;
};

/**
 * Variant que resol el rol necessari a partir del `:slug` de la ruta, perquè
 * hi hagi una sola ruta `/panell/tornejos/:slug` i no una per esport.
 */
export const RequireTournamentRole: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const { user, roles, loading } = useAuth();
  const location = useLocation();
  const { tournament, loading: tournamentLoading } = useTournamentBySlug(slug);

  if (loading || tournamentLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (canManageTournament(roles, tournament?.managerRole)) return <>{children}</>;

  return <Navigate to={resolveHomePanel(roles) ?? '/participa'} replace />;
};
