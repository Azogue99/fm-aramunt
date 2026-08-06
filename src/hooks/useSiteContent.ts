import { useDocument } from './useDocument';
import { DEFAULT_CONTENT, LANDING_DOC, WEB_CONTENT } from '../services/content';
import type { SiteContent } from '../types';

/** Contingut editable de la web, amb els valors per defecte com a xarxa de seguretat. */
export function useSiteContent(): { content: SiteContent; loading: boolean } {
  const { data, loading } = useDocument<SiteContent>(WEB_CONTENT, LANDING_DOC);
  return { content: { ...DEFAULT_CONTENT, ...(data ?? {}) }, loading };
}
