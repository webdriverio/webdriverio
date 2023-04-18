---
id: mocksandspies
title: नकली और जासूसों का अनुरोध करें
---

WebdriverIO नेटवर्क प्रतिक्रियाओं को संशोधित करने के लिए अंतर्निहित समर्थन के साथ आता है जो आपको अपने बैकएंड या नकली सर्वर को सेटअप किए बिना अपने फ्रंटएंड एप्लिकेशन के परीक्षण पर ध्यान केंद्रित करने की अनुमति देता है। आप अपने परीक्षण में REST API अनुरोधों जैसे वेब संसाधनों के लिए कस्टम प्रतिक्रियाएँ परिभाषित कर सकते हैं और उन्हें गतिशील रूप से संशोधित कर सकते हैं।

:::info

यह सुविधा वर्तमान में केवल क्रोम पर स्थानीय परीक्षण चलाते समय ही समर्थित है। इसे जल्द ही [Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1591389) और [सॉस लैब्स](https://saucelabs.com/) पर समर्थित करने की योजना है। यदि आप इसका उपयोग करने में समस्या का सामना करते हैं तो कृपया [समस्या](https://github.com/webdriverio/webdriverio/issues/new/choose) फ़ाइल करें और हमें बताएं!

:::

## एक मॉक बनाना

इससे पहले कि आप किसी प्रतिक्रिया को संशोधित कर सकें, आपको पहले एक मॉक परिभाषित करना होगा। यह नकली संसाधन यूआरएल द्वारा वर्णित है और इसे [अनुरोध विधि](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) या [हेडर](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)द्वारा फ़िल्टर किया जा सकता है। संसाधन ग्लोब एक्सप्रेशंस को [मिनिमैच](https://www.npmjs.com/package/minimatch)द्वारा समर्थित करता है:

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

## कस्टम प्रतिक्रियाओं को निर्दिष्ट करना

एक बार नकली को परिभाषित करने के बाद आप इसके लिए कस्टम प्रतिक्रियाओं को परिभाषित कर सकते हैं। वे कस्टम प्रतिक्रियाएँ या तो एक JSON का जवाब देने के लिए एक वस्तु हो सकती हैं, एक कस्टम फ़िक्चर के साथ प्रतिक्रिया करने के लिए एक स्थानीय फ़ाइल या इंटरनेट से संसाधन के साथ प्रतिक्रिया को बदलने के लिए एक वेब संसाधन।

### मॉकिंग एपीआई अनुरोध

एपीआई अनुरोधों को मॉक करने के लिए जहां आप JSON प्रतिक्रिया की अपेक्षा करते हैं, आपको बस इतना करना है कि मॉक ऑब्जेक्ट पर `respond` को कॉल करना है, जिसे आप वापस करना चाहते हैं, उदाहरण के लिए:

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

आप प्रतिक्रिया हेडर के साथ-साथ स्थिति कोड को कुछ मॉक रिस्पॉन्स पैराम में निम्नानुसार संशोधित कर सकते हैं:

```js
mock.respond({ ... }, {
    // respond with status code 404
    statusCode: 404,
    // merge response headers with following headers
    headers: { 'x-custom-header': 'foobar' }
})
```

यदि आप चाहते हैं कि मॉक बैकएंड को बिल्कुल भी कॉल न करे, तो आप `FetchResponce` फ़्लैग के लिए `false` पास कर सकते हैं।

```js
mock.respond({ ... }, {
    // do not call the actual backend
    fetchResponse: false
})
```

फ़िक्चर फ़ाइलों में कस्टम प्रतिक्रियाओं को संग्रहीत करने की अनुशंसा की जाती है ताकि आप उन्हें अपने परीक्षण में निम्नानुसार आवश्यकता कर सकें:

```js
// requires Node.js v16.14.0 or higher to support JSON import assertions
import responseFixture from './__fixtures__/apiResponse.json' assert { type: 'json' }
mock.respond(responseFixture)
```

### पाठ संसाधनों का मोच्किंग करना

यदि आप जावास्क्रिप्ट, सीएसएस फाइलों या अन्य टेक्स्ट आधारित संसाधनों जैसे टेक्स्ट संसाधनों को संशोधित करना चाहते हैं तो आप केवल फ़ाइल पथ में पास कर सकते हैं और वेबड्राइवरियो मूल संसाधन को इसके साथ बदल देगा, उदाहरण के लिए:

```js
const scriptMock = await browser.mock('**/script.min.js')
scriptMock.respond('./tests/fixtures/script.js')

// or respond with your custom JS
scriptMock.respond('alert("I am a mocked resource")')
```

### वेब संसाधनों को पुनर्निर्देशित करें

यदि आपकी वांछित प्रतिक्रिया पहले से ही वेब पर होस्ट की जा चुकी है, तो आप बस एक वेब संसाधन को दूसरे वेब संसाधन से बदल सकते हैं। यह अलग-अलग पेज संसाधनों के साथ-साथ वेबपेज के साथ भी काम करता है, उदाहरण के लिए:

```js
const pageMock = await browser.mock('https://google.com/')
await pageMock.respond('https://webdriver.io')
await browser.url('https://google.com')
console.log(await browser.getTitle()) // returns "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"
```

### गतिशील प्रतिक्रियाएँ

यदि आपकी नकली प्रतिक्रिया मूल संसाधन प्रतिक्रिया पर निर्भर करती है, तो आप फ़ंक्शन में पास करके संसाधन को गतिशील रूप से संशोधित भी कर सकते हैं, मूल प्रतिक्रिया को पैरामीटर के रूप में प्राप्त करते हैं और वापसी मूल्य के आधार पर नकली सेट करते हैं, उदाहरण के लिए:

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

## मोक को टालना

कस्टम प्रतिक्रिया वापस करने के बजाय आप निम्न HTTP त्रुटियों में से किसी एक के साथ अनुरोध को निरस्त भी कर सकते हैं:

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

यह बहुत उपयोगी है यदि आप अपने पृष्ठ से तृतीय पक्ष स्क्रिप्ट को ब्लॉक करना चाहते हैं जो आपके कार्यात्मक परीक्षण पर नकारात्मक प्रभाव डालती है। आप केवल `abort` या `abortOnce`को कॉल करके एक नकली निरस्त कर सकते हैं, उदाहरण के लिए:

```js
const mock = await browser.mock('https://www.google-analytics.com/**')
mock.abort('Failed')
```

## जासूस

हर नकली स्वचालित रूप से एक जासूस है जो उस संसाधन के लिए ब्राउज़र द्वारा किए गए अनुरोधों की मात्रा को गिनता है। यदि आप मॉक के लिए कस्टम प्रतिक्रिया या निरस्त कारण लागू नहीं करते हैं तो यह सामान्य रूप से प्राप्त होने वाली डिफ़ॉल्ट प्रतिक्रिया के साथ जारी रहता है। यह आपको यह जांचने की अनुमति देता है कि ब्राउजर ने कितनी बार अनुरोध किया है, उदाहरण के लिए एक निश्चित एपीआई एंडपॉइंट के लिए।

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
