import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SiteContent } from '../types';

export const WEB_CONTENT = 'web_content';
export const LANDING_DOC = 'landing_texts';

/** Valors per defecte perquè la web mai es vegi buida si Firestore no respon. */
export const DEFAULT_CONTENT: SiteContent = {
  hero_title: "Festa Major d'Aramunt",
  hero_subtitle: "5, 6, 7 i 8 d'agost del 2026",
  info_text: `Carbassots, carbassotes i carbassotis, deixeu per uns dies les presses i els neguits.
Pareu bé les orelles i presteu atenció, que ja torna a Aramunt la Festa Major!

Que peti la música, el xou i la diversió:
VISCA ARAMUNT I VISCA LA FESTA MAJOR!

#SOCARBASSOT #FEMCOLLA #FEMPOBLE`,
  programa_intro: "Ei carbassots i carbassotes! Aquests són tots els actes d'enguany.",
  programa: [],
};

export function saveContent(content: SiteContent) {
  return setDoc(doc(db, WEB_CONTENT, LANDING_DOC), content);
}
