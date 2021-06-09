# site-search

> A lightweight self-hosted alternative to [DocSearch](https://docsearch.algolia.com/).

`site-search` will run your website locally, crawl its pages and index their content in a [`lunr`](https://www.npmjs.com/package/lunr) index. It also provides a node.js request handler that can be initialized with this index to provide a search endpoint for your website.

## How to use

1. Install the package

```
yarn add -D site-search
```

2. Add a `site-search.config.js` to the root of your project containing

```ts
module.exports = {
  siteStartCmd: `yarn start`,
  siteOrigin: 'http://localhost:3000',
  siteReadyProbe: '/',
  outputPath: './site-search-index.json',
  selectors: {
    lvl0: 'h1',
    lvl1: 'h2',
    lvl2: 'h3',
    lvl3: 'h4',
    lvl4: 'h5',
    lvl5: 'h6',
    text: 'p',
  },
};
```

3. Run `site-search`:

4. Add the search endpoint to your app:

```ts
const handler = require('site-search/handler');
const indexData = require('./site-search-index.json');
// ...
app.use('/search', handler(indexData));
```

5. Now you can use `/search?q=foo` to find document matching "foo"

## Config

**`siteStartCmd`**: Command that should be run to start your website
**`siteOrigin`**: Url of where the running website can be reached
**`siteReadyProbe`**: Path that can be polled to determine the website is ready for crawling. Crawling doesn't start until this returns a `200`
**`outputPath`**: Where to store the resulting index data
**`selectors`**: Selectors to extract hierarchy. Similar to [how Algolia does it](https://docsearch.algolia.com/docs/how-do-we-build-an-index)
