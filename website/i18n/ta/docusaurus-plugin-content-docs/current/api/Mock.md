---
id: mock
title: மாக் ஆப்ஜெக்ட்
---

மாக் ஆப்ஜெக்ட் என்பது ஒரு நெட்வொர்க் மாக்கை குறிக்கும் ஒரு ஆப்ஜெக்டாகும், மேலும் `url` மற்றும் `filterOptions`ல் கொடுக்கப்பட்டுள்ள கோரிக்கைகளைப் பற்றிய தகவலைக் கொண்டுள்ளது. இதை [`mock`](/docs/api/browser/mock) கட்டளையைப் பயன்படுத்தி பெறலாம்.

:::info

`mock` கட்டளையைப் பயன்படுத்த, Chrome DevTools நெறிமுறைக்கான ஆதரவு தேவை என்பதை நினைவில் கொள்ளவும். நீங்கள் Chromium அடிப்படையிலான பிரௌசரில் டெஸ்டுகளை இயக்கினால் அல்லது நீங்கள் Selenium Grid v4 அல்லது அதற்கு மேற்பட்டதைப் பயன்படுத்தினால் அந்த ஆதரவு வழங்கப்படும். கிளவுடில் தானியங்கு டெஸ்டுகளை இயக்கும்போது இந்தக் கட்டளை __not__ ஐப் பயன்படுத்த முடியாது. [Automation Protocols](/docs/automationProtocols) பிரிவில் மேலும் அறியவும்.

:::

எங்கள் [Mocks and Spies](/docs/mocksandspies) வழிகாட்டியில் WebdriverIO இல் மாக் செய்யும் கோரிக்கைகள் மற்றும் பதில்களைப் பற்றி மேலும் படிக்கலாம்.

## பண்புகள்

ஒரு மாக் ஆப்ஜெக்ட் பின்வரும் பண்புகளைக் கொண்டுள்ளது:

