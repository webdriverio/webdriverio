---
id: parameterize-tests
title: Tests Parametrisieren
---

Du kannst Tests auf Testebene einfach parametrisieren, z.B. über einfache `for`-Schleifen:

```ts title=example.spec.js
const people = ['Alice', 'Bob']
describe('my tests', () => {
    for (const name of people) {
        it(`testing with ${name}`, async () => {
            // ...
        })
    }
})
```

oder indem du Tests in dynamische Funktionen extrahierst, z.B.:

```js title=dynamic.spec.js
import { browser } from '@wdio/globals'

function testComponent(componentName, options) {
  it(`should test my ${componentName}`, async () => {
    await browser.url(`/${componentName}`)
    await expect($('input')).toHaveValue(options.expectedValue)
  })
}

describe('page components', () => {
    testComponent('component-a', { expectedValue: 'some expected value' })
    testComponent('component-b', { expectedValue: 'some other expected value' })
})
```

## Umgebungsvariablen Übergeben

Du kannst Umgebungsvariablen verwenden, um Tests über die Befehlszeile zu konfigurieren.

Betrachte zum Beispiel die folgende Testdatei, die einen Benutzernamen und ein Passwort benötigt. Es ist in der Regel eine gute Idee, deine Geheimnisse nicht im Quellcode zu speichern, daher benötigen wir eine Möglichkeit, Geheimnisse von außen zu übergeben.

```ts title=example.spec.ts
it(`example test`, async () => {
  // ...
  await $('#username').setValue(process.env.USERNAME)
  await $('#password').setValue(process.env.PASSWORD)
})
```

Du kannst diesen Test mit deinem geheimen Benutzernamen und Passwort ausführen, die in der Befehlszeile festgelegt werden.

<Tabs
  defaultValue="bash"
  values={[
    {label: 'Bash', value: 'bash'},
 {label: 'Powershell', value: 'powershell'},
 {label: 'Batch', value: 'batch'},
 ]
}>
<TabItem value="bash">

```sh
USERNAME=me PASSWORD=secret npx wdio run wdio.conf.js
```

</TabItem>
<TabItem value="powershell">

```sh
$env:USERNAME=me
$env:PASSWORD=secret
npx wdio run wdio.conf.js
```

</TabItem>
<TabItem value="batch">

```sh
set USERNAME=me
set PASSWORD=secret
npx wdio run wdio.conf.js
```

</TabItem>
</Tabs>

In ähnlicher Weise kann die Konfigurationsdatei auch Umgebungsvariablen lesen, die über die Befehlszeile übergeben werden.

```ts title=wdio.config.js
export const config = {
  // ...
  baseURL: process.env.STAGING === '1'
    ? 'http://staging.example.test/'
    : 'http://example.test/',
  // ...
}
```

Jetzt kannst du Tests in einer Staging- oder Produktionsumgebung ausführen:

<Tabs
  defaultValue="bash"
  values={[
    {label: 'Bash', value: 'bash'},
 {label: 'Powershell', value: 'powershell'},
 {label: 'Batch', value: 'batch'},
 ]
}>
<TabItem value="bash">

```sh
STAGING=1 npx wdio run wdio.conf.js
```

</TabItem>
<TabItem value="powershell">

```sh
$env:STAGING=1
npx wdio run wdio.conf.js
```

</TabItem>
<TabItem value="batch">

```sh
set STAGING=1
npx wdio run wdio.conf.js
```

</TabItem>
</Tabs>

## `.env` Dateien

Um Umgebungsvariablen einfacher zu verwalten, betrachte die Verwendung von `.env` Dateien. WebdriverIO lädt `.env` Dateien automatisch in deine Umgebung. Anstatt die Umgebungsvariable als Teil des Befehlsaufrufs zu definieren, kannst du die folgende `.env` Datei definieren:

```bash title=".env"
# .env file
STAGING=0
USERNAME=me
PASSWORD=secret
```

Führe Tests wie gewohnt aus, deine Umgebungsvariablen sollten erkannt werden.

```sh
npx wdio run wdio.conf.js
```

## Tests über eine CSV-Datei erstellen

Der WebdriverIO Test-Runner läuft in Node.js, das bedeutet, du kannst Dateien direkt aus dem Dateisystem lesen und mit deiner bevorzugten CSV-Bibliothek analysieren.

Siehe zum Beispiel diese CSV-Datei, in unserem Beispiel input.csv:

```csv
"test_case","some_value","some_other_value"
"value 1","value 11","foobar1"
"value 2","value 22","foobar21"
"value 3","value 33","foobar321"
"value 4","value 44","foobar4321"
```

Basierend darauf generieren wir einige Tests mit der csv-parse Bibliothek von NPM:

```js title=test.spec.ts
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'csv-parse/sync'

const records = parse(fs.readFileSync(path.join(__dirname, 'input.csv')), {
  columns: true,
  skip_empty_lines: true
})

describe('my test suite', () => {
    for (const record of records) {
        it(`foo: ${record.test_case}`, async () => {
            console.log(record.test_case, record.some_value, record.some_other_value)
        })
    }
})
```
