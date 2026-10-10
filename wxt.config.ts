import { defineConfig } from 'wxt';

const siteMatches = ['https://claude.ai/*', 'https://gemini.google.com/*'];

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: ({ browser }) => ({
    name: 'AI Read-Time Indicator',
    short_name: 'AI Read-Time',
    description: 'See a live, local reading-time estimate on AI assistant responses.',
    permissions: ['storage'],
    host_permissions: siteMatches,
    icons: {
      16: '/icons/icon-16.png',
      32: '/icons/icon-32.png',
      48: '/icons/icon-48.png',
      128: '/icons/icon-128.png',
    },
    action: {
      default_title: 'AI Read-Time Indicator',
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'ai-read-time@example.org',
              strict_min_version: '140.0',
              data_collection_permissions: {
                required: ['none'],
              },
            },
          },
        }
      : {}),
  }),
});
