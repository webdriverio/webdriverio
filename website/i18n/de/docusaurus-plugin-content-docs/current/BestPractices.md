---
id: bestpractices
title: Best Practices
---

# Best Practices

Dieser Leitfaden teilt unsere Best Practices, die Ihnen helfen, leistungsstarke und robuste Tests zu schreiben.

## Verwenden Sie widerstandsfähige Selektoren

Durch die Verwendung von Selektoren, die widerstandsfähig gegenüber Änderungen im DOM sind, haben Sie weniger oder sogar keine fehlschlagenden Tests, wenn beispielsweise eine Klasse von einem Element entfernt wird.

Klassen können auf mehrere Elemente angewendet werden und sollten wenn möglich vermieden werden, es sei denn, Sie möchten bewusst alle Elemente mit dieser Klasse abrufen.

```js
// 👎
await $('.button')
```

Alle diese Selektoren sollten ein einzelnes Element zurückgeben.

```js
// 👍
await $('aria/Submit')
await $('[test-id="submit-button"]')
await $('#submit-button')
```

__Hinweis:__ Um alle möglichen Selektoren zu entdecken, die WebdriverIO unterstützt, schauen Sie auf unsere [Selektoren](./Selectors.md) Seite.

## Begrenzen Sie die Anzahl der Element-Abfragen

