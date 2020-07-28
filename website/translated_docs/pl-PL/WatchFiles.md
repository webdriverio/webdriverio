---
id: watcher
title: Obserwuj Pliki Testowe
---

Dzięki testrunnerowi WDIO możesz obserwować pliki podczas pracy nad nimi. Automatycznie uruchamiają się one ponownie, jeśli zmienisz coś w swojej aplikacji lub w plikach testowych. Dodając flagę `--watch` podczas wywoływania polecenia `wdio`, testrunner będzie czekał na zmiany pliku, po wykonaniu wszystkich testów, np.

```sh
$ wdio wdio.conf.js --watch
```

Domyślnie obserwuje to tylko zmiany wykonane w plikach `specs`. Jednak poprzez ustawienie właściwości `filesToWatch` w twoim `wdio.conf. s`,który zawiera listę ścieżek plików (glob jest wspierany), będzie on również obserwował zmiany tych plików w celu ponownego uruchomienia całego zestawu testów. Jest to przydatne, jeśli chcesz automatycznie uruchomić wszystkie testy, jeśli zmieniłeś kod aplikacji, np.

```js
// wdio.conf.js
export.config = {
    // ...
    filesToWatch: [
        // obserwuj wszystkie pliki JS w mojej aplikacji
        './src/app/**/*.js'
    ],
    // ...
}
```

**Uwaga:** upewnij się, że uruchamiasz jak najwięcej testów równolegle. Testy E2E są z natury powolne i ich ponowne uruchamianie jest przydatne tylko wtedy, gdy wykonanie pojedynczego testu jest krótkie. Aby zaoszczędzić czas, testrunner utrzymuje sesje WebDrivera przy życiu, podczas oczekiwania na zmiany w plikach. Upewnij się, że Twój backend WebDrivera może zostać zmodyfikowany tak, aby nie zamknął automatycznie sesji, jeśli po pewnym czasie nie zostało wykonane żadne polecenie.