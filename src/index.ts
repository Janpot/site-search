import { resolve, dirname } from 'path';
import execa from 'execa';
import fetch from 'node-fetch';
import Ajv, { JSONSchemaType } from 'ajv';
import { URL } from 'url';
import { JSDOM } from 'jsdom';
import extractRecords from './extractRecords';
import { SiteSearchConfig, IndexedDocument, ContentRule } from './types';
import PromiseQueue from './PromiseQueue';
import lunr from 'lunr';
import { writeFile } from 'fs/promises';
import arg from 'arg';

const args = arg({});

const ajv = new Ajv();

const projectRoot = args._[0] || process.cwd();

const configPath = resolve(projectRoot, 'site-search.config');

const contentSelector = {
  type: 'object',
  properties: {
    selector: { type: 'string' },
    default: { type: 'string', nullable: true },
  },
  required: ['selector'],
} as const;

const configSchema: JSONSchemaType<SiteSearchConfig> = {
  type: 'object',
  properties: {
    siteStartCmd: { type: 'string', nullable: true },
    siteOrigin: { type: 'string' },
    startUrl: { type: 'string' },
    outputPath: { type: 'string' },
    rules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          test: { type: 'string', nullable: true },
          hierarchy: { type: 'array', items: contentSelector },
          text: contentSelector,
        },
        required: ['hierarchy', 'text'],
      },
    },
  },
  required: ['siteOrigin', 'startUrl'],
  additionalProperties: false,
};

const validateConfig = ajv.compile(configSchema);

async function isSiteReady(url: URL): Promise<boolean> {
  try {
    const { status } = await fetch(url);
    return status >= 200 && status < 300;
  } catch (err) {
    return false;
  }
}

async function waitUntilSiteReady(url: URL): Promise<void> {
  const timeout = 30000;
  const pollInterval = 1000;

  const startTime = Date.now();
  while (true) {
    const siteReady = await isSiteReady(url);
    if (siteReady) {
      return;
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime > timeout) {
      throw new Error('Timeout waiting for site to become ready');
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

function findRule(rules: ContentRule[], pathname: string): ContentRule | null {
  for (const rule of rules) {
    const match = !rule.test || new RegExp(rule.test).test(pathname);
    if (match) {
      return rule;
    }
  }
  return null;
}

function extractLinks(doc: Document, config: SiteSearchConfig): string[] {
  const result: string[] = [];
  for (const anchor of doc.querySelectorAll('a')) {
    const url = new URL(anchor.href);
    url.search = '';
    url.hash = '';
    if (
      url.origin === config.siteOrigin &&
      findRule(config.rules, url.pathname)
    ) {
      result.push(url.toString());
    }
  }
  return result;
}

export default async function run() {
  let siteProcess;
  try {
    console.log(`Reading configuration at "${configPath}"`);
    const { default: config } = await import(configPath);

    if (!validateConfig(config)) {
      console.log(validateConfig.errors);
      return;
    }

    const resolvedOutputPath = resolve(dirname(configPath), config.outputPath);

    if (config.siteStartCmd) {
      console.log(`Starting site with "${config.siteStartCmd}"`);
      siteProcess = execa.command(config.siteStartCmd, {
        stdio: 'inherit',
      });
    }

    await Promise.race([
      ...(siteProcess
        ? [
            siteProcess.then(() => {
              throw new Error(`Site process stopped unexpectedly`);
            }),
          ]
        : []),
      (async () => {
        const parsedStartUrl = new URL(config.startUrl, config.siteOrigin);
        console.log(`Waiting until site ready at ${parsedStartUrl}`);
        await waitUntilSiteReady(parsedStartUrl);
        console.log(`Site ready`);

        const queue = new PromiseQueue({ concurrency: 5 });
        const seen: Set<string> = new Set();

        const corpus: IndexedDocument[] = [];

        const crawl = async (url: string) => {
          if (seen.has(url)) {
            return;
          }

          seen.add(url);
          const { pathname } = new URL(url);

          const rule = findRule(config.rules, pathname);
          if (!rule) {
            console.log('Skipped url', pathname);
            return;
          }

          const links = await queue.add(async () => {
            console.log(`Fetching ${url}`);
            const res = await fetch(url);
            const pageSrc = await res.text();
            const { window } = new JSDOM(pageSrc, {
              url,
              contentType: res.headers.get('content-type') || 'text/html',
            });

            const records = extractRecords(window.document.body, rule);

            corpus.push(
              ...records.map((record) => ({ path: pathname, ...record }))
            );

            const links = extractLinks(window.document, config);

            return links;
          });

          await Promise.all(links.map((link) => crawl(link)));
        };

        await crawl(parsedStartUrl.toString());

        const maxLevel = Math.max(
          0,
          ...config.rules.map((rule) => rule.hierarchy.length)
        );
        const hierarchy: string[] = [];

        const index = lunr(function () {
          this.ref('id');
          for (let level = 0; level < maxLevel; level++) {
            const field = `l_${level}`;
            hierarchy.push(field);
            this.field(field, {
              extractor: (doc: object) =>
                (doc as IndexedDocument).hierarchy[level] || '',
            });
          }
          this.field('text');

          this.metadataWhitelist = ['position'];
          this.pipeline.remove(lunr.stemmer);

          corpus.forEach((record, id) => {
            this.add({ id, ...record });
          });
        });

        console.log(`Writing output at "${resolvedOutputPath}"`);
        await writeFile(
          resolvedOutputPath,
          JSON.stringify({
            corpus,
            index: index.toJSON(),
            hierarchy,
          })
        );
      })(),
    ]);

    if (siteProcess) {
      await Promise.all([
        siteProcess.cancel(),
        siteProcess.catch(() => undefined),
      ]);
    }

    console.log('Done');
  } finally {
    if (siteProcess) {
      await siteProcess.cancel();
    }
  }
}
