<script lang="ts">
  import { onMount } from 'svelte';
  import { buildIssueUrl, SITE_LABELS } from '../../shared/constants';
  import { DEFAULT_SETTINGS, type Settings, type SiteId } from '../../shared/defaultSettings';
  import { getSettings, saveSettings } from '../../shared/storage';

  const sites = Object.entries(SITE_LABELS) as [SiteId, string][];
  let settings: Settings = {
    ...DEFAULT_SETTINGS,
    perSite: { ...DEFAULT_SETTINGS.perSite },
  };
  let ready = false;

  onMount(() => {
    void getSettings().then((value) => {
      settings = value;
      ready = true;
    });
  });

  function setGlobalEnabled(event: Event): void {
    const enabled = (event.currentTarget as HTMLInputElement).checked;
    void saveSettings({ enabled }).then((value) => (settings = value));
  }

  function setSiteEnabled(site: SiteId, event: Event): void {
    const enabled = (event.currentTarget as HTMLInputElement).checked;
    void saveSettings({ perSite: { [site]: enabled } }).then((value) => (settings = value));
  }
</script>

<svelte:head>
  <title>AI Read-Time Indicator</title>
</svelte:head>

<main class="popup">
  <header class="brand">
    <div class="brand-mark" aria-hidden="true">⏱</div>
    <div>
      <h1>AI Read-Time</h1>
      <p>Private, local reading estimates</p>
    </div>
  </header>

  {#if !ready}
    <div class="loading" aria-live="polite">Loading settings…</div>
  {:else}
    <section class="master-card">
      <div>
        <strong>Show estimates</strong>
        <span>Applies across supported sites</span>
      </div>
      <label class="switch" aria-label="Enable read-time estimates">
        <input type="checkbox" checked={settings.enabled} onchange={setGlobalEnabled} />
        <span class="track"></span>
      </label>
    </section>

    <section class:disabled={!settings.enabled} class="site-list" aria-label="Supported sites">
      {#each sites as [siteId, label]}
        <label class="site-row">
          <span
            class="site-dot"
            class:claude={siteId === 'claude'}
            class:gemini={siteId === 'gemini'}
          ></span>
          <span class="site-name">{label}</span>
          <input
            type="checkbox"
            checked={settings.perSite[siteId]}
            disabled={!settings.enabled}
            onchange={(event) => setSiteEnabled(siteId, event)}
            aria-label={`Enable on ${label}`}
          />
        </label>
      {/each}
    </section>
  {/if}

  <footer>
    <a href={buildIssueUrl()} target="_blank" rel="noreferrer">Report a broken site ↗</a>
    <a href="options.html" target="_blank">Settings</a>
  </footer>
  <p class="privacy-note">Your chats stay in this browser. No analytics or network calls.</p>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  :global(body) {
    margin: 0;
    width: 340px;
    background: #f7f8fa;
    color: #182230;
    font:
      13px/1.45 Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
  }
  .popup {
    padding: 17px 16px 13px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 11px;
    margin: 0 1px 16px;
  }
  .brand-mark {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    color: #fff;
    background: linear-gradient(145deg, #536de6, #344ac0);
    font-size: 21px;
    box-shadow: 0 4px 10px #4057c52b;
  }
  h1 {
    margin: 0;
    font-size: 15px;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  .brand p {
    margin: 3px 0 0;
    color: #718096;
    font-size: 11px;
  }
  .master-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e3e7ee;
    border-radius: 12px;
    background: #fff;
  }
  .master-card strong,
  .master-card span {
    display: block;
  }
  .master-card strong {
    font-size: 12px;
    font-weight: 650;
  }
  .master-card span {
    margin-top: 2px;
    color: #7a8696;
    font-size: 10px;
  }
  .switch {
    position: relative;
    display: inline-flex;
    width: 36px;
    height: 21px;
    flex: 0 0 auto;
    cursor: pointer;
  }
  .switch input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
  }
  .track {
    position: absolute;
    inset: 0;
    border-radius: 99px;
    background: #cbd2dd;
    transition: background 0.16s ease;
    pointer-events: none;
  }
  .track::after {
    content: '';
    position: absolute;
    width: 15px;
    height: 15px;
    top: 3px;
    left: 3px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px #0002;
    transition: transform 0.16s ease;
  }
  .switch input:checked + .track {
    background: #536de6;
  }
  .switch input:checked + .track::after {
    transform: translateX(15px);
  }
  .switch input:focus-visible + .track {
    outline: 2px solid #8b9af1;
    outline-offset: 2px;
  }
  .site-list {
    margin-top: 9px;
    border: 1px solid #e3e7ee;
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }
  .site-list.disabled {
    opacity: 0.55;
  }
  .site-row {
    min-height: 39px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 12px;
    cursor: pointer;
  }
  .site-row + .site-row {
    border-top: 1px solid #edf0f4;
  }
  .site-name {
    flex: 1;
    font-weight: 550;
  }
  .site-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #78869a;
  }
  .site-dot.claude {
    background: #ca8d5a;
  }
  .site-dot.gemini {
    background: #4285f4;
  }
  .site-row input {
    accent-color: #536de6;
    margin: 0;
  }
  footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 13px;
  }
  footer a {
    color: #465ecb;
    text-decoration: none;
    font-size: 11px;
    font-weight: 600;
  }
  footer a:hover {
    text-decoration: underline;
  }
  .privacy-note {
    margin: 10px 0 0;
    color: #8993a1;
    font-size: 10px;
    text-align: center;
  }
  .loading {
    padding: 24px 0;
    text-align: center;
    color: #758094;
  }
</style>
