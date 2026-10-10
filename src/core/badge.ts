import type { BadgePosition, Theme } from '../shared/defaultSettings';

export interface BadgeHandle {
  update(label: string, position: BadgePosition, theme: Theme): void;
  remove(): void;
}

const SHADOW_STYLES = `
  :host {
    all: initial;
    display: inline-flex;
    box-sizing: border-box;
    z-index: 5;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 12px;
    line-height: 1.2;
    color-scheme: light dark;
    pointer-events: none;
  }
  :host([data-position="top-right"]) {
    position: absolute;
    inset-block-start: 6px;
    inset-inline-end: 8px;
  }
  :host([data-position="inline-end"]) {
    display: flex;
    position: static;
    width: 100%;
    justify-content: flex-end;
    margin: 4px 0 8px;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: 1px solid rgba(120, 130, 145, .3);
    border-radius: 999px;
    padding: 4px 9px;
    background: rgba(245, 247, 250, .96);
    color: #465160;
    box-shadow: 0 1px 4px rgba(20, 30, 45, .10);
    white-space: nowrap;
    font: inherit;
    letter-spacing: .01em;
    opacity: 0;
    transform: translateY(2px);
    animation: arrive 180ms ease-out forwards;
  }
  .clock { font-size: 12px; line-height: 1; }
  :host([data-theme="dark"]) .pill {
    background: rgba(44, 48, 56, .96);
    color: #d8dde5;
    border-color: rgba(190, 200, 215, .24);
  }
  @media (prefers-color-scheme: dark) {
    :host([data-theme="auto"]) .pill {
      background: rgba(44, 48, 56, .96);
      color: #d8dde5;
      border-color: rgba(190, 200, 215, .24);
    }
  }
  :host-context(.dark) .pill,
  :host-context([data-theme="dark"]) .pill,
  :host-context([data-color-scheme="dark"]) .pill {
    background: rgba(44, 48, 56, .96);
    color: #d8dde5;
    border-color: rgba(190, 200, 215, .24);
  }
  :host([data-theme="light"]) .pill {
    background: rgba(245, 247, 250, .96);
    color: #465160;
    border-color: rgba(120, 130, 145, .3);
  }
  @keyframes arrive {
    to { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .pill { animation: none; opacity: 1; transform: none; }
  }
`;

export function createBadge(
  anchor: Element,
  label: string,
  position: BadgePosition,
  theme: Theme,
): BadgeHandle {
  const host = document.createElement('span');
  host.setAttribute('data-ai-readtime', 'true');
  host.setAttribute('role', 'status');
  host.setAttribute('aria-label', 'Estimated reading time');

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = SHADOW_STYLES;
  const pill = document.createElement('span');
  pill.className = 'pill';
  const clock = document.createElement('span');
  clock.className = 'clock';
  clock.setAttribute('aria-hidden', 'true');
  clock.textContent = '⏱';
  const text = document.createElement('span');
  text.textContent = label;
  pill.append(clock, text);
  shadow.append(style, pill);

  let changedPosition = false;
  let priorInlinePosition = '';

  const ensurePositionedAnchor = (): void => {
    const computedPosition = getComputedStyle(anchor).position;
    if ((computedPosition && computedPosition !== 'static') || changedPosition) return;
    priorInlinePosition = (anchor as HTMLElement).style.position;
    (anchor as HTMLElement).style.position = 'relative';
    changedPosition = true;
  };

  const restoreAnchorPosition = (): void => {
    if (changedPosition && (anchor as HTMLElement).style.position === 'relative') {
      (anchor as HTMLElement).style.position = priorInlinePosition;
    }
    changedPosition = false;
  };

  const place = (nextPosition: BadgePosition): void => {
    if (nextPosition === 'top-right') {
      ensurePositionedAnchor();
      if (host.parentElement !== anchor) anchor.append(host);
      return;
    }

    if (host.parentElement === anchor || host.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement('afterend', host);
    }
    restoreAnchorPosition();
  };

  const update = (nextLabel: string, nextPosition: BadgePosition, nextTheme: Theme): void => {
    place(nextPosition);
    text.textContent = nextLabel;
    host.dataset.position = nextPosition;
    host.dataset.theme = nextTheme;
    host.setAttribute('aria-label', `Estimated reading time: ${nextLabel}`);
  };

  update(label, position, theme);

  return {
    update,
    remove() {
      host.remove();
      restoreAnchorPosition();
    },
  };
}
