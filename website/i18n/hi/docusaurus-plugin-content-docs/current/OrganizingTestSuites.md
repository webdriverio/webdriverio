---
id: organizingsuites
title: Organizing Test Suite
---

As projects grow, inevitably more and more integration tests are added. This increases build time and slows productivity.

To prevent this, you should run your tests in parallel. WebdriverIO already tests each spec (or _feature file_ in Cucumber) in parallel within a single session. In general, try to test only a single feature per spec file. एक फ़ाइल में बहुत अधिक या बहुत कम परीक्षण न करने का प्रयास करें। (हालांकि, यहां कोई सुनहरा नियम नहीं है।)

एक बार जब आपके परीक्षणों में कई विशिष्ट फ़ाइलें हों, तो आपको अपने परीक्षणों को समवर्ती रूप से चलाना शुरू कर देना चाहिए। ऐसा करने के लिए, अपनी कॉन्फ़िगरेशन फ़ाइल में `maxInstances` गुण समायोजित करें। WebdriverIO आपको अधिकतम संगामिति के साथ अपने परीक्षण चलाने की अनुमति देता है - जिसका अर्थ है कि आपके पास कितनी भी फाइलें और परीक्षण हों, वे सभी समानांतर में चल सकते हैं।  (यह अभी भी कुछ सीमाओं के अधीन है, जैसे आपके कंप्यूटर का CPU, समवर्ती प्रतिबंध, आदि)

> मान लीजिए कि आपके पास 3 अलग-अलग क्षमताएं हैं (क्रोम, फ़ायरफ़ॉक्स और सफारी) और आपने `maxInstances` से `1`सेट किया है। WDIO टेस्ट रनर 3 प्रोसेस को स्पॉन करेगा। इसलिए, यदि आपके पास 10 विशिष्ट फ़ाइलें हैं और आप `maxInstances` से `10`, सेट करते हैं, तो _सभी_ विशिष्ट फ़ाइलों का एक साथ परीक्षण किया जाएगा, और 30 प्रक्रियाओं को उत्पन्न किया जाएगा।

आप सभी ब्राउज़रों के लिए विशेषता सेट करने के लिए वैश्विक रूप से `maxInstances` प्रॉपर्टी को परिभाषित कर सकते हैं।

यदि आप अपना स्वयं का वेबड्राइवर ग्रिड चलाते हैं, तो आपके पास (उदाहरण के लिए) एक ब्राउज़र की तुलना में दूसरे ब्राउज़र के लिए अधिक क्षमता हो सकती है। उस स्थिति में, आप अपनी क्षमता वस्तु में `maxInstances` को _सीमित _ कर सकते हैं:

```js
// wdio.conf.js
निर्यात कॉन्स्ट कॉन्फ़िगरेशन = {
    // ...
    // set maxInstance for all browser
    maxInstances: 10,
    // ...
    capabilities: [{
        browserName: 'firefox'
    }, {
        // maxInstances can get overwritten per capability. So if you have an in-house WebDriver
        // grid with only 5 firefox instance available you can make sure that not more than
        // 5 instance gets started at a time.
        browserName: 'chrome'
    }],
    // ...
}
```

## मुख्य कॉन्फ़िग फ़ाइल से इनहेरिट करें

यदि आप अपने परीक्षण सूट को कई वातावरणों (जैसे, देव और एकीकरण) में चलाते हैं, तो यह चीजों को प्रबंधनीय रखने के लिए कई कॉन्फ़िगरेशन फ़ाइलों का उपयोग करने में मदद कर सकता है।

[पेज ऑब्जेक्ट कॉन्सेप्ट](PageObjects.md)के समान, पहली चीज़ जिसकी आपको आवश्यकता होगी वह एक मुख्य कॉन्फ़िगरेशन फ़ाइल है। इसमें आपके द्वारा परिवेशों में साझा किए गए सभी कॉन्फ़िगरेशन शामिल हैं।

फिर प्रत्येक वातावरण के लिए एक और कॉन्फ़िगरेशन फ़ाइल बनाएं, और मुख्य कॉन्फ़िगरेशन को पर्यावरण-विशिष्ट के साथ पूरक करें:

```js
// wdio.dev.config.js
import { deepmerge } from 'deepmerge-ts'
import wdioConf from './wdio.conf.js'

// have main config file as default but overwrite environment specific information
export const config = deepmerge(wdioConf.config, {
    capabilities: [
        // more caps defined here
        // ...
    ],

    // run tests on sauce instead locally
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    services: ['sauce']
}, { clone: false })

// add an additional reporter
config.reporters.push('allure')
```

## सुइट्स में ग्रुपिंग टेस्ट स्पेक्स

आप परीक्षण विनिर्देशों को सुइट में समूहीकृत कर सकते हैं और उन सभी के बजाय एकल विशिष्ट सुइट चला सकते हैं।

सबसे पहले, अपने सुइट्स को अपने WDIO कॉन्फ़िगरेशन में परिभाषित करें:

