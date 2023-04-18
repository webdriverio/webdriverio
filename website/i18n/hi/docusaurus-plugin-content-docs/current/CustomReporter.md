---
id: customreporter
title: कस्टम रिपोर्टर
---

आप WDIO टेस्ट रनर के लिए अपना खुद का कस्टम रिपोर्टर लिख सकते हैं जो आपकी आवश्यकताओं के अनुरूप है। और यह आसान है!

आपको केवल एक नोड मॉड्यूल बनाना है जो `@wdio/reporter` पैकेज से प्राप्त होता है, ताकि यह परीक्षण से संदेश प्राप्त कर सके।

मूल सेटअप इस तरह दिखना चाहिए:

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    constructor(options) {
        /*
         * make reporter to write to the output stream by default
         */
        options = Object.assign(options, { stdout: true })
        super(options)
    }

    onTestPass(test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`)
    }
}
```

इस रिपोर्टर का उपयोग करने के लिए, आपको केवल अपने कॉन्फ़िगरेशन में `reporter` गुण को असाइन करना है।


आपकी `wdio.conf.js` फ़ाइल इस तरह दिखनी चाहिए:

```js
import CustomReporter from './reporter/my.custom.reporter'

export const config = {
    // ...
    reporters: [
        /**
         * use imported reporter class
         */
        [CustomReporter, {
            someOption: 'foobar'
        }]
        /**
         * use absolute path to reporter
         */
        ['/path/to/reporter.js', {
            someOption: 'foobar'
        }]
    ],
    // ...
}
```

आप रिपोर्टर को एनपीएम में भी प्रकाशित कर सकते हैं ताकि हर कोई इसका उपयोग कर सके। पैकेज को अन्य रिपोर्टर `wdio-<reportername>-reporter`की तरह नाम दें, और इसे `wdio` या `wdio-reporter`जैसे कीवर्ड के साथ टैग करें।

## इवेंट प्रबंधकर्ता

आप परीक्षण के दौरान ट्रिगर होने वाली कई घटनाओं के लिए एक ईवेंट हैंडलर पंजीकृत कर सकते हैं। निम्नलिखित सभी हैंडलर वर्तमान स्थिति और प्रगति के बारे में उपयोगी जानकारी के साथ पेलोड प्राप्त करेंगे।

इन पेलोड ऑब्जेक्ट्स की संरचना घटना पर निर्भर करती है, और फ्रेमवर्क (मोचा, जेसमीन, और कुकुम्बर) में एकीकृत होती है। एक बार जब आप एक कस्टम रिपोर्टर लागू कर लेते हैं, तो उसे सभी रूपरेखाओं के लिए काम करना चाहिए।

निम्न सूची में वे सभी संभावित विधियाँ हैं जिन्हें आप अपने रिपोर्टर वर्ग में जोड़ सकते हैं:

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    onRunnerStart() {}
    onBeforeCommand() {}
    onAfterCommand() {}
    onSuiteStart() {}
    onHookStart() {}
    onHookEnd() {}
    onTestStart() {}
    onTestPass() {}
    onTestFail() {}
    onTestSkip() {}
    onTestEnd() {}
    onSuiteEnd() {}
    onRunnerEnd() {}
}
```

विधि के नाम बहुत आत्म व्याख्यात्मक हैं।

किसी निश्चित घटना पर कुछ प्रिंट करने के लिए, `this.write(...)` विधि का उपयोग करें, जो मूल `WDIOReporter` वर्ग द्वारा प्रदान की जाती है। यह या तो सामग्री को `stdout`पर स्ट्रीम करता है, या लॉग फ़ाइल में (रिपोर्टर के विकल्पों के आधार पर)।

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    onTestPass(test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`)
    }
}
```

ध्यान दें कि आप किसी भी तरह से परीक्षण निष्पादन को स्थगित नहीं कर सकते।

सभी ईवेंट हैंडलर्स को सिंक्रोनस रूटीन निष्पादित करना चाहिए (या आप दौड़ की स्थिति में चलेंगे)।

[उदाहरण अनुभाग](https://github.com/webdriverio/webdriverio/tree/main/examples/wdio) को देखना सुनिश्चित करें जहां आपको एक उदाहरण कस्टम रिपोर्टर मिल सकता है जो प्रत्येक ईवेंट के लिए ईवेंट का नाम प्रिंट करता है।

यदि आपने एक कस्टम रिपोर्टर लागू किया है जो समुदाय के लिए उपयोगी हो सकता है, तो पुल अनुरोध करने में संकोच न करें ताकि हम रिपोर्टर को जनता के लिए उपलब्ध करा सकें!

इसके अलावा, यदि आप `Launcher` इंटरफ़ेस के माध्यम से WDIO टेस्टरनर चलाते हैं, तो आप कस्टम रिपोर्टर को निम्नानुसार फ़ंक्शन के रूप में लागू नहीं कर सकते हैं:

```js
import Launcher from '@wdio/cli'

