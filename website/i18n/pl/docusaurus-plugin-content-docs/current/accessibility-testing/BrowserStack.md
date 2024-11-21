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
- Brak wymogu dodatkowej konserwacji dla testów dostępności.
- Zrozum historyczne tendencje i dowiedz się więcej na temat przypadków testowych.

## Jak zacząć z Testami Dostępności BrowserStack?

Żeby zintegrować zestawy testowe WebdriverIO z Testami Dostępności BrowserStack wykonaj następujące czynności:

1. Zainstaluj pakiet npm `@wdio/browserstack-service`.

```bash npm2yarn
npm install --save-dev @wdio/browserstack-service
```

2. Aktualizuj plik konfiguracyjny `wdio.conf.js`.

```javascript
exports.config = {
    //...
    user: '<browserstack_username>' || proces. nv.BROWSERSTACK_USERNAME,
    key: '<browserstack_access_key>' || process.env. LOCAL_LABEL
    commonCapabilities: {
      'bstack:options': {
        projectName: "Statyczna nazwa Twojego projektu",
        buildName: "Statyczna nazwa Twojego buildu/joba"
      }
    },
    services: [
      ['browserstack', {
        accessibility: true,
        // Nieobowiązkowe opcje konfiguracji
        accessibilityOptions: {
          'wcagVersion': 'wcag21a',
          'includeIssueType': {
            'bestPractice': false,
            'needsReview': true
          },
          'includeTagsInTestingScope': ['Tagi przypadków testowych, które należy uwzględnić'],
          'excludeTagsInTestingScope': ['Tagi przypadków testowych, które należy pominąć']
        },
      }]
    ],
    //. .
};
```

Dokładniejsze instrukcje [tutaj](https://www.browserstack.com/docs/accessibility/automated-tests/get-started/webdriverio?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation).
