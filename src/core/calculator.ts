import type { Settings } from '../shared/defaultSettings';

export interface ReadTimeCounts {
  wordCount: number;
  codeLines: number;
}

export interface ReadTimeResult extends ReadTimeCounts {
  seconds: number;
  label: string;
}

export type CalculatorSettings = Pick<Settings, 'wpm' | 'codeLinesPerMinute' | 'roundingMode'>;

const EXCLUDED_CONTENT_SELECTOR =
  'pre, code, script, style, noscript, svg, button, textarea, input, select, [data-ai-readtime]';
const BLOCK_ELEMENTS = new Set([
  'ADDRESS',
  'ARTICLE',
  'BLOCKQUOTE',
  'DD',
  'DIV',
  'DL',
  'DT',
  'FIELDSET',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'FORM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HR',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'SECTION',
  'TABLE',
  'TBODY',
  'TD',
  'TFOOT',
  'TH',
  'THEAD',
  'TR',
  'UL',
]);

// CJK scripts don't use spaces, so whitespace splitting counts a whole
// paragraph as one word. Count each CJK character as ~0.6 words (≈340
// chars/min at the default 200 wpm pace).
const CJK_PATTERN = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const cjkChars = trimmed.match(new RegExp(CJK_PATTERN.source, 'gu'))?.length ?? 0;
  const latinWords = trimmed
    .replace(new RegExp(CJK_PATTERN.source, 'gu'), ' ')
    .split(/\s+/u)
    .filter(Boolean).length;
  return latinWords + Math.round(cjkChars * 0.6);
}

function countCodeLines(text: string): number {
  if (!text.trim()) return 0;
  const withoutTrailingNewlines = text.replace(/\r\n?/gu, '\n').replace(/\n+$/u, '');
  return withoutTrailingNewlines ? withoutTrailingNewlines.split('\n').length : 0;
}

function collectProseText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as Element;
  if (element.matches(EXCLUDED_CONTENT_SELECTOR)) return ' ';
  if (element.tagName === 'BR' || element.tagName === 'HR') return ' ';

  const contents = Array.from(element.childNodes, collectProseText).join('');
  return BLOCK_ELEMENTS.has(element.tagName) ? ` ${contents} ` : contents;
}

export function extractReadTimeCounts(root: Element): ReadTimeCounts {
  const codeContainers: Element[] = root.matches('pre')
    ? [root]
    : Array.from(root.querySelectorAll('pre'));
  const codeElements = root.matches('code') ? [root] : Array.from(root.querySelectorAll('code'));
  const standaloneCode = codeElements.filter((element) => !element.closest('pre'));
  codeContainers.push(...standaloneCode);

  const codeLines = codeContainers.reduce(
    (total, element) => total + countCodeLines(element.textContent ?? ''),
    0,
  );

  return {
    wordCount: countWords(collectProseText(root)),
    codeLines,
  };
}

export function formatReadTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  if (safeSeconds < 60) return `~${safeSeconds} sec read`;
  return `~${Math.max(1, Math.round(safeSeconds / 60))} min read`;
}

export function calculateReadTime(
  counts: ReadTimeCounts,
  settings: CalculatorSettings,
): ReadTimeResult {
  const wpm = Math.min(400, Math.max(100, settings.wpm));
  const codeLinesPerMinute = Math.min(120, Math.max(5, settings.codeLinesPerMinute));
  const rawSeconds = (counts.wordCount / wpm + counts.codeLines / codeLinesPerMinute) * 60;
  const seconds =
    settings.roundingMode === 'round' ? Math.round(rawSeconds) : Math.ceil(rawSeconds);

  return {
    ...counts,
    seconds,
    label: formatReadTime(seconds),
  };
}

export function estimateElementReadTime(
  root: Element,
  settings: CalculatorSettings,
): ReadTimeResult {
  return calculateReadTime(extractReadTimeCounts(root), settings);
}
