var webdriverio = require('../../build/index'),
  client = webdriverio.remote({
    desiredCapabilities: {
      sessionName: 'Automation test session',
      sessionDescription: 'This is an example for Automation Test on Android device',
      deviceOrientation:  'portrait',
      captureScreenshots: true,
      browserName:        'chrome',
      deviceGroup:        'KOBITON',
      deviceName:         'Galaxy Note5',
      platformVersion:    '6.0.1',
      platformName:       'Android'
    },
    protocol: 'https',
    port: 443,
    host: 'api.kobiton.com',
    user: process.env.KOBITON_USERNAME,
    key: process.env.KOBITON_ACCESS_KEY,
    logLevel: 'verbose'
  }).init();

client
  .url('http://webdriver.io')
  .setValue('.ds-input', 'click')
  .click('.algolia-docsearch-suggestion--title')
  .pause(1000)
  .getTitle().then((title) => {
      console.log(title); // should return "WebdriverIO - click"
  })
  .end()
  .catch((e) => console.log(e));
