import { useDocument } from './useDocument';
import { DEFAULT_CONTENT, LANDING_DOC, WEB_CONTENT } from '../services/content';
import type { SiteContent } from '../types';

/** Contingut editable de la web, amb els valors per defecte com a xarxa de seguretat. */
export function useSiteContent(): { content: SiteContent; loading: boolean } {
  const { data, loading } = useDocument<SiteContent>(WEB_CONTENT, LANDING_DOC);
  // Les versions anteriors guardaven també hero i textos de la comissió. No
  // els llegim: ara són part de la interfície fixa; el pregó i el programa són anuals.
  return {
    content: {
      ...DEFAULT_CONTENT,
      info_text: data?.info_text ?? DEFAULT_CONTENT.info_text,
      programa_intro: data?.programa_intro ?? DEFAULT_CONTENT.programa_intro,
      programa: data?.programa ?? DEFAULT_CONTENT.programa,
    },
    loading,
  };
}
