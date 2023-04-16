---
id: automationProtocols
title: स्वचालन प्रोटोकॉल
---

'@theme/Tabs'; से टैब इम्पोर्ट करें; '@theme/TabItem' से टैबआइटम इम्पोर्ट करें;

WebdriverIO के साथ, आप अपने E2E परीक्षणों को स्थानीय रूप से या क्लाउड में चलाते समय कई स्वचालन तकनीकों के बीच चयन कर सकते हैं। डिफ़ॉल्ट रूप से WebdriverIO हमेशा ऐसे ब्राउज़र ड्राइवर की जाँच करेगा जो `localhost:4444`पर WebDriver प्रोटोकॉल के अनुरूप हो। यदि उसे ऐसा ड्राइवर नहीं मिलता है तो वह हुड के नीचे पपेटियर का उपयोग करके Chrome DevTools का उपयोग करने के लिए जाता है।

लगभग सभी आधुनिक ब्राउज़र जो [WebDriver](https://w3c.github.io/webdriver/) का समर्थन करते हैं, [DevTools](https://chromedevtools.github.io/devtools-protocol/) नामक एक अन्य मूल इंटरफ़ेस का भी समर्थन करते हैं जिसका उपयोग स्वचालन उद्देश्यों के लिए किया जा सकता है।

आपके उपयोग के मामले और पर्यावरण के आधार पर दोनों के फायदे और नुकसान हैं।

## वेबड्राइवर प्रोटोकॉल

> [वेबड्राइवर](https://w3c.github.io/webdriver/) एक रिमोट कंट्रोल इंटरफ़ेस है जो उपयोगकर्ता एजेंटों के इंट्रोस्पेक्सन और नियंत्रण को सक्षम बनाता है। यह वेब ब्राउज़र के व्यवहार को दूर से निर्देश देने के लिए आउट-ऑफ़-प्रोसेस प्रोग्राम के लिए एक प्लेटफ़ॉर्म- और भाषा-तटस्थ वायर प्रोटोकॉल प्रदान करता है।

वेबड्राइवर प्रोटोकॉल को उपयोगकर्ता के दृष्टिकोण से एक ब्राउज़र को स्वचालित करने के लिए डिज़ाइन किया गया था, जिसका अर्थ है कि एक उपयोगकर्ता जो कुछ भी करने में सक्षम है, आप ब्राउज़र के साथ कर सकते हैं। यह कमांड का एक सेट प्रदान करता है जो किसी एप्लिकेशन के साथ सामान्य इंटरैक्शन को दूर करता है (उदाहरण के लिए, किसी तत्व की स्थिति को नेविगेट करना, क्लिक करना या पढ़ना)। चूंकि यह एक वेब मानक है, यह सभी प्रमुख ब्राउज़र विक्रेताओं में अच्छी तरह से समर्थित है, और इसका उपयोग [एपियम](http://appium.io)का उपयोग करके मोबाइल स्वचालन के लिए अंतर्निहित प्रोटोकॉल के रूप में भी किया जा रहा है।

इस ऑटोमेशन प्रोटोकॉल का उपयोग करने के लिए, आपको एक प्रॉक्सी सर्वर की आवश्यकता होती है जो सभी आदेशों का अनुवाद करता है और उन्हें लक्षित वातावरण (यानी ब्राउज़र या मोबाइल ऐप) में निष्पादित करता है।

ब्राउज़र ऑटोमेशन के लिए, प्रॉक्सी सर्वर आमतौर पर ब्राउज़र ड्राइवर होता है। सभी ब्राउज़रों के लिए ड्राइवर उपलब्ध हैं:

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

किसी भी तरह के मोबाइल ऑटोमेशन के लिए, आपको [एपियम](http://appium.io)को इंस्टॉल और सेटअप करना होगा। यह आपको उसी वेबड्राइवरआईओ सेटअप का उपयोग करके मोबाइल (आईओएस/एंड्रॉइड) या यहां तक कि डेस्कटॉप (मैकओएस/विंडोज) अनुप्रयोगों को स्वचालित करने की अनुमति देगा।

ऐसी बहुत सी सेवाएँ भी हैं जो आपको उच्च स्तर पर क्लाउड में अपना स्वचालन परीक्षण चलाने की अनुमति देती हैं। Instead of having to setup all these drivers locally, you can just talk to these services (e.g. [Sauce Labs](https://saucelabs.com)) in the cloud and inspect the results on their platform. The communication between test script and automation environment will look as follows:

![WebDriver Setup](/img/webdriver.png)

### Advantages

- Official W3C web standard, supported by all major browsers
- Simplified protocol that covers common user interactions
- Support for mobile automation (and even native desktop apps)
- Can be used locally as well as in the cloud through services like [Sauce Labs](https://saucelabs.com)

### Disadvantages

- Not designed for in-depth browser analysis (e.g., tracing or intercepting network events)
- Limited set of automation capabilities (e.g., no support to throttle CPU or network)
- Additional effort to set up browser driver with selenium-standalone/chromedriver/etc

## DevTools Protocol

The DevTools interface is a native browser interface that is usually being used to debug the browser from a remote application (e.g., [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/)). Next to its capabilities to inspect the browser in nearly all possible forms, it can also be used to control it.

While every browser used to have its own internal DevTools interface that was not really exposed to the user, more and more browsers are now adopting the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). It is used to either debug a web application using Chrome DevTools or control Chrome using tools like [Puppeteer](https://pptr.dev).

The communication happens without any proxy, directly to the browser using WebSockets:

![DevTools Setup](/img/devtools.png)

WebdriverIO allows you to use the DevTools capabilities as an alternative automation technology for WebDriver if you have special requirements to automate the browser. With the [`devtools`](https://www.npmjs.com/package/devtools) NPM package, you can use the same commands that WebDriver provides, which then can be used by WebdriverIO and the WDIO testrunner to run its useful commands on top of that protocol. It uses Puppeteer to under the hood and allows you to run a sequence of commands with Puppeteer if needed.

To use DevTools as your automation protocol switch the `automationProtocol` flag to `devtools` in your configurations or just run WebdriverIO without a browser driver run in the background.

<Tabs
  defaultValue="testrunner"
  values={[
    {label: 'Testrunner', value: 'testrunner'},
 {label: 'Standalone', value: 'standalone'},
 ]
}>
<TabItem value="testrunner">

```js title="wdio.conf.js"
export const config = {
    // ...
    automationProtocol: 'devtools'
    // ...
}
```
```js title="devtools.e2e.js"
describe('my test', () => {
    it('can use Puppeteer as automation fallback', async () => {
        // WebDriver command
        await browser.url('https://webdriver.io')

        // get <Puppeteer.Browser> instance (https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-class-browser)
        const puppeteer = await browser.getPuppeteer()

        // use Puppeteer interfaces
        const page = (await puppeteer.pages())[0]
        await page.setRequestInterception(true)
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().endsWith('webdriverio.png')) {
                return interceptedRequest.continue({
                    url: 'https://webdriver.io/img/puppeteer.png'
                })
            }

            interceptedRequest.continue()
        })

        // continue with WebDriver commands
        await browser.url('https://webdriver.io')

        /**
         * WebdriverIO logo is no replaced with the Puppeteer logo
         */
    })
})
```

__Note:__ there is no need to have either `selenium-standalone` or `chromedriver` services installed.

We recommend wrapping your Puppeteer calls within the `call` command, so that all calls are executed before WebdriverIO continues with the next WebDriver command.

</TabItem>
<TabItem value="standalone">

```js
import { remote } from 'webdriverio'

const browser = await remote({
    automationProtocol: 'devtools',
    capabilities: {
        browserName: 'chrome'
    }
})

// WebDriver command
await browser.url('https://webdriver.io')

// get <Puppeteer.Browser> instance (https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-class-browser)
const puppeteer = await browser.getPuppeteer()

// switch to Puppeteer to intercept requests
const page = (await puppeteer.pages())[0]
await page.setRequestInterception(true)
page.on('request', interceptedRequest => {
    if (interceptedRequest.url().endsWith('webdriverio.png')) {
        return interceptedRequest.continue({
            url: 'https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png'
        })
    }

    interceptedRequest.continue()
})

// continue with WebDriver commands
await browser.refresh()
await browser.pause(2000)

await browser.deleteSession()
```

</TabItem>
</Tabs>

By accessing the Puppeteer interface, you have access to a variety of new capabilities to automate or inspect the browser and your application, e.g. intercepting network requests (see above), tracing the browser, throttle CPU or network capabilities, and much more.

### `wdio:devtoolsOptions` Capability

If you run WebdriverIO tests through the DevTools package, you can apply [custom Puppeteer options](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions). These options will be directly passed into the [`launch`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions) or [`connect`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerconnectoptions) methods of Puppeteer. Other custom devtools options are the following:

#### customPort
Start Chrome on a custom port.

Type: `number`<br /> Default: `9222` (default of Puppeteer)

Note: if you pass in `goog:chromeOptions/debuggerAddress`, `wdio:devtoolsOptions/browserWSEndpoint` or `wdio:devtoolsOptions/browserURL` options, WebdriverIO will try to connect with given connection details rather than starting a browser. For example you can connect to Testingbots cloud via:

```js
import { format } from 'util'
import { remote } from 'webdriverio'

(async () => {
    const browser = await remote({
        capabilities: {
            'wdio:devtoolsOptions': {
                browserWSEndpoint: format(
                    `wss://cloud.testingbot.com?key=%s&secret=%s&browserName=chrome&browserVersion=latest`,
                    process.env.TESTINGBOT_KEY,
                    process.env.TESTINGBOT_SECRET
                )
            }
        }
    })

    await browser.url('https://webdriver.io')

    const title = await browser.getTitle()
    console.log(title) // returns "should return "WebdriverIO - click""

    await browser.deleteSession()
})()
```

### Advantages

- Access to more automation capabilities (e.g. network interception, tracing etc.)
- No need to manage browser drivers

### Disadvantages

- Only supports Chromium based browser (e.g. Chrome, Chromium Edge) and (partially) Firefox
- Does __not__ support execution on cloud vendors such as Sauce Labs, BrowserStack etc.
