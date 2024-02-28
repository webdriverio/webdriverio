---
id: mocksandspies
title: Solicitar Mocks y Espías
---

WebdriverIO comes with built-in support for modifying network responses that allows you to focus testing your frontend application without having to setup your backend or a mock server. Puede definir respuestas personalizadas para recursos web como solicitudes de API REST en su prueba y modificarlas dinámicamente.

:::info

Note that using the `mock` command requires support for Chrome DevTools protocol. That support is given if you run tests locally in a Chromium-based browser, via a Selenium Grid v4 or higher, or through a cloud vendor with support for the Chrome DevTools protocol (e.g. SauceLabs, BrowserStack, LambdaTest). Full cross-browser support will be available once the required primitives land in [Webdriver Bidi](https://wpt.fyi/results/webdriver/tests/bidi/network?label=experimental&label=master&aligned) and get implemented in the respective browser.

:::

## Crear una simulación

Antes de poder modificar cualquier respuesta que haya definido primero una simulación. Esta simulación es descrita por la url del recurso y puede ser filtrada por el [método de solicitud](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) o [encabezados](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers). El recurso soporta expresiones glob por [minimatch](https://www.npmjs.com/package/minimatch):

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

## Especificar respuestas personalizadas

Una vez que haya definido una simulación, puede definir respuestas personalizadas para ella. Estas respuestas personalizadas pueden ser un objeto para responder un JSON, un archivo local para responder con un dispositivo personalizado o un recurso web para reemplazar la respuesta con un recurso de Internet.

### Solicitudes API de Mocking

Para simular las solicitudes de API donde se espera una respuesta JSON todo lo que se necesita hacer es llamar a `responder` en el objeto simulado con un objeto arbitrario que se desea devolver, ej.:

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

También puede modificar los encabezados de respuesta, así como el código de estado, pasando algunos parámetros de respuesta simulados de la siguiente manera:

```js
mock.respond({ ... }, {
    // respond with status code 404
    statusCode: 404,
    // merge response headers with following headers
    headers: { 'x-custom-header': 'foobar' }
})
```

Si desea que el simulacro no llame al backend en absoluto, puede pasar `falso` para el indicador `fetchResponse`.

```js
mock.respond({ ... }, {
    // do not call the actual backend
    fetchResponse: false
})
```

Se recomienda almacenar respuestas personalizadas en archivos de dispositivos para que pueda solicitarlos en su prueba de la siguiente manera:

```js
// requires Node.js v16.14.0 or higher to support JSON import assertions
import responseFixture from './__fixtures__/apiResponse.json' assert { type: 'json' }
mock.respond(responseFixture)
```

### Modificando recursos de texto

Si desea modificar recursos de texto como JavaScript, archivos CSS u otros recursos basados en texto, simplemente puede pasar una ruta de archivo y WebdriverIO reemplazará el recurso original con él, por ejemplo.:

```js
const scriptMock = await browser.mock('**/script.min.js')
scriptMock.respond('./tests/fixtures/script.js')

// or respond with your custom JS
scriptMock.respond('alert("I am a mocked resource")')
```

### Redirigir los recursos web

También puede reemplazar un recurso web con otro recurso web si su respuesta deseada ya se encuentra alojada en la web. Esto funciona con recursos de página individuales así como con una página web misma, por ejemplo:

```js
const pageMock = await browser.mock('https://google.com/')
await pageMock.respond('https://webdriver.io')
await browser.url('https://google.com')
console.log(await browser.getTitle()) // returns "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"
```

### Respuestas dinámicas

Si su respuesta simulada depende de la respuesta del recurso original, también puede modificar dinámicamente el recurso pasando una función que recibe la respuesta original como parámetro y establece el simulacro en función del valor de retorno, por ejemplo.:

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

## Anular simulaciones

En lugar de devolver una respuesta personalizada, también puede abortar la petición con uno de los siguientes errores HTTP:

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

Esto es muy útil si desea bloquear secuencias de comandos de terceros de su página que tengan una influencia negativa en su prueba funcional. Puede abortar un simulacro simplemente llamando `abort` o `abortOnce`, por ejemplo:

```js
const mock = await browser.mock('https://www.google-analytics.com/**')
mock.abort('Failed')
```

## Espías

Cada simulacro es automáticamente un espía que cuenta la cantidad de peticiones que el navegador hizo a ese recurso. Si no aplica una respuesta personalizada o aborta la razón de la simulación, continúa con la respuesta por defecto que normalmente recibiría. Esto le permite comprobar cuántas veces ha hecho la petición el navegador, por ejemplo, a un determinado punto final de la API.

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
