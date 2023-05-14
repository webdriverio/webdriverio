---
id: mocksandspies
title: மாக்ஸ் மற்றும் ஸ்பைகளைக் கோருங்கள்
---

WebdriverIO ஆனது நெட்ஒர்க் ரெஸ்பான்சுகளை மாற்றியமைப்பதற்கான ஆதரவுடன் வருகிறது, இது உங்கள் பின்தளம் அல்லது மாக் சேவையகத்தை அமைக்காமல் உங்கள் முன்பக்கம் பயன்பாட்டைச் சோதிப்பதில் கவனம் செலுத்த அனுமதிக்கிறது. உங்கள் டெஸ்டில் REST API கோரிக்கைகள் போன்ற இணைய ஆதாரங்களுக்கான தனிப்பயன் பதில்களை நீங்கள் வரையறுத்து அவற்றை மாறும் வகையில் மாற்றலாம்.

:::info

Chrome இல் லோக்கல் டெஸ்டுகளை இயக்கும்போது மட்டுமே இந்த அம்சம் தற்போது ஆதரிக்கப்படுகிறது. இது விரைவில் [Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1591389) மற்றும் [Sauce Labs](https://saucelabs.com/) இல் ஆதரிக்கப்பட திட்டமிடப்பட்டுள்ளது. இதைப் பயன்படுத்துவதில் உங்களுக்குச் சிக்கல்கள் ஏற்பட்டால், தயவுசெய்து [an issue](https://github.com/webdriverio/webdriverio/issues/new/choose) ஐப் பதிவுசெய்து எங்களுக்குத் தெரியப்படுத்துங்கள்!

:::

## ஒரு மாக் உருவாக்கம்

நீங்கள் எந்த ரெஸ்பான்சுகளையும் மாற்றுவதற்கு முன், நீங்கள் முதலில் ஒரு மாக்கை வரையறுக்க வேண்டும். இந்த மாக்கானது ரிசோர்ஸ் url ஆல் விவரிக்கப்பட்டுள்ளது மற்றும் [request method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) அல்லது [ headers ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)மூலம் பில்டர் செய்யலாம். ரிசோர்ஸ் குளோப் வெளிப்பாடுகளை [minimatch](https://www.npmjs.com/package/minimatch)ஆல் ஆதரிக்கிறது:

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

## தனிப்பயன் பதில்களைக் குறிப்பிடுதல்

நீங்கள் ஒரு மாக்கை வரையறுத்தவுடன், அதற்கான தனிப்பயன் பதில்களை நீங்கள் வரையறுக்கலாம். அந்தத் தனிப்பயன் பதில்கள் JSONக்கு பதிலளிக்கும் ஆப்ஜெக்டாக இருக்கலாம், தனிப்பயன் சாதனத்துடன் பதிலளிக்கும் லோக்கல் பைல் அல்லது பதிலை இணையத்தில் உள்ள ரிசோர்சுடன் மாற்றுவதற்கான வலை ரிசோர்சாக இருக்கலாம்.

### மாக்கிங் API கோரிக்கைகள்

நீங்கள் JSON பதிலை எதிர்பார்க்கும் API கோரிக்கைகளை மாக் செய்ய, நீங்கள் செய்ய வேண்டியதெல்லாம், நீங்கள் ரிட்டர்ன் செய்ய விரும்பும் ஒரு தன்னிச்சையான ஆப்ஜெக்டுடன் மாக் ஆப்ஜெக்டை`respond` அழைக்க வேண்டும், எ.கா.:

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

சில மாக் ரெஸ்பான்ஸ் பேராம்ஸ்களில் பின்வருவனவற்றை அனுப்புவதன் மூலம் நீங்கள் ரெஸ்பான்ஸ் headersகளையும் ஸ்டேட்டஸ் கோடையும் மாற்றலாம்:

```js
mock.respond({ ... }, {
    // respond with status code 404
    statusCode: 404,
    // merge response headers with following headers
    headers: { 'x-custom-header': 'foobar' }
})
```

மாக்கானது பின்தளத்தை அழைக்கவே கூடாது என நீங்கள் விரும்பினால், `fetchResponse` பிளாகிற்கு `false` அனுப்பலாம்.

```js
mock.respond({ ... }, {
    // do not call the actual backend
    fetchResponse: false
})
```

தனிப்பயன் பதில்களை ஃபிக்சர் பைல்களில் சேமிக்க பரிந்துரைக்கப்படுகிறது, எனவே அவற்றை உங்கள் டெஸ்டில் பின்வருமாறு தேவைப்படுத்தலாம்:

```js
// requires Node.js v16.14.0 or higher to support JSON import assertions
import responseFixture from './__fixtures__/apiResponse.json' assert { type: 'json' }
mock.respond(responseFixture)
```

### மாக் டெக்ஸ்ட் ரிசோர்சுகள்

JavaScript, CSS பைல்கள் அல்லது பிற டெக்ஸ்ட் அடிப்படையிலான ரிசோர்சுகளை நீங்கள் மாற்ற விரும்பினால், நீங்கள் ஒரு பைல் பாத்தில் பாஸ் செய்யலாம் மற்றும் WebdriverIO அசல் ரிசோர்சை அதனுடன் மாற்றும், எ.கா.:

```js
const scriptMock = await browser.mock('**/script.min.js')
scriptMock.respond('./tests/fixtures/script.js')

// or respond with your custom JS
scriptMock.respond('alert("I am a mocked resource")')
```

### வலை ரிசோர்சுகளை திருப்பி விடவும்

நீங்கள் விரும்பிய பதில் இணையத்தில் ஏற்கனவே ஹோஸ்ட் செய்யப்பட்டிருந்தால், வலை ரிசோர்சை மற்றொரு வலை ரிசோர்சுடன் மாற்றலாம். This works with individual page resources as well as with a webpage itself, e.g.:

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