Jedes Mal, wenn Sie den [`$`](https://webdriver.io/docs/api/browser/$) oder [`$$`](https://webdriver.io/docs/api/browser/$$) Befehl verwenden (einschließlich Verkettung), versucht WebdriverIO, das Element im DOM zu lokalisieren. Diese Abfragen sind teuer, daher sollten Sie versuchen, sie so weit wie möglich zu begrenzen.

Fragt drei Elemente ab.

```js
// 👎
await $('table').$('tr').$('td')
```

Fragt nur ein Element ab.

``` js
// 👍
await $('table tr td')
```

Der einzige Zeitpunkt, zu dem Sie Verkettung verwenden sollten, ist, wenn Sie verschiedene [Selektor-Strategien](https://webdriver.io/docs/selectors/#custom-selector-strategies) kombinieren möchten. Im Beispiel verwenden wir [Deep Selectors](https://webdriver.io/docs/selectors#deep-selectors), eine Strategie, um in den Shadow-DOM eines Elements zu gelangen.

``` js
// 👍
await $('custom-datepicker').$('#calendar').$('aria/Select')
```

### Bevorzugen Sie die Lokalisierung eines einzelnen Elements statt der Entnahme aus einer Liste

Dies ist nicht immer möglich, aber mit CSS-Pseudoklassen wie [:nth-child](https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-child) können Sie Elemente basierend auf den Indizes der Elemente in der Kinderliste ihrer Elternelemente abgleichen.

Fragt alle Tabellenzeilen ab.

```js
// 👎
await $$('table tr')[15]
```

Fragt eine einzelne Tabellenzeile ab.

```js
// 👍
await $('table tr:nth-child(15)')
```

## Verwenden Sie die eingebauten Assertions

Verwenden Sie keine manuellen Assertions, die nicht automatisch warten, bis die Ergebnisse übereinstimmen, da dies zu instabilen Tests führen kann.

```js
// 👎
expect(await button.isDisplayed()).toBe(true)
```

Durch die Verwendung der eingebauten Assertions wartet WebdriverIO automatisch, bis das tatsächliche Ergebnis mit dem erwarteten Ergebnis übereinstimmt, was zu robusten Tests führt. Dies wird erreicht, indem die Assertion automatisch wiederholt wird, bis sie erfolgreich ist oder eine Zeitüberschreitung eintritt.

```js
// 👍
await expect(button).toBeDisplayed()
```

## Lazy Loading und Promise-Verkettung

WebdriverIO hat einige Tricks auf Lager, wenn es um das Schreiben von sauberem Code geht, da es das Element lazy laden kann, was das Verketten von Promises ermöglicht und die Anzahl der `await`-Anweisungen reduziert. Dies ermöglicht es Ihnen auch, das Element als ChainablePromiseElement anstelle eines Elements weiterzugeben und erleichtert die Verwendung mit Page-Objects.

Wann müssen Sie also `await` verwenden? Sie sollten immer `await` verwenden, mit Ausnahme der Befehle `$` und `$$`.

```js
// 👎
const div = await $('div')
const button = await div.$('button')
await button.click()
// oder
await (await (await $('div')).$('button')).click()
```

```js
// 👍
const button = $('div').$('button')
await button.click()
// oder
await $('div').$('button').click()
```

## Übernutzen Sie keine Befehle und Assertions

Wenn Sie expect.toBeDisplayed verwenden, warten Sie implizit auch darauf, dass das Element existiert. Es besteht keine Notwendigkeit, die waitForXXX-Befehle zu verwenden, wenn Sie bereits eine Assertion haben, die dasselbe tut.

```js
// 👎
await button.waitForExist()
await expect(button).toBeDisplayed()

// 👎
await button.waitForDisplayed()
await expect(button).toBeDisplayed()

// 👍
await expect(button).toBeDisplayed()
```

Es ist nicht nötig, darauf zu warten, dass ein Element existiert oder angezeigt wird, wenn Sie damit interagieren oder etwas wie seinen Text überprüfen, es sei denn, das Element kann explizit unsichtbar sein (z.B. opacity: 0) oder explizit deaktiviert sein (z.B. disabled-Attribut). In diesen Fällen ist es sinnvoll, darauf zu warten, dass das Element angezeigt wird.

```js
// 👎
await expect(button).toBeExisting()
await expect(button).toHaveText('Submit')

// 👎
await expect(button).toBeDisplayed()
await expect(button).toHaveText('Submit')

// 👎
await expect(button).toBeDisplayed()
await button.click()
```

```js
// 👍
await button.click()

// 👍
await expect(button).toHaveText('Submit')
```

## Dynamische Tests

Verwenden Sie Umgebungsvariablen, um dynamische Testdaten, z.B. geheime Anmeldeinformationen, in Ihrer Umgebung zu speichern, anstatt sie direkt in den Test zu codieren. Weitere Informationen zu diesem Thema finden Sie auf der Seite [Parameterize Tests](parameterize-tests).

## Linting Ihres Codes

Mit eslint können Sie Ihren Code linting und potenziell frühzeitig Fehler erkennen. Verwenden Sie unsere [Linting-Regeln](https://www.npmjs.com/package/eslint-plugin-wdio), um sicherzustellen, dass einige der Best Practices immer angewendet werden.

## Keine Pausen verwenden

Es kann verlockend sein, den Pause-Befehl zu verwenden, aber das ist eine schlechte Idee, da er nicht robust ist und auf lange Sicht nur zu instabilen Tests führen wird.

```js
// 👎
await nameInput.setValue('Bob')
await browser.pause(200) // warte bis der Submit-Button aktiviert ist
await submitFormButton.click()

// 👍
await nameInput.setValue('Bob')
await submitFormButton.waitForEnabled()
await submitFormButton.click()
```

## Asynchrone Schleifen

Wenn Sie asynchronen Code haben, den Sie wiederholen möchten, ist es wichtig zu wissen, dass nicht alle Schleifen dies tun können. Zum Beispiel erlaubt die forEach-Funktion des Arrays keine asynchronen Callbacks, wie auf [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach) nachgelesen werden kann.

__Hinweis:__ Sie können diese trotzdem verwenden, wenn der Vorgang nicht synchron sein muss, wie in diesem Beispiel gezeigt: `console.log(await $$('h1').map((h1) => h1.getText()))`.

Nachfolgend einige Beispiele, was das bedeutet.

Das Folgende wird nicht funktionieren, da asynchrone Callbacks nicht unterstützt werden.

```js
// 👎
const characters = 'this is some example text that should be put in order'
characters.forEach(async (character) => {
    await browser.keys(character)
})
```

Das Folgende wird funktionieren.

```js
// 👍
const characters = 'this is some example text that should be put in order'
for (const character of characters) {
    await browser.keys(character)
}
```

## Halten Sie es einfach

Manchmal sehen wir, dass unsere Benutzer Daten wie Text oder Werte mappen. Dies ist oft nicht nötig und ist häufig ein Warnsignal. Prüfen Sie die folgenden Beispiele, warum dies der Fall ist.

```js
// 👎 zu komplex, synchrone Assertion, verwenden Sie die eingebauten Assertions, um instabile Tests zu vermeiden
const headerText = ['Products', 'Prices']
const texts = await $$('th').map(e => e.getText());
expect(texts).toBe(headerText)

// 👎 zu komplex
const headerText = ['Products', 'Prices']
const columns = await $$('th');
await expect(columns).toBeElementsArrayOfSize(2);
for (let i = 0; i < columns.length; i++) {
    await expect(columns[i]).toHaveText(headerText[i]);
}

// 👎 findet Elemente anhand ihres Textes, berücksichtigt aber nicht die Position der Elemente
await expect($('th=Products')).toExist();
await expect($('th=Prices')).toExist();
```

```js
// 👍 verwenden Sie eindeutige Kennungen (oft für benutzerdefinierte Elemente verwendet)
await expect($('[data-testid="Products"]')).toHaveText('Products');
// 👍 Accessibility-Namen (oft für native HTML-Elemente verwendet)
await expect($('aria/Product Prices')).toHaveText('Prices');
```

Eine andere Sache, die wir manchmal sehen, ist, dass einfache Dinge eine überkomplizierte Lösung haben.

```js
// 👎
class BadExample {
    public async selectOptionByValue(value: string) {
        await $('select').click();
        await $$('option')
            .map(async function (element) {
                const hasValue = (await element.getValue()) === value;
                if (hasValue) {
                    await $(element).click();
                }
                return hasValue;
            });
    }

    public async selectOptionByText(text: string) {
        await $('select').click();
        await $$('option')
            .map(async function (element) {
                const hasText = (await element.getText()) === text;
                if (hasText) {
                    await $(element).click();
                }
                return hasText;
            });
    }
}
```

```js
// 👍
class BetterExample {
    public async selectOptionByValue(value: string) {
        await $('select').click();
        await $(`option[value=${value}]`).click();
    }

    public async selectOptionByText(text: string) {
        await $('select').click();
        await $(`option=${text}]`).click();
    }
}
```

## Code parallel ausführen

Wenn es Ihnen nicht wichtig ist, in welcher Reihenfolge ein Code ausgeführt wird, können Sie [`Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) verwenden, um die Ausführung zu beschleunigen.

__Hinweis:__ Da dies den Code schwerer lesbar macht, könnten Sie dies mithilfe eines Page-Objects oder einer Funktion abstrahieren, obwohl Sie auch hinterfragen sollten, ob der Leistungsvorteil die Kosten der Lesbarkeit wert ist.

```js
// 👎
await name.setValue('Bob')
await email.setValue('bob@webdriver.io')
await age.setValue('50')
await submitFormButton.waitForEnabled()
await submitFormButton.click()

// 👍
await Promise.all([
    name.setValue('Bob'),
    email.setValue('bob@webdriver.io'),
    age.setValue('50'),
])
await submitFormButton.waitForEnabled()
await submitFormButton.click()
```

Wenn abstrahiert, könnte es wie unten aussehen, wo die Logik in einer Methode namens submitWithDataOf platziert ist und die Daten von der Person-Klasse abgerufen werden.

```js
// 👍
await form.submitData(new Person('bob@webdriver.io'))
```
