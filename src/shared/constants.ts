import type { SiteId } from './defaultSettings';

export const SETTINGS_KEY = 'settings';
export const PRODUCT_NAME = 'AI Read-Time Indicator';
export const GITHUB_REPOSITORY = 'Mounesh-13/ai-read-time';

export const SITE_LABELS: Record<SiteId, string> = {
  claude: 'Claude',
  gemini: 'Gemini',
};

export function buildIssueUrl(site?: SiteId): string {
  const siteLabel = site ? SITE_LABELS[site] : 'Unknown / multiple sites';
  const params = new URLSearchParams({
    title: `Broken site adapter: ${siteLabel}`,
    labels: 'bug',
    body: [
      '## Site adapter report',
      '',
      `- Site: ${siteLabel}`,
      `- Browser: ${navigator.userAgent}`,
      '',
      'Please describe what is not working. Do not include prompts, responses, screenshots, or other chat content.',
    ].join('\n'),
  });
  return `https://github.com/${GITHUB_REPOSITORY}/issues/new?${params.toString()}`;
}
