---
id: browserstack
title: BrowserStack Accessibility Testing
---

# BrowserStack Accessibility Testing

You can easily integrate accessibility tests in your WebdriverIO test suites using the Automated tests feature of BrowserStack Accessibility Testing.

## Advantages of Automated Tests in BrowserStack Accessibility Testing

To use Automated tests in BrowserStack Accessibility Testing, your tests should be running on BrowserStack Automate.

The following are the advantages of Automated tests:

- Seamlessly integrates into your pre-existing automation test suite.
- No code changes are required in test cases.
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
      projectName: "Insira aqui o nome fixo do seu projeto",
      buildName: "Insira aqui o nome fixo da sua build/job"
    }
  },
  services: [
    ['browserstack', {
      accessibility: true,
      // Opções de configuração opcionais
      accessibilityOptions: {
        'wcagVersion': 'wcag21a',
        'includeIssueType': {
          'bestPractice': false,
          'needsReview': true
        },
        'includeTagsInTestingScope': ['Especifique as tags dos casos de teste a serem incluídas'],
        'excludeTagsInTestingScope': ['Especifique as tags dos casos de teste a serem excluídas']
      },
    }]
  ],
  //...
};
```

Você pode ver instruções detalhadas aqui.

