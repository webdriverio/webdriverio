---
id: globals
title: Obiekty globalne
---

W plikach testowych WebdriverIO umieszcza każdą z tych metod i obiektów w środowisku globalnym. Nie musisz niczego importować, aby z nich korzystać. Jeśli jednak wolisz jawne importowanie, możesz wykorzystać `import { browser, $, $$, expect } from „@wdio/globals”` oraz ustawić `injectGlobals: false` w konfiguracji WDIO.

Obiekty globalne mają następujące wartości, jeśli nie skonfigurowano ich inaczej:

- `browser`: [Obiekt przeglądarki](https://webdriver.io/docs/api/browser) WebdriverIO
- `driver`: alias `przeglądarki` (używany podczas uruchamiania testów mobilnych)
- `multiremotebrowser`: alias `przeglądarki` lub `sterownika` ale ustawiony tylko w ramach [sesji Multiremote](/docs/multiremote)
- `$`: polecenie pobrania elementu (zobacz więcej w [dokumentacji API](/docs/api/browser/$))
- `$`: polecenie pobrania elementów (zobacz więcej w [dokumentacji API](/docs/api/browser/$$))
- `expect`: framework asercji dla WebdriverIO (zobacz [dokumentację API](/docs/api/expect-webdriverio))

__Uwaga:__ WebdriverIO nie ma kontroli nad wykorzystywanymi frameworkami (np. Mocha lub Jasmine) ustawiającymi zmienne globalne podczas ładowania ich środowiska.
