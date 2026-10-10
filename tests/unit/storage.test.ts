import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { DEFAULT_SETTINGS } from '../../src/shared/defaultSettings';

const browserGlobals = globalThis as typeof globalThis & {
  browser: typeof fakeBrowser;
  chrome: typeof fakeBrowser;
};

async function loadStorage() {
  vi.resetModules();
  return import('../../src/shared/storage');
}

beforeEach(() => {
  fakeBrowser.reset();
  browserGlobals.browser = fakeBrowser;
  browserGlobals.chrome = fakeBrowser;
});

describe('settings storage', () => {
  it('returns defaults when storage is empty and initializes defaults once', async () => {
    const storage = await loadStorage();
    expect(await storage.getSettings()).toEqual(DEFAULT_SETTINGS);

    await storage.initializeSettings();
    expect(await storage.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('saves partial changes while preserving the remaining preferences', async () => {
    const storage = await loadStorage();
    await storage.initializeSettings();
    const next = await storage.saveSettings({ wpm: 260, perSite: { claude: false } });

    expect(next).toMatchObject({
      wpm: 260,
      perSite: { claude: false, gemini: true },
    });
    expect(await storage.getSettings()).toEqual(next);
  });

  it('serializes concurrent partial updates without dropping fields', async () => {
    const storage = await loadStorage();
    await storage.initializeSettings();

    await Promise.all([
      storage.saveSettings({ perSite: { claude: false } }),
      storage.saveSettings({ perSite: { gemini: false } }),
    ]);

    expect(await storage.getSettings()).toMatchObject({
      perSite: { claude: false, gemini: false },
    });
  });

  it('notifies listeners when synced settings change and supports unsubscribe', async () => {
    const storage = await loadStorage();
    await storage.initializeSettings();
    const callback = vi.fn();
    const unsubscribe = storage.onSettingsChange(callback);

    await storage.saveSettings({ enabled: false });
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));

    unsubscribe();
    callback.mockClear();
    await storage.saveSettings({ enabled: true });
    expect(callback).not.toHaveBeenCalled();
  });
});
