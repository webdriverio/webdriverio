---
id: frameworks
title: फ्रेमवर्क
---

WDIO रनर वर्तमान में [Mocha](http://mochajs.org/),  [Jasmine](http://jasmine.github.io/), और [कुकुम्बर](https://cucumber.io/)का समर्थन करता है।

WebdriverIO के साथ प्रत्येक ढांचे को एकीकृत करने के लिए, एनपीएम पर एडॉप्टर पैकेज हैं जिन्हें स्थापित किया जाना चाहिए। आप एडेप्टर को कहीं भी स्थापित नहीं कर सकते हैं; इन पैकेजों को उसी स्थान पर स्थापित किया जाना चाहिए जहाँ WebdriverIO स्थापित है। इसलिए, यदि आपने WebdriverIO को विश्व स्तर पर स्थापित किया है, तो विश्व स्तर पर एडेप्टर पैकेज को भी स्थापित करना सुनिश्चित करें।

आपकी विशिष्ट फ़ाइलों (या चरण परिभाषाओं) के भीतर, आप वैश्विक चर `browser`का उपयोग करके वेबड्राइवर उदाहरण तक पहुँच सकते हैं। आपको सेलेनियम सत्र आरंभ करने या समाप्त करने की आवश्यकता नहीं है। यह `wdio` परीक्षक द्वारा ध्यान रखा जाता है।)

## मोचा का उपयोग करना

सबसे पहले, एनपीएम से एडॉप्टर पैकेज इनस्टॉल करें:

```bash npm2yarn
एनपीएम इंस्टॉल @wdio/mocha-framework --save-dev
```

डिफ़ॉल्ट रूप से WebdriverIO एक [अभिकथन लाइब्रेरी](Assertion.md) प्रदान करता है जो अंतर्निहित है जिसमें आप तुरंत प्रारंभ कर सकते हैं:

