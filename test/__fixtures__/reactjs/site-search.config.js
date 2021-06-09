const path = require('path');

module.exports = {
  siteOrigin: 'https://reactjs.org',
  siteReadyProbe: '/',
  outputPath: './site-search.json',
  allowedPaths: '^\/docs\/',
  selectors: {
    "lvl0": "nav [aria-expanded=true]",
    "lvl1": "article h1",
    "lvl2": "article h2",
    "lvl3": "article h3",
    "lvl4": "article h4",
    "lvl5": "article h5",
    "text": "article p, article li"
  },

};
