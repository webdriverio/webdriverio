---
id: snapshot
title: Snapshot
---

Snapshot-Tests können sehr nützlich sein, um eine Vielzahl von Aspekten Ihrer Komponente oder Logik gleichzeitig zu überprüfen. In WebdriverIO können Sie Snapshots von beliebigen Objekten sowie von WebElement-DOM-Strukturen oder WebdriverIO-Befehlsergebnissen erstellen.

Ähnlich wie bei anderen Test-Frameworks erstellt WebdriverIO einen Snapshot des angegebenen Werts und vergleicht ihn dann mit einer Referenz-Snapshot-Datei, die zusammen mit dem Test gespeichert wird. Der Test schlägt fehl, wenn die beiden Snapshots nicht übereinstimmen: Entweder ist die Änderung unerwartet, oder der Referenz-Snapshot muss auf die neue Version des Ergebnisses aktualisiert werden.

:::info Plattformübergreifende Unterstützung

Diese Snapshot-Funktionen sind sowohl für End-to-End-Tests in der Node.js-Umgebung als auch für [Unit- und Komponententests](/docs/component-testing) im Browser oder auf mobilen Geräten verfügbar.

:::

## Snapshots verwenden

Um einen Wert als Snapshot zu erfassen, können Sie `toMatchSnapshot()` aus der [`expect()`](/docs/api/expect-webdriverio)-API verwenden:

```ts
import { browser, expect } from '@wdio/globals'

it('can take a DOM snapshot', () => {
    await browser.url('https://guinea-pig.webdriver.io/')
    await expect($('.findme')).toMatchSnapshot()
})
```

Wenn dieser Test zum ersten Mal ausgeführt wird, erstellt WebdriverIO eine Snapshot-Datei, die wie folgt aussieht:

```js
// Snapshot v1

exports[`main suite 1 > can take a DOM snapshot 1`] = `"<h1 class="findme">Test CSS Attributes</h1>"`;
```

Das Snapshot-Artefakt sollte zusammen mit Codeänderungen übertragen und im Rahmen Ihres Code-Review-Prozesses überprüft werden. Bei nachfolgenden Testläufen vergleicht WebdriverIO die gerenderte Ausgabe mit dem vorherigen Snapshot. Wenn sie übereinstimmen, besteht der Test. Wenn sie nicht übereinstimmen, hat der Test-Runner entweder einen Fehler in Ihrem Code gefunden, der behoben werden sollte, oder die Implementierung hat sich geändert und der Snapshot muss aktualisiert werden.

Um den Snapshot zu aktualisieren, übergeben Sie das Flag `-s` (oder `--updateSnapshot`) an den `wdio`-Befehl, z.B.:

```sh
npx wdio run wdio.conf.js -s
```

**Hinweis:** Wenn Sie Tests mit mehreren Browsern parallel ausführen, wird nur ein Snapshot erstellt und verglichen. Wenn Sie für jede Capability einen separaten Snapshot haben möchten, [erstellen Sie bitte ein Issue](https://github.com/webdriverio/webdriverio/issues/new?assignees=\&labels=Idea+%F0%9F%92%A1%2CNeeds+Triaging+%E2%8F%B3\&projects=\&template=feature-request.yml\&title=%5B%F0%9F%92%A1+Feature%5D%3A+%3Ctitle%3E) und teilen Sie uns Ihren Anwendungsfall mit.

## Inline-Snapshots

In ähnlicher Weise können Sie `toMatchInlineSnapshot()` verwenden, um den Snapshot inline in der Testdatei zu speichern.

```ts
import { expect, $ } from '@wdio/globals'

it('can take inline DOM snapshots', () => {
  const elem = $('.container')
  await expect(elem.getCSSProperty()).toMatchInlineSnapshot()
})
```

Anstatt eine Snapshot-Datei zu erstellen, modifiziert Vitest die Testdatei direkt, um den Snapshot als String zu aktualisieren:

```ts
import { expect, $ } from '@wdio/globals'

it('can take inline DOM snapshots', () => {
    const elem = $('.container')
    await expect(elem.getCSSProperty()).toMatchInlineSnapshot(`
        {
            "parsed": {
                "alpha": 0,
                "hex": "#000000",
                "rgba": "rgba(0,0,0,0)",
                "type": "color",
            },
            "property": "background-color",
            "value": "rgba(0,0,0,0)",
        }
    `)
})
```

Dies ermöglicht es Ihnen, die erwartete Ausgabe direkt zu sehen, ohne zwischen verschiedenen Dateien hin und her wechseln zu müssen.

## Visuelle Snapshots

Das Erstellen eines DOM-Snapshots eines Elements ist möglicherweise nicht die beste Idee, besonders wenn die DOM-Struktur zu groß ist und dynamische Elementeigenschaften enthält. In diesen Fällen wird empfohlen, sich auf visuelle Snapshots für Elemente zu verlassen.

Um visuelle Snapshots zu aktivieren, fügen Sie den `@wdio/visual-service` zu Ihrem Setup hinzu. Sie können den Einrichtungsanweisungen in der [Dokumentation](/docs/visual-testing#installation) für visuelles Testen folgen.

Sie können dann einen visuellen Snapshot über `toMatchElementSnapshot()` erstellen, z.B.:

```ts
import { expect, $ } from '@wdio/globals'

it('can take inline DOM snapshots', () => {
  const elem = $('.container')
  await expect(elem.getCSSProperty()).toMatchInlineSnapshot()
})
```

Ein Bild wird dann im Baseline-Verzeichnis gespeichert. Schauen Sie sich die [Visual Testing](/docs/visual-testing) Dokumentation für weitere Informationen an.
