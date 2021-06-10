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
  siteStartUrl: '/',
  outputPath: './site-search-index.json',
  rules: [
    {
      hierarchy: [
        { selector: 'h1' },
        { selector: 'h2' },
        { selector: 'h3' },
        { selector: 'h4' },
      ],
      text: { selector: 'p' },
    },
  ],
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
**`siteStartUrl`**: Url where crawling should start
**`outputPath`**: Where to store the resulting index data
**`rules`**: Rules to extract hierarchy. A bit similar to [how Algolia does it](https://docsearch.algolia.com/docs/how-do-we-build-an-index)
