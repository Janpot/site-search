import handler from '../src/handler';
import express from 'express';
import { Server } from 'http';
import fetch from 'node-fetch';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

let server: Server;
const port = 3001;

beforeAll(async () => {
  const index = JSON.parse(
    await readFile(
      resolve(__dirname, './__fixtures__/reactjs/site-search.json'),
      { encoding: 'utf-8' }
    )
  );
  const app = express();
  app.use('/search', handler({ data: index }));
  return new Promise((resolve, reject) => {
    server = app.listen(port).once('listening', resolve).once('error', reject);
  });
});

afterAll(async () => {
  return server?.close();
});

test('handler', async () => {
  const res = await fetch(`http://localhost:${port}/search?q=react`);
  expect(res).toHaveProperty('status', 200);
  const body = await res.json();
  console.log(JSON.stringify(body, null, 2));
  expect(body).toEqual(
    expect.objectContaining({
      results: expect.arrayContaining([]),
    })
  );
});
