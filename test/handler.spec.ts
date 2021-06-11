import handler from '../src/handler';
import express from 'express';
import { Server } from 'http';
import fetch from 'node-fetch';
import { resolve } from 'path';

let server: Server;
const port = 3001;

beforeAll(async () => {
  const app = express();
  app.use(
    '/search',
    handler({
      filename: resolve(__dirname, './__fixtures__/reactjs/site-search.json'),
    })
  );
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
  expect(body).toMatchSnapshot();
});
