import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-xl">Carregant...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Si no té permisos, el redirigim al panell corresponent al seu rol o al login
    if (role === 'superadmin') return <Navigate to="/admin" />;
    if (role === 'barista') return <Navigate to="/bar" />;
    if (role === 'admin_futbol') return <Navigate to="/futbol" />;
    if (role === 'admin_basquet') return <Navigate to="/basquet" />;
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};
