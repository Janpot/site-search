import lunr from 'lunr';
import { IncomingMessage, ServerResponse } from 'http';
import { IndexedDocument } from './types';

let lunrIndex: lunr.Index | undefined;
function getIndex(serializedLunrIndex: object): lunr.Index {
  if (!lunrIndex) {
    lunrIndex = lunr.Index.load(serializedLunrIndex);
  }
  return lunrIndex;
}

type Position = [number, number];

type LevelPosition = {
  position: Position[];
};

type DocMatchPositions = Partial<Record<`l_${number}` | 'text', LevelPosition>>;

type DocMatchesPositions = {
  [match: string]: DocMatchPositions;
};

function mergeTextPositions(
  docMatchPositions: DocMatchesPositions
): Position[] {
  const result: Position[] = [];
  for (const matchPosition of Object.values(docMatchPositions)) {
    const levelMatchPosition = matchPosition.text;
    if (!levelMatchPosition) {
      continue;
    }
    result.push(...levelMatchPosition.position);
  }

  result.sort((a, b) => {
    return a[0] - b[0] || b[1] - a[1];
  });

  return result;
}

interface Snippet {
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

async function search(
  { corpus, index: serializedLunrIndex }: SerializedIndexData,
  query: string
): Promise<SearchApiResult[]> {
  const index = getIndex(serializedLunrIndex);

  const results = index.search(query);
  return results.slice(0, 10).map((result) => {
    const doc = corpus[Number(result.ref)];
    const highlights = mergeTextPositions(
      result.matchData.metadata as DocMatchesPositions
    );

    const snippet = buildSnippet(doc.text, { highlights });

    return {
      hierarchy: doc.hierarchy,
      score: result.score,
      snippet,
    };
  });
}

export interface SerializedIndexData {
  corpus: IndexedDocument[];
  index: object;
}

export interface Options {
  data: SerializedIndexData;
}

export interface SearchApiResult {
  hierarchy: (string | null)[];
  score: number;
  snippet: Snippet;
}

export interface SearchApiResponse {
  results: SearchApiResult[];
}

export default function (options: Options) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const { searchParams } = new URL(req.url!, 'http://x');
    const query = searchParams.get('q');
    const results = query ? await search(options.data, query + '*') : [];
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ results }));
  };
}
