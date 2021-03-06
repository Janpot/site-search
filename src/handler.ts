import lunr from 'lunr';
import { IncomingMessage, ServerResponse } from 'http';
import { IndexedDocument } from './types';
import { buildSnippet, Snippet } from './snippets';
import { readFile } from 'fs/promises';

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
      hierarchy: doc.hierarchy.map((content) => (content ? { content } : null)),
      score: result.score,
      snippet,
      path: doc.path,
      anchor: doc.anchor,
    };
  });
}

export interface SerializedIndexData {
  corpus: IndexedDocument[];
  index: object;
}

export interface Options {
  filename: string;
}

export interface HierarchyLevel {
  content: string;
}

export interface SearchApiResult {
  hierarchy: (HierarchyLevel | null)[];
  score: number;
  snippet: Snippet;
  path: string;
  anchor: string | null;
}

export interface SearchApiResponse {
  results: SearchApiResult[];
}

export default function (options: Options) {
  let dataPromise: Promise<SerializedIndexData>;

  return async (req: IncomingMessage, res: ServerResponse) => {
    if (!dataPromise) {
      dataPromise = readFile(options.filename, 'utf-8').then((file) =>
        JSON.parse(file)
      );
    }

    const data = await dataPromise;
    const { searchParams } = new URL(req.url!, 'http://x');
    const query = searchParams.get('q');
    const results = query ? await search(data, query + '*') : [];
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ results }));
  };
}
