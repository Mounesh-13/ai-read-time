import { describe, expect, it } from 'vitest';
import { createBadge } from '../../src/core/badge';

describe('shadow-DOM read-time badge', () => {
  it('isolates the pill and can move between supported positions', () => {
    const anchor = document.createElement('div');
    anchor.textContent = 'Assistant response';
    document.body.append(anchor);

    const badge = createBadge(anchor, '~1 min read', 'top-right', 'auto');
    const host = anchor.querySelector('[data-ai-readtime="true"]') as HTMLElement;
    expect(host.shadowRoot).not.toBeNull();
    expect(host.shadowRoot?.textContent).toContain('~1 min read');
    expect(anchor.style.position).toBe('relative');

    badge.update('~2 min read', 'inline-end', 'dark');
    expect(host.parentElement).toBe(document.body);
    expect(host.previousElementSibling).toBe(anchor);
    expect(host.dataset.theme).toBe('dark');
    expect(anchor.style.position).toBe('');

    badge.update('~3 min read', 'top-right', 'light');
    expect(host.parentElement).toBe(anchor);
    expect(host.shadowRoot?.textContent).toContain('~3 min read');

    badge.remove();
    expect(anchor.querySelector('[data-ai-readtime="true"]')).toBeNull();
    expect(anchor.style.position).toBe('');
  });
});
