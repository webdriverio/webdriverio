---
id: customservices
title: ग्राहक सेवा
---

आप अपनी आवश्यकताओं को कस्टम-फिट करने के लिए WDIO टेस्ट रनर के लिए अपनी स्वयं की कस्टम सेवा लिख सकते हैं।

सेवाएँ ऐड-ऑन हैं जो परीक्षणों को सरल बनाने, आपके परीक्षण सूट को प्रबंधित करने और परिणामों को एकीकृत करने के लिए पुन: प्रयोज्य तर्क के लिए बनाई गई हैं। सेवाओं के पास `wdio.conf.js`में उपलब्ध समान [हुक](/docs/configurationfile) तक पहुंच है।

दो प्रकार की सेवाएं हैं जिन्हें परिभाषित किया जा सकता है: एक लॉन्चर सेवा जिसकी केवल `onPrepare`, `onWorkerStart`, `onWorkerEnd` और `onComplete` हुक तक पहुंच है, जो केवल एक बार प्रति टेस्ट रन पर निष्पादित होती है, और एक कार्यकर्ता सेवा जो अन्य सभी हुक तक पहुंच है और प्रत्येक कार्यकर्ता के लिए निष्पादित किया जा रहा है। ध्यान दें कि आप दोनों प्रकार की सेवाओं के बीच (वैश्विक) चर साझा नहीं कर सकते क्योंकि कार्यकर्ता सेवाएं एक अलग (कार्यकर्ता) प्रक्रिया में चलती हैं।

एक लॉन्चर सेवा को निम्नानुसार परिभाषित किया जा सकता है:

```js
export default class CustomLauncherService {
    // If a hook returns a promise, WebdriverIO will wait until that promise is resolved to continue.
    async onPrepare(config, capabilities) {
        // TODO: something before all workers launch
    }

    onComplete(exitCode, config, capabilities) {
        // TODO: something after the workers shutdown
    }

    // custom service methods ...
}
```

जबकि एक कार्यकर्ता सेवा इस तरह दिखनी चाहिए:

```js
export default class CustomWorkerService {
    /**
     * `serviceOptions` contains all options specific to the service
     * e.g. if defined as follows:
     *
     * ```
     * services: [['custom', { foo: 'bar' }]]
     * ```
     *
     * the `serviceOptions` parameter will be: `{ foo: 'bar' }`
     */
    constructor (serviceOptions, capabilities, config) {
        this.options = serviceOptions
    }

    /**
     * this browser object is passed in here for the first time
     */
    async before(config, capabilities, browser) {
        this.browser = browser

        // TODO: something before all tests are run, e.g.:
        await this.browser.setWindowSize(1024, 768)
    }

    after(exitCode, config, capabilities) {
        // TODO: something after all tests are run
    }

    beforeTest(test, context) {
        // TODO: something before each Mocha/Jasmine test run
    }

    beforeScenario(test, context) {
        // TODO: something before each Cucumber scenario run
    }

    // other hooks or custom service methods ...
}
```

कन्स्ट्रक्टर में पास किए गए पैरामीटर के माध्यम से ब्राउज़र ऑब्जेक्ट को स्टोर करने की अनुशंसा की जाती है। अंत में निम्नलिखित के रूप में दोनों प्रकार के श्रमिकों को बेनकाब करें:

```js
import CustomLauncherService from './launcher'
import CustomWorkerService from './service'

export default CustomWorkerService
export const launcher = CustomLauncherService
```

यदि आप टाइपस्क्रिप्ट का उपयोग कर रहे हैं और यह सुनिश्चित करना चाहते हैं कि हुक विधियाँ पैरामीटर सुरक्षित हैं, तो आप अपनी सेवा वर्ग को निम्नानुसार परिभाषित कर सकते हैं:

```ts
import type { Capabilities, Options, Services } from '@wdio/types'

export default class CustomWorkerService implements Services.ServiceInstance {
    constructor (
        private _options: MyServiceOptions,
        private _capabilities: Capabilities.RemoteCapability,
        private _config: Omit<Options.Testrunner, 'capabilities'>
    ) {
        // ...
    }

    // ...
}
```

## सेवा त्रुटि प्रबंधन

रनर जारी रहने के दौरान सर्विस हुक के दौरान फेंकी गई त्रुटि को लॉग किया जाएगा। यदि आपकी सेवा में एक हुक परीक्षण धावक के सेटअप या फाड़ने के लिए महत्वपूर्ण है, तो `webdriverio` पैकेज से प्रदर्शित `SevereServiceError` उपयोग धावक को रोकने के लिए किया जा सकता है।

```js
import { SevereServiceError } from 'webdriverio'

export default class CustomServiceLauncher {
    async onPrepare(config, capabilities) {
        // TODO: something critical for setup before all workers launch

        throw new SevereServiceError('Something went wrong.')
    }

    // custom service methods ...
}
```

## मॉड्यूल से आयात सेवा

इस सेवा का उपयोग करने के लिए अब केवल यही करना है कि इसे `services` संपत्ति को असाइन करें।

आपकी `wdio.conf.js` फ़ाइल इस तरह दिखनी चाहिए:

```js
import CustomService from './service/my.custom.service'

export const config = {
    // ...
    services: [
        /**
         * use imported service class
         */
        [CustomService, {
            someOption: true
        }],
        /**
         * use absolute path to service
         */
        ['/path/to/service.js', {
            someOption: true
        }]
    ],
    // ...
}
```

## एनपीएम पर रिपोर्टर प्रकाशित करें

WebdriverIO समुदाय द्वारा रिपोर्टर को उपभोग करने और खोजने में आसान बनाने के लिए, कृपया इन अनुशंसाओं का पालन करें:

* सेवाओं को इस नेमिंग कांवेन्सन का उपयोग करना चाहिए: `wdio-*-reporter`
* एनपीएम कीवर्ड का प्रयोग करें: `wdio-plugin`, `wdio-reporter`
* `main` प्रविष्टि `export` रिपोर्टर का एक उदाहरण होना चाहिए
* उदाहरण रिपोर्टर: [`@wdio/dot-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service)

अनुशंसित नामकरण पैटर्न के बाद सेवाओं को नाम से जोड़ा जा सकता है:

```js
// Add wdio-custom-service
export const config = {
    // ...
    services: ['custom'],
    // ...
}
```

### WDIO CLI और डॉक्स में प्रकाशित सेवा जोड़ें

हम वास्तव में हर नए प्लगइन की सराहना करते हैं जो अन्य लोगों को बेहतर परीक्षण करने में मदद कर सकता है! यदि आपने ऐसा कोई प्लगइन बनाया है, तो कृपया इसे हमारे सीएलआई और डॉक्स में जोड़ने पर विचार करें ताकि इसे ढूंढना आसान हो सके।

कृपया निम्नलिखित परिवर्तनों के साथ एक पुल अनुरोध करें:

- cLI मॉड्यूल में अपनी सेवा को [समर्थित सेवाओं](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/constants.ts#L92-L128)) की सूची में जोड़ें
- अपने डॉक्स को आधिकारिक Webdriver.io पेज पर जोड़ने के लिए [सर्विस लिस्ट](https://github.com/webdriverio/webdriverio/blob/main/scripts/docs-generation/3rd-party/services.json) को एन्हांस करें
