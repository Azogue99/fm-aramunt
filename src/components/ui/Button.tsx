import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex max-w-full items-center justify-center gap-2 rounded text-center font-semibold transition-colors ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-ink',
  secondary: 'bg-ink text-paper hover:bg-ink/85',
  ghost: 'border border-hairline text-ink hover:bg-ink/5',
  danger: 'border border-red-300 text-red-700 hover:bg-red-50',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-6 py-3',
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}) => (
  <button type={type} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
    {children}
  </button>
);

type LinkButtonProps = CommonProps & { to: string; external?: boolean };

export const LinkButton: React.FC<LinkButtonProps> = ({
  to,
  external,
  variant = 'primary',
  size = 'md',
  className,
  children,
}) => {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={classes}>
      {children}
    </Link>
  );
};
