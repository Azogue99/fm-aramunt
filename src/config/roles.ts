import type { UserRole } from '../types';

/**
 * Font única de veritat dels rols. Abans això estava repetit a AuthContext,
 * ProtectedRoute, Login i SuperAdminPanel; afegir un rol volia dir tocar 4 fitxers.
 */
export const ROLES = ['superadmin', 'admin_futbol', 'admin_basquet', 'barista'] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super-Admin',
  admin_futbol: 'Admin Futbol',
  admin_basquet: 'Admin Bàsquet',
  barista: 'Barra',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  superadmin: 'Accés total: textos, usuaris, barra i tots els tornejos.',
  admin_futbol: 'Gestiona equips, grups i partits del torneig de futbol.',
  admin_basquet: 'Gestiona equips, grups i partits del torneig de bàsquet.',
  barista: 'Accés al TPV de la barra.',
};

export interface PanelDefinition {
  /** Camí relatiu dins de /panell. */
  path: string;
  label: string;
  /** Qualsevol d'aquests rols hi dona accés. */
  roles: UserRole[];
  icon: string;
}

/**
 * Els panells d'administració. `AdminNav` en deriva la navegació i
 * `resolveHomePanel` hi busca la primera destinació vàlida després del login.
 */
export const PANELS: PanelDefinition[] = [
  { path: 'tornejos', label: 'Tornejos', roles: ['superadmin', 'admin_futbol', 'admin_basquet'], icon: 'trophy' },
  { path: 'barra', label: 'Barra', roles: ['superadmin', 'barista'], icon: 'cup' },
  { path: 'web', label: 'Contingut web', roles: ['superadmin'], icon: 'text' },
  { path: 'usuaris', label: 'Usuaris i rols', roles: ['superadmin'], icon: 'users' },
];

export function hasAnyRole(roles: UserRole[], allowed: UserRole[]): boolean {
  return roles.some((role) => allowed.includes(role));
}

export function panelsFor(roles: UserRole[]): PanelDefinition[] {
  return PANELS.filter((panel) => hasAnyRole(roles, panel.roles));
}

/** Primera ruta d'admin a la qual pot anar aquest usuari, o null si no en té cap. */
export function resolveHomePanel(roles: UserRole[]): string | null {
  const [first] = panelsFor(roles);
  return first ? `/panell/${first.path}` : null;
}

export function canManageTournament(roles: UserRole[], managerRole: UserRole | undefined): boolean {
  return roles.includes('superadmin') || (managerRole ? roles.includes(managerRole) : false);
}
