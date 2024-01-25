---
id: typescript
title: TypeScript-Setup
---

Sie können Tests mit [TypeScript](http://www.typescriptlang.org) schreiben, um eine automatische Vervollständigung und Typsicherheit zu erhalten.

Sie müssen dazu [`typescript`](https://github.com/microsoft/TypeScript) und [`ts-node`](https://github.com/TypeStrong/ts-node) als `devDependencies` installieren, via:

```bash npm2yarn
$ npm install typescript ts-node --save-dev
```

WebdriverIO erkennt automatisch, ob diese Abhängigkeiten installiert sind, und kompiliert Ihre Konfiguration und Tests für Sie. Stellen Sie sicher, dass sich eine `tsconfig.json` im selben Verzeichnis wie Ihre WDIO-Konfiguration befindet. If you need to configure how ts-node runs please use the environment variables for [ts-node](https://www.npmjs.com/package/ts-node#options) or use wdio config's [autoCompileOpts section](/docs/configurationfile).

## Konfiguration

You can provide custom `ts-node` options through the environment (by default it uses the tsconfig.json in the root relative to your wdio config if the file exists):

```sh
# run wdio testrunner with custom options
TS_NODE_PROJECT=./config/tsconfig.e2e.json TS_NODE_TYPE_CHECK=true wdio run wdio.conf.ts
```

Die minimale TypeScript-Version ist `v4.0.5`.

## Framework-Setup

Ihre `tsconfig.json` benötigt Folgendes:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types"]
    }
}
```

Bitte vermeiden Sie den expliziten Import von `webdriverio` oder `@wdio/sync`. `WebdriverIO` und `WebDriver` -Typen sind von überall aus zugänglich, sobald sie zu `types` in `tsconfig.json` hinzugefügt wurden. Wenn Sie zusätzliche WebdriverIO-Dienste, Plugins oder das Automatisierungspaket `devtools` verwenden, fügen Sie diese bitte auch der Liste `types` hinzu, da diese ebenfalls viele zusätzliche Typisierungen bereitstellen.

## Framework-Typen

Je nach verwendetem Framework müssen Sie die Typen für dieses Framework zu Ihrer  `types` Eigenschaft in `tsconfig.json` hinzufügen und seine Typdefinitionen installieren. Dies ist besonders wichtig, wenn Sie Typunterstützung für die integrierte Assertion-Bibliothek [`Expect-Webdriverio`](https://www.npmjs.com/package/expect-webdriverio) haben möchten.

Wenn Sie sich beispielsweise für die Verwendung des Mocha-Frameworks entscheiden, müssen Sie `@types/mocha` installieren und wie folgt hinzufügen, um alle Typen global verfügbar zu haben:

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 {label: 'Cucumber', value: 'cucumber'},
 ]
}>
<TabItem value="mocha">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/mocha-framework"]
    }
}
```

</TabItem>
<TabItem value="jasmine">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/jasmine-framework"]
    }
}
```

</TabItem>
<TabItem value="cucumber">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/cucumber-framework"]
    }
}
```

</TabItem>
</Tabs>

## Services

Wenn Sie Dienste verwenden, die dem Browserbereich Befehle hinzufügen, müssen Sie diese auch in Ihre `tsconfig.json` aufnehmen. Wenn Sie beispielsweise `@wdio/devtools-service` verwenden, stellen Sie sicher, dass Sie es auch zu den `types` hinzugefügt haben, z.B.:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": [
            "node",
            "@wdio/globals/types",
            "@wdio/mocha-framework",
            "@wdio/devtools-service"
        ]
    }
}
```

Das Hinzufügen von Diensten und Reportern zu Ihrer TypeScript-Konfiguration stärkt auch die Typsicherheit Ihrer WebdriverIO-Konfigurationsdatei.

## Typdefinitionen

Beim Ausführen von WebdriverIO-Befehlen werden normalerweise alle Eigenschaften typisiert, sodass Sie sich nicht mit dem Import zusätzlicher Typen befassen müssen. Es gibt jedoch Fälle, in denen Sie Variablen im Voraus definieren möchten. Um sicherzustellen, dass diese typsicher sind, können Sie alle im Paket [`@wdio/types`](https://www.npmjs.com/package/@wdio/types) definierten Typen verwenden. Wenn Sie beispielsweise die Remote-Option für `webdriverio` definieren möchten, können Sie Folgendes tun:

```ts
import type { Options } from '@wdio/types'

const config: Options.WebdriverIO = {
    hostname: 'http://localhost',
    port: '4444' // Error: Type 'string' is not assignable to type 'number'.ts(2322)
    capabilities: {
        browserName: 'chrome'
    }
}
```

## Missing Types

When using Node 20 or above, wdio runs ts-node with different settings as this is required in order to keep things running. These settings can cause your custom types not to be loaded, if this happens there are a few ways you can fix this, of which the easiest I will show below.

Using ts-node's environment variables
```
TS_NODE_FILES=true wdio run ./wdio.conf.ts
```

Using tsconfig
```
{
  "ts-node": {
    "files": true
  },
}
```

For more information checkout the (ts-node documentation)[https://typestrong.org/ts-node/docs/troubleshooting#missing-types].

## Tipps und Tricks

### Compile & Lint

Um ganz sicher zu gehen, können Sie die bewährten Methoden befolgen: Kompilieren Sie Ihren Code mit dem TypeScript-Compiler (führen Sie `tsc` oder `npx tsc`aus) und lassen Sie [eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) auf [pre-commit hook](https://github.com/typicode/husky)laufen.
