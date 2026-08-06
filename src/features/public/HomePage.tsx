import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MASCOT_IMAGE } from '../../config/site';
import { useSiteContent } from '../../hooks/useSiteContent';

const DESTINATIONS = [
  { to: '/programa', label: 'Programa', description: "Tots els actes, hora a hora." },
  { to: '/tornejos', label: 'Tornejos', description: 'Inscripcions, partits i classificació.' },
  { to: '/la-comi', label: 'La Comi', description: 'Qui hi ha darrere de la festa.' },
];

/**
 * Portada deliberadament curta: mascota, títol, dates i tres portes. Tot el
 * contingut dens viu a la seva pàgina, que és el que feia net el disseny del 2025.
 */
export const HomePage: React.FC = () => {
  const { content } = useSiteContent();

  return (
    <div className="flex flex-col items-center gap-14 text-center">
      <img
        src={MASCOT_IMAGE}
        alt="El Carbassot ballant a la plaça"
        className="w-full max-w-sm"
        width={460}
        height={460}
      />

      <div className="prose-column">
        <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          {content.hero_title}
        </h1>
        <p className="mt-5 text-xl text-muted">{content.hero_subtitle}</p>
      </div>

      <nav className="grid w-full gap-px border border-hairline bg-hairline sm:grid-cols-3">
        {DESTINATIONS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex flex-col items-center gap-2 bg-paper px-6 py-10 transition-colors hover:bg-white"
          >
            <span className="inline-flex items-center gap-2 text-lg font-bold text-ink transition-colors group-hover:text-brand">
              {item.label}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </span>
            <span className="text-sm text-muted">{item.description}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};
