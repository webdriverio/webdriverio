---
id: browserstack-accessibility-testing
title: BrowserStack Accessibility Testing
---

# BrowserStack Accessibility Testing

You can easily integrate accessibility tests in your WebdriverIO test suites using the [Automated tests feature of BrowserStack Accessibility Testing](https://www.browserstack.com/docs/accessibility/automated-tests?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation).

## Advantages of Automated tests in BrowserStack Accessibility Testing

To use Automated tests in BrowserStack Accessibility Testing, your tests should be running on BrowserStack Automate.

The following are the advantages of Automated tests:

- Seamlessly integrates into your pre-existing automation test suite.
- No code changes are required in test cases.
- Requires zero additional maintenance for accessibility testing.
- Understand historical trends and gain test-case insights.

## Get Started with BrowserStack Accessibility Testing

Follow these steps to integrate your WebdriverIO test suites with BrowserStack's Accessibility Testing:

1. Update `@wdio/browserstack-service` npm package.

```bash
npm update @wdio/browserstack-service
```

2. Update `wdio.conf.js` config file.

```javascript
exports.config = {
    //...
    user: ‘<browserstack_username>’ || process.env.BROWSERSTACK_USERNAME,
    key: 'browserstack_access_key> || process.env.BROWSERSTACK_ACCESS_KEY,
    commonCapabilities: {
      'bstack:options': {
        projectName: "Your static project name goes here",
        buildName: "Your static build/job name goes here"
      }
    },
    services: [
      ['browserstack', {
        accessibility: true,
        // Optional configuration options
        accessibilityOptions: {
          'wcagVersion': 'wcag21a',
          'includeIssueType': {
            'bestPractice': false,
            'needsReview': true
          },
          'includeTagsInTestingScope': ['Specify tags of test cases to be included'],
          'excludeTagsInTestingScope': ['Specify tags of test cases to be excluded']
        },
      }]
    ],
    //...
  };
```

You can view detailed instructions [here](https://www.browserstack.com/docs/accessibility/automated-tests/get-started/webdriverio?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation).
