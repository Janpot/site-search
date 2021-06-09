import { resolve } from 'path';
import execa from 'execa';
import { rm, mkdir } from 'fs/promises';

const CLI = resolve(__dirname, '../../bin/cli.js');
const OUTPUT_FOLDER = resolve(__dirname, 'output');

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
    expect.objectContaining({
      path: '/',
      hierarchy: ['Title', 'Subtitle 1'],
      text: 'Content 1',
    })
  );
  expect(corpus).toContainEqual(
    expect.objectContaining({
      path: '/',
      hierarchy: ['Title', 'Subtitle 2'],
      text: 'Content 2',
    })
  );
  expect(corpus).toContainEqual(
    expect.objectContaining({
      path: '/',
      hierarchy: ['Title', 'Subtitle 3', 'Subsubtitle 1'],
      text: 'Content 4',
    })
  );
  expect(corpus).toContainEqual(
    expect.objectContaining({
      path: '/',
      hierarchy: ['Title', 'Subtitle 4'],
      text: 'Content 5',
    })
  );
  expect(corpus).toContainEqual(
    expect.objectContaining({
      path: '/foo.html',
      hierarchy: ['Foo Title'],
      text: 'Content',
    })
  );
  expect(corpus).toContainEqual(
    expect.objectContaining({
      path: '/nested.html',
      hierarchy: ['Nested Title'],
      text: 'Content',
    })
  );
  expect(corpus).toContainEqual(
    expect.objectContaining({
      path: '/nested.html',
      hierarchy: ['Nested Title'],
      text: 'Content',
    })
  );
  expect(corpus).toContainEqual(
    expect.objectContaining({
      path: '/deep-links.html',
      anchor: 'anchor2',
      hierarchy: ['Deep Links', 'Subtitle 1'],
      text: 'Content 1',
    })
  );
  expect(corpus).toContainEqual(
    expect.objectContaining({
      path: '/deep-links.html',
      anchor: 'anchor3',
      hierarchy: ['Deep Links', 'Subtitle 2'],
      text: 'Content 2',
    })
  );
  expect(corpus).not.toContainEqual(
    expect.objectContaining({
      path: '/foo.html?param=foo#hash',
    })
  );
});
