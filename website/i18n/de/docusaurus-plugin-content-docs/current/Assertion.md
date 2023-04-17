---
id: assertion
title: Assertion
---

Der [WDIO Testrunner](https://webdriver.io/docs/clioptions) verfügt über eine integrierte Assertion-Bibliothek, mit der Sie aussagekräftige Assertionen zu verschiedenen Aspekten des Browsers oder von Elementen in Ihrer (Web-)Anwendung erstellen können. Es erweitert die Funktionalität von [Jests Matchers](https://jestjs.io/docs/en/using-matchers) um zusätzliche, für e2e-Tests optimierte Matcher, z.B.:

```js
const $button = await $('button')
await expect($button).toBeDisplayed()
```

oder

```js
const selectOptions = await $$('form select>option')

// make sure there is at least one option in select
await expect(selectOptions).toHaveChildren({ gte: 1 })
```

Die vollständige Liste finden Sie im [expect-API-Dokument](/docs/api/expect-webdriverio).

## Migration von Chai

[Chai](https://www.chaijs.com/) und [Expect-Webdriverio](https://github.com/webdriverio/expect-webdriverio#readme) können nebeneinander existieren, und mit einigen geringfügigen Anpassungen kann ein reibungsloser Übergang zu Expect-Webdriverio erreicht werden. Wenn Sie auf WebdriverIO v6 aktualisiert haben, haben Sie standardmäßig Zugriff auf alle Zusicherungen von `Expect-WebdriverIO` out of the Box. Das bedeutet, dass Sie überall dort, wo Sie `erwarten` verwenden, eine `Expect-Webdriverio` Assertion aufrufen würden. Es sei denn, Sie setzen [`injectGlobals`](/docs/configuration#injectglobals) auf `false` oder haben explizit die globale `expect` Variable überschrieben. In diesem Fall hätten Sie keinen Zugriff auf „expect-webdriverio“, ohne das Paket explizit dort zu importieren, wo Sie es benötigen.

Dieser Leitfaden zeigt Beispiele für die Migration von Chai, wenn es lokal überschrieben wurde, und für die Migration von Chai, wenn es global überschrieben wurde.

### Lokal

Angenommen, Chai wurde explizit in eine Datei importiert, z.B.:

```js
// myfile.js - original code
import { expect as expectChai } from 'chai'

describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        expectChai(await browser.getUrl()).to.include('/login')
    })
})
```

Um diesen Code zu migrieren, entfernen Sie den Chai-Import und verwenden Sie stattdessen die neue Expect-Webdriverio-Assertion-Methode `toHaveUrl`:

```js
// myfile.js - migrated code
describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        await expect(browser).toHaveUrl('/login') // new expect-webdriverio API method https://webdriver.io/docs/api/expect-webdriverio.html#tohaveurl
    });
});
```

Wenn Sie sowohl Chai als auch Expect-Webdriverio in derselben Datei verwenden möchten, würden Sie den Chai-Import beibehalten und `expect` würde standardmäßig die Erwartungs-Webdriverio-Assertion verwenden, z.B.:

```js
// myfile.js
import { expect as expectChai } from 'chai'
import { expect as expectWDIO } from '@wdio/globals'

describe('Element', () => {
    it('should be displayed', async () => {
        const isDisplayed = await $("#element").isDisplayed()
        expectChai(isDisplayed).to.equal(true); // Chai assertion
    })
});

describe('Other element', () => {
    it('should not be displayed', async () => {
        await expectWDIO($("#element")).not.toBeDisplayed(); // expect-webdriverio assertion
    })
})
```

### Global

Angenommen `erwartet, dass` global überschrieben wurde, um Chai zu verwenden. Um Expect-Webdriverio-Assertionen zu verwenden, müssen wir global eine Variable im „Before“-Hook setzen, z.B.:

```js
// wdio.conf.js
before: async () => {
    await import('expect-webdriverio');
    global.wdioExpect = global.expect;
    const chai = await import('chai');
    global.expect = chai.expect;
}
```

Jetzt können Chai und Expect-WebdriverIO nebeneinander verwendet werden. In Ihrem Code würden Sie Chai- und Expect-Webdriverio-Assertionen wie folgt verwenden, z. B.:

```js
// myfile.js
describe('Element', () => {
    it('should be displayed', async () => {
        const isDisplayed = await $("#element").isDisplayed()
        expect(isDisplayed).to.equal(true); // Chai assertion
    });
});

describe('Other element', () => {
    it('should not be displayed', async () => {
        await expectWdio($("#element")).not.toBeDisplayed(); // expect-webdriverio assertion
    });
});
```

Um zu migrieren, würden Sie jede Chai-Assertion langsam zu „expect-webdriverio“ umschreiben. Sobald alle Chai-Assertionen in der gesamten Codebasis ersetzt wurden, kann der "Before"-Hook gelöscht werden. Ein globales Suchen und Ersetzen zum Ersetzen aller Instanzen von `wdioExpect` bis `erwartet` wird dann die Migration abschließen.
