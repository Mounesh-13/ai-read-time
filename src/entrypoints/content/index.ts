import { SITE_ADAPTERS, getAdapter } from '../../adapters/registry';
import type { SiteAdapter } from '../../adapters/types';
import { createBadge, type BadgeHandle } from '../../core/badge';
import { estimateElementReadTime } from '../../core/calculator';
import { DEFAULT_SETTINGS, type Settings } from '../../shared/defaultSettings';
import { getSettings, onSettingsChange } from '../../shared/storage';

interface MessageState {
  element: Element;
  textRoot: Element;
  badge: BadgeHandle;
  observer?: MutationObserver;
  debounceTimer?: number;
  finalizeTimer?: number;
  started: boolean;
  finalized: boolean;
  streamingSeen: boolean;
  lastSnapshot: string;
  label: string;
}

const UPDATE_DEBOUNCE_MS = 200;
const FINALIZE_AFTER_STREAM_MS = 700;
const FINALIZE_FALLBACK_MS = 1500;

class ReadTimeController {
  private settings: Settings = DEFAULT_SETTINGS as Settings;
  private adapter?: SiteAdapter;
  private chatContainer?: Element;
  private latestMessage?: Element;
  private containerObserver?: MutationObserver;
  private documentObserver?: MutationObserver;
  private intersectionObserver?: IntersectionObserver;
  private routeTimer?: number;
  private unsubscribeSettings?: () => void;
  private lastHref = '';
  private readonly states = new Map<Element, MessageState>();

  async start(): Promise<void> {
    try {
      this.settings = await getSettings();
    } catch {
      this.settings = DEFAULT_SETTINGS as Settings;
    }

    this.unsubscribeSettings = onSettingsChange((settings) => this.handleSettingsChange(settings));
    this.lastHref = window.location.href;
    this.connect();
    this.routeTimer = window.setInterval(() => this.checkRoute(), 1000);
  }

  private siteIsEnabled(adapter: SiteAdapter | undefined): adapter is SiteAdapter {
    return Boolean(adapter && this.settings.enabled && this.settings.perSite[adapter.id]);
  }

  private checkRoute(): void {
    const href = window.location.href;
    if (href !== this.lastHref) {
      this.lastHref = href;
      this.disconnectSite();
      this.connect();
      return;
    }

    if (this.adapter && this.siteIsEnabled(this.adapter)) {
      const currentContainer = this.adapter.getChatContainer(document);
      if (currentContainer && currentContainer !== this.chatContainer) {
        this.disconnectSite();
        this.connect();
      } else if (!this.chatContainer || !this.chatContainer.isConnected) {
        this.disconnectSite();
        this.connect();
      }
    } else if (!this.adapter && this.siteIsEnabled(getAdapter(href))) {
      this.connect();
    }
  }

  private connect(): void {
    const adapter = getAdapter(window.location.href);
    if (!this.siteIsEnabled(adapter)) {
      this.disconnectSite();
      this.stopWaitingForDocument();
      return;
    }

    this.adapter = adapter;
    const container = adapter.getChatContainer(document);
    if (!container) {
      this.waitForChatContainer();
      return;
    }

    this.stopWaitingForDocument();
    if (container === this.chatContainer && adapter.id === this.adapter.id) return;

    this.disconnectSite();
    this.adapter = adapter;
    this.chatContainer = container;
    this.observeChatContainer(container);
    this.discoverMessages(container);
  }

