import rawSelectors from '../selectors/selectors.json';
import type { SiteId } from '../shared/defaultSettings';
import type { SiteAdapter, SiteSelectors } from './types';

const selectors = rawSelectors as Record<SiteId, SiteSelectors>;

const hostnames: Record<SiteId, string[]> = {
  claude: ['claude.ai'],
  gemini: ['gemini.google.com'],
};

function hasRole(node: Element, roles: string[]): boolean | undefined {
  const role =
    node.getAttribute('data-message-author-role') ??
    node.getAttribute('data-author') ??
    node.getAttribute('data-role');
  if (!role) return undefined;
  return roles.includes(role.toLowerCase());
}

function createAdapter(id: SiteId): SiteAdapter {
  const siteSelectors = selectors[id];

  const adapter: SiteAdapter = {
    id,
    selectors: siteSelectors,
    matches(url) {
      try {
        return hostnames[id].includes(new URL(url).hostname);
      } catch {
        return false;
      }
    },
    getChatContainer(document) {
      return document.querySelector(siteSelectors.chatContainer);
    },
    findAssistantMessages(root) {
      const matches: Element[] = [];
      if (root instanceof Element && root.matches(siteSelectors.assistantMessage)) {
        matches.push(root);
      }
      if ('querySelectorAll' in root) {
        matches.push(...Array.from(root.querySelectorAll(siteSelectors.assistantMessage)));
      }
      return Array.from(new Set(matches)).filter((node) => adapter.isAssistantMessage(node));
    },
    isAssistantMessage(node) {
      if (id === 'claude') {
        if (
          node.matches('[data-testid="user-message"], [data-author="user"], [data-role="user"]')
        ) {
          return false;
        }
        const explicitRole = hasRole(node, ['assistant', 'model']);
        if (explicitRole !== undefined) return explicitRole;
        if (node.matches('[data-testid="assistant-message"]')) return true;
        if (node.matches('[data-testid="chat-message"]')) {
          return !node.querySelector(
            '[data-testid="user-message"], [data-author="user"], [data-role="user"]',
          );
        }
        return false;
      }

      if (id === 'gemini') {
        const explicitRole = hasRole(node, ['assistant', 'model']);
        if (explicitRole !== undefined) return explicitRole;
        return node.matches(
          'model-response, [data-test-id="model-response"], [data-testid="model-response"]',
        );
      }

      return false;
    },
    getMessageTextRoot(node) {
      return node.matches(siteSelectors.messageTextRoot)
        ? node
        : (node.querySelector(siteSelectors.messageTextRoot) ?? node);
    },
    getBadgeAnchor(node) {
      return node.matches(siteSelectors.badgeAnchor)
        ? node
        : (node.querySelector(siteSelectors.badgeAnchor) ?? node);
    },
    isGenerating(node, chatContainer, isLatest = false) {
      const locallyBusy =
        node.matches('[aria-busy="true"], [data-is-streaming="true"], [data-streaming="true"]') ||
        Boolean(
          node.querySelector(
            '[aria-busy="true"], [data-is-streaming="true"], [data-streaming="true"]',
          ),
        ) ||
        Boolean(node.querySelector(siteSelectors.generatingIndicator));
      if (locallyBusy) return true;

      const globalIndicator = chatContainer.querySelector(siteSelectors.generatingIndicator);
      return Boolean(globalIndicator && isLatest);
    },
  };

  return adapter;
}

export const SITE_ADAPTERS: readonly SiteAdapter[] = [
  createAdapter('claude'),
  createAdapter('gemini'),
];

export function getAdapter(url: string): SiteAdapter | undefined {
  return SITE_ADAPTERS.find((adapter) => adapter.matches(url));
}