import CustomReporter from './reporter/my.custom.reporter'

const launcher = new Launcher('/path/to/config.file.js', {
    // this will NOT work, because CustomReporter is not serializable
    reporters: ['dot', CustomReporter]
})
```

## `isSynchronised` होने तक प्रतीक्षा करें

यदि आपके रिपोर्टर को डेटा की रिपोर्ट करने के लिए async संचालन निष्पादित करना है (उदाहरण के लिए लॉग फ़ाइलों या अन्य संपत्तियों का अपलोड) तो आप अपने कस्टम रिपोर्टर में `isSynchronised` विधि को अधिलेखित कर सकते हैं ताकि WebdriverIO रनर को तब तक प्रतीक्षा करने दिया जा सके जब तक आप सब कुछ गणना नहीं कर लेते। इसका एक उदाहरण [`@wdio/sumologic-reporter`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-sumologic-reporter/src/index.js)में देखा जा सकता है:

```js
export default class SumoLogicReporter extends WDIOReporter {
    constructor (options) {
        // ...
        this.unsynced = []
        this.interval = setInterval(::this.sync, this.options.syncInterval)
        // ...
    }

    /**
     * overwrite isSynchronised method
     */
    get isSynchronised () {
        return this.unsynced.length === 0
    }

    /**
     * sync log files
     */
    sync () {
        // ...
        request({
            method: 'POST',
            uri: this.options.sourceAddress,
            body: logLines
        }, (err, resp) => {
            // ...
            /**
             * remove transferred logs from log bucket
             */
            this.unsynced.splice(0, MAX_LINES)
            // ...
        }
    }
}
```

इस तरह रनर तब तक प्रतीक्षा करेगा जब तक कि सभी लॉग जानकारी अपलोड नहीं हो जाती।

## एनपीएम पर रिपोर्टर प्रकाशित करें

WebdriverIO समुदाय द्वारा रिपोर्टर को उपभोग करने और खोजने में आसान बनाने के लिए, कृपया इन अनुशंसाओं का पालन करें:

* सेवाओं को इस नेमिंग कांवेन्सन का उपयोग करना चाहिए: `wdio-*-reporter`
* एनपीएम कीवर्ड का प्रयोग करें: `wdio-plugin`, `wdio-reporter`
* `main` प्रविष्टि `export` रिपोर्टर का एक उदाहरण होना चाहिए
* उदाहरण रिपोर्टर: [`@wdio/dot-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-dot-reporter)

अनुशंसित नामकरण पैटर्न के बाद सेवाओं को नाम से जोड़ा जा सकता है:

```js
// Add wdio-custom-reporter
export const config = {
    // ...
    reporter: ['custom'],
    // ...
}
```

### WDIO CLI और डॉक्स में प्रकाशित सेवा जोड़ें

हम वास्तव में हर नए प्लगइन की सराहना करते हैं जो अन्य लोगों को बेहतर परीक्षण करने में मदद कर सकता है! यदि आपने ऐसा कोई प्लगइन बनाया है, तो कृपया इसे हमारे सीएलआई और डॉक्स में जोड़ने पर विचार करें ताकि इसे ढूंढना आसान हो सके।

कृपया निम्नलिखित परिवर्तनों के साथ एक पुल अनुरोध करें:

- cLI मॉड्यूल में अपनी सेवा को [समर्थित रिपोर्टर](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/constants.ts#L74-L91)) की सूची में जोड़ें
- अपने डॉक्स को आधिकारिक Webdriver.io पेज पर जोड़ने के लिए [रिपोर्टर सूची](https://github.com/webdriverio/webdriverio/blob/main/scripts/docs-generation/3rd-party/reporters.json) को एन्हांस करें
