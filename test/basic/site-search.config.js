const path = require('path');

const SERVER_CMD = path.resolve(__dirname, '../__fixtures__/basic/run.ts');

module.exports = {
  siteStartCmd: `yarn ts-node ${SERVER_CMD}`,
  siteOrigin: 'http://localhost:3000',
  startUrl: '/',
  outputPath: './output/site-search.json',
  rules: [
    {
      hierarchy: [{ selector: 'h1' }, { selector: 'h2' }, { selector: 'h3' }],
      text: { selector: 'p' },
    },
  ],
};
