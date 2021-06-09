import { resolve } from 'path';
import execa from 'execa';
import { rm, mkdir } from 'fs/promises';

const CLI = resolve(__dirname, '../../bin/cli.js');
const OUTPUT_FOLDER = resolve(__dirname, 'output');

expect.extend({
  documentMatching(actual, expected) {
    let pass = true;
    for (const [key, value] of Object.entries(expected)) {
      if (actual[key] !== value) {
        pass = false;
      }
    }

    const excluded = [
      'lvl0',
      'lvl1',
      'lvl2',
      'lvl3',
      'lvl4',
      'lvl5',
      'text',
      'path',
      'anchor',
    ].filter((key) => !Object.prototype.hasOwnProperty.call(expected, key));
    for (const key of excluded) {
      if (Object.prototype.hasOwnProperty.call(actual, key)) {
        pass = false;
      }
    }

    return { pass, message: () => '' };
  },
});

declare global {
  namespace jest {
    interface Expect {
      documentMatching(doc: object): any;
    }
  }
}

beforeAll(async () => {
  await rm(OUTPUT_FOLDER, { recursive: true, force: true });
  await mkdir(OUTPUT_FOLDER);
});

afterAll(async () => {
  await rm(OUTPUT_FOLDER, { recursive: true, force: true });
});

test('test', async () => {
  await execa(CLI, [], {
    cwd: __dirname,
    stdio: 'inherit',
  });

  // @ts-expect-error './output/site-search.json' gets cleaned up between tests
  const { corpus } = await import('./output/site-search.json');
  expect(corpus).toContainEqual(
    expect.documentMatching({
      path: '/',
      lvl0: 'Title',
      lvl1: 'Subtitle 1',
      text: 'Content 1',
    })
  );
  expect(corpus).toContainEqual(
    expect.documentMatching({
      path: '/',
      lvl0: 'Title',
      lvl1: 'Subtitle 2',
      text: 'Content 2',
    })
  );
  expect(corpus).toContainEqual(
    expect.documentMatching({
      path: '/',
      lvl0: 'Title',
      lvl1: 'Subtitle 3',
      lvl2: 'Subsubtitle 1',
      text: 'Content 4',
    })
  );
  expect(corpus).toContainEqual(
    expect.documentMatching({
      path: '/',
      lvl0: 'Title',
      lvl1: 'Subtitle 4',
      text: 'Content 5',
    })
  );
  expect(corpus).toContainEqual(
    expect.documentMatching({
      path: '/foo.html',
      lvl0: 'Foo Title',
      text: 'Content',
    })
  );
  expect(corpus).toContainEqual(
    expect.documentMatching({
      path: '/nested.html',
      lvl0: 'Nested Title',
      text: 'Content',
    })
  );
  expect(corpus).toContainEqual(
    expect.documentMatching({
      path: '/nested.html',
      lvl0: 'Nested Title',
      text: 'Content',
    })
  );
  expect(corpus).toContainEqual(
    expect.documentMatching({
      path: '/deep-links.html',
      anchor: 'anchor2',
      lvl0: 'Deep Links',
      lvl1: 'Subtitle 1',
      text: 'Content 1',
    })
  );
  expect(corpus).toContainEqual(
    expect.documentMatching({
      path: '/deep-links.html',
      anchor: 'anchor3',
      lvl0: 'Deep Links',
      lvl1: 'Subtitle 2',
      text: 'Content 2',
    })
  );
  expect(corpus).not.toContainEqual(
    expect.objectContaining({
      path: '/foo.html?param=foo#hash',
    })
  );
});
