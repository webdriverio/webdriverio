---
id: gettingstarted
title: Erste Schritte
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CreateProjectAnimation from '@site/src/pages/components/CreateProjectAnimation.js';

Willkommen auf der WebdriverIO Dokumentation-Seite. Diese wird Ihnen Helfen Ihre WebdriverIO Journey zu starten. Wenn Sie auf Probleme stoßen, finden Sie Hilfe und Antworten auf unserem [Discord Support Server](https://discord.webdriver.io) oder Sie können das Projekt auf [Twitter](https://twitter.com/webdriverio)kontaktieren.

:::info
Dies sind die Dokumentation für die aktuelle Version (__v8.x__) von WebdriverIO. Wenn Sie noch eine ältere Version verwenden, besuchen Sie bitte die [alten Dokumentations-Webseiten](/versions)!
:::

## WebdriverIO Einrichten

Um ein vollständiges WebdriverIO Setup zu einem existierenden oder neuen Projekt hinzuzufügen, verwenden Sie das [WebdriverIO Starter Toolkit](https://www.npmjs.com/package/create-wdio):

Wenn Sie sich im Root-Verzeichnis eines vorhandenen Projekts befinden, führen Sie Folgendes aus:

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio .
```sh
npm init wdio .
```

or if you want to create a new project:

```sh
npm init wdio ./path/to/new/project
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio .
```sh
yarn create wdio .
```

or if you want to create a new project:

```sh
yarn create wdio ./path/to/new/project
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio .
```sh
pnpm create wdio .
```

or if you want to create a new project:

```sh
pnpm create wdio ./path/to/new/project
```

</TabItem>
</Tabs>

Dieser lädt das WebdriverIO-CLI-Tool herunter und führt einen Konfigurationsassistenten aus, der Sie bei der Konfiguration Ihrer Testsuite unterstützt.

<CreateProjectAnimation />

Der Assistent wird eine Reihe von Fragen stellen, die Sie durch das Setup führt. Sie können einen `--yes` Parameter übergeben, um eine Standardeinstellung auszuwählen, die Mocha mit Chrome unter Verwendung des [Page Object](https://martinfowler.com/bliki/PageObject.html) -Musters verwendet.

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio . -- --yes
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio . --yes
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio . --yes
```

</TabItem>
</Tabs>

## Tests Ausführen

Sie können Ihre Testsuite starten, indem Sie den Befehl `run` verwenden und auf die gerade erstellte WebdriverIO-Konfiguration verweisen:

```sh
npx wdio run ./wdio.conf.js
```

Wenn Sie bestimmte Testdateien ausführen möchten, können Sie einen Parameter `--spec` hinzufügen:

```sh
npx wdio run ./wdio.conf.js --spec example.e2e.js
```

oder definieren Sie Suiten in Ihrer Konfigurationsdatei und führen Sie nur die Testdateien aus, die in einer Suite definiert sind:

```sh
npx wdio run ./wdio.conf.js --suite exampleSuiteName
```

## In einem Skript Ausführen

Wenn Sie WebdriverIO als Automatisierungs-Engine im [Standalone-Modus](/docs/setuptypes#standalone-mode) innerhalb eines Node.JS-Skripts verwenden möchten, können Sie WebdriverIO auch direkt installieren und als Paket verwenden, um beispielsweise einen einer Website zu erstellen:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fc362f2f8dd823d294b9bb5f92bd5991339d4591/getting-started/run-in-script.js#L2-L19
```

__Hinweis:__ Alle WebdriverIO-Befehle sind asynchron und müssen ordnungsgemäß mit [`async/await`](https://javascript.info/async-await) ausgeführt werden.

## Tests Aufzeichnen

WebdriverIO bietet Tools an, die Ihnen den Einstieg erleichtern, indem Sie Ihre Testaktionen auf dem Bildschirm aufzeichnen und automatisch in WebdriverIO-Testskripte umwandeln. Weitere Informationen finden Sie unter [Recorder-Tests mit Chrome DevTools Recorder](/docs/record).

## Systemanforderungen

Sie müssen [Node.js](http://nodejs.org) installiert haben.

- Installieren Sie mindestens v16.x oder höher, da dies die älteste aktive LTS-Version ist
- Nur Releases, die als LTS-Releases markiert sind, werden offiziell unterstützt

Wenn Sie Node.js noch nicht auf Ihrem System installiert haben, empfehlen wir die Verwendung eines Tools wie [NVM](https://github.com/creationix/nvm) oder [Volta](https://volta.sh/) , um die Verwaltung mehrerer aktiver Node.js-Versionen zu unterstützen. NVM ist eine beliebte Wahl, während Volta auch eine gute Alternative ist.
