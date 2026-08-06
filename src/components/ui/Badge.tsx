import React from 'react';
import { cn } from '../../lib/cn';

export type BadgeTone = 'neutral' | 'positive' | 'pending' | 'live' | 'negative';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink/5 text-muted',
  positive: 'bg-emerald-50 text-emerald-800',
  pending: 'bg-amber-50 text-amber-800',
  live: 'bg-brand/10 text-brand-ink',
  negative: 'bg-red-50 text-red-700',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

/**
 * El color aquí sempre significa estat (pendent, aprovat, en directe), mai
 * "de quina secció som" — per això els tornejos no tenen color propi.
 */
export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
      TONES[tone],
      className,
    )}
  >
    {children}
  </span>
);
