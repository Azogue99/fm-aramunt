export const SITE_NAME = 'FM Aramunt';
export const FESTIVAL_YEAR = 2026;

/** L'única xarxa social que té la comissió. */
export const INSTAGRAM_URL = 'https://www.instagram.com/fmaramunt';

export const MASCOT_IMAGE =
  'https://cdn.prod.website-files.com/6893ba338f49004dbec3957c/6893d3db3bc3db789dcdee1b_CarbassotBailongo.png';

export const POSTER_IMAGE = '/poster-2026.jpeg';

export const LOGO_IMAGE =
  'https://cdn.prod.website-files.com/6893ba338f49004dbec39510/6893d81b59d9759d7ed49584_CarbassotBailongoCrop-32x32.png';

export interface NavItem {
  to: string;
  label: string;
}

export const PUBLIC_NAV: NavItem[] = [
  { to: '/programa', label: 'Programa' },
  { to: '/tornejos', label: 'Tornejos' },
  { to: '/la-comi', label: 'La Comi' },
];

/** Base per construir els enllaços d'invitació que es comparteixen. */
export function siteOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'https://fm-aramunt.web.app';
}

export function inviteUrl(code: string): string {
  return `${siteOrigin()}/unir-se/${code}`;
}
