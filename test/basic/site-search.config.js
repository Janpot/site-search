const path = require('path');

const SERVER_CMD = path.resolve(__dirname, '../__fixtures__/basic/run.ts');

module.exports = {
  siteStartCmd: `yarn ts-node ${SERVER_CMD}`,
  siteOrigin: 'http://localhost:3000',
  siteReadyProbe: '/',
  outputPath: './output/site-search.json',
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
