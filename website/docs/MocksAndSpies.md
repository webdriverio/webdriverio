---
id: mocksandspies
title: Request Mocks and Spies
---

WebdriverIO comes with built in support for modifying network responses that allows you to focus testing your frontend application without having to setup your backend or a mock server. You can define custom responses for web resources like REST API requests in your test and modify them dynamically.

:::info

This feature is currently only supported when running local tests on Chrome. It is planned to be supported on [Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1591389) and [Sauce Labs](https://saucelabs.com/) soon. If you encounter problems using it please file [an issue](https://github.com/webdriverio/webdriverio/issues/new/choose) and let us know!

:::

## Creating a mock

Before you can modify any responses you have define a mock first. This mock is described by the resource url and can be filtered by the [request method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) or [headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers). The resource supports glob expressions by [minimatch](https://www.npmjs.com/package/minimatch):

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

## Specifying custom responses

Once you have defined a mock you can define custom responses for it. Those custom responses can be either an object to respond a JSON, a local file to respond with a custom fixture or a web resource to replace the response with a resource from the internet.

### Mocking API Requests

In order to mock API requests where you expect a JSON response all you need to do is to call `respond` on the mock object with an arbitrary object you want to return, e.g.:

```js
const mock = await browser.mock('https://todo-backend-express-knex.herokuapp.com/', {
    method: 'get'
})

mock.respond([{
    title: 'Injected (non) completed Todo',
    order: null,
    completed: false
}, {
    title: 'Injected completed Todo',
    order: null,
    completed: true
}])

await browser.url('https://todobackend.com/client/index.html?https://todo-backend-express-knex.herokuapp.com/')

await $('#todo-list li').waitForExist()
console.log(await $$('#todo-list li').map(el => el.getText()))
// outputs: "[ 'Injected (non) completed Todo', 'Injected completed Todo' ]"
```

You can also modify the response headers as well as the status code by passing in some mock response params as follows:

```js
mock.respond({ ... }, {
    // respond with status code 404
    statusCode: 404,
    // merge response headers with following headers
    headers: { 'x-custom-header': 'foobar' }
})
```

If you want the mock not to call the backend at all, you can pass `false` for the `fetchResponse` flag.

```js
mock.respond({ ... }, {
    // do not call the actual backend
    fetchResponse: false
})
```

It is recommend to store custom responses in fixture files so you can just require them in your test as follows:

```js
// requires Node.js v16.14.0 or higher to support JSON import assertions
import responseFixture from './__fixtures__/apiResponse.json' assert { type: 'json' }
mock.respond(responseFixture)
```

### Mocking text resources

If you like to modify text resources like JavaScript, CSS files or other text based resources you can just pass in a file path and WebdriverIO will replaces the original resource with it, e.g.:

```js
const scriptMock = await browser.mock('**/script.min.js')
scriptMock.respond('./tests/fixtures/script.js')

// or respond with your custom JS
scriptMock.respond('alert("I am a mocked resource")')
```

### Redirect web resources

You can also just replace a web resource with another web resource if your desired response is already hosted on the web. This works with individual page resources as well as with a webpage itself, e.g.:

```js
const pageMock = await browser.mock('https://google.com/')
await pageMock.respond('https://webdriver.io')
await browser.url('https://google.com')
console.log(await browser.getTitle()) // returns "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"
```

### Dynamic responses

If your mock response depends on the original resource response you can also dynamically modify the resource by passing in a function receives the original response as parameter and sets the mock based on the return value, e.g.:

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

## Aborting mocks

Instead of returning a custom response you can also just abort the request with one of the following HTTP errors:

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

This is very useful if you want to block 3rd party script from your page that have a negative influence on your functional test. You can abort a mock by just calling `abort` or `abortOnce`, e.g.:

```js
const mock = await browser.mock('https://www.google-analytics.com/**')
mock.abort('Failed')
```

## Spies

Every mock is automatically a spy that counts the amount of requests the browser made to that resource. If you don't apply a custom response or abort reason to the mock it continues with the default response you would normally receive. This allows you to check how many times the browser made the request, e.g. to a certain API endpoint.

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
