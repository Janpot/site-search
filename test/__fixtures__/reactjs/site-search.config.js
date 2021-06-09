const path = require('path');

module.exports = {
  siteOrigin: 'https://reactjs.org',
  siteReadyProbe: '/',
  outputPath: './site-search.json',
  allowedPaths: '^\/docs\/',
  selectors: {
    hierarchy: [
      { selector: 'nav [aria-expanded=true]' },
      { selector: 'article h1' },
      { selector: 'article h2' },
      { selector: 'article h3' },
      { selector: 'article h4' },
      { selector: 'article h5' },
    ],
    text: { selector: 'article p, article li' }
  }
};
