# TODO: This file is just made for testing the functionality E2E. It will be removed once the functionality is tested and working as expected.
# Prerquisites: 
# 1. Ensure that you have access to https://github.com/browserstack/ai-sdk-node
# 2. This bash script is compatible only with Mac OS.
# 3. Ensure that you have the following environment variables are exported in `~/.zshrc` (or) `~/.bashrc` : BROWSERSTACK_USERNAME, BROWSERSTACK_ACCESS_KEY. For NL2Steps, another variable named TCG_AUTH_TOKEN will also be required.
# 4. A working local selenium grid setup is required to run the tests. Documentation to setup local selenium grid: https://browserstack.atlassian.net/wiki/spaces/ENG/pages/4205380059/Testing+on+Local+-+Healing

rm -rf webdriverio_ai package-lock.json
git clone --single-branch --branch nl2steps-and-healing-support git@github.com:xxshubhamxx/webdriverio_ai.git
cd webdriverio_ai
npm install

cd packages/wdio-browserstack-service
npm install

npm ls -g
npm unlink @wdio/browserstack-service -g
npm link

cd ../../
npm run build
cd ..
pwd


rm -rf webdriverio-browserstack
git clone https://github.com/browserstack/webdriverio-browserstack
cd webdriverio-browserstack
sed -i '' 's/7/8/g' package.json
npm install

npm ls -g
npm link @wdio/browserstack-service

pwd

cat > ./conf/base.conf.js << EOL
exports.config = {
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  updateJob: false,
  specs: ['../tests/specs/test.js'],
  exclude: [],
  logLevel: 'info',
  coloredLogs: true,
  screenshotPath: './errorShots/',
  baseUrl: '',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  hostname: 'localhost',
  port: 4444,
  protocol: 'http',
  services: [['browserstack']],
  selfHeal: true,
  before: function () {
    var chai = require('chai');
    global.expect = chai.expect;
    chai.Should();
  },
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 600000,
  },
};
EOL

echo "Content of ./conf/base.conf.js has been updated."

cat > ./conf/test.conf.js << EOL
const { config: baseConfig } = require('./base.conf.js');
const parallelConfig = {
  maxInstances: 10,
  commonCapabilities: {
    'bstack:options': {
      buildName: 'browserstack build',
      source: 'webdriverio:sample-master:v1.2'
    }
  },
  services: [
    [
      'browserstack',
      { buildIdentifier: '#\${BUILD_NUMBER}' },
    ],
  ],
  capabilities: [
    {
      browserName: 'chrome',
      browserVersion: '124.0',
      'bstack:options': {
        os: 'Linux',
        osVersion: '6.5.0-15-generic',
      },
    },
  ],
};
exports.config = { ...baseConfig, ...parallelConfig };
// Code to support common capabilities
exports.config.capabilities.forEach(function (caps) {
  for (var i in exports.config.commonCapabilities)
    caps[i] = { ...caps[i], ...exports.config.commonCapabilities[i]};
});
EOL

echo "Content of ./conf/test.conf.js has been updated."

cat > ./tests/specs/test.js << EOL
describe("Testing with BStackDemo", () => {
  it("add product to cart", async () => {
    await browser.url('https://xxshubhamxx.github.io/html-files/new/adv.html');
    await browser.execute("window.dispatchEvent(new CustomEvent('enable-ext-logs'));");
    await browser.pause(10000);
    await browser.ai("Click the Subscribe button present at the end of the page");
    await browser.pause(5000)
    const elem = await \$('/html/body/div/div/form/button');
    if(!elem){
      throw new Error("Element not found");
    } else {
      console.log("Element found", elem);
      await elem.click();
    }
    await browser.pause(10000);
  });
});
EOL

echo "Content of ./tests/specs/test.js has been updated."

pwd

npm run test