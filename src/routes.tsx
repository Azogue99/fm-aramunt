import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { RequireAuth, RequireRole, RequireTournamentRole } from './components/routing/Guards';
import { EmptyState } from './components/ui/EmptyState';
import { LinkButton } from './components/ui/Button';
import { useAuth } from './context/AuthContext';
import { resolveHomePanel } from './config/roles';

import { HomePage } from './features/public/HomePage';
import { ProgramaPage } from './features/public/ProgramaPage';
import { ComissioPage } from './features/public/ComissioPage';
import { TornejosPage } from './features/public/TornejosPage';
import { TorneigPage } from './features/public/TorneigPage';
import { LoginPage } from './features/auth/LoginPage';
import { MyTeamsPage } from './features/participant/MyTeamsPage';
import { JoinTeamPage } from './features/participant/JoinTeamPage';
import { ContentPanel } from './features/admin/ContentPanel';
import { UsersPanel } from './features/admin/UsersPanel';
import { BarPanel } from './features/admin/BarPanel';
import { TournamentPanel } from './features/admin/tournament/TournamentPanel';
import { TournamentsPanel } from './features/admin/tournament/TournamentsPanel';
import { BarPOS } from './features/bar/BarPOS';

/** `/panell` sol: porta al primer panell que aquest usuari pot veure. */
const PanelIndex: React.FC = () => {
  const { roles } = useAuth();
  return <Navigate to={resolveHomePanel(roles) ?? '/participa'} replace />;
};

const NotFound: React.FC = () => {
  const location = useLocation();
  return (
    <EmptyState
      title="Aquesta pàgina no existeix"
      description={`No hem trobat res a ${location.pathname}.`}
      action={<LinkButton to="/">Tornar a l&apos;inici</LinkButton>}
    />
  );
};

export const AppRoutes: React.FC = () => (
  <Routes>
    {/* Pantalles sense el chrome públic */}
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/barra/tpv"
      element={
        <RequireRole allowed={['superadmin', 'barista']}>
          <BarPOS />
        </RequireRole>
      }
    />

    {/* Web pública */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/programa" element={<ProgramaPage />} />
      <Route path="/tornejos" element={<TornejosPage />} />
      <Route path="/tornejos/:slug" element={<TorneigPage />} />
      <Route path="/la-comi" element={<ComissioPage />} />
      <Route path="/unir-se/:code" element={<JoinTeamPage />} />

      <Route
        path="/participa"
        element={
          <RequireAuth>
            <MyTeamsPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Route>

    {/* Panells d'administració */}
    <Route
      path="/panell"
      element={
        <RequireRole allowed={['superadmin', 'admin_futbol', 'admin_basquet', 'barista']}>
          <AdminLayout />
        </RequireRole>
      }
    >
      <Route index element={<PanelIndex />} />
      <Route
        path="web"
        element={
          <RequireRole allowed={['superadmin']}>
            <ContentPanel />
          </RequireRole>
        }
      />
      <Route
        path="usuaris"
        element={
          <RequireRole allowed={['superadmin']}>
            <UsersPanel />
          </RequireRole>
        }
      />
      <Route
        path="barra"
        element={
          <RequireRole allowed={['superadmin', 'barista']}>
            <BarPanel />
          </RequireRole>
        }
      />
      <Route
        path="tornejos"
        element={
          <RequireRole allowed={['superadmin', 'admin_futbol', 'admin_basquet']}>
            <TournamentsPanel />
          </RequireRole>
        }
      />
      <Route
        path="tornejos/:slug"
        element={
          <RequireTournamentRole>
            <TournamentPanel />
          </RequireTournamentRole>
        }
      />
    </Route>

    {/* Rutes de la versió anterior, per no trencar enllaços compartits */}
    <Route path="/admin" element={<Navigate to="/panell" replace />} />
    <Route path="/bar" element={<Navigate to="/panell/barra" replace />} />
    <Route path="/futbol" element={<Navigate to="/panell/tornejos" replace />} />
    <Route path="/basquet" element={<Navigate to="/panell/tornejos" replace />} />
  </Routes>
);
