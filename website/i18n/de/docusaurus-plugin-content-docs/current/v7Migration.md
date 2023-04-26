---
id: v7-migration
title: Von v6 bis v7
---

Dieses Tutorial richtet sich an Personen, die noch `v6` von WebdriverIO verwenden und auf `v7` migrieren möchten. Wie in unserem [Release-Blogbeitrag](https://webdriver.io/blog/2021/02/09/webdriverio-v7-released) erwähnt, befinden sich die Änderungen größtenteils unter der Haube, und das Upgrade sollte ein unkomplizierter Prozess sein.

:::info

Wenn Sie WebdriverIO `v5` oder niedriger verwenden, aktualisieren Sie bitte zuerst auf `v6`. Bitte sehen Sie sich unseren [v6-Migrationsleitfaden](v6-migration) an.

:::

Während wir dafür gerne einen vollautomatisierten Prozess hätten, sieht die Realität anders aus. Jeder nutzt WebdriverIO auf eine andere Art und Weise. Dieses Dokument gilt als eine Hilfestellung und weniger als Schritt-für-Schritt-Anleitung. Wenn Sie Probleme mit der Migration haben, zögern Sie nicht, uns [zu kontaktieren](https://github.com/webdriverio/codemod/discussions/new).

## Setup

Ähnlich wie bei anderen Migrationen können wir den WebdriverIO [Codemod](https://github.com/webdriverio/codemod)verwenden. Für dieses Tutorial verwenden wir ein [Boilerplate-Projekt](https://github.com/WarleyGabriel/demo-webdriverio-cucumber), das von einem Community-Mitglied eingereicht wurde, und migrieren es vollständig von `v6` auf `v7`.

Um den Codemod zu installieren, führen Sie Folgendes aus:

```sh
npm install jscodeshift @wdio/codemod
```

#### Commits:

- _install codemod deps_ [[6ec9e52]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/6ec9e52038f7e8cb1221753b67040b0f23a8f61a)

## Aktualisieren Sie WebdriverIO-Abhängigkeiten

Da alle WebdriverIO-Versionen eng beieinander liegen, ist es am besten, immer auf ein bestimmtes Tag zu aktualisieren, z. B. `latest`. Dazu kopieren wir alle WebdriverIO-bezogenen Abhängigkeiten aus unserer `package.json` und installieren sie neu über:

```sh
npm i --save-dev @wdio/allure-reporter@7 @wdio/cli@7 @wdio/cucumber-framework@7 @wdio/local-runner@7 @wdio/spec-reporter@7 @wdio/sync@7 wdio-chromedriver-service@7 wdio-timeline-reporter@7 webdriverio@7
```

Normalerweise sind WebdriverIO-Abhängigkeiten Teil der Dev-Dependencies, je nach Projekt kann dies jedoch variieren. Danach sollte Ihre `package.json` und `package-lock.json` aktualisiert werden. __Hinweis:__ Dies sind die vom Beispielprojekt [verwendeten Abhängigkeiten](https://github.com/WarleyGabriel/demo-webdriverio-cucumber), Ihre können abweichen.

#### Commits:

- _updated dependencies_ [[7097ab6]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/7097ab6297ef9f37ead0a9c2ce9fce8d0765458d)

## Konfigurationsdatei Transformieren

Ein guter erster Schritt ist, mit der Konfigurationsdatei zu beginnen. In WebdriverIO `v7` müssen wir keinen der Compiler mehr manuell registrieren. Diese Einstellungen müssen sogar entfernt werden. Dies kann mit dem Codemod vollautomatisch erfolgen:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v7 ./wdio.conf.js
```

:::caution

Der Codemod unterstützt noch keine TypeScript-Projekte. Siehe [`@webdriverio/codemod#10`](https://github.com/webdriverio/codemod/issues/10). Wir arbeiten daran, die Unterstützung dafür bald zu implementieren. Wenn Sie TypeScript verwenden, ist jede Hilfe gern gesehen!

:::

#### Commits:

- _transpile config file_ [[6015534]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/60155346a386380d8a77ae6d1107483043a43994)

## Schrittdefinitionen Aktualisieren

Wenn Sie Jasmin oder Mocha verwenden, sind Sie hier fertig. Der letzte Schritt besteht darin, die Cucumber.js-Importe von `cucumber` auf `@cucumber/cucumber` zu aktualisieren. Dies kann mit dem Codemod vollautomatisch erfolgen:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v7 ./src/e2e/*
```

Das war's! Keine weiteren Änderungen mehr notwendig 🎉

#### Commits:

- _transpile step definitions_ [[8c97b90]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/8c97b90a8b9197c62dffe4e2954f7dad814753cc)

## Zusammenfassung

Wir hoffen, dass dieses Tutorial Ihnen ein wenig durch den Migrationsprozess zu WebdriverIO `v7` geholfen hat. Die Community verbessert den Codemod weiter und testet ihn mit verschiedenen Teams in verschiedenen Organisationen. Zögern Sie nicht, [ein Problem zu melden,](https://github.com/webdriverio/codemod/issues/new) wenn Sie Feedback haben, oder [eine Diskussion zu beginnen](https://github.com/webdriverio/codemod/discussions/new) wenn Sie während des Migrationsprozesses auf Schwierigkeiten stoßen.
