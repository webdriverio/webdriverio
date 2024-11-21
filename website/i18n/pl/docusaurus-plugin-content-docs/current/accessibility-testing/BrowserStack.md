---
id: browserstack
title: Testy Dostępności z BrowserStack
---

# Testy Dostępności BrowserStack

Możesz łatwo zintegrować testy dostępności w zestawach testowych WebdriverIO za pomocą [funkcji zautomatyzowanych testów w ramach Testów Dostępności BrowserStack](https://www.browserstack.com/docs/accessibility/automated-tests?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation).

## Zalety zautomatyzowanych testów w Testach Dostępności BrowserStack

Aby skorzystać ze zautomatyzowanych testów w Testach Dostępności BrowserStack, twoje testy powinny być uruchomione na BrowserStack Automate.

Zalety zautomatyzowanych testów:

- Bezproblemowo integruje się z istniejącym wcześniej zestawem zautomatyzowanych testów.
- Nie trzeba wprowadzać żadnych zmian w kodzie przypadków testowych.
- Requires zero additional maintenance for accessibility testing.
- Understand historical trends and gain test-case insights.

## Get Started with BrowserStack Accessibility Testing

Follow these steps to integrate your WebdriverIO test suites with BrowserStack's Accessibility Testing:

1. Install `@wdio/browserstack-service` npm package.

```bash npm2yarn
npm install --save-dev @wdio/browserstack-service
```

2. Update `wdio.conf.js` config file.

```javascript
exports.config = {
    //...
    user: '<browserstack_username>' || process.env.BROWSERSTACK_USERNAME,
    key: '<browserstack_access_key>' || process.env.BROWSERSTACK_ACCESS_KEY,
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
