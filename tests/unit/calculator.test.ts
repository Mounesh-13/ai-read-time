import { describe, expect, it } from 'vitest';
import {
  calculateReadTime,
  estimateElementReadTime,
  extractReadTimeCounts,
  formatReadTime,
} from '../../src/core/calculator';
import { DEFAULT_SETTINGS } from '../../src/shared/defaultSettings';

const settings = { ...DEFAULT_SETTINGS };

function rootFrom(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

describe('extractReadTimeCounts', () => {
  it('counts prose words and excludes code blocks', () => {
    const root = rootFrom(
      '<p>Read this short assistant response.</p><pre><code>const answer = 42;\nconsole.log(answer);</code></pre>',
    );
    expect(extractReadTimeCounts(root)).toEqual({ wordCount: 5, codeLines: 2 });
  });

  it('counts standalone code once and ignores controls', () => {
    const root = rootFrom('<p>Try <code>npm test</code> now.</p><button>Copy</button>');
    expect(extractReadTimeCounts(root)).toEqual({ wordCount: 2, codeLines: 1 });
  });

  it('separates adjacent block elements when extracting prose words', () => {
    const root = rootFrom('<p>first</p><p>second</p>');
    expect(extractReadTimeCounts(root)).toEqual({ wordCount: 2, codeLines: 0 });
  });

  it('handles empty and whitespace-only content', () => {
    expect(extractReadTimeCounts(rootFrom(''))).toEqual({ wordCount: 0, codeLines: 0 });
    expect(extractReadTimeCounts(rootFrom('<pre>  </pre>'))).toEqual({
      wordCount: 0,
      codeLines: 0,
    });
  });

  it('does not count a nested code element twice', () => {
    const root = rootFrom('<pre><code>line one\nline two</code></pre>');
    expect(extractReadTimeCounts(root)).toEqual({ wordCount: 0, codeLines: 2 });
  });
});

describe('reading-time calculation', () => {
  it('uses the configured prose and code speeds', () => {
    expect(calculateReadTime({ wordCount: 100, codeLines: 30 }, settings)).toMatchObject({
      seconds: 90,
      label: '~2 min read',
    });
  });

  it('rounds up by default and supports nearest-second rounding', () => {
    expect(calculateReadTime({ wordCount: 98, codeLines: 0 }, settings).seconds).toBe(30);
    expect(
      calculateReadTime({ wordCount: 98, codeLines: 0 }, { ...settings, roundingMode: 'round' })
        .seconds,
    ).toBe(29);
  });

  it('formats the specified thresholds', () => {
    expect(formatReadTime(0)).toBe('~0 sec read');
    expect(formatReadTime(29)).toBe('~29 sec read');
    expect(formatReadTime(59)).toBe('~59 sec read');
    expect(formatReadTime(60)).toBe('~1 min read');
    expect(formatReadTime(119)).toBe('~2 min read');
    expect(formatReadTime(121)).toBe('~2 min read');
    expect(formatReadTime(150)).toBe('~3 min read');
  });

  it('counts CJK characters without spaces as reading load', () => {
    const root = rootFrom('<p>你好世界这是一个测试</p>');
    expect(extractReadTimeCounts(root).wordCount).toBe(6);
  });

  it('keeps latin word counts unchanged', () => {
    const root = rootFrom('<p>one two three four</p>');
    expect(extractReadTimeCounts(root).wordCount).toBe(4);
  });

  it('can estimate directly from a DOM element', () => {
    const root = rootFrom('<p>one two three four</p>');
    expect(estimateElementReadTime(root, settings)).toMatchObject({
      wordCount: 4,
      codeLines: 0,
      seconds: 2,
    });
  });
});
