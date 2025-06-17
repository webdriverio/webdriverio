WebdriverIO BrowserStack Service
==========

> A WebdriverIO service for BrowserStack users, enabling testing on 3,000+ real browsers and devices with support for local testing and test analytics.

## Prerequisites

* Ensure you have a BrowserStack username and access key. Obtain your `userName` and `accessKey` from the [Account & Profile](https://www.browserstack.com/accounts/profile/details) section on the dashboard.  
If you have not yet created an account, [sign up for a free trial](https://www.browserstack.com/users/sign_up).

* Node.js and [WebdriverIO getting started](https://webdriver.io/docs/gettingstarted).

* BrowserStack [Local binary](https://www.browserstack.com/docs/local-testing/api) for local testing.

## Installation​

Install the BrowserStack service as a devDependency:

```bash
npm install @wdio/browserstack-service --save-dev
```

## Configuration​

Add your BrowserStack credentials and service settings to `wdio.conf.js`. The BrowserStack service supports [BrowserStack Tunnel](https://www.browserstack.com/docs/automate/selenium/getting-started/nodejs/webdriverio/local-testing) for testing local or private servers, as well as Test Reporting & Analytics for test analytics. Here is an example configuration file to help you get started with:

```js
// wdio.conf.js
export const config = {
  user: process.env.BROWSERSTACK_USERNAME || 'your-username', // Your BrowserStack username
  key: process.env.BROWSERSTACK_ACCESS_KEY || 'your-access-key', // Your BrowserStack access key
  services: [
    [
      'browserstack',
      {
        testObservability: true, // Enable test analytics
        testObservabilityOptions: {
          projectName: 'WebdriverIO Project', // Name for grouping tests
          buildName: 'Nightly Regression Build', // Name for test runs
        },
        browserstackLocal: true, // Enable local testing
      },
    ],
  ],
  capabilities: [
    {
      browserName: 'chrome',
      browserVersion: 'latest',
      'bstack:options': {
        os: 'Windows',
        osVersion: '10',
        resolution: '1920x1080',
      },
    },
  ],
  baseUrl: 'http://localhost:3000',
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
};
```

## Options​

Configure your `wdio.conf.js` with these key options:

### Web Testing

* Test web apps on 3,000+ real desktop/mobile browsers using Selenium.
* Set browser capabilities via BrowserStack’s [Capability Generator](https://www.browserstack.com/automate/capabilities).
* [Integrate with Automate](https://www.browserstack.com/docs/automate/selenium/getting-started/nodejs/webdriverio/integrate-your-tests).
* Manage sessions and retrieve test data (e.g., logs, screenshots) with the [Automate REST API](https://www.browserstack.com/docs/automate/api-reference/selenium/automate-api).

### App Testing

* Test native/hybrid apps on 2,000+ real iOS/Android devices using Appium.
* Configure device settings via BrowserStack’s [App Automate Capability Generator](https://www.browserstack.com/app-automate/capabilities).
* [Integrate with App Automate](https://www.browserstack.com/docs/app-automate/appium/getting-started/nodejs/webdriverio/integrate-your-tests).
* Manage sessions and retrieve test data (e.g., logs, screenshots, videos) with the [App Automate REST API](https://www.browserstack.com/docs/app-automate/api-reference).

### Test Reporting & Analytics

* Gain insights like unique error analysis and automatic flaky test detection.
* Enabled by default with `testObservability: true`. 
* View results: [Test Reporting & Analytics dashboard](https://observability.browserstack.com/overview).
* Learn more: [Test Reporting & Analytics guide](https://www.browserstack.com/docs/test-reporting-and-analytics/quick-start/webdriverio).

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
