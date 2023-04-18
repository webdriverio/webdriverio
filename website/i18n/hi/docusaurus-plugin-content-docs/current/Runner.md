---
id: runner
title: Runner
---

import CodeBlock from '@theme/CodeBlock';

A runner in WebdriverIO orchestrates how and where tests are being run when using the testrunner. WebdriverIO currently supports two different types of runner: local and browser runner.

## Local Runner

The [Local Runner](https://www.npmjs.com/package/@wdio/local-runner) initiates your framework (e.g. Mocha, Jasmine or Cucumber) within worker a process and runs all your test files within your Node.js environment. Every test file is being run in a separate worker process per capability allowing for maximum concurrency. Every worker process uses a single browser instance and therefore runs its own browser session allowing for maximum isolation.

Given every test is run in its own isolated process, it is not possible to share data across test files. There are two ways to work around this:

- use the [`@wdio/shared-store-service`](https://www.npmjs.com/package/@wdio/shared-store-service) to share data across all workers
- group spec files (read more in [Organizing Test Suite](https://webdriver.io/docs/organizingsuites#grouping-test-specs-to-run-sequentially))

If nothing else is defined in the `wdio.conf.js` the Local Runner is the default runner in WebdriverIO.

### Install

To use the Local Runner you can install it via:

```sh
npm install --save-dev @wdio/local-runner
```

### Setup

The Local Runner is the default runner in WebdriverIO so there is no need to define it within your `wdio.conf.js`. If you want to explicitly set it, you can define it as follows:

```js
// wdio.conf.js
export const {
    // ...
    runner: 'local',
    // ...
}
```

## Browser Runner

[लोकल रनर](https://www.npmjs.com/package/@wdio/local-runner) के विपरीत [ब्राउज़र रनर](https://www.npmjs.com/package/@wdio/browser-runner) ब्राउज़र के भीतर फ्रेमवर्क को आरंभ और निष्पादित करता है। यह आपको JSDOM के बजाय कई अन्य परीक्षण ढाँचों की तरह एक वास्तविक ब्राउज़र में इकाई परीक्षण या घटक परीक्षण चलाने की अनुमति देता है।

जबकि [JSDOM](https://www.npmjs.com/package/jsdom) व्यापक रूप से परीक्षण उद्देश्यों के लिए उपयोग किया जाता है, यह अंत में एक वास्तविक ब्राउज़र नहीं है और न ही आप इसके साथ मोबाइल वातावरण का अनुकरण कर सकते हैं। इस रनर के साथ WebdriverIO आपको ब्राउज़र में अपने परीक्षण आसानी से चलाने और पृष्ठ पर प्रदान किए गए तत्वों के साथ इंटरैक्ट करने के लिए WebDriver कमांड का उपयोग करने में सक्षम बनाता है।

यहाँ JSDOM बनाम WebdriverIOs ब्राउज़र रनर के भीतर चल रहे परीक्षणों का अवलोकन है

|    | जेएसडीओएम                                                                                                                                                                      | WebdriverIO ब्राउज़र रनर                                                                                                            |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1. | वेब मानकों, विशेष रूप से WHATWG DOM और HTML मानकों के पुन: कार्यान्वयन का उपयोग करके Node.js के भीतर अपने परीक्षण चलाता है                                                     | आपके परीक्षण को एक वास्तविक ब्राउज़र में निष्पादित करता है और आपके उपयोगकर्ताओं द्वारा उपयोग किए जाने वाले वातावरण में कोड चलाता है |
| 2. | घटकों के साथ सहभागिता केवल जावास्क्रिप्ट के माध्यम से नकल की जा सकती है                                                                                                        | आप वेबड्राइवर प्रोटोकॉल के माध्यम से तत्वों के साथ इंटरैक्ट करने के लिए [WebdriverIO API](api) का उपयोग कर सकते हैं                 |
| 3. | कैनवास समर्थन के लिए [अतिरिक्त निर्भरताओं की आवश्यकता होती है](https://www.npmjs.com/package/canvas) और [की सीमाएँ होती हैं](https://github.com/Automattic/node-canvas/issues) | आपके पास वास्तविक [कैनवस एपीआई](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)तक पहुंच है                             |
| 4. | JSDOM में कुछ [चेतावनियाँ](https://github.com/jsdom/jsdom#caveats) और असमर्थित वेब API हैं                                                                                     | सभी वेब एपीआई एक वास्तविक ब्राउज़र में टेस्ट रन के रूप में समर्थित हैं                                                              |
| 5. | ब्राउज़र में त्रुटियों का पता लगाना असंभव है                                                                                                                                   | मोबाइल ब्राउज़र सहित सभी ब्राउज़रों के लिए समर्थन                                                                                   |
| 6. | तत्व छद्म राज्यों के लिए __नहीं__ परीक्षण कर सकते हैं                                                                                                                          | छद्म राज्यों के लिए समर्थन जैसे `: hover` या `: active`                                                                             |

यह रनर आपके परीक्षण कोड को संकलित करने और इसे ब्राउज़र में लोड करने के लिए [Vite](https://vitejs.dev/) का उपयोग करता है। यह निम्नलिखित घटक ढांचे के लिए प्रीसेट के साथ आता है:

- React
- Preact
- Vue.js
- Svelte
- SolidJS

प्रत्येक परीक्षण फ़ाइल / परीक्षण फ़ाइल समूह एक पृष्ठ के भीतर चलता है जिसका अर्थ है कि प्रत्येक परीक्षण के बीच पृष्ठ को परीक्षणों के बीच अलगाव की गारंटी देने के लिए पुनः लोड किया जा रहा है।

### इनस्टॉल

ब्राउज़र रनर का उपयोग करने के लिए आप इसे इसके माध्यम से इंस्टाल कर सकते हैं:

```sh
npm install --save-dev @wdio/browser-runner
```

### सेटअप

ब्राउज़र रनर का उपयोग करने के लिए, आपको अपनी `wdio.conf.js` फ़ाइल में `runner` गुण परिभाषित करना होगा, उदाहरण के लिए:

```js
// wdio.conf.js
निर्यात कॉन्स्ट कॉन्फ़िगरेशन = {
    // ...
    runner: 'browser',
    // ...
}
```

### रनर विकल्प

ब्राउज़र रनर निम्न कॉन्फ़िगरेशन की अनुमति देता है:

#### `preset`

यदि आप ऊपर उल्लिखित रूपरेखाओं में से किसी एक का उपयोग करके घटकों का परीक्षण करते हैं, तो आप एक पूर्व निर्धारित निर्धारित कर सकते हैं जो सुनिश्चित करता है कि सब कुछ बॉक्स से बाहर कॉन्फ़िगर किया गया है। इस विकल्प का उपयोग `viteConfig`के साथ नहीं किया जा सकता है।

__Type:__ `vue` | `svelte` | `solid` | `react` | `preact`<br /> __Example:__

```js title="wdio.conf.js"
एक्सपोर्ट const {
    // ...
    runner: ['browser', {
        preset: 'svelte'
    }],
    // ...
}
```

#### `viteConfig`

अपने स्वयं के [Vite कॉन्फ़िगरेशन](https://vitejs.dev/config/)परिभाषित करें। यदि आप विकास के लिए Vite.js का उपयोग करते हैं तो आप या तो एक कस्टम ऑब्जेक्ट पास कर सकते हैं या मौजूदा `vite.conf.ts` फ़ाइल आयात कर सकते हैं। ध्यान दें कि WebdriverIO टेस्ट हार्नेस सेट करने के लिए कस्टम Vite कॉन्फ़िगरेशन रखता है।

__Type:__ `string` or [`UserConfig`](https://github.com/vitejs/vite/blob/52e64eb43287d241f3fd547c332e16bd9e301e95/packages/vite/src/node/config.ts#L119-L272) or `(env: ConfigEnv) => UserConfig | Promise<UserConfig>`<br /> __Example:__

```js title="wdio.conf.ts"
'../vite.config.ts' से viteConfig आयात करें

निर्यात const {
     // ...
    runner: ['browser', { viteConfig }],
    // or just:
    runner: ['browser', { viteConfig: '../vites.config.ts' }],
    // or use a function if your vite config contains a lot of plugins
    // which you only want to resolve when value is read
    runner: ['browser', {
        viteConfig: () => ({
            // ...
        })
    }],
    // ...
}
```

#### `headless`

यदि `true` पर सेट किया जाता है तो रनर टेस्ट को हेडलेस चलाने के लिए क्षमताओं को अपडेट करेगा। डिफ़ॉल्ट रूप से यह सीआई वातावरण में सक्षम है जहां `CI` पर्यावरण चर `'1'` या `'true'`पर सेट है।

__Type:__ `boolean`<br /> __Default:__ `false`, set to `true` if `CI` environment variable is set

#### `rootDir`

प्रोजेक्ट रूट डायरेक्टरी।

__Type:__ `string`<br /> __Default:__ `process.cwd()`

#### `coverage`

WebdriverIO [`इस्तांबुल`](https://istanbul.js.org/)के माध्यम से परीक्षण कवरेज रिपोर्टिंग का समर्थन करता है। अधिक विवरण के लिए [कवरेज विकल्प](#coverage-options) देखें।

__Type:__ `object`<br /> __Default:__ `undefined`

### कवरेज विकल्प

निम्न विकल्प कवरेज रिपोर्टिंग को कॉन्फ़िगर करने की अनुमति देते हैं।

#### `enabled`

कवरेज संग्रह सक्षम करता है।

__Type:__ `boolean`<br /> __Default:__ `false`

#### `include`

List of files included in coverage as glob patterns.

__Type:__ `string[]`<br /> __Default:__ `[**]`

#### `exclude`

List of files excluded in coverage as glob patterns.

__Type:__ `string[]`<br /> __Default:__

```
[
  'coverage/**',
  'dist/**',
  'packages/*/test{,s}/**',
  '**/*.d.ts',
  'cypress/**',
  'test{,s}/**',
  'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
  '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
  '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
  '**/__tests__/**',
  '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
  '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
]
```

#### `extension`

List of file extensions the report should include.

__Type:__ `string | string[]`<br /> __Default:__ `['.js', '.cjs', '.mjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '.vue', '.svelte']`

#### `reportsDirectory`

Directory to write coverage report to.

__Type:__ `string`<br /> __Default:__ `./coverage`

#### `reporter`

Coverage reporters to use. See [istanbul documentation](https://istanbul.js.org/docs/advanced/alternative-reporters/) for detailed list of all reporters.

__Type:__ `string[]`<br /> __Default:__ `['text', 'html', 'clover', 'json-summary']`

#### `perFile`

Check thresholds per file. See `lines`, `functions`, `branches` and `statements` for the actual thresholds.

__Type:__ `boolean`<br /> __Default:__ `false`

#### `clean`

Clean coverage results before running tests.

__Type:__ `boolean`<br /> __Default:__ `true`

#### `lines`

Threshold for lines.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `functions`

Threshold for functions.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `branches`

Threshold for branches.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `statements`

Threshold for statements.

__Type:__ `number`<br /> __Default:__ `undefined`

### Limitations

When using the WebdriverIO browser runner, it's important to note that thread blocking dialogs like `alert` or `confirm` cannot be used natively. This is because they block the web page, which means WebdriverIO cannot continue communicating with the page, causing the execution to hang.

In such situations, WebdriverIO provides default mocks with default returned values for these APIs. This ensures that if the user accidentally uses synchronous popup web APIs, the execution would not hang. However, it's still recommended for the user to mock these web APIs for better experience. Read more in [Mocking](/docs/component-testing/mocking).

### Examples

Make sure to check out the docs around [component testing](https://webdriver.io/docs/component-testing) and have a look into the [example repository](https://github.com/webdriverio/component-testing-examples) for examples using these and various other frameworks.

