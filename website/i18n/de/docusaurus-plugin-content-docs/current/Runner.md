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

### Runner Options

The Browser runner allows following configurations:

#### `preset`

If you test components using one of the mentioned frameworks above, you can define a preset that ensures everything is configured out of the box. This option can't be used together with `viteConfig`.

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

Define your own [Vite configuration](https://vitejs.dev/config/). You can either pass in a custom object or import an existing `vite.conf.ts` file if you use Vite.js for development. Note that WebdriverIO keeps custom Vite configurations to set up the test harness.

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

If set to `true` the runner will update capabilities to run tests headless. By default this is enabled within CI environments where a `CI` environment variable is set to `'1'` or `'true'`.

__Type:__ `boolean`<br /> __Default:__ `false`, set to `true` if `CI` environment variable is set

#### `rootDir`

Project root directory.

__Type:__ `string`<br /> __Default:__ `process.cwd()`

#### `coverage`

WebdriverIO supports test coverage reporting through [`istanbul`](https://istanbul.js.org/). See [Coverage Options](#coverage-options) for more details.

__Type:__ `object`<br /> __Default:__ `undefined`

### Coverage Options

The following options allow to configure coverage reporting.

#### `enabled`

Enables coverage collection.

__Type:__ `boolean`<br /> __Default:__ `false`

#### `include`

List of files included in coverage as glob patterns.

__Type:__ `string[]`<br /> __Default:__ `[**]`

#### `exclude`

List of files excluded in coverage as glob patterns.

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

List of file extensions the report should include.

__Type:__ `string | string[]`<br /> __Default:__ `['.js', '.cjs', '.mjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '.vue', '.svelte']`

#### `reportsDirectory`

Directory to write coverage report to.

__Type:__ `string`<br /> __Default:__ `./coverage`

#### `reporter`

Coverage reporters to use. See [istanbul documentation](https://istanbul.js.org/docs/advanced/alternative-reporters/) for detailed list of all reporters.

__Type:__ `string[]`<br /> __Default:__ `['text', 'html', 'clover', 'json-summary']`

#### `perFile`

Check thresholds per file. See `lines`, `functions`, `branches` and `statements` for the actual thresholds.

__Type:__ `boolean`<br /> __Default:__ `false`

#### `clean`

Clean coverage results before running tests.

__Type:__ `boolean`<br /> __Default:__ `true`

#### `lines`

Threshold for lines.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `functions`

Threshold for functions.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `branches`

Threshold for branches.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `statements`

Threshold for statements.

__Type:__ `number`<br /> __Default:__ `undefined`

### Limitations

When using the WebdriverIO browser runner, it's important to note that thread blocking dialogs like `alert` or `confirm` cannot be used natively. This is because they block the web page, which means WebdriverIO cannot continue communicating with the page, causing the execution to hang.

In such situations, WebdriverIO provides default mocks with default returned values for these APIs. This ensures that if the user accidentally uses synchronous popup web APIs, the execution would not hang. However, it's still recommended for the user to mock these web APIs for better experience. Read more in [Mocking](/docs/component-testing/mocking).

### Examples

Make sure to check out the docs around [component testing](https://webdriver.io/docs/component-testing) and have a look into the [example repository](https://github.com/webdriverio/component-testing-examples) for examples using these and various other frameworks.

