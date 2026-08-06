import React, { useId } from 'react';
import { cn } from '../../lib/cn';
import { controlClasses as CONTROL } from './controlClasses';

interface FieldShellProps {
  label: string;
  hint?: string;
  className?: string;
  children: (id: string) => React.ReactNode;
}

/** Etiqueta + control lligats per id, per no repetir el `useId` a cada formulari. */
export const Field: React.FC<FieldShellProps> = ({ label, hint, className, children }) => {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
};

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string };

export const Input: React.FC<InputProps> = ({ label, hint, className, ...rest }) => (
  <Field label={label} hint={hint} className={className}>
    {(id) => <input id={id} className={CONTROL} {...rest} />}
  </Field>
);

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string };

export const Textarea: React.FC<TextareaProps> = ({ label, hint, className, ...rest }) => (
  <Field label={label} hint={hint} className={className}>
    {(id) => <textarea id={id} className={cn(CONTROL, 'resize-y')} {...rest} />}
  </Field>
);

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

export const Select: React.FC<SelectProps> = ({ label, hint, className, children, ...rest }) => (
  <Field label={label} hint={hint} className={className}>
    {(id) => (
      <select id={id} className={CONTROL} {...rest}>
        {children}
      </select>
    )}
  </Field>
);
