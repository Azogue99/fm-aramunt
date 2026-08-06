import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ExternalLink, LogOut, Trophy, Type, Users, Wine } from 'lucide-react';
import { panelsFor } from '../../config/roles';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/cn';
import { EmptyState } from '../ui/EmptyState';
import { LinkButton } from '../ui/Button';

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  trophy: Trophy,
  cup: Wine,
  text: Type,
  users: Users,
};

/**
 * Chrome únic per a tots els panells. Abans cada panell tenia el seu color i
 * només el de superadmin tenia enllaços cap als altres, de manera que un
 * barista o un admin de futbol quedava atrapat a la seva pàgina.
 */
export const AdminLayout: React.FC = () => {
  const { roles, signOut, user } = useAuth();
  const panels = panelsFor(roles);

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors',
      isActive ? 'bg-ink text-paper' : 'text-muted hover:bg-ink/5 hover:text-ink',
    );

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-paper lg:flex-row">
      <aside className="flex w-full min-w-0 shrink-0 flex-col border-b border-hairline bg-white lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link to="/" className="text-lg font-bold tracking-tight text-ink">
            FM Aramunt
          </Link>
          <p className="hidden text-xs text-muted lg:mt-1 lg:block">{user?.displayName ?? user?.email}</p>
        </div>

        <nav className="grid grid-cols-2 gap-1 px-3 pb-3 lg:flex lg:flex-col lg:pb-0">
          {panels.map((panel) => {
            const Icon = ICONS[panel.icon] ?? Trophy;
            return (
              <NavLink
                key={panel.path}
                to={`/panell/${panel.path}`}
                className={({ isActive }) => cn(linkClasses({ isActive }), 'min-w-0 justify-center lg:justify-start')}
              >
                <Icon size={16} />
                <span className="min-w-0 text-center leading-tight lg:text-left">{panel.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto grid grid-cols-3 gap-1 border-t border-hairline p-3 lg:flex lg:flex-col">
          <NavLink to="/participa" aria-label="El meu equip" className={({ isActive }) => cn(linkClasses({ isActive }), 'justify-center lg:justify-start')}>
            <Users size={16} />
            <span className="hidden md:inline">El meu equip</span>
          </NavLink>
          <a
            href="/"
            aria-label="Veure la web"
            className="flex items-center justify-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink lg:justify-start"
          >
            <ExternalLink size={16} />
            <span className="hidden md:inline">Veure la web</span>
          </a>
          <button
            type="button"
            onClick={signOut}
            aria-label="Tancar sessió"
            className="flex items-center justify-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-red-50 hover:text-red-700 lg:justify-start"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Tancar sessió</span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-grow px-4 py-6 sm:px-5 sm:py-8 lg:px-10">
        {panels.length === 0 ? (
          <EmptyState
            title="Encara no tens cap permís assignat"
            description="Si formes part de la comissió, demana a l'administrador que t'assigni un rol. Mentrestant pots gestionar el teu equip."
            action={<LinkButton to="/participa">El meu equip</LinkButton>}
          />
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};

interface PanelHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({ title, description, actions }) => (
  <header className="mb-8 flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
    </div>
    {actions && <div className="flex max-w-full shrink-0 flex-wrap gap-2">{actions}</div>}
  </header>
);