  private waitForChatContainer(): void {
    if (this.documentObserver || !document.documentElement) return;
    this.documentObserver = new MutationObserver(() => {
      if (!this.adapter || !this.siteIsEnabled(this.adapter)) return;
      if (this.adapter.getChatContainer(document)) this.connect();
    });
    this.documentObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  private stopWaitingForDocument(): void {
    this.documentObserver?.disconnect();
    this.documentObserver = undefined;
  }

  private disconnectSite(): void {
    this.containerObserver?.disconnect();
    this.containerObserver = undefined;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = undefined;

    for (const state of this.states.values()) this.disposeState(state);
    this.states.clear();
    this.chatContainer = undefined;
    this.latestMessage = undefined;
    this.adapter = undefined;
  }

  private observeChatContainer(container: Element): void {
    this.containerObserver = new MutationObserver((records) =>
      this.handleContainerMutations(records),
    );
    this.containerObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-busy', 'data-is-streaming', 'data-streaming'],
    });

    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const state = this.states.get(entry.target);
            if (state) this.beginObservingMessage(state);
            this.intersectionObserver?.unobserve(entry.target);
          }
        },
        { rootMargin: '160px 0px' },
      );
    }
  }

  private discoverMessages(root: ParentNode): void {
    const adapter = this.adapter;
    if (!adapter) return;
    for (const message of adapter.findAssistantMessages(root)) this.registerMessage(message);
  }

  private registerMessage(element: Element): void {
    const adapter = this.adapter;
    if (!adapter || this.states.has(element) || !adapter.isAssistantMessage(element)) return;

    const textRoot = adapter.getMessageTextRoot(element);
    const badgeAnchor = adapter.getBadgeAnchor(element);
    const badge = createBadge(badgeAnchor, '…', this.settings.badgePosition, this.settings.theme);
    const state: MessageState = {
      element,
      textRoot,
      badge,
      started: false,
      finalized: false,
      streamingSeen: false,
      lastSnapshot: '',
      label: '…',
    };
    this.states.set(element, state);
    this.latestMessage = element;

    if (this.intersectionObserver) this.intersectionObserver.observe(element);
    else this.beginObservingMessage(state);
  }

  private handleContainerMutations(records: MutationRecord[]): void {
    const adapter = this.adapter;
    const container = this.chatContainer;
    if (!adapter || !container) return;

    for (const record of records) {
      const target = record.target instanceof Element ? record.target : record.target.parentElement;
      if (target?.closest('[data-ai-readtime="true"]')) continue;

      const message = target?.closest(adapter.selectors.assistantMessage);
      if (message && adapter.isAssistantMessage(message)) {
        const state = this.states.get(message);
        if (!state) this.registerMessage(message);
        else if (state.finalized) this.resumeMessage(state);
        continue;
      }

      for (const addedNode of Array.from(record.addedNodes)) {
        if (addedNode instanceof Element) this.discoverMessages(addedNode);
      }

      if (record.type === 'childList' && target && target !== container) {
        this.discoverMessages(target);
      }
    }

    this.removeDetachedMessages();

    // The stop/generation control is often outside the message subtree. Re-check the
    // newest visible response when that global control appears or disappears.
    const latestState = this.latestMessage ? this.states.get(this.latestMessage) : undefined;
    if (
      latestState?.started &&
      !adapter.isGenerating(
        latestState.element,
        container,
        latestState.element === this.latestMessage,
      )
    ) {
      this.queueUpdate(latestState);
    }
  }

  private beginObservingMessage(state: MessageState): void {
    if (state.started || !state.element.isConnected || !this.adapter) return;
    state.started = true;
    state.textRoot = this.adapter.getMessageTextRoot(state.element);
    state.observer = new MutationObserver(() => this.queueUpdate(state));
    state.observer.observe(state.textRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-busy', 'data-is-streaming', 'data-streaming'],
    });
    this.updateMessage(state);
  }

  private queueUpdate(state: MessageState): void {
    if (!state.started || state.finalized) return;
    if (state.debounceTimer !== undefined) window.clearTimeout(state.debounceTimer);
    state.debounceTimer = window.setTimeout(() => {
      state.debounceTimer = undefined;
      this.updateMessage(state);
    }, UPDATE_DEBOUNCE_MS);
  }

  private updateMessage(state: MessageState): void {
    const adapter = this.adapter;
    const container = this.chatContainer;
    if (!adapter || !container || !state.element.isConnected) return;

    state.textRoot = adapter.getMessageTextRoot(state.element);
    const result = estimateElementReadTime(state.textRoot, this.settings);
    state.lastSnapshot = state.textRoot.textContent ?? '';
    state.label = result.label;
    state.badge.update(state.label, this.settings.badgePosition, this.settings.theme);

    const isGenerating = adapter.isGenerating(
      state.element,
      container,
      state.element === this.latestMessage,
    );
    if (isGenerating) {
      state.streamingSeen = true;
      this.clearFinalizeTimer(state);
      return;
    }

    if (!state.lastSnapshot.trim()) return;
    this.scheduleFinalize(
      state,
      state.streamingSeen ? FINALIZE_AFTER_STREAM_MS : FINALIZE_FALLBACK_MS,
    );
  }

  private scheduleFinalize(state: MessageState, delay: number): void {
    this.clearFinalizeTimer(state);
    state.finalizeTimer = window.setTimeout(() => {
      state.finalizeTimer = undefined;
      const adapter = this.adapter;
      const container = this.chatContainer;
      if (!adapter || !container || !state.element.isConnected) return;
      if (adapter.isGenerating(state.element, container, state.element === this.latestMessage)) {
        state.streamingSeen = true;
        return;
      }

      const snapshot = adapter.getMessageTextRoot(state.element).textContent ?? '';
      if (snapshot !== state.lastSnapshot) {
        this.updateMessage(state);
        return;
      }

      state.finalized = true;
      state.observer?.disconnect();
      state.observer = undefined;
    }, delay);
  }

  private resumeMessage(state: MessageState): void {
    state.finalized = false;
    state.started = false;
    state.streamingSeen = false;
    state.lastSnapshot = '';
    this.beginObservingMessage(state);
  }

  private refreshMessages(): void {
    for (const state of this.states.values()) {
      state.badge.update(state.label, this.settings.badgePosition, this.settings.theme);
      if (state.started && !state.finalized) {
        this.queueUpdate(state);
        continue;
      }

      const adapter = this.adapter;
      if (adapter) {
        const result = estimateElementReadTime(
          adapter.getMessageTextRoot(state.element),
          this.settings,
        );
        state.label = result.label;
        state.badge.update(state.label, this.settings.badgePosition, this.settings.theme);
      }
    }
  }

  private handleSettingsChange(settings: Settings): void {
    this.settings = settings;
    const current = getAdapter(window.location.href);
    if (!this.siteIsEnabled(current)) {
      this.disconnectSite();
      this.stopWaitingForDocument();
      return;
    }

    if (!this.chatContainer || this.adapter?.id !== current.id) {
      this.disconnectSite();
      this.connect();
      return;
    }

    this.refreshMessages();
  }

  private clearFinalizeTimer(state: MessageState): void {
    if (state.finalizeTimer !== undefined) {
      window.clearTimeout(state.finalizeTimer);
      state.finalizeTimer = undefined;
    }
  }

  private disposeState(state: MessageState): void {
    state.observer?.disconnect();
    if (state.debounceTimer !== undefined) window.clearTimeout(state.debounceTimer);
    this.clearFinalizeTimer(state);
    this.intersectionObserver?.unobserve(state.element);
    state.badge.remove();
  }

  private removeDetachedMessages(): void {
    for (const [element, state] of this.states) {
      if (!element.isConnected) {
        this.disposeState(state);
        this.states.delete(element);
      }
    }

    if (this.latestMessage && !this.latestMessage.isConnected) {
      this.latestMessage = Array.from(this.states.keys()).at(-1);
    }
  }
}

export default defineContentScript({
  matches: SITE_ADAPTERS.flatMap((adapter) => {
    if (adapter.id === 'claude') return ['https://claude.ai/*'];
    return ['https://gemini.google.com/*'];
  }),
  runAt: 'document_idle',
  main() {
    const controller = new ReadTimeController();
    void controller.start();
  },
});
