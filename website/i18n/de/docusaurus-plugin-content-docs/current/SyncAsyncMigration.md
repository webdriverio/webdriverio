---
id: async-migration
title: Von Sync nach Async
---

Aufgrund von Änderungen in V8 hat das WebdriverIO-Team [](https://webdriver.io/blog/2021/07/28/sync-api-deprecation) angekündigt, die synchrone Befehlsausführung bis April 2023 einzustellen. Das Team hat hart daran gearbeitet, den Übergang so einfach wie möglich zu gestalten. In diesem Leitfaden erklären wir, wie Sie Ihre Testsuite langsam von synchron zu asynchron migrieren können. Als Beispielprojekt verwenden wir das [Cucumber Boilerplate](https://github.com/webdriverio/cucumber-boilerplate), aber die Vorgehensweise ist auch bei allen anderen Projekten gleich.

## Promises in JavaScript

Der Grund, warum die synchrone Ausführung in WebdriverIO beliebt war, liegt darin, dass es die Komplexität des Umgangs mit Promises beseitigt. Besonders wenn Sie das Programmieren in anderen Sprachen gewohnt sind, in denen dieses Konzept so nicht existiert, kann es am Anfang verwirrend sein. Promises sind jedoch ein sehr leistungsfähiges Werkzeug, um mit asynchronem Code umzugehen, und das heutige JavaScript macht die Nutzung sehr einfach. Wenn Sie noch nie mit Promises gearbeitet haben, empfehlen wir Ihnen, das [MDN-Referenzhandbuch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) dazu zu lesen, da es den Rahmen sprengen würde, es hier zu erklären.

## Asynchroner Übergang

Der WebdriverIO-Testrunner kann die asynchrone und synchrone Ausführung innerhalb derselben Testsuite verarbeiten. Das bedeutet, dass Sie Ihre Tests und PageObjects Schritt für Schritt in Ihrem Tempo langsam migrieren können. Zum Beispiel hat das Cucumber Boilerplate [einen großen Satz von Schrittdefinitionen](https://github.com/webdriverio/cucumber-boilerplate/tree/main/src/support/action) definiert, die Sie in Ihr Projekt kopieren können. Wir können fortfahren und eine Schrittdefinition oder eine Datei nach der anderen migrieren.

:::tip

WebdriverIO bietet einen [Codemod](https://github.com/webdriverio/codemod), der es ermöglicht, Ihren Sync-Code fast vollautomatisch in async-Code umzuwandeln. Führen Sie zuerst den Codemod wie in der Dokumentation beschrieben aus und verwenden Sie diese Anleitung bei Bedarf für die manuelle Migration.

:::

In vielen Fällen müssen Sie lediglich die Funktion, in der Sie WebdriverIO-Befehle aufrufen, `async` machen und vor jedem Befehl eine `await` hinzufügen. Wenn wir uns die erste Datei `clearInputField.ts` ansehen, die im Boilerplate-Projekt transformiert werden soll, transformieren wir von:

```ts
export default (selector: Selector) => {
    $(selector).clearValue();
};
```

nach:

```ts
export default async (selector: Selector) => {
    await $(selector).clearValue();
};
```

Das war's. Den vollständigen Commit mit allen Rewrite-Beispielen können Sie hier einsehen:

#### Commits:

- _transform all step definitions_ [[af6625f]](https://github.com/webdriverio/cucumber-boilerplate/pull/481/commits/af6625fcd01dc087479e84562f237ecf38b3537d)

:::info
Dieser Übergang ist unabhängig davon, ob Sie TypeScript verwenden oder nicht. Wenn Sie TypeScript verwenden, stellen Sie einfach sicher, dass Sie die Eigenschaft `types` in Ihrer `tsconfig.json` von `webdriverio/sync` in `@wdio/globals/types`ändern. Stellen Sie außerdem sicher, dass Ihr Kompilierungsziel auf mindestens `ES2018`eingestellt ist.
:::

## Sonderfälle

Natürlich gibt es immer wieder Sonderfälle, wo man etwas mehr aufpassen muss.

### ForEach-Schleifen

Wenn Sie eine `forEach` Schleife haben, z. B. um über Elemente zu iterieren, müssen Sie sicherstellen, dass der Iterator-Callback ordnungsgemäß asynchron behandelt wird, z. B.:

```js
const elems = $$('div')
elems.forEach((elem) => {
    elem.click()
})
```

Die Funktion, die wir an `forEach` übergeben, ist eine Iteratorfunktion. In einer synchronen Welt würde es auf alle Elemente klicken, bevor es weitergeht. Wenn wir dies in asynchronen Code umwandeln, müssen wir sicherstellen, dass wir warten, bis jede Iteratorfunktion die Ausführung beendet hat. Durch Hinzufügen von `async`/`await` geben diese Iteratorfunktionen ein Promise zurück, das wir auflösen müssen. Jetzt ist `forEach` nicht gerade ideal, um über die Elemente zu iterieren, da es nicht das Ergebnis der Iteratorfunktionen zurückgibt und wir daher nicht wissen können, wann die asynchrone Operation im Promise erledigt ist. Daher müssen wir `forEach` durch `map` ersetzen, welches dieses Promise zurückgibt. The `map` as well as all other iterator methods of Arrays like `find`, `every`, `reduce` and more are implemented so that they respect promises within the iterator functions and are therefor simplified for using them in an async context. Das obige Beispiel sieht transformiert so aus:

```js
const elems = await $$('div')
await elems.forEach((elem) => {
    return elem.click()
})
```

Um beispielsweise alle `<h3 />` Elemente abzurufen und ihren Textinhalt zu erhalten, können Sie Folgendes ausführen:

```js
await browser.url('https://webdriver.io')

const h3Texts = await browser.$$('h3').map((img) => img.getText())
console.log(h3Texts);
/**
 * returns:
 * [
 *   'Extendable',
 *   'Compatible',
 *   'Feature Rich',
 *   'Who is using WebdriverIO?',
 *   'Support for Modern Web and Mobile Frameworks',
 *   'Google Lighthouse Integration',
 *   'Watch Talks about WebdriverIO',
 *   'Get Started With WebdriverIO within Minutes'
 * ]
 */
```

Wenn dies zu kompliziert aussieht, sollten Sie die Verwendung einfacher for-Schleifen in Betracht ziehen, z.B.:

```js
const elems = await $$('div')
for (const elem of elems) {
    await elem.click()
}
```

### WebdriverIO-Assertionen

Wenn Sie den WebdriverIO Assertion Helper [`expect-webdriverio`](https://webdriver.io/docs/api/expect-webdriverio) verwenden, stellen Sie sicher, dass Sie vor jedem `expect` Aufruf ein `await` setzen, z. B.:

```ts
expect($('input')).toHaveAttributeContaining('class', 'form')
```

muss umgewandelt werden in:

```ts
await expect($('input')).toHaveAttributeContaining('class', 'form')
```

### Synchronisieren Sie PageObject-Methoden und asynchrone Tests

Wenn Sie Seitenobjekte in Ihrer Testsuite synchron geschrieben haben, können diese nicht mehr in asynchronen Tests verwendet werden. Wenn Sie eine PageObject-Methode sowohl in synchronen als auch in asynchronen Tests verwenden wollen, empfehlen wir, die Methode zu duplizieren und sie für beide Umgebungen anzubieten, z.B.:

```js
class MyPageObject extends Page {
    /**
     * define elements
     */
    get btnStart () { return $('button=Start') }
    get loadedPage () { return $('#finish') }

    someMethod () {
        // sync code
    }

    someMethodAsync () {
        // async version of MyPageObject.someMethod()
    }
}
```

Nachdem Sie die Migration abgeschlossen haben, können Sie die synchronen PageObject-Methoden entfernen und die Benennung bereinigen.

Wenn Sie nicht zwei verschiedene Versionen einer PageObject-Methode verwalten möchten, können Sie auch das gesamte PageObject zu async migrieren und [`browser.call`](https://webdriver.io/docs/api/browser/call) verwenden, um die Methode in einer synchronen Umgebung auszuführen, z.B.:

```js
// before:
// MyPageObject.someMethod()
// after:
browser.call(() => MyPageObject.someMethod())
```

Der Befehl `call` stellt sicher, dass der asynchrone Befehl `someMethod` aufgelöst wird, bevor mit dem nächsten Befehl fortgefahren wird.

## Zusammenfassung

Wie Sie in dem [resultierenden Refaktor PR](https://github.com/webdriverio/cucumber-boilerplate/pull/481/files) sehen können, ist die Komplexität dieser Refaktorisierung ziemlich einfach. Denken Sie daran, dass Sie eine Schrittdefinition nach der anderen umschreiben können. WebdriverIO ist perfekt in der Lage, die synchrone und asynchrone Ausführung in einem einzigen Framework zu handhaben.