```js
describe('my awesome website', () => {
    it('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

WebdriverIO Mocha के `BDD` (डिफ़ॉल्ट), `TDD`और `QUnit` [इंटरफेस](https://mochajs.org/#interfaces)का समर्थन करता है।

If you like to write your specs in TDD style, set the `ui` property in your `mochaOpts` config to `tdd`. Now your test files should be written like this:

```js
suite('my awesome website', () => {
    test('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

If you want to define other Mocha-specific settings, you can do it with the `mochaOpts` key in your configuration file. A list of all options can be found on the [Mocha project website](https://mochajs.org/api/mocha).

__Note:__ WebdriverIO does not support the deprecated usage of `done` callbacks in Mocha:

```js
it('should test something', (done) => {
    done() // throws "done is not a function"
})
```

If you want to run something asynchronously, you can either use the [`browser.call`](/docs/api/browser/call) command or [custom commands](CustomCommands.md).

### Mocha Options

The following options can be applied in your `wdio.conf.js` to configure your Mocha environment. __Note:__ not all options are supported, e.g. applying the `parallel` option will cause an error as the WDIO testrunner has its own way to run tests in parallel. हालांकि निम्नलिखित विकल्प समर्थित हैं:

#### require
जब आप कुछ बुनियादी कार्यक्षमता (वेबड्राइवरआईओ फ्रेमवर्क विकल्प) को जोड़ना या बढ़ाना चाहते हैं तो `require` विकल्प उपयोगी है।

Type: `string|string[]`<br /> Default: `[]`

#### compilers
Use the given module(s) to compile files. Compilers will be included before requires (WebdriverIO framework option).

Type: `string[]`<br /> Default: `[]`

#### allowUncaught
Propagate uncaught errors.

Type: `boolean`<br /> Default: `false`

#### bail
Bail after first test failure.

Type: `boolean`<br /> Default: `false`

#### checkLeaks
Check for global variable leaks.

Type: `boolean`<br /> Default: `false`

#### delay
Delay root suite execution.

Type: `boolean`<br /> Default: `false`

#### fgrep
Test filter given string.

Type: `string`<br /> Default: `null`

#### forbidOnly
Tests marked `only` fail the suite.

Type: `boolean`<br /> Default: `false`

#### forbidPending
Pending tests fail the suite.

Type: `boolean`<br /> Default: `false`

#### fullTrace
Full stacktrace upon failure.

Type: `boolean`<br /> Default: `false`

#### global
Variables expected in global scope.

Type: `string[]`<br /> Default: `[]`

#### grep
Test filter given regular expression.

Type: `RegExp|string`<br /> Default: `null`

#### invert
Invert test filter matches.

Type: `boolean`<br /> Default: `false`

#### retries
Number of times to retry failed tests.

Type: `number`<br /> Default: `0`

#### timeout
Timeout threshold value (in ms).

Type: `number`<br /> Default: `30000`

## Using Jasmine

First, install the adapter package from NPM:

```bash npm2yarn
npm install @wdio/jasmine-framework --save-dev
```

You can then configure your Jasmine environment by setting a `jasmineOpts` property in your config. A list of all options can be found on the [Jasmine project website](https://jasmine.github.io/api/3.5/Configuration.html).

### Intercept Assertion

The Jasmine framework allows it to intercept each assertion in order to log the state of the application or website, depending on the result.

For example, it is pretty handy to take a screenshot every time an assertion fails. In your `jasmineOpts` you can add a property called `expectationResultHandler` that takes a function to execute. The function’s parameters provide information about the result of the assertion.

The following example demonstrates how to take a screenshot if an assertion fails:

```js
jasmineOpts: {
    defaultTimeoutInterval: 10000,
    expectationResultHandler: function(passed, assertion) {
        /**
         * only take screenshot if assertion failed
         */
        if(passed) {
            return
        }

        browser.saveScreenshot(`assertionError_${assertion.error.message}.png`)
    }
},
```

**Note:** You cannot stop test execution to do something async. It might happen that the command takes too much time and the website state has changed. (Though usually, after another 2 commands the screenshot is taken anyway, which still gives _some_ valuable information about the error.)

### Jasmine Options

The following options can be applied in your `wdio.conf.js` to configure your Jasmine environment using the `jasmineOpts` property. For more information on these configuration options, check out the [Jasmine docs](https://jasmine.github.io/api/edge/Configuration).

#### defaultTimeoutInterval
Default Timeout Interval for Jasmine operations.

Type: `number`<br /> Default: `60000`

#### helpers
Array of filepaths (and globs) relative to spec_dir to include before jasmine specs.

Type: `string[]`<br /> Default: `[]`

#### requires
The `requires` option is useful when you want to add or extend some basic functionality.

Type: `string[]`<br /> Default: `[]`

#### random
Whether to randomize spec execution order.

Type: `boolean`<br /> Default: `true`

#### seed
Seed to use as the basis of randomization. Null causes the seed to be determined randomly at the start of execution.

Type: `Function`<br /> Default: `null`

#### failSpecWithNoExpectations
Whether to fail the spec if it ran no expectations. By default a spec that ran no expectations is reported as passed. Setting this to true will report such spec as a failure.

Type: `boolean`<br /> Default: `false`

#### oneFailurePerSpec
Whether to cause specs to only have one expectation failure.

Type: `boolean`<br /> Default: `false`

#### specFilter
स्पेक्स फ़िल्टर उपयोग करने के लिए फंक्शन।

Type: `Function`<br /> Default: `(spec) => true`

#### grep
केवल इस स्ट्रिंग या regexp से मेल खाने वाले परीक्षण चलाएँ। (केवल तभी लागू होता है जब कोई कस्टम `specFilter` फ़ंक्शन सेट न हो)

Type: `string|Regexp`<br /> Default: `null`

#### invertGrep
यदि सही है तो यह मेल खाने वाले परीक्षणों को उलट देता है और केवल ऐसे परीक्षण चलाता है जो `grep`में प्रयुक्त अभिव्यक्ति से मेल नहीं खाते हैं। (केवल तभी लागू होता है जब कोई कस्टम `specFilter` फ़ंक्शन सेट न हो)

Type: `boolean`<br /> Default: `false`

## कुकुम्बर का उपयोग

सबसे पहले, एनपीएम से एडॉप्टर पैकेज इनस्टॉल करें:

```bash npm2yarn
npm install @wdio/cucumber-framework --save-dev
```

यदि आप कुकुम्बर का उपयोग करना चाहते हैं, तो `framework` प्रॉपर्टी को `cucumber` में `framework: 'cucumber'` जोड़कर [कॉन्फिग फाइल](ConfigurationFile.md)।

कुकुम्बर के लिए विकल्प कॉन्फ़िग फ़ाइल में `cucumberOpts`के साथ दिए जा सकते हैं। विकल्पों की पूरी सूची देखें [यहाँ](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options)।

कुकुम्बर के साथ जल्दी उठने और दौड़ने के लिए, हमारे [`cucumber-boilerplate`](https://github.com/webdriverio/cucumber-boilerplate) प्रोजेक्ट पर एक नज़र डालें, जो उन सभी चरण परिभाषाओं के साथ आता है जिनकी आपको घूरने की ज़रूरत है, और आप तुरंत फ़ीचर फ़ाइलें लिख रहे होंगे।

### कुकुम्बर विकल्प

निम्नलिखित विकल्पों को आपके `wdio.conf.js` में `cucumberOpts` गुण का उपयोग करके अपने खीरा वातावरण को कॉन्फ़िगर करने के लिए लागू किया जा सकता है:

#### backtrace
त्रुटियों के लिए पूर्ण बैकट्रैक दिखाएं।

Type: `Boolean`<br /> Default: `true`

#### requireModule
किसी भी समर्थन फ़ाइल की आवश्यकता से पहले मॉड्यूल की आवश्यकता होती है।

Type: `string[]`<br /> Default: `[]`<br /> Example:

```js
cucumberOpts: {
    requireModule: ['@babel/register']
    // or
    requireModule: [
        [
            '@babel/register',
            {
                rootMode: 'upward',
                ignore: ['node_modules']
            }
        ]
    ]
 }
 ```

#### failAmbiguousDefinitions
अस्पष्ट परिभाषाओं को त्रुटियों के रूप में मानें। कृपया ध्यान दें कि यह `@wdio/cucumber-framework` विशिष्ट विकल्प है और इसे खीरा-js द्वारा ही पहचाना नहीं गया है।

Type: `boolean`<br /> Default: `false`

#### failFast
पहली बार असफल होने पर रन होने को रोक दें।

Type: `boolean`<br /> Default: `false`

#### ignoreUndefinedDefinitions
अपरिभाषित परिभाषाओं को चेतावनियों के रूप में मानें। कृपया ध्यान दें कि यह @wdio/cucumber-framework विशिष्ट विकल्प है और इसे cucumber-js द्वारा ही पहचाना नहीं गया है।

Type: `boolean`<br /> Default: `false`

#### names
केवल उन परिदृश्यों को निष्पादित करें जिनके नाम अभिव्यक्ति (दोहराने योग्य) से मेल खाते हैं।

Type: `RegExp[]`<br /> Default: `[]`

#### profile
उपयोग करने के लिए प्रोफ़ाइल निर्दिष्ट करें।

Type: `string[]`<br /> Default: `[]`

#### require
सुविधाओं को निष्पादित करने से पहले आपकी चरण परिभाषाओं वाली फ़ाइलों की आवश्यकता होती है। आप अपनी चरण परिभाषाओं के लिए एक ग्लोब भी निर्दिष्ट कर सकते हैं।

Type: `string[]`<br /> Default: `[]` Example:

```js
cucumberOpts: {
    require: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### snippetSyntax
एक कस्टम स्निपेट सिंटैक्स निर्दिष्ट करें।

Type: `string`<br /> Default: `null`

#### snippets
लंबित चरणों के लिए चरण परिभाषा स्निपेट छुपाएं.

Type: `boolean`<br /> Default: `true`

#### source
स्रोत यूरी छुपाएं।

Type: `boolean`<br /> Default: `true`

#### strict
कोई अपरिभाषित या लंबित चरण होने पर विफल।

Type: `boolean`<br /> Default: `false`

#### tagExpression
अभिव्यक्ति से मेल खाने वाले टैग के साथ केवल सुविधाओं या परिदृश्यों को निष्पादित करें। अधिक विवरण के लिए कृपया [कुकुम्बर दस्तावेज़](https://docs.cucumber.io/cucumber/api/#tag-expressions) देखें।

Type: `string`<br /> Default: `null`

#### tagsInTitle
फीचर या परिदृश्य नाम में कुकुम्बर टैग जोड़ें।

Type: `boolean`<br /> Default: `false`

#### timeout
स्टेप परिभाषाओं के लिए मिलीसेकंड में टाइमआउट।

Type: `number`<br /> Default: `30000`

### कुकुम्बर में स्किपिंग परीक्षण

ध्यान दें कि यदि आप `cucumberOpts`में उपलब्ध नियमित खीरा परीक्षण फ़िल्टरिंग क्षमताओं का उपयोग करके एक परीक्षण छोड़ना चाहते हैं, तो आप इसे क्षमताओं में कॉन्फ़िगर किए गए सभी ब्राउज़रों और उपकरणों के लिए करेंगे। यदि आवश्यक न हो तो सत्र शुरू किए बिना केवल विशिष्ट क्षमताओं के संयोजन के लिए परिदृश्यों को छोड़ने में सक्षम होने के लिए, वेबड्राइवरियो ककड़ी के लिए निम्नलिखित विशिष्ट टैग सिंटैक्स प्रदान करता है:

`@skip([condition])`

वेयर स्थिति उनके मानों के साथ क्षमताओं गुणों का एक वैकल्पिक संयोजन है, जब **सभी** से मेल खाते हैं, तो टैग किए गए परिदृश्य या सुविधा को छोड़ दिया जाता है। बेशक आप कई अलग-अलग परिस्थितियों में परीक्षण छोड़ने के लिए परिदृश्यों और सुविधाओं में कई टैग जोड़ सकते हैं।

आप `टैगएक्सप्रेशन' को बदले बिना परीक्षण छोड़ने के लिए '@tagExpression' का भी उपयोग कर सकते हैं। In this case the skipped tests will be displayed in the test report.

Here you have some examples of this syntax:
- `@skip` or `@skip()`: will always skip the tagged item
- `@skip(browserName="chrome")`: the test will not be executed against chrome browsers.
- `@skip(browserName="firefox";platformName="linux")`: will skip the test in firefox over linux executions.
- `@skip(browserName=["chrome","firefox"])`: tagged items will be skipped for both chrome and firefox browsers.
- `@skip(browserName=/i.*explorer/`: capabilities with browsers matching the regexp will be skipped (like `iexplorer`, `internet explorer`, `internet-explorer`, ...).

### Import Step Definition Helper

In order to use step definition helper like `Given`, `When` or `Then` or hooks, you are suppose to import then from `@cucumber/cucumber`, e.g. like this:

```js
import { Given, When, Then } from '@cucumber/cucumber'
```

Now, if you use Cucumber already for other types of tests unrelated to WebdriverIO for which you use a specific version you need to import these helpers in your e2e tests from the WebdriverIO Cucumber package, e.g.:

```js
import { Given, When, Then } from '@wdio/cucumber-framework'
```

This ensures that you use the right helpers within the WebdriverIO framework and allows you to use an independant Cucumber version for other types of testing.
