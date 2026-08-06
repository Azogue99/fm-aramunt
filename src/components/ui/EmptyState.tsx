import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <div className="flex flex-col items-center gap-3 border border-dashed border-hairline px-6 py-12 text-center">
    <p className="font-semibold text-ink">{title}</p>
    {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
    {action}
  </div>
);

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Carregant…' }) => (
  <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted" role="status">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-hairline border-t-brand" />
    {label}
  </div>
);
