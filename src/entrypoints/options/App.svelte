<script lang="ts">
  import { onMount } from 'svelte';
  import { GITHUB_REPOSITORY } from '../../shared/constants';
  import { DEFAULT_SETTINGS, type Settings } from '../../shared/defaultSettings';
  import { getSettings, resetSettings, saveSettings } from '../../shared/storage';

  let settings: Settings = {
    ...DEFAULT_SETTINGS,
    perSite: { ...DEFAULT_SETTINGS.perSite },
  };
  let draftWpm = settings.wpm;
  let draftCodeSpeed = settings.codeLinesPerMinute;
  let ready = false;
  let saved = false;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    void getSettings().then((value) => {
      settings = value;
      draftWpm = value.wpm;
      draftCodeSpeed = value.codeLinesPerMinute;
      ready = true;
    });
  });

  function commit(patch: Partial<Settings>): void {
    void saveSettings(patch).then((value) => {
      settings = value;
      saved = true;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => (saved = false), 1500);
    });
  }

  function commitWpm(): void {
    commit({ wpm: draftWpm });
  }

  function commitCodeSpeed(): void {
    commit({ codeLinesPerMinute: draftCodeSpeed });
  }

  function handleRounding(event: Event): void {
    commit({
      roundingMode: (event.currentTarget as HTMLSelectElement).value as Settings['roundingMode'],
    });
  }

  function handlePosition(event: Event): void {
    commit({
      badgePosition: (event.currentTarget as HTMLSelectElement).value as Settings['badgePosition'],
    });
  }

  function handleTheme(event: Event): void {
    commit({ theme: (event.currentTarget as HTMLSelectElement).value as Settings['theme'] });
  }

  async function handleReset(): Promise<void> {
    settings = await resetSettings();
    draftWpm = settings.wpm;
    draftCodeSpeed = settings.codeLinesPerMinute;
    saved = false;
  }
</script>

<svelte:head>
  <title>AI Read-Time Settings</title>
</svelte:head>

