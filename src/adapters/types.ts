import type { SiteId } from '../shared/defaultSettings';

export interface SiteSelectors {
  chatContainer: string;
  assistantMessage: string;
  messageTextRoot: string;
  badgeAnchor: string;
  generatingIndicator: string;
}

export interface SiteAdapter {
  readonly id: SiteId;
  readonly selectors: SiteSelectors;
  matches(url: string): boolean;
  getChatContainer(document: Document): Element | null;
  findAssistantMessages(root: ParentNode): Element[];
  isAssistantMessage(node: Element): boolean;
  getMessageTextRoot(node: Element): Element;
  getBadgeAnchor(node: Element): Element;
  isGenerating(node: Element, chatContainer: ParentNode, isLatest?: boolean): boolean;
}
