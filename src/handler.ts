import lunr from 'lunr';
import { IncomingMessage, ServerResponse } from 'http';
import { IndexedDocument } from './types';
import { buildSnippet, Snippet } from './snippets';

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