```js
// wdio.conf.js
निर्यात कॉन्स्ट कॉन्फ़िगरेशन = {
    // परिभाषित सभी परीक्षण
    स्पेक्स: ['./test/specs/**/*.spec.js'],
    // ...
    // define specific suites
    suites: {
        login: [
            './test/specs/login.success.spec.js',
            './test/specs/login.failure.spec.js'
        ],
        otherFeature: [
            // ...
        ]
    },
    // ...
}
```

अब, यदि आप केवल एक सूट चलाना चाहते हैं, तो आप सूट नाम को सीएलआई तर्क के रूप में पास कर सकते हैं:

```sh
wdio wdio.conf.js --suite login
```

या, एक साथ कई सुइट चलाएँ:

```sh
wdio wdio.conf.js --suite login --suite otherFeature
```

## क्रमिक रूप से चलाने के लिए ग्रुपिंग टेस्ट स्पेक्स

जैसा कि ऊपर वर्णित है, परीक्षणों को समवर्ती रूप से चलाने में लाभ हैं।  हालांकि, ऐसे मामले हैं जहां एक उदाहरण में अनुक्रमिक रूप से चलाने के लिए एक साथ समूह परीक्षणों के लिए यह फायदेमंद होगा।  इसके उदाहरण मुख्य रूप से वहां हैं जहां एक बड़ी सेटअप लागत होती है जैसे ट्रांसप्लिंग कोड या प्रोविजनिंग क्लाउड इंस्टेंसेस, लेकिन उन्नत उपयोग मॉडल भी हैं जो इस क्षमता से लाभान्वित होते हैं।

एकल उदाहरण में चलाने के लिए समूह परीक्षणों के लिए, उन्हें स्पेक्स परिभाषा के भीतर एक सरणी के रूप में परिभाषित करें।

```json
    "specs": [
        [
            "./test/specs/test_login.js",
            "./test/specs/test_product_order.js",
            "./test/specs/test_checkout.js"
        ],
        "./test/specs/test_b*.js",
    ],
```
उपरोक्त उदाहरण में, परीक्षण 'test_login.js', 'test_product_order.js' और 'test_checkout.js' एक ही उदाहरण में क्रमिक रूप से चलाए जाएंगे और प्रत्येक "test_b*" परीक्षण अलग-अलग उदाहरणों में समवर्ती रूप से चलेंगे।

सुइट्स में परिभाषित विशिष्टताओं को समूहीकृत करना भी संभव है, इसलिए अब आप सुइट्स को इस प्रकार भी परिभाषित कर सकते हैं:
```json
    "suites": {
        end2end: [
            [
                "./test/specs/test_login.js",
                "./test/specs/test_product_order.js",
                "./test/specs/test_checkout.js"
            ]
        ],
        allb: ["./test/specs/test_b*.js"]
},
```
और इस मामले में "end2end" सुइट के सभी परीक्षण एक ही उदाहरण में चलाए जाएंगे।

एक पैटर्न का उपयोग करके क्रमिक रूप से परीक्षण चलाते समय, यह वर्णानुक्रम में कल्पना फ़ाइलों को चलाएगा

```json
  "suites": {
    end2end: ["./test/specs/test_*.js"]
  },
```

यह उपरोक्त पैटर्न से मेल खाने वाली फाइलों को निम्न क्रम में चलाएगा:

```
  [
      "./test/specs/test_checkout.js",
      "./test/specs/test_login.js",
      "./test/specs/test_product_order.js"
  ]
```

## चयनित परीक्षण चलाएँ

कुछ मामलों में, आप अपने सुइट्स का केवल एक परीक्षण (या परीक्षणों का सबसेट) निष्पादित करना चाह सकते हैं।

`--spec` पैरामीटर के साथ, आप निर्दिष्ट कर सकते हैं कि कौन से _सुइट_ (मोचा, जैस्मीन) या _फीचर_ (कुकुम्बर) को चलाया जाना चाहिए। पथ आपकी वर्तमान कार्यशील निर्देशिका से संबंधित हल हो गया है।

उदाहरण के लिए, केवल अपना लॉगिन टेस्ट चलाने के लिए:

```sh
wdio wdio.conf.js --spec ./test/specs/e2e/login.js
```

या एक साथ कई स्पेक्स चलाएं:

```sh
wdio wdio.conf.js --spec ./test/specs/signup.js --spec ./test/specs/forgot-password.js
```

यदि `--spec` मान किसी विशेष युक्ति फ़ाइल को इंगित नहीं करता है, तो इसका उपयोग आपके कॉन्फ़िगरेशन में परिभाषित विशिष्ट फ़ाइल नामों को फ़िल्टर करने के लिए किया जाता है।

विशिष्ट फ़ाइल नामों में "संवाद" शब्द के साथ सभी विनिर्देशों को चलाने के लिए, आप इसका उपयोग कर सकते हैं:

```sh
wdio wdio.conf.js --spec dialog
```

ध्यान दें कि प्रत्येक परीक्षण फ़ाइल एकल परीक्षण रनर प्रक्रिया में चल रही है। चूंकि हम फाइलों को पहले से स्कैन नहीं करते हैं ( `wdio`पर फ़ाइल नामों को पाइप करने के बारे में जानकारी के लिए अगला भाग देखें), आप निर्देश देने के लिए अपनी कल्पना फ़ाइल के शीर्ष पर (उदाहरण के लिए) `वर्णन.केवल` उपयोग _नहीं _ कर सकते मोचा केवल उस सूट को चलाने के लिए।

