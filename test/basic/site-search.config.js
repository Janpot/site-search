const path = require('path');

const SERVER_CMD = path.resolve(__dirname, '../__fixtures__/basic/run.ts');

module.exports = {
  siteStartCmd: `yarn ts-node ${SERVER_CMD}`,
  siteOrigin: 'http://localhost:3000',
  siteReadyProbe: '/',
  outputPath: './output/site-search.json',
  selectors: {
    hierarchy: [
      { selector: 'h1' },
      { selector: 'h2' },
      { selector: 'h3' },
      { selector: 'h4' },
      { selector: 'h5' },
    ],
    text: { selector: 'p' },
  },
};
