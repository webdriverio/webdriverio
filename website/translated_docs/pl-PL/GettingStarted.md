---
id: gettingstarted
title: Pierwsze kroki
---

Witamy w dokumentacji do WebdriverIO. Pomoże ci ona szybko zapoznać się i zacząć. W razie kłopotów poproś o pomoc na naszym [Kanale Gitter](https://gitter.im/webdriverio/webdriverio) lub kontaktuj się ze mną na [Twitterze](https://twitter.com/webdriverio). Ponadto, jeśli napotkasz problemy z uruchomieniem serwera lub uruchomieniem testów po tym samouczku, upewnij się, że serwer i geckodriver są wymienione w katalogu projektu. Jeśli nie, to ponownie je pobierz, zgodnie z 2 i 3 krokiem w instrukcji poniżej.

> **Uwaga:** To jest dokumentacja dla najnowszej wersji (v5.0.0) WebdriverIO. Jeśli nadal używasz wersji v4 lub starszej, użyj starej dokumentacji dostepnej tutaj [v4.webdriver.io](http://v4.webdriver.io)!

Instrukcje poniżej pomogą Ci krok po kroku uruchomić Twój pierwszy skrypt WebdriverIO.

## Pierwsze kroki

Załóżmy, że masz już zainstalowany [Node.js](http://nodejs.org/). Najpierw musimy pobrać sterownik przeglądarki, który pomoże nam zautomatyzować przeglądarkę. Aby to zrobić, najpierw tworzymy przykładowy folder:

### Utwórz prosty folder testowy

```sh
$ mkdir webdriverio-test && cd test webdriverio
```

*Wciąż w tym folderze testowym:*

### Pobierz Geckodriver

Pobierz najnowszą wersję geckodriver dla swojego środowiska i rozpakuj ją w katalogu projektu:

Linux 64 bitowy

```sh
$ curl -L https://github.com/mozilla/geckodriver/releases/download/v0.21.0/geckodriver-v0.21.0-linux64.tar.gz | tar xz
```

OSX

```sh
$ curl -L https://github.com/mozilla/geckodriver/releases/download/v0.21.0/geckodriver-v0.21.0-macos.tar.gz | tar xz
```

Uwaga: Inne wersje geckodrivera są dostępne [tutaj](https://github.com/mozilla/geckodriver/releases). Aby zautomatyzować inną przeglądarkę, musisz używać innych, dedykowanych sterowników. Możesz znaleźć listę ze wszystkimi sterownikami w pliku readme [awesome-selenium](https://github.com/christian-bromann/awesome-selenium#driver).

### Uruchom Sterownik Przeglądarki

Uruchom Geckodriver za pomocą komendy:

```sh
$ /path/to/binary/geckodriver --port 4444
```

To uruchomi Geckodrivera na `localhost:4444` z punktem końcowym (endpoint) WebDrivera ustawionym na `/`. Pozostaw to uruchomione w tle i otwórz nowe okno terminalu. Następnym krokiem jest pobranie WebdriverIO przez NPM:

### Pobierz WebdriverIO

Przez wywołanie:

```sh
$ npm install webdriverio
```

### Utwórz plik testowy

Utwórz plik testowy (np. `test.js`) o następującej treści:

```js
const { remote } = require('webdriverio');

(async () => {
    const browser = await remote({
        logLevel: 'error',
        path: '/',
        capabilities: {
            browserName: 'firefox'
        }
    });

    await browser.url('http://webdriver.io');

    const title = await browser.getTitle();
    console.log('Title was: ' + title);

    await browser.deleteSession();
})().catch((e) => console.error(e));
```

### Uruchom plik testowy

Upewnij się, że masz zainstalowany co najmniej Node.js v8.11.2 lub nowszy. Aby zaktualizować aktualną wersję Node.js zainstaluj [nvm](https://github.com/creationix/nvm) i postępuj zgodnie z ich instrukcjami. Po wykonaniu tych kroków uruchom skrypt testowy przez wywołanie:

```sh
$ node test.js
```

w konsoli powinna się pojawić taka wiadomość:

```sh
Title was: WebdriverIO · Next-gen WebDriver test framework for Node.js
```

Gratulacje! Właśnie udało Ci się uruchomić Twój pierwszy automatyczny skrypt z WebdriverIO. Teraz wejdźmy na wyższy bieg i stwórzmy pierwszy prawdziwy test.

## Przejdźmy do konkretów

*(Powróć do katalogu źródłowego projektu)*

To była tylko rozgrzewka. Przejdźmy dalej i uruchommy WebdriverIO z testrunnerem. Jeśli chcesz używać WebdriverIO w swoim projekcie do testów integracyjnych, to zalecamy używanie testrunnera, ponieważ posiada on wiele przydatnych funkcji, które ułatwiają Twoje życie. Z wersją WebdriverIO v5 i wyższymi testrunner został przeniesiony do paczki NPM [`@wdio/cli`](https://www.npmjs.com/package/@wdio/cli). Aby rozpocząć, musimy najpierw zainstalować to:

```sh
$ npm i --save-dev @wdio/cli
```

### Generowanie Pliku Konfiguracyjnego

Aby to zrobić, użyj narzędzia konfiguracji:

```sh
$ ./node_modules/.bin/wdio config
```

Pojawi się kwestionariusz. Pomoże to w łatwym i szybkim tworzeniu konfiguracji. Jeśli nie wiesz, jak odpowiedzieć, to odpowiedz jak w krokach poniżej:

__Q: Where should your tests be launched?__ || Gdzie powinny uruchamiać się Twoje testy?  
A: *local_ || lokalnie  
<br /> __Q: Shall I install the runner plugin for you?__ || Czy powinienem zainstalować wtyczkę testrunnera dla Ciebie?  
A: _Yes_ || Tak  
<br /> __Q: Where do you want to execute your tests?__ || Gdzie chcesz uruchamiać swoje testy?  
A: _On my local machine_ || Na swojej lokalnej maszynie  
<br /> __Q: Which framework do you want to use?__ || Którego frameworka chcesz używać?  
A: _mocha_ || mocha  
<br /> __Q: Shall I install the framework adapter for you?__ || Czy mam zainstalować adapter tego frameworka dla Ciebie?  
A: _Yes* (just press enter) || Tak (po prostu naciśnij enter)  
<br /> __Q: Do you want to run WebdriverIO commands synchronous or asynchronous?__ || Czy chcesz uruchamiać komendy WebdriverIO synchronicznie czy asynchronicznie?  
A: *sync* (just press enter, you can also run commands async and handle promises by yourself but for the sake of simplicity let's run them synchronously) || synchronicznie (po prostu nacisnij enter. Dodatkowo możesz uruchamiać komendy asynchroniczne i rozwiązywać promisy własnoręcznie, ale dla uproszczenia uruchommy je synchronicznie)   
<br /> __Q: Where are your test specs located?__ || Gdzie znajdują się Twoje pliki testowe?  
A: *./test/specs/**/*.js* (Po prostu naciśnij enter)  
<br /> __Q: Which reporter do you want to use?__ || Jakiego narzędzia do raportowania chcesz używać?  
A: *dot* (po prostu naciśnij spację, by zaznaczyć a następnie enter)  
<br /> __Q: Shall I install the reporter library for you?__ || Czy mam dla Ciebie zainstalować bibliotekę narzędzia do raportowania?  
A: *Yes* (just press enter) || Tak (po prostu naciśnij enter)  
<br /> __Q: Do you want to add a service to your test setup?__ || Czy chcesz dodać jakieś serwisy do Twojego środowiska testowego?  
A: none (just press enter, let's skip this for simplicity) || Żadne (po prostu naciśnij enter; pomińmy to dla ułatwienia)  
<br /> __Q: Level of logging verbosity:__ || Szczegółowość wiadomości w konsoli  
A: *trace* (po prostu naciśnij enter)  
<br /> __Q: In which directory should screenshots gets saved if a command fails?__ || W jakiej lokacji powinny zapisywać się zrzuty ekranu, gdy komenda napotka błąd?  
A: *./errorShots/* (po prostu naciśnij enter)  
<br /> __Q: What is the base url?__ || Jaki jest bazowy adres?  
A: *http://localhost* (po prostu naciśnij enter)  


To tyle! Konfigurator instaluje teraz wszystkie wymagane pakiety i tworzy plik konfiguracyjny o nazwie `wdio.conf.js`. Następnym krokiem jest utworzenie pierwszego pliku specyfikacji (plik testowy).

### Utwórz Pliki Specyfikacji

W tym celu utwórz folder testowy w taki sposób:

```sh
$ mkdir -p ./test/specs
```

Teraz utwórzmy prosty plik specyfikacji w tym nowym folderze:

```js
const assert = require('assert');

describe('webdriver.io page', () => {
    it('should have the right title', () => {
        browser.url('http://webdriver.io');
        const title = browser.getTitle();
        assert.equal(title, 'WebdriverIO - WebDriver bindings for Node.js');
    });
});
```

### Uruchommy Testrunnera

Ostatnim krokiem jest uruchomienie testrunnera. Aby to zrobić, wystarczyć:

```sh
$ ./node_modules/.bin/wdio wdio.conf.js
```

Hurra! Test powinien przejść. Gdy tak się stanie, możesz rozpocząć pisanie testów integracyjnych wraz z WebdriverIO. Jeśli interesują Cię bardziej szczegółowe poradniki, możesz sprawdzić nasz własny kurs o nazwie [learn.webdriver.io](https://learn.webdriver.io/?coupon=wdio). Również nasza społeczność stworzyła sporo [gotowców](BoilerplateProjects.md), które mogą pomóc Ci zacząć.