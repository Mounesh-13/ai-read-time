import { browser } from 'wxt/browser';
import type { Browser } from 'wxt/browser';
import { SETTINGS_KEY } from './constants';
import { DEFAULT_SETTINGS, type Settings, type SiteId } from './defaultSettings';

export type SettingsPatch = Omit<Partial<Settings>, 'perSite'> & {
  perSite?: Partial<Record<SiteId, boolean>>;
};

let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function normalizeSettings(value: unknown): Settings {
  const candidate = (value && typeof value === 'object' ? value : {}) as Partial<Settings>;
  const perSite = (
    candidate.perSite && typeof candidate.perSite === 'object' ? candidate.perSite : {}
  ) as Partial<Record<SiteId, unknown>>;

  return {
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : DEFAULT_SETTINGS.enabled,
    perSite: {
      claude:
        typeof perSite.claude === 'boolean' ? perSite.claude : DEFAULT_SETTINGS.perSite.claude,
      gemini:
        typeof perSite.gemini === 'boolean' ? perSite.gemini : DEFAULT_SETTINGS.perSite.gemini,
    },
    wpm: clampInteger(candidate.wpm, DEFAULT_SETTINGS.wpm, 100, 400),
    codeLinesPerMinute: clampInteger(
      candidate.codeLinesPerMinute,
      DEFAULT_SETTINGS.codeLinesPerMinute,
      5,
      120,
    ),
    roundingMode: candidate.roundingMode === 'round' ? 'round' : 'ceil',
    badgePosition: candidate.badgePosition === 'inline-end' ? 'inline-end' : 'top-right',
    theme: candidate.theme === 'light' || candidate.theme === 'dark' ? candidate.theme : 'auto',
  };
}

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.sync.get(SETTINGS_KEY);
  return normalizeSettings(stored[SETTINGS_KEY]);
}

export function saveSettings(patch: SettingsPatch): Promise<Settings> {
  return enqueueWrite(async () => {
    const current = await getSettings();
    const next = normalizeSettings({
      ...current,
      ...patch,
      perSite: { ...current.perSite, ...(patch.perSite ?? {}) },
    });
    await browser.storage.sync.set({ [SETTINGS_KEY]: next });
    return next;
  });
}

export function resetSettings(): Promise<Settings> {
  return enqueueWrite(async () => {
    const defaults = normalizeSettings(DEFAULT_SETTINGS);
    await browser.storage.sync.set({ [SETTINGS_KEY]: defaults });
    return defaults;
  });
}

export function initializeSettings(): Promise<void> {
  return enqueueWrite(async () => {
    const stored = await browser.storage.sync.get(SETTINGS_KEY);
    if (stored[SETTINGS_KEY] === undefined) {
      await browser.storage.sync.set({ [SETTINGS_KEY]: normalizeSettings(DEFAULT_SETTINGS) });
      return;
    }

    const normalized = normalizeSettings(stored[SETTINGS_KEY]);
    if (JSON.stringify(normalized) !== JSON.stringify(stored[SETTINGS_KEY])) {
      await browser.storage.sync.set({ [SETTINGS_KEY]: normalized });
    }
  });
}

export function onSettingsChange(callback: (settings: Settings) => void): () => void {
  const listener = (
    changes: Record<string, Browser.storage.StorageChange>,
    areaName: string,
  ): void => {
    if (areaName !== 'sync' || !changes[SETTINGS_KEY]) return;
    callback(normalizeSettings(changes[SETTINGS_KEY].newValue));
  };

  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
