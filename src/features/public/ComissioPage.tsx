import React from 'react';
import { PageHeader } from '../../components/layout/PublicLayout';
import { LinkButton } from '../../components/ui/Button';
import { InstagramIcon } from '../../components/ui/icons';
import { INSTAGRAM_URL } from '../../config/site';
import { useSiteContent } from '../../hooks/useSiteContent';

export const ComissioPage: React.FC = () => {
  const { content } = useSiteContent();

  return (
    <>
      <PageHeader title="La Comi" lead="Qui som i per què fem això." />

      <div className="prose-column whitespace-pre-line text-lg leading-relaxed text-muted">
        {content.info_text}
      </div>

      <div className="mt-12 border-t border-hairline pt-8">
        <p className="mb-4 text-sm text-muted">Ens trobaràs aquí per qualsevol cosa:</p>
        <LinkButton to={INSTAGRAM_URL} external variant="ghost">
          <InstagramIcon size={18} />
          @fmaramunt
        </LinkButton>
      </div>
    </>
  );
};