<main class="page">
  <header class="page-header">
    <div class="brand-mark" aria-hidden="true">⏱</div>
    <div>
      <p class="eyebrow">PREFERENCES</p>
      <h1>Reading-time settings</h1>
      <p class="subtitle">Tune estimates to match how you read.</p>
    </div>
  </header>

  {#if !ready}
    <section class="panel loading">Loading settings…</section>
  {:else}
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Reading speeds</h2>
          <p>Used only in this browser to calculate each estimate.</p>
        </div>
      </div>

      <label class="range-setting" for="wpm">
        <span class="range-heading"
          ><strong>Prose reading speed</strong><span>{draftWpm} words/min</span></span
        >
        <input
          id="wpm"
          type="range"
          min="100"
          max="400"
          step="10"
          value={draftWpm}
          oninput={(event) => (draftWpm = Number((event.currentTarget as HTMLInputElement).value))}
          onchange={commitWpm}
        />
        <span class="range-scale"><span>100 · careful</span><span>400 · fast</span></span>
      </label>

      <label class="range-setting" for="code-speed">
        <span class="range-heading"
          ><strong>Code reading speed</strong><span>{draftCodeSpeed} lines/min</span></span
        >
        <input
          id="code-speed"
          type="range"
          min="5"
          max="120"
          step="5"
          value={draftCodeSpeed}
          oninput={(event) =>
            (draftCodeSpeed = Number((event.currentTarget as HTMLInputElement).value))}
          onchange={commitCodeSpeed}
        />
        <span class="range-scale"><span>5 · detailed</span><span>120 · skim</span></span>
      </label>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Badge appearance</h2>
          <p>Changes apply immediately to open supported chats.</p>
        </div>
      </div>

      <label class="select-setting">
        <span
          ><strong>Position</strong><small>Where the estimate appears on each response</small></span
        >
        <select value={settings.badgePosition} onchange={handlePosition}>
          <option value="top-right">Top right</option>
          <option value="inline-end">Below response</option>
        </select>
      </label>
      <label class="select-setting">
        <span><strong>Theme</strong><small>Match your preference or the system theme</small></span>
        <select value={settings.theme} onchange={handleTheme}>
          <option value="auto">Automatic</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label class="select-setting">
        <span
          ><strong>Rounding</strong><small>Never underestimate, or round to nearest second</small
          ></span
        >
        <select value={settings.roundingMode} onchange={handleRounding}>
          <option value="ceil">Round up</option>
          <option value="round">Nearest second</option>
        </select>
      </label>
    </section>

    <section class="panel privacy-panel">
      <div class="privacy-icon" aria-hidden="true">✓</div>
      <div>
        <h2>Private by design</h2>
        <p>
          Message text is read locally to calculate the estimate. It is never sent, stored, or
          logged by this extension.
        </p>
      </div>
    </section>

    <footer class="page-footer">
      <div class="footer-links">
        <a
          href={`https://github.com/${GITHUB_REPOSITORY}/blob/main/PRIVACY.md`}
          target="_blank"
          rel="noreferrer">Privacy policy ↗</a
        >
        <a href={`https://github.com/${GITHUB_REPOSITORY}`} target="_blank" rel="noreferrer"
          >GitHub ↗</a
        >
      </div>
      <div class="footer-actions">
        <span class="saved" aria-live="polite">{saved ? 'Saved' : ''}</span>
        <button class="reset" onclick={handleReset}>Reset to defaults</button>
      </div>
    </footer>
  {/if}
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  :global(body) {
    margin: 0;
    min-width: 320px;
    background: #f5f7fb;
    color: #1a2433;
    font:
      14px/1.5 Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
  }
  .page {
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 24px 56px;
  }
  .page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 27px;
  }
  .brand-mark {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 16px;
    color: #fff;
    background: linear-gradient(145deg, #536de6, #344ac0);
    font-size: 27px;
    box-shadow: 0 8px 18px #4057c52b;
  }
  .eyebrow {
    margin: 0 0 3px;
    color: #5269d4;
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.14em;
  }
  h1 {
    margin: 0;
    font-size: 25px;
    line-height: 1.18;
    letter-spacing: -0.04em;
  }
  .subtitle {
    margin: 6px 0 0;
    color: #758195;
    font-size: 13px;
  }
  .panel {
    margin-top: 14px;
    padding: 23px 24px;
    border: 1px solid #e2e7ef;
    border-radius: 15px;
    background: #fff;
    box-shadow: 0 2px 10px #25355406;
  }
  .loading {
    color: #758195;
  }
  .section-heading {
    display: flex;
    align-items: start;
    justify-content: space-between;
    margin-bottom: 19px;
  }
  h2 {
    margin: 0;
    font-size: 14px;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }
  .section-heading p {
    margin: 4px 0 0;
    color: #7b8797;
    font-size: 12px;
  }
  .range-setting {
    display: block;
    margin-top: 21px;
  }
  .range-setting:first-of-type {
    margin-top: 0;
  }
  .range-heading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
  }
  .range-heading strong,
  .select-setting strong {
    font-weight: 650;
  }
  .range-heading span:last-child {
    color: #5168d0;
    font-variant-numeric: tabular-nums;
    font-weight: 650;
  }
  input[type='range'] {
    display: block;
    width: 100%;
    margin: 13px 0 2px;
    accent-color: #536de6;
  }
  .range-scale {
    display: flex;
    justify-content: space-between;
    color: #9aa3af;
    font-size: 10px;
  }
  .select-setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 14px 0;
  }
  .select-setting + .select-setting {
    border-top: 1px solid #edf0f4;
  }
  .select-setting span {
    display: grid;
    gap: 3px;
  }
  .select-setting small {
    color: #7b8797;
    font-size: 11px;
  }
  select {
    min-width: 145px;
    padding: 8px 30px 8px 10px;
    border: 1px solid #d9dfe8;
    border-radius: 8px;
    background: #fff;
    color: #283445;
    font: inherit;
    font-size: 12px;
  }
  .privacy-panel {
    display: flex;
    gap: 13px;
    align-items: start;
    background: #f7faf9;
    border-color: #dcebe6;
  }
  .privacy-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: #dff2e9;
    color: #1c8a5b;
    font-weight: 800;
  }
  .privacy-panel h2 {
    margin: 1px 0 4px;
  }
  .privacy-panel p {
    max-width: 560px;
    margin: 0;
    color: #68786f;
    font-size: 12px;
  }
  .page-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 19px;
  }
  .footer-links,
  .footer-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .footer-links a {
    color: #5269d4;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
  }
  .footer-links a:hover {
    text-decoration: underline;
  }
  .saved {
    color: #188158;
    font-size: 11px;
  }
  .reset {
    padding: 8px 11px;
    border: 1px solid #dbe1ea;
    border-radius: 8px;
    background: #fff;
    color: #5e6978;
    font: inherit;
    font-size: 11px;
    cursor: pointer;
  }
  .reset:hover {
    background: #f7f8fa;
  }
  @media (max-width: 560px) {
    .page {
      padding: 30px 15px;
    }
    .panel {
      padding: 19px 16px;
    }
    .page-footer {
      align-items: flex-start;
      flex-direction: column;
    }
    .select-setting {
      align-items: flex-start;
      flex-direction: column;
      gap: 9px;
    }
    select {
      width: 100%;
    }
  }
</style>
