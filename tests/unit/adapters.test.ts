import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getAdapter } from '../../src/adapters/registry';

function loadFixture(fileName: string): HTMLElement {
  const html = readFileSync(join(process.cwd(), 'tests', 'fixtures', fileName), 'utf8');
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.querySelector('main')!;
}

describe('site adapter registry', () => {
  it('selects adapters by supported host', () => {
    expect(getAdapter('https://chatgpt.com/c/example')).toBeUndefined();
    expect(getAdapter('https://claude.ai/chat/example')?.id).toBe('claude');
    expect(getAdapter('https://gemini.google.com/app')?.id).toBe('gemini');
    expect(getAdapter('https://example.com/')).toBeUndefined();
  });

  it('identifies fixture assistant messages and ignores user turns', () => {
    const claude = getAdapter('https://claude.ai/')!;
    expect(claude.findAssistantMessages(loadFixture('claude.html'))).toHaveLength(1);

    const gemini = getAdapter('https://gemini.google.com/')!;
    expect(gemini.findAssistantMessages(loadFixture('gemini.html'))).toHaveLength(1);
  });
});
