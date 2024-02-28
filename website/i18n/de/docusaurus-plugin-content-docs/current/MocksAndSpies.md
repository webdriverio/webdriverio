---
id: mocksandspies
title: Request Mocks und Spione
---

WebdriverIO comes with built-in support for modifying network responses that allows you to focus testing your frontend application without having to setup your backend or a mock server. Sie können benutzerdefinierte Antworten für Webressourcen wie REST-API-Requests in Ihrem Test definieren und dynamisch ändern.

:::info

Note that using the `mock` command requires support for Chrome DevTools protocol. That support is given if you run tests locally in a Chromium-based browser, via a Selenium Grid v4 or higher, or through a cloud vendor with support for the Chrome DevTools protocol (e.g. SauceLabs, BrowserStack, LambdaTest). Full cross-browser support will be available once the required primitives land in [Webdriver Bidi](https://wpt.fyi/results/webdriver/tests/bidi/network?label=experimental&label=master&aligned) and get implemented in the respective browser.

:::

## Mock Erstellen

Bevor Sie Responsen ändern können, müssen Sie zuerst einen Mock definieren. Dieser Mock wird durch die Ressourcen-URL beschrieben und kann durch die [-Anfragemethode](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) oder [Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)gefiltert werden. Die Ressource unterstützt Glob-Ausdrücke von [minimatch](https://www.npmjs.com/package/minimatch):

```js
// mock all resources ending with "/users/list"
const userListMock = await browser.mock('**/users/list')

// or you can specify the mock by filtering resources by headers or
// status code, only mock successful requests to json resources
const strictMock = await browser.mock('**', {
    // mock all json responses
    headers: { 'Content-Type': 'application/json' },
    // that were successful
    statusCode: 200
})
```

## Angeben Benutzerdefinierter Responses

Sobald Sie einen Mock definiert haben, können Sie benutzerdefinierte Responses dafür definieren. Diese benutzerdefinierten Responses können entweder ein Objekt oder ein JSON zurückgeben, auf eine lokale Datei verweisen oder auf eine andere Webressource weiterleiten.

### Mocking API Requests

Um API-Anfragen zu simulieren, bei denen Sie eine JSON-Antwort erwarten, müssen Sie lediglich `respond` für das Mock-Objekt mit einem beliebigen Objekt aufrufen, das Sie zurückgeben möchten, z.B.:

```js
const mock = await browser.mock('https://todo-backend-express-knex.herokuapp.com/')

mock.respond([{
    title: 'Injected (non) completed Todo',
    order: null,
    completed: false
}, {
    title: 'Injected completed Todo',
    order: null,
    completed: true
}], {
    headers: {
        'Access-Control-Allow-Origin': '*'
    },
    fetchResponse: false
})

await browser.url('https://todobackend.com/client/index.html?https://todo-backend-express-knex.herokuapp.com/')

await $('#todo-list li').waitForExist()
console.log(await $$('#todo-list li').map(el => el.getText()))
// outputs: "[ 'Injected (non) completed Todo', 'Injected completed Todo' ]"
```

Sie können auch die Antwortheader sowie den Statuscode ändern, indem Sie wie folgt einige Parameter übergeben:

```js
mock.respond({ ... }, {
    // respond with status code 404
    statusCode: 404,
    // merge response headers with following headers
    headers: { 'x-custom-header': 'foobar' }
})
```

Wenn Sie möchten, dass der Mock das Backend überhaupt nicht aufruft, können Sie `false` für via `fetchResponse` übergeben.

```js
mock.respond({ ... }, {
    // do not call the actual backend
    fetchResponse: false
})
```

Es wird empfohlen, benutzerdefinierte Antworten in Fixture-Dateien zu speichern und diese wie folgt in Ihrem Test laden:

```js
// requires Node.js v16.14.0 or higher to support JSON import assertions
import responseFixture from './__fixtures__/apiResponse.json' assert { type: 'json' }
mock.respond(responseFixture)
```

### Mocking von Textressourcen

Wenn Sie Textressourcen wie JavaScript, CSS-Dateien oder andere textbasierte Ressourcen ändern möchten, können Sie einfach einen Dateipfad übergeben und WebdriverIO ersetzt die ursprüngliche Ressource damit, z.B.:

```js
const scriptMock = await browser.mock('**/script.min.js')
scriptMock.respond('./tests/fixtures/script.js')

// or respond with your custom JS
scriptMock.respond('alert("I am a mocked resource")')
```

### Web-Ressourcen Umleiten

Sie können eine Webressource auch einfach durch eine andere Webressource ersetzen, wenn Ihre gewünschte Antwort bereits im Web gehostet wird. Dies funktioniert sowohl mit einzelnen Seitenressourcen als auch mit einer Webseite selbst, z.B.:

```js
const pageMock = await browser.mock('https://google.com/')
await pageMock.respond('https://webdriver.io')
await browser.url('https://google.com')
console.log(await browser.getTitle()) // returns "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"
```

### Dynamische Responsen

Wenn Ihre Mock-Antwort von der ursprünglichen Ressourcenantwort abhängt, können Sie die Ressource auch dynamisch ändern, indem Sie eine Funktion übergeben, die die ursprüngliche Antwort als Parameter erhält und die Mock basierend auf dem Rückgabewert festlegt, z.B.:

```js
const mock = await browser.mock('https://todo-backend-express-knex.herokuapp.com/', {
    method: 'get'
})

mock.respond((req) => {
    // replace todo content with their list number
    return req.body.map((item, i) => ({ ...item, title: i }))
})

await browser.url('https://todobackend.com/client/index.html?https://todo-backend-express-knex.herokuapp.com/')

await $('#todo-list li').waitForExist()
console.log(await $$('#todo-list li label').map((el) => el.getText()))
// returns
// [
//   '0',  '1',  '2',  '19', '20',
//   '21', '3',  '4',  '5',  '6',
//   '7',  '8',  '9',  '10', '11',
//   '12', '13', '14', '15', '16',
//   '17', '18', '22'
// ]
```

## Mocks Fehlschlagen

Anstatt eine benutzerdefinierte Antwort zurückzugeben, können Sie die Anfrage auch einfach mit einem der folgenden HTTP-Fehler fehlschlagen lassen:

- Failed
- Aborted
- TimedOut
- AccessDenied
- ConnectionClosed
- ConnectionReset
- ConnectionRefused
- ConnectionAborted
- ConnectionFailed
- NameNotResolved
- InternetDisconnected
- AddressUnreachable
- BlockedByClient
- BlockedByResponse

Dies ist sehr nützlich, wenn Sie Skripte von Drittanbietern von Ihrer Seite blockieren möchten, wenn diese auf den Test Einfluss nehmen. Sie können einen Mock fehlschlagen lassen, indem Sie einfach `abort` oder `abortOnce` aufrufen, z.B.:

```js
const mock = await browser.mock('https://www.google-analytics.com/**')
mock.abort('Failed')
```

## Spione

Jeder Mock ist automatisch ein Spion, der die Anzahl der Anfragen zählt, die der Browser an diese Ressource gestellt hat. Wenn Sie dem Mock keine benutzerdefinierte Antwort oder Abbruchursache zuweisen, wird es mit der Standardantwort fortgesetzt, die Sie normalerweise erhalten würden. So können Sie überprüfen, wie oft der Browser die Anfrage gestellt hat, z.B.: an einen bestimmten API-Endpunkt.

```js
const mock = await browser.mock('**/user', { method: 'post' })
console.log(mock.calls.length) // returns 0

// register user
await $('#username').setValue('randomUser')
await $('password').setValue('password123')
await $('password_repeat').setValue('password123')
await $('button[type="submit"]').click()

// check if API request was made
expect(mock.calls.length).toBe(1)

// assert response
expect(mock.calls[0].body).toEqual({ success: true })
```
