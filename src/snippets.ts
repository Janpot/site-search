export type Position = [number, number];

export interface Snippet {
  parts: string[];
}

export interface BuildSnippetOptions {
  highlights?: Position[];
  // Approximate size of the snippet
  size?: number;
  /// Amount the snippet can grow or shrink on either end to start/stop on a whitespace
  margin?: number;
}

function applyMargin(
  regex: RegExp,
  text: string,
  position: number,
  margin: number
): number {
  let i = 0;
  while (i <= margin) {
    const pre = text.slice(position - i - 1, position - i + 1);
    if (regex.test(pre)) {
      return position - i;
    }
    const post = text.slice(position + i - 1, position + i + 1);
    if (regex.test(post)) {
      return position + i;
    }
    i++;
  }
  return position;
}

export function buildSnippet(
  text: string,
  { highlights = [], size = 100, margin = 10 }: BuildSnippetOptions = {}
): Snippet {
  const pivot = highlights.length > 0 ? highlights[0][0] : 0;
  let sliceStart = pivot - size / 2;
  let sliceEnd = pivot + size / 2;

  if (sliceStart < 0) {
    sliceEnd += -sliceStart;
  } else if (sliceEnd > text.length) {
    sliceStart -= sliceEnd - text.length;
  }

  sliceStart = applyMargin(/.\b\S/, text, sliceStart, margin);
  sliceEnd = applyMargin(/\S\b./, text, sliceEnd, margin);

  const isTruncatedStart = sliceStart > 0;
  const isTruncatedEnd = sliceEnd < text.length;

  sliceStart = Math.max(0, sliceStart);
  sliceEnd = Math.min(sliceEnd, text.length);

  const applicablePositions = highlights.filter(
    ([start, length]) => start >= sliceStart && start + length <= sliceEnd
  );

  const parts = [];
  let i = sliceStart;
  for (const [start, length] of applicablePositions) {
    parts.push(text.slice(i, start));
    parts.push(text.slice(start, start + length));
    i = start + length;
  }

  parts.push(text.slice(i, sliceEnd));

  if (isTruncatedStart) {
    parts[0] = '…' + parts[0];
  }

  if (isTruncatedEnd) {
    parts[parts.length - 1] = parts[parts.length - 1] + '…';
  }

  return { parts };
}