यह सुविधा आपको उसी लक्ष्य को पूरा करने में मदद करेगी।

जब `--spec` विकल्प प्रदान किया जाता है, तो यह कॉन्फ़िगरेशन या क्षमता स्तर के `specs` पैरामीटर द्वारा परिभाषित किसी भी पैटर्न को ओवरराइड कर देगा।

## चयनित परीक्षण चलाएँ

जरूरत पड़ने पर, यदि आपको किसी रन से विशेष विशेष फाइल (फाइलों) को बाहर करने की आवश्यकता है, तो आप `--exclude` पैरामीटर (मोचा, जैस्मीन) या फीचर (ककड़ी) का उपयोग कर सकते हैं।

उदाहरण के लिए, अपने लॉगिन टेस्ट को टेस्ट रन से बाहर करने के लिए:

```sh
wdio wdio.conf.js --exclude ./test/specs/e2e/login.js
```

या, एक से अधिक विशिष्ट फ़ाइलें बाहर करता है:

 ```sh
wdio wdio.conf.js --exclude ./test/specs/signup.js --exclude ./test/specs/forgot-password.js
```

Or, exclude a spec file when filtering using a suite:

```sh
wdio wdio.conf.js --suite login --exclude ./test/specs/e2e/login.js
```

When the `--exclude` option is provided, it will override any patterns defined by the config or capability level's `exclude` parameter.

## Run Suites and Test Specs

Run an entire suite along with individual specs.

```sh
wdio wdio.conf.js --suite login --spec ./test/specs/signup.js
```

## Run Multiple, Specific Test Specs

It is sometimes necessary&mdash;in the context of continuous integration and otherwise&mdash;to specify multiple sets of specs to run. WebdriverIO's `wdio` command line utility accepts piped-in filenames (from `find`, `grep`, or others).

Piped-in filenames override the list of globs or filenames specified in the configuration's `spec` list.

```sh
grep -r -l --include "*.js" "myText" | wdio wdio.conf.js
```

_**Note:** This will_ not _override the `--spec` flag for running a single spec._

## Running Specific Tests with MochaOpts

You can also filter which specific `suite|describe` and/or `it|test` you want to run by passing a mocha specific argument: `--mochaOpts.grep` to the wdio CLI.

```sh
wdio wdio.conf.js --mochaOpts.grep myText
wdio wdio.conf.js --mochaOpts.grep "Text with spaces"
```

_**Note:** Mocha will filter the tests after the WDIO test runner creates the instances, so you might see several instances being spawned but not actually executed._

## Stop testing after failure

With the `bail` option, you can tell WebdriverIO to stop testing after any test fails.

This is helpful with large test suites when you already know that your build will break, but you want to avoid the lengthy wait of a full testing run.

The `bail` option expects a number, which specifies how many test failures can occur before WebDriver stop the entire testing run. The default is `0`, meaning that it always runs all tests specs it can find.

Please see [Options Page](Configuration.md) for additional information on the bail configuration.
## Run options hierarchy

When declaring what specs to run, there is a certain hierarchy defining what pattern will take precedence. Currently, this is how it works, from highest priority to lowest:

> CLI `--spec` argument > capability `specs` pattern > config `specs` pattern CLI `--exclude` argument > config `exclude` pattern > capability `exclude` pattern

If only the config parameter is given, it will be used for all capabilities. However, if defining the pattern at the capability level, it will be used instead of the config pattern. Finally, any spec pattern defined on the command line will override all other patterns given.

### Using capability-defined spec patterns

When you define a spec pattern at the capability level, it will override any patterns defined at the config level. This is useful when needing to separate tests based on differentiating device capabilities. In cases like this, it is more useful to use a generic spec pattern at the config level, and more specific patterns at the capability level.

For example, let's say you had two directories, with one for Android tests, and one for iOS tests.

Your config file may define the pattern as such, for non-specific device tests:

```js
{
    specs: ['tests/general/**/*.js']
}
```

but then, you will have different capabilities for your Android and iOS devices, where the patterns could look like such:

```json
{
  "platformName": "Android",
  "specs": [
    "tests/android/**/*.js"
  ]
}
```

```json
{
  "platformName": "iOS",
  "specs": [
    "tests/ios/**/*.js"
  ]
}
```

If you require both of these capabilities in your config file, then the Android device will only run the tests under the "android" namespace, and the iOS tests will run only tests under the "ios" namespace!

```js
//wdio.conf.js
export const config = {
    "specs": [
        "tests/general/**/*.js"
    ],
    "capabilities": [
        {
            platformName: "Android",
            specs: ["tests/android/**/*.js"],
            //...
        },
        {
            platformName: "iOS",
            specs: ["tests/ios/**/*.js"],
            //...
        },
        {
            platformName: "Chrome",
            //config level specs will be used
        }
    ]
}
```

