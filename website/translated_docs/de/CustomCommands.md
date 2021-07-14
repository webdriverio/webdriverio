---
id: customcommands
title: Benutzerdefinierte Befehle
---

Sie können `addCommand` verwenden, wenn Sie die Browserinstanz mit Ihren eigenen Befehlen erweitern möchten. Die Befehle können dabei synchron or asynchron geschrieben abhängig davon in welchem Modus Sie WebdriverIO verwenden. Das folgende Beispiel zeigt, wie ein neuer Befehl hinzugefügt werden kann, der die aktuelle URL und den Titel als Ergebnis zurückliefert:

```js
browser.addCommand("getUrlAndTitle", (customVar) => {
    return {
        url: this.getUrl(),
        title: this.getTitle(),
        customVar: customVar
    };
});
```

Eigene Befehle ermöglichen es Ihnen, eine bestimmte Anzahl von häufig benutzten Befehlen in einen einzigen nützlichen Methode zu bündeln. Sie können an jedem Punkt in Ihrer Testsuite eigene Befehle festlegen, stellen Sie jedoch sicher, dass der Befehl definiert ist, bevor Sie ihn zuerst verwenden (der `before` Hook in Ihrem wdio.conf.js ist z.B. ein guter Platz um benutzerdefinierte Befehle zu definieren). Einmal definiert, können Sie diese wie folgt verwenden:

```js
it('should use my custom command', () => {
    browser.url('http://www.github.com');
    const result = browser.getUrlAndTitle('foobar');

    assert.strictEqual(result.url, 'https://github.com/');
    assert.strictEqual(result.title, 'GitHub · Where software is built');
    assert.strictEqual(result.customVar, 'foobar');
});
```

Achten Sie darauf, die `browser` Instanz nicht mit benutzerdefinierten Befehlen zu überladen. Es wird empfohlen, benutzerdefinierte Abfolgen von Befehlen in Page Objekten zu definieren, so dass sie an eine bestimmte Seite gebunden sind.

## Integration von Drittanbieter-Bibliotheken

Wenn Sie externe Bibliotheken verwenden z.B. um Datenbankaufrufe zu tätigen, ist es ein guter Ansatz, diese einfach mit einem benutzerdefiniertem Befehl zu integrieren. Sobald Sie innerhalb eines eigenen Befehls ein Promise zurückgeben, so wartet WebdriverIO mit der Ausführung des Befehls, bis dieses Promise aufgelöst wurde. In Fällen, wo das Promise mit einem Fehler zurückgewiesen wird, wirft der benutzerdefinierte Befehl einen Fehler.

```js
import request from 'request';

browser.addCommand('makeRequest', (url) => {
    return request.get(url).then((response) => response.body)
});
```

Um den Response vom Request in einem Test zu nutzen, weißen Sie den Rückgabewert einfach einer Variable zu:

```js
it('execute external library in a sync way', () => {
    browser.url('...');
    const body = browser.makeRequest('http://...');
    console.log(body); // returns response body
});
```

Beachten Sie, dass der Rückgabewert Ihres eigenen Befehls der Rückgabewert des Promises ist. Beachten Sie, dass sie synchrone Befehle innerhalb von benutzerdefinierten Methoden nur verwenden können, wenn Sie WebdriverIO mit dem WDIO Testrunner verwenden.