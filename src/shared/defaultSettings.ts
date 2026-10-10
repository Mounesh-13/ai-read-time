export type SiteId = 'claude' | 'gemini';
export type RoundingMode = 'ceil' | 'round';
export type BadgePosition = 'top-right' | 'inline-end';
export type Theme = 'auto' | 'light' | 'dark';

export interface Settings {
  enabled: boolean;
  perSite: Record<SiteId, boolean>;
  wpm: number;
  codeLinesPerMinute: number;
  roundingMode: RoundingMode;
  badgePosition: BadgePosition;
  theme: Theme;
}

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  enabled: true,
  perSite: Object.freeze({ claude: true, gemini: true }),
  wpm: 200,
  codeLinesPerMinute: 30,
  roundingMode: 'ceil',
  badgePosition: 'top-right',
  theme: 'auto',
});
