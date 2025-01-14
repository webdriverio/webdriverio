---
id: browserstack
title: BrowserStack Accessibility Testing
---

# BrowserStack Accessibility Testing

Puede fácilmente integrar las pruebas de accesibilidad de sus suites de pruebas de WebdriverIO utilizando la función de [Pruebas automatizadas de Testeos de Accesibilidad de BrowserStack](https://www.browserstack.com/docs/accessibility/automated-tests?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation).

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
        projectName: "Ingrese el nombre de su proyecto estático aqui",
        buildName: "Ingrese el nombre de su build/job aqui"
      }
    },
    services: [
      ['browserstack', {
        accessibility: true,
        // Opciones de configuración opcionales
        accessibilityOptions: {
          'wcagVersion': 'wcag21a',
          'includeIssueType': {
            'bestPractice': false,
            'needsReview': true
          },
          'includeTagsInTestingScope': ['Especifique las etiquetas de los casos de test a ser incluídos'],
          'excludeTagsInTestingScope': ['Especifique las etiquetas de los casos de test a ser excluídos']
        },
      }]
    ],
    //...
  };
```

You can view detailed instructions [here](https://www.browserstack.com/docs/accessibility/automated-tests/get-started/webdriverio?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation).
