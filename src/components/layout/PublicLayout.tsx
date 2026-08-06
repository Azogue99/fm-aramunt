import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { InstagramIcon } from '../ui/icons';
import { INSTAGRAM_URL, PUBLIC_NAV, SITE_NAME } from '../../config/site';
import { useAuth } from '../../context/AuthContext';
import { resolveHomePanel } from '../../config/roles';
import { cn } from '../../lib/cn';

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm font-semibold uppercase tracking-[0.12em] transition-colors',
    // El taronja marca la pàgina on ets. Abans "Programa" hi estava fix.
    isActive ? 'text-brand' : 'text-muted hover:text-ink',
  );

const SiteHeader: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const { user, roles } = useAuth();
  const location = useLocation();

  React.useEffect(() => setOpen(false), [location.pathname]);

  const account = user
    ? { to: resolveHomePanel(roles) ?? '/participa', label: roles.length > 0 ? 'Panell' : 'El meu equip' }
    : { to: '/login', label: 'Entrar' };

  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-2xl font-bold tracking-tight text-ink transition-colors hover:text-brand">
          {SITE_NAME}
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {PUBLIC_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses}>
              {item.label}
            </NavLink>
          ))}
          <NavLink to={account.to} className={navLinkClasses}>
            {account.label}
          </NavLink>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded p-1 text-ink sm:hidden"
          aria-expanded={open}
          aria-label={open ? 'Tancar el menú' : 'Obrir el menú'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-hairline px-6 pb-4 sm:hidden">
          {[...PUBLIC_NAV, account].map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => cn(navLinkClasses({ isActive }), 'py-3')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
};

const SiteFooter: React.FC = () => (
  <footer className="mt-auto border-t border-hairline">
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 text-sm text-muted sm:flex-row sm:justify-between">
      <p>
        © {new Date().getFullYear()} Festa Major d&apos;Aramunt · #SOCARBASSOT
      </p>
      {/* Única xarxa social de la comissió. Abans hi havia dos href="#" morts. */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-semibold text-ink transition-colors hover:text-brand"
      >
        <InstagramIcon size={18} />
        @fmaramunt
      </a>
    </div>
  </footer>
);

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="mx-auto w-full max-w-5xl flex-grow px-6 py-14"
      >
        <Outlet />
      </motion.main>
      <SiteFooter />
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  lead?: string;
  actions?: React.ReactNode;
}

/** Encapçalament comú de totes les pàgines públiques: una idea, molt d'aire. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, lead, actions }) => (
  <div className="mb-12 border-b border-hairline pb-8">
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="prose-column">
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">{title}</h1>
        {lead && <p className="mt-4 text-lg leading-relaxed text-muted">{lead}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  </div>
);