| பெயர்           | வகை        | விவரங்கள்                                                                                                                                                                              |
| --------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`           | `String`   | மாக் கட்டளைக்குள் அனுப்பப்பட்ட url                                                                                                                                                     |
| `filterOptions` | `Object`   | மாக் கட்டளைக்குள் அனுப்பப்பட்ட ரிசோர்ஸ் பில்டர் ஆப்ஷன்கள்                                                                                                                              |
| `browser`       | `Object`   | மாக் ஆப்ஜெக்டைப் பெற பயன்படுத்தப்பட்ட [Browser Object](/docs/api/browser).                                                                                                             |
| `calls`         | `Object[]` | `url`, `method`, `headers`, `initialPriority`, `referrerPolic`, `statusCode`, `responseHeaders` மற்றும் `body`போன்ற பண்புகளை உள்ளடக்கிய பிரௌசர் கோரிக்கைகளைப் பொருத்துவது பற்றிய தகவல் |

## மெத்தெடுகள்

மாக் ஆப்ஜெக்டுகள் `mock` பிரிவில் பட்டியலிடப்பட்டுள்ள பல்வேறு கட்டளைகளை வழங்குகின்றன, இது பயனர்கள் கோரிக்கை அல்லது பதிலின் நடத்தையை மாற்ற அனுமதிக்கிறது.

- [`abort`](/docs/api/mock/abort)
- [`abortOnce`](/docs/api/mock/abortOnce)
- [`clear`](/docs/api/mock/clear)
- [`respond`](/docs/api/mock/respond)
- [`respondOnce`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)

## நிகழ்வுகள்

மாக் ஆப்ஜெக்ட் ஒரு EventEmitter ஆகும் மற்றும் உங்கள் பயன்பாட்டிற்கு இரண்டு நிகழ்வுகள் வெளியிடப்படும்.

நிகழ்வுகளின் பட்டியல் இங்கே.

### `request`

மாக் வடிவங்களுடன் பொருந்தக்கூடிய நெட்வொர்க் கோரிக்கையைத் தொடங்கும்போது இந்த நிகழ்வு வெளியிடப்படுகிறது. நிகழ்வு அழைப்பின்போது கோரிக்கை செலுத்தப்படுகிறது.

கோரிக்கை இன்டெர்பேஸ்:
```ts
interface RequestEvent {
    requestId: number
    request: Matches
    responseStatusCode: number
    responseHeaders: Record<string, string>
}
```

### `overwrite`

நெட்வொர்க் ரெஸ்பான்ஸ் [`respond`](/docs/api/mock/respond) அல்லது [`respondOnce`](/docs/api/mock/respondOnce)உடன் மேலெழுதப்படும்போது இந்த நிகழ்வு வெளியிடப்படுகிறது. நிகழ்வு அழைப்பின்போது கோரிக்கை செலுத்தப்படுகிறது.

ரெஸ்பான்ஸ் இன்டெர்பேஸ்:
```ts
interface OverwriteEvent {
    requestId: number
    responseCode: number
    responseHeaders: Record<string, string>
    body?: string | Record<string, any>
}
```

### `fail`

நெட்வொர்க் கோரிக்கை [`abort`](/docs/api/mock/abort) அல்லது [`abortOnce`](/docs/api/mock/abortOnce)உடன் நிறுத்தப்படும்போது இந்த நிகழ்வு வெளியிடப்படுகிறது. நிகழ்வு அழைப்பின்போது பெயில் செலுத்தப்படுகிறது.

பெயில் இன்டெர்பேஸ்:
```ts
interface FailEvent {
    requestId: number
    errorReason: Protocol.Network.ErrorReason
}
```

### `match`

`continue` முன் அல்லது `overwrite`க்கு முன், புதிய பொருத்தம் சேர்க்கப்படும்போது இந்த நிகழ்வு வெளியிடப்படுகிறது. நிகழ்வு அழைப்பின்போது மேட்ச் செலுத்தப்படுகிறது.

மேட்ச் இன்டெர்பேஸ்:
```ts
interface MatchEvent {
    url: string // Request URL (without fragment).
    urlFragment?: string // Fragment of the requested URL starting with hash, if present.
    method: string // HTTP request method.
    headers: Record<string, string> // HTTP request headers.
    postData?: string // HTTP POST request data.
    hasPostData?: boolean // True when the request has POST data.
    mixedContentType?: MixedContentType // The mixed content export type of the request.
    initialPriority: ResourcePriority // Priority of the resource request at the time request is sent.
    referrerPolicy: ReferrerPolicy // The referrer policy of the request, as defined in https://www.w3.org/TR/referrer-policy/
    isLinkPreload?: boolean // Whether is loaded via link preload.
    body: string | Buffer | JsonCompatible // Body response of actual resource.
    responseHeaders: Record<string, string> // HTTP response headers.
    statusCode: number // HTTP response status code.
    mockedResponse?: string | Buffer // If mock, emitting the event, also modified it's response.
}
```

### `continue`

நெட்வொர்க் பதில் மேலெழுதப்படாமலோ அல்லது குறுக்கிடப்படாமலோ இருந்தாலோ அல்லது ரெஸ்பான்ஸ் ஏற்கனவே மற்றொரு மாக் மூலம் அனுப்பப்பட்டிருந்தாலோ இந்த நிகழ்வு வெளியிடப்படுகிறது. `requestId` நிகழ்வின் அழைப்பில் அனுப்பப்பட்டது.

## எடுத்துக்காட்டுகள்

நிலுவையில் உள்ள பல கோரிக்கைகளைப் பெறுதல்:

```js
let pendingRequests = 0
const mock = await browser.mock('**') // it is important to match all requests otherwise, the resulting value can be very confusing.
mock.on('request', ({request}) => {
    pendingRequests++
    console.log(`matched request to ${request.url}, pending ${pendingRequests} requests`)
})
mock.on('match', ({url}) => {
    pendingRequests--
    console.log(`resolved request to ${url}, pending ${pendingRequests} requests`)
})
```

404 நெட்வொர்க் பெயில் வருமின் பிழையெனப் பதிவு செய்யவும்:

```js
browser.addCommand('loadPageWithout404', (url, {selector, predicate}) => new Promise(async (resolve, reject) => {
    const mock = await this.mock('**')

    mock.on('match', ({url, statusCode}) => {
        if (statusCode === 404) {
            reject(new Error(`request to ${url} failed with "Not Found"`))
        }
    })

    await this.url(url).catch(reject)

    // waiting here, because some requests can still be pending
    if (selector) {
        await this.$(selector).waitForExist().catch(reject)
    }

    if (predicate) {
        await this.waitUntil(predicate).catch(reject)
    }

    resolve()
}))

await browser.loadPageWithout404(browser, 'some/url', { selector: 'main' })
```

மாக் ரெஸ்பான்ட் வேல்யூ பயன்படுத்தப்பட்டதா என்பதைத் தீர்மானித்தல்:

```js
const firstMock = await browser.mock('**/foo/**')
const secondMock = await browser.mock('**/foo/bar/**')

firstMock.respondOnce({id: 3, title: 'three'})
secondMock.respond({id: 4, title: 'four'})

firstMock.on('overwrite', () => {
    // triggers for first request to '**/foo/**'
}).on('continue', () => {
    // triggers for rest requests to '**/foo/**'
})

secondMock.on('continue', () => {
    // triggers for first request to '**/foo/bar/**'
}).on('overwrite', () => {
    // triggers for rest requests to '**/foo/bar/**'
})
```

இந்த எடுத்துக்காட்டில், `firstMock` முதலில் வரையறுக்கப்பட்டது மற்றும் ஒரு `respondOnce` கால் உள்ளது, எனவே `secondMock` ரெஸ்பான்ஸ் வேல்யூ முதல் கோரிக்கைக்குப் பயன்படுத்தப்படாது, ஆனால் மீதமுள்ளவற்றுக்கு பயன்படுத்தப்படும்.
