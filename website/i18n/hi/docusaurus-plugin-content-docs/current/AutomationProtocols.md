---
id: automationProtocols
title: स्वचालन प्रोटोकॉल
---

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

ऐसी बहुत सी सेवाएँ भी हैं जो आपको उच्च स्तर पर क्लाउड में अपना स्वचालन परीक्षण चलाने की अनुमति देती हैं। इन सभी ड्राइवरों को स्थानीय रूप से सेटअप करने के बजाय, आप क्लाउड में इन सेवाओं (जैसे [सॉस लैब्स](https://saucelabs.com)) से बात कर सकते हैं और उनके प्लेटफॉर्म पर परिणामों का निरीक्षण कर सकते हैं। परीक्षण स्क्रिप्ट और स्वचालन वातावरण के बीच संचार इस प्रकार दिखाई देगा:

![वेब ड्राइवर सेटअप](/img/webdriver.png)

### लाभ

- आधिकारिक W3C वेब मानक, सभी प्रमुख ब्राउज़रों द्वारा समर्थित
- सरलीकृत प्रोटोकॉल जो सामान्य उपयोगकर्ता इंटरैक्शन को कवर करता है
- मोबाइल स्वचालन के लिए समर्थन (और यहां तक कि देशी डेस्कटॉप ऐप्स)
- [सॉस लैब्स](https://saucelabs.com)जैसी सेवाओं के माध्यम से स्थानीय और साथ ही क्लाउड में उपयोग किया जा सकता है

### नुकसान

- गहन ब्राउज़र विश्लेषण के लिए डिज़ाइन नहीं किया गया है (उदाहरण के लिए, नेटवर्क ईवेंट का पता लगाना या इंटरसेप्ट करना)
- स्वचालन क्षमताओं का सीमित सेट (उदाहरण के लिए, सीपीयू या नेटवर्क को थ्रॉटल करने के लिए कोई समर्थन नहीं)
- ब्राउज़र ड्राइवर को सेलेनियम-स्टैंडअलोन/क्रोमड्राइवर/आदि के साथ सेट करने के लिए अतिरिक्त प्रयास

## DevTools प्रोटोकॉल

DevTools इंटरफ़ेस एक देशी ब्राउज़र इंटरफ़ेस है जिसका उपयोग आमतौर पर किसी दूरस्थ एप्लिकेशन (जैसे, [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/)) से ब्राउज़र को डीबग करने के लिए किया जाता है। लगभग सभी संभावित रूपों में ब्राउज़र का निरीक्षण करने की अपनी क्षमताओं के आगे, इसका उपयोग इसे नियंत्रित करने के लिए भी किया जा सकता है।

जबकि प्रत्येक ब्राउज़र का अपना आंतरिक DevTools इंटरफ़ेस हुआ करता था जो वास्तव में उपयोगकर्ता के लिए खुला नहीं था, अधिक से अधिक ब्राउज़र अब [Chrome DevTools प्रोटोकॉल](https://chromedevtools.github.io/devtools-protocol/)को अपना रहे हैं। इसका उपयोग या तो Chrome DevTools का उपयोग करके किसी वेब एप्लिकेशन को डीबग करने या [Puppeteer](https://pptr.dev)जैसे टूल का उपयोग करके क्रोम को नियंत्रित करने के लिए किया जाता है।

संचार बिना किसी प्रॉक्सी के होता है, सीधे WebSockets का उपयोग करने वाले ब्राउज़र पर:

![DevTools सेटअप](/img/devtools.png)

यदि आपके पास ब्राउज़र को स्वचालित करने के लिए विशेष आवश्यकताएं हैं, तो WebdriverIO आपको WebDriver के लिए एक वैकल्पिक स्वचालन तकनीक के रूप में DevTools क्षमताओं का उपयोग करने की अनुमति देता है। [`devtools`](https://www.npmjs.com/package/devtools) NPM पैकेज के साथ, आप उन्हीं कमांड का उपयोग कर सकते हैं जो WebDriver प्रदान करता है, जिसे तब WebdriverIO और WDIO टेस्टरनर द्वारा उस प्रोटोकॉल के शीर्ष पर उपयोगी कमांड चलाने के लिए उपयोग किया जा सकता है। यह हुड के नीचे कठपुतली का उपयोग करता है और यदि आवश्यक हो तो आपको कठपुतली के साथ कमांड का अनुक्रम चलाने की अनुमति देता है।

अपने ऑटोमेशन प्रोटोकॉल के रूप में DevTools का उपयोग करने के लिए अपने कॉन्फ़िगरेशन में `automationProtocol` फ़्लैग को `devtools` पर स्विच करें या पृष्ठभूमि में चलाए जा रहे ब्राउज़र ड्राइवर के बिना WebdriverIO चलाएं।

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

हम आपके कठपुतली कॉल को `कॉल` कमांड के भीतर व्रेप करने की सलाह देते हैं, ताकि अगले वेबड्राइवर कमांड के साथ WebdriverIO जारी रहने से पहले सभी कॉल निष्पादित हो जाएं।

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

Puppeteer इंटरफ़ेस का उपयोग करके, आपके पास ब्राउज़र और आपके एप्लिकेशन को स्वचालित या निरीक्षण करने के लिए कई नई क्षमताओं तक पहुंच है, उदाहरण के लिए इंटरसेप्टिंग नेटवर्क अनुरोध (ऊपर देखें), ब्राउज़र का पता लगाना, CPU या नेटवर्क क्षमताओं को थ्रॉटल करना, और भी बहुत कुछ।

### `wdio: devtoolsOptions` क्षमता

यदि आप DevTools पैकेज के माध्यम से WebdriverIO परीक्षण रन करते हैं, तो आप [कस्टम Puppeteer विकल्प](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions)लागू कर सकते हैं। इन विकल्पों को सीधे Puppeteer के [`लॉन्च`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions) या [`connect`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerconnectoptions) विधियों में पास किया जाएगा। अन्य कस्टम devtools विकल्प निम्नलिखित हैं:

#### customPort
क्रोम को कस्टम पोर्ट पर शुरू करें।

Type: `number`<br /> Default: `9222` (default of Puppeteer)

ध्यान दें: अगर आप `goog:chromeOptions/debuggerAddress`, `wdio:devtoolsOptions/browserWSEndpoint` या `wdio:devtoolsOptions/browserURL` विकल्प पास करते हैं, तो WebdriverIO ब्राउज़र शुरू करने के बजाय दिए गए कनेक्शन विवरण से कनेक्ट करने का प्रयास करेगा। उदाहरण के लिए आप Testingbots क्लाउड से कनेक्ट कर सकते हैं:

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

### लाभ

- अधिक स्वचालन क्षमताओं तक पहुंच (जैसे नेटवर्क इंटरसेप्शन, ट्रेसिंग आदि)
- ब्राउज़र ड्राइवरों को प्रबंधित करने की आवश्यकता नहीं है

### नुकसान

- केवल क्रोमियम आधारित ब्राउज़र (जैसे क्रोम, क्रोमियम एज) और (आंशिक रूप से) फ़ायरफ़ॉक्स का समर्थन करता है
- सॉस लैब्स, ब्राउज़रस्टैक इत्यादि जैसे क्लाउड वेंडर पर एग्जिक्युसन का समर्थन __नहीं__ करता है
