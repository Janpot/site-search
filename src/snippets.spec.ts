import { buildSnippet, BuildSnippetOptions } from './snippets';

test.each([
  ['hello world foo bar', { size: 8, margin: 1 }, ['hello wo…']],
  ['hello world foo bar', { size: 8, margin: 2 }, ['hello wo…']],
  ['hello world foo bar', { size: 9, margin: 2 }, ['hello world…']],
  ['hello world foo bar', { size: 8, margin: 3 }, ['hello…']],
  ['hello world foo bar', { size: 50, margin: 3 }, ['hello world foo bar']],
  [
    'hello world foo bar baz',
    { size: 12, margin: 3, highlights: [[12, 3]] },
    ['…world ', 'foo', ' bar…'],
  ],
  [
    'hello world foo bar baz',
    { size: 14, margin: 3, highlights: [[16, 3]] },
    ['…world foo ', 'bar', ' baz'],
  ],
  [
    'hello world foo bar baz',
    {
      size: 50,
      margin: 3,
      highlights: [
        [12, 3],
        [16, 3],
      ],
    },
    ['hello world ', 'foo', ' ', 'bar', ' baz'],
  ],
  [
    'hello world foo bar',
    { size: 10, margin: 1, highlights: [[0, 5]] },
    ['', 'hello', ' world…'],
  ],
  [
    'hello world foo bar baz',
    { size: 50, margin: 3, highlights: [[30, 3]] },
    ['hello world foo bar baz'],
  ],
] as [string, BuildSnippetOptions, string[]][])(
  'buildSnippet(%p, %p) makes %p',
  (input, options, expected) => {
    expect(buildSnippet(input, options).parts).toEqual(expected);
  }
);
