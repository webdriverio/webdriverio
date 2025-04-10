---
id: browserstack
title: BrowserStack Accessibility Testing
---

# BrowserStack Accessibility Testing

Sie können Barrierefreiheitstests ganz einfach in Ihre WebdriverIO-Testsuiten integrieren, indem Sie die [Funktion für automatisierte Tests von BrowserStack Accessibility Testing](https://www.browserstack.com/docs/accessibility/automated-tests?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation) verwenden.

## Vorteile von automatisierten Tests in BrowserStack Accessibility Testing

Um automatisierte Tests in BrowserStack Accessibility Testing zu verwenden, sollten Ihre Tests auf BrowserStack Automate ausgeführt werden.

Die folgenden Vorteile bieten automatisierte Tests:

- Nahtlose Integration in Ihre bestehende Automatisierungs-Testsuite.
- Keine Codeänderungen in Testfällen erforderlich.
- Kein zusätzlicher Wartungsaufwand für Barrierefreiheitstests.
- Verständnis historischer Trends und Einblicke in Testfälle.

## Erste Schritte mit BrowserStack Accessibility Testing

Befolgen Sie diese Schritte, um Ihre WebdriverIO-Testsuiten mit BrowserStack's Accessibility Testing zu integrieren:

1. Aktualisieren Sie das `@wdio/browserstack-service` npm-Paket.

```bash
npm update @wdio/browserstack-service
```

2. Aktualisieren Sie die `wdio.conf.js` Konfigurationsdatei.

```javascript
exports.config = {
    //...
    user: '<browserstack_username>' || process.env.BROWSERSTACK_USERNAME,
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
        // Optionale Konfigurationsoptionen
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

Detaillierte Anweisungen finden Sie [hier](https://www.browserstack.com/docs/accessibility/automated-tests/get-started/webdriverio?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation).
