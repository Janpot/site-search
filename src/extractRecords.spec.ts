import { JSDOM } from 'jsdom';
import extractRecords from './extractRecords';

test('Basic text extraction', () => {
  const { window } = new JSDOM(`
    <section>
      <h1>Main Title</h1>
      <h2>Some Subtitle</h2>
      <p>Some content</p>
      <p>Some content as well</p>
      <h2>Some other Subtitle</h2>
      <p>Some more content</p>
      <h3>Such a deep title</h3>
      <p>And such deep content</p>
      <h2>Back up again</h2>
      <p>The end</p>
    </section>
  `);

  const records = extractRecords(window.document.body, {
    hierarchy: [
      { selector: 'section h1' },
      { selector: 'section h2' },
      { selector: 'section h3' },
    ],
    text: { selector: 'section p' },
  });

  expect(records).toEqual([
    {
      hierarchy: ['Main Title', 'Some Subtitle', null],
      text: 'Some content\nSome content as well',
      anchor: null,
    },
    {
      hierarchy: ['Main Title', 'Some other Subtitle', null],
      text: 'Some more content',
      anchor: null,
    },
    {
      hierarchy: ['Main Title', 'Some other Subtitle', 'Such a deep title'],
      text: 'And such deep content',
      anchor: null,
    },
    {
      hierarchy: ['Main Title', 'Back up again', null],
      text: 'The end',
      anchor: null,
    },
  ]);
});

test("Doesn't find things outside of selectors", () => {
  const { window } = new JSDOM(`
    <body>
      <h1>Ignore this</h1>
      <p>And this</p>
      <section>
        <h1>Some Title</h1>
        <p>Some content</p>
      </section>
      <h2>Ignore also this</h2>
      <p>And this too</p>
    </body>
  `);

  const records = extractRecords(window.document.body, {
    hierarchy: [{ selector: 'section h1' }, { selector: 'section h2' }],
    text: { selector: 'section p' },
  });

  expect(records).toEqual([
    {
      hierarchy: ['Some Title', null],
      text: 'Some content',
      anchor: null,
    },
  ]);
});

test('Understands anchors', () => {
  const { window } = new JSDOM(`
    <section>
      <h1>Main Title</h1>
      <h2 id="anchor1">Some Subtitle</h2>
      <p>Some content</p>
      <h2>Some other Subtitle<span id="anchor2"/></h2>
      <p>Some more content</p>
      <h2>Some Subtitle without anchor</h2>
      <p>Even more content</p>
    </section>
  `);

  const records = extractRecords(window.document.body, {
    hierarchy: [{ selector: 'section h1' }, { selector: 'section h2' }],
    text: { selector: 'section p' },
  });

  expect(records).toEqual([
    {
      hierarchy: ['Main Title', 'Some Subtitle'],
      anchor: 'anchor1',
      text: 'Some content',
    },
    {
      hierarchy: ['Main Title', 'Some other Subtitle'],
      anchor: 'anchor2',
      text: 'Some more content',
    },
    {
      hierarchy: ['Main Title', 'Some Subtitle without anchor'],
      anchor: null,
      text: 'Even more content',
    },
  ]);
});

test('Handles default valiue', () => {
  const { window } = new JSDOM(`
    <body>
      <h2>Some Title</h2>
      <p>Some content</p>
    </body>
  `);

  const records = extractRecords(window.document.body, {
    hierarchy: [{ selector: 'h1', default: 'Default' }, { selector: 'h2' }],
    text: { selector: 'p' },
  });

  expect(records).toEqual([
    {
      hierarchy: ['Default', 'Some Title'],
      text: 'Some content',
      anchor: null,
    },
  ]);
});
