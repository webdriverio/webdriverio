---
id: autocompletion
title: Autouzupełnianie
---

Jeśli piszesz kod od jakiegoś czasu, to prawdopodobnie lubisz autouzupełnianie. Autouzupełnianie jest dostępne w wielu edytorach kodów. Jednakże jeśli autouzupełnianie jest wymagane dla pakietów, które nie są zainstalowane w standardowej lokacji albo gdy są wykluczone z indeksowania z jakiś powodów, to wtedy można dodać je przez zmiany konfiguracji.

![Autocompletion](/img/autocompletion/0.png)

Kod jest udokumentowany za pomocą [JSDoców](http://usejsdoc.org/). Pomaga to zobaczyć więcej szczegółów na temat parametrów i ich typów.

![Autocompletion](/img/autocompletion/1.png)

Użyj standardowych skrótów *⇧ + ⌥ + SPACE* na platformie IntelliJ, aby zobaczyć dostępną dokumentację:

![Autocompletion](/img/autocompletion/2.png)

Rozważmy więc przykłady dodania autouzupełniania do edytorów kodu w platformach IntelliJ takich, jak WebStorm.

### Moduły Node.js Core jako biblioteka zewnętrzna

Otwórz *Settings -> Preferences -> Languages & Frameworks -> JavaScript -> Libraries*

![Autocompletion](/img/autocompletion/3.png)

Dodaj nową bibliotekę

![Autocompletion](/img/autocompletion/4.png)

Dodaj katalog z komendami WebdriverIO

![Autocompletion](/img/autocompletion/5.png) ![Autocompletion](/img/autocompletion/6.png) ![Autocompletion](/img/autocompletion/7.png)

Wprowadź adres URL dokumentacji

![Autocompletion](/img/autocompletion/8.png) ![Autocompletion](/img/autocompletion/9.png) ![Autocompletion](/img/autocompletion/10.png)

### Używanie stubów społeczności TypeScript (pliki definicji TypeScript)

WebStorm pozwala na jeszcze jedną metodę dodawania pomocy kodowania. Pozwala na pobranie stubów [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped).

![Autocompletion](/img/autocompletion/11.png) ![Autocompletion](/img/autocompletion/12.png)