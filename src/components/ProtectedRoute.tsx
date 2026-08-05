import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-xl">Carregant...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && (!roles || !roles.some(r => allowedRoles.includes(r)))) {
    // Si no té permisos per aquesta ruta en concret, el redirigim a la primera que tingui permís
    if (roles.includes('superadmin')) return <Navigate to="/admin" />;
    if (roles.includes('barista')) return <Navigate to="/bar" />;
    if (roles.includes('admin_futbol')) return <Navigate to="/futbol" />;
    if (roles.includes('admin_basquet')) return <Navigate to="/basquet" />;
    return <Navigate to="/" />; // Si no té cap d'aquests, torna a l'inici
  }

  return <>{children}</>;
};
