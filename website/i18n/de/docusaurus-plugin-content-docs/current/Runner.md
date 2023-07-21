---
id: runner
title: Runner
---

import CodeBlock from '@theme/CodeBlock';

Ein Runner in WebdriverIO orchestriert, wie und wo Tests ausgeführt werden, wenn der Testrunner verwendet wird. WebdriverIO unterstützt derzeit zwei verschiedene Arten von Runner: Local und Browser Runner.

## Local Runner

Der [Local Runner](https://www.npmjs.com/package/@wdio/local-runner) initiiert Ihr Framework (z. B. Mocha, Jasmine oder Cucumber) innerhalb eines Worker-Prozesses und führt alle Ihre Testdateien in Ihrer Node.js-Umgebung aus. Jede Testdatei wird in einem separaten Arbeitsprozess pro Funktion ausgeführt, was eine maximale Parallelität ermöglicht. Jeder Arbeitsprozess verwendet eine einzelne Browserinstanz und führt daher seine eigene Browsersitzung aus, was eine maximale Isolierung ermöglicht.

Da jeder Test in einem eigenen isolierten Prozess ausgeführt wird, ist es nicht möglich, Daten über Testdateien hinweg gemeinsam zu nutzen. Es gibt zwei Möglichkeiten, dies zu umgehen:

- Verwenden Sie [`@wdio/shared-store-service`](https://www.npmjs.com/package/@wdio/shared-store-service), um Daten für die isolierten Prozesse zugänglich zu machen
- Gruppieren Sie Ihre Test-Dateien (mehr dazu in [Test Suites Organisieren](https://webdriver.io/docs/organizingsuites#grouping-test-specs-to-run-sequentially))

Wenn nichts anderes in wdio.conf.js `definiert ist` ist der Local Runner der Standard-Runner in WebdriverIO.

### Installation

Um den Local Runner zu verwenden, können Sie ihn installieren über:

```sh
npm install --save-dev @wdio/local-runner
```

### Einrichten

Der Local Runner ist der Standard-Runner in WebdriverIO, daher muss er nicht in Ihrer `wdio.conf.js`definiert werden. Wenn Sie es explizit festlegen möchten, können Sie es wie folgt definieren:

```js
// wdio.conf.js
export const {
    // ...
    runner: 'local',
    // ...
}
```

## Browser-Runner

Im Gegensatz zum [Local Runner](https://www.npmjs.com/package/@wdio/local-runner) initiiert der [Browser Runner](https://www.npmjs.com/package/@wdio/browser-runner) das Framework innerhalb des Browsers und führt es dort aus. Auf diese Weise können Sie Unit- oder Komponententests in einem echten Browser ausführen und nicht wie viele andere Testframeworks im JSDOM.

Während [JSDOM](https://www.npmjs.com/package/jsdom) für Testzwecke weit verbreitet ist, ist es letztendlich weder ein echter Browser, noch können Sie damit mobile Umgebungen emulieren. Mit diesem Runner ermöglicht Ihnen WebdriverIO, Ihre Tests einfach im Browser auszuführen und WebDriver-Befehle zu verwenden, um mit Elementen zu interagieren, die auf der Seite gerendert werden.

Hier ist eine Übersicht, wie unterschiedlich Tests innerhalb von JSDOM vs. WebdriverIOs Browser Runner verhalten:

|    | JSDOM                                                                                                                                                                         | WebdriverIO Browser Runner                                                                                         |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1. | Führt Ihre Tests in Node.js unter Verwendung einer Neuimplementierung von Webstandards aus, insbesondere der WHATWG DOM- und HTML-Standards                                   | Führt Ihren Test in einem echten Browser aus und führt den Code in einer Umgebung aus, die Ihre Benutzer verwenden |
| 2. | Interaktionen mit Komponenten können nur über JavaScript nachgeahmt werden                                                                                                    | Sie können die [WebdriverIO-API](api) verwenden, um mit Elementen über das WebDriver-Protokoll zu interagieren     |
| 3. | Canvas-Unterstützung erfordert [zusätzliche Abhängigkeiten](https://www.npmjs.com/package/canvas) und [hat Einschränkungen](https://github.com/Automattic/node-canvas/issues) | Sie haben Zugriff auf die echte [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)          |
| 4. | JSDOM hat einige [Einschränkungen](https://github.com/jsdom/jsdom#caveats) und nicht unterstützte Web-APIs                                                                    | Alle Web-APIs werden sind im Browser unterstützt                                                                   |
| 5. | Browserübergreifende Fehler können nicht erkannt werden                                                                                                                       | Unterstützung für Cross-Browser-Tests, einschließlich mobiler Browser                                              |
| 6. | Kann __nicht__ auf Pseudozustände von Elementen testen                                                                                                                        | Unterstützung für Pseudozustände wie `:hover` oder `:active`                                                       |

Dieser Runner verwendet [Vite](https://vitejs.dev/) , um Ihren Testcode zu kompilieren und im Browser zu laden. Es enthält Voreinstellungen für die folgenden Komponenten-Frameworks:

- React
- Preact
- Vue.js
- Svelte
- SolidJS

Jede Testdatei / Testdateigruppe wird innerhalb einer einzelnen Seite ausgeführt, was bedeutet, dass die Seite zwischen jedem Test neu geladen wird, um die Isolation zwischen den Tests zu gewährleisten.

### Installation

Um den Browser Runner zu verwenden, können Sie ihn installieren über:

```sh
npm install --save-dev @wdio/browser-runner
```

### Einrichten

Um den Browser-Runner zu verwenden, müssen Sie in Ihrer Datei `wdio.conf.js` eine Eigenschaft `runner` definieren, z.B.:

```js
// wdio.conf.js
export const {
    // ...
    runner: 'local',
    // ...
}
    runner: 'browser',
    // ...
}
```

### Runner-Optionen

Der Browser-Runner erlaubt folgende Konfigurationen:

#### `preset`

Wenn Sie Komponenten mit einem der oben genannten Frameworks testen, können Sie eine Voreinstellung definieren, die sicherstellt, dass alles sofort konfiguriert ist.

__Type:__ `vue` | `svelte` | `solid` | `react` | `preact`<br /> __Example:__

```js title="wdio.conf.js"
export const {
    // ...
    runner: ['browser', {
        preset: 'svelte'
    }],
    // ...
}
    runner: ['browser', {
        preset: 'svelte'
    }],
    // ...
}
```

#### `viteConfig`

Definieren Sie Ihre eigene [Vite-Konfiguration](https://vitejs.dev/config/). Sie können entweder ein benutzerdefiniertes Objekt übergeben oder eine vorhandene Datei `vite.conf.ts` importieren, wenn Sie Vite.js für Ihre Entwicklungsumgebung verwenden. Beachten Sie, dass WebdriverIO benutzerdefinierte Vite-Konfigurationen beibehält, um die Testumgebung einzurichten.

__Type:__ `string` or [`UserConfig`](https://github.com/vitejs/vite/blob/52e64eb43287d241f3fd547c332e16bd9e301e95/packages/vite/src/node/config.ts#L119-L272) or `(env: ConfigEnv) => UserConfig | Promise<UserConfig>`<br /> __Example:__

```js title="wdio.conf.ts"
import viteConfig from '../vite.config.ts'

export const {
    // ...
    runner: ['browser', { viteConfig }],
    // or just:
    runner: ['browser', { viteConfig: '../vites.config.ts' }],
    // or use a function if your vite config contains a lot of plugins
    // which you only want to resolve when value is read
    runner: ['browser', {
        viteConfig: () => ({
            // ...
        })
    }],
    // ...
}
```

#### `headless`

Wenn auf `true` gesetzt, aktualisiert der Runner die Fähigkeiten, um Tests Headless auszuführen. Standardmäßig ist dies in CI-Umgebungen aktiviert, in denen eine Umgebungsvariable wie `CI` auf `'1'` oder `'true'`gesetzt ist.

__Type:__ `boolean`<br /> __Default:__ `false`, set to `true` if `CI` environment variable is set

#### `rootDir`

Hauptverzeichnis des Projekts.

__Type:__ `string`<br /> __Default:__ `process.cwd()`

#### `coverage`

WebdriverIO unterstützt Testabdeckungsberichte über [`istanbul`](https://istanbul.js.org/). Weitere Einzelheiten finden Sie unter [Coverage Optionen](#coverage-options).

__Type:__ `object`<br /> __Default:__ `undefined`

### Coverage Optionen

Mit den folgenden Optionen können Sie die Coverage-Reports konfigurieren.

#### `enabled`

Aktiviert das Erstellen von Coverage-Reports.

__Type:__ `boolean`<br /> __Default:__ `false`

#### `include`

Liste der Dateien als Glob-Muster definiert, die in der Abdeckung enthalten sind.

__Type:__ `string[]`<br /> __Default:__ `[**]`

#### `exclude`

Liste der Dateien als Glob-Muster definiert, die in der Abdeckung ausgeschlossen sind.

__Type:__ `string[]`<br /> __Default:__

```
[
  'coverage/**',
  'dist/**',
  'packages/*/test{,s}/**',
  '**/*.d.ts',
  'cypress/**',
  'test{,s}/**',
  'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
  '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
  '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
  '**/__tests__/**',
  '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
  '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
]
```

#### `extension`

Liste der Dateierweiterungen, die der Bericht einbeziehen sollte.

__Type:__ `string | string[]`<br /> __Default:__ `['.js', '.cjs', '.mjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '.vue', '.svelte']`

#### `reportsDirectory`

Verzeichnis, in das der Abdeckungsbericht geschrieben werden soll.

__Type:__ `string`<br /> __Default:__ `./coverage`

#### `reporter`

Liste der zu erstellenden Reports. Siehe [istanbul Dokumentation](https://istanbul.js.org/docs/advanced/alternative-reporters/) für eine detaillierte Liste aller Reporter.

__Type:__ `string[]`<br /> __Default:__ `['text', 'html', 'clover', 'json-summary']`

#### `perFile`

Überprüfen Sie die Schwellenwerte pro Datei. Siehe `lines`, `functions`, `branches` und `statements` für die tatsächlichen Schwellenwerte.

__Type:__ `boolean`<br /> __Default:__ `false`

#### `clean`

Bereinigen Sie die Abdeckungsergebnisse, bevor Sie Tests durchführen.

__Type:__ `boolean`<br /> __Default:__ `true`

#### `lines`

Schwelle für Linien.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `functions`

Schwellenwert für Funktionen.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `branches`

Schwellenwert für Zweige.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `statements`

Schwellenwert für Anweisungen.

__Type:__ `number`<br /> __Default:__ `undefined`

### Einschränkungen

Bei Verwendung des Browser-Runners ist zu beachten, dass Dialoge zum Blockieren von Threads wie `alert` oder `confirm` nicht nativ verwendet werden können. Dies liegt daran, dass sie die Webseite blockieren, was bedeutet, dass WebdriverIO nicht weiter mit der Seite kommunizieren kann, wodurch die Ausführung hängen bleibt.

In solchen Situationen stellt WebdriverIO Standard-Mocks mit standardmäßig zurückgegebenen Werten für diese APIs bereit. Dadurch wird sichergestellt, dass die Ausführung nicht hängen bleibt, wenn der Benutzer versehentlich synchrone Popup-Web-APIs verwendet. Es wird dem Benutzer jedoch dennoch empfohlen, diese Web-APIs für eine bessere Erfahrung zu simulieren. Lesen Sie mehr in [Mocking](/docs/component-testing/mocking).

### Beispiele

Schauen Sie sich unbedingt die Dokumentation zu [Komponententests](https://webdriver.io/docs/component-testing) an und werfen Sie einen Blick in das [Beispiel-Repository](https://github.com/webdriverio/component-testing-examples), die diese und verschiedene andere Frameworks verwenden.

