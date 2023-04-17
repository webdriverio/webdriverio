---
id: component-testing
title: Component Testing
---

With WebdriverIOs [Browser Runner](/docs/runner#browser-runner) you can run tests within an actual desktop or mobile browser while using WebdriverIO and the WebDriver protocol to automate and interact what gets rendered on the page. This approach has [many advantages](/docs/runner#browser-runner) compared to other test frameworks that only allow testing against [JSDOM](https://www.npmjs.com/package/jsdom).

## How does it Work?

The Browser Runner uses [Vite](https://vitejs.dev/) to render a test page and initialize a test framework to run your tests in the browser. Currently it only supports Mocha but Jasmine and Cucumber are [on the roadmap](https://github.com/orgs/webdriverio/projects/1). This allows to test any kind of components even for projects that don't use Vite.

The Vite server is started by the WebdriverIO testrunner and configured so that you can use all reporter and services as you used to for normal e2e tests. Furthermore it initialises a [`browser`](/docs/api/browser) instance that allows you to access a subset of the [WebdriverIO API](/docs/api) to interact with the any elements on the page. E2e परीक्षणों के समान आप वैश्विक दायरे से जुड़े `browser` वेरिएबल के माध्यम से या `@wdio/globals` से आयात करके इस उदाहरण तक पहुंच सकते हैं, यह इस बात पर निर्भर करता है कि [`njectGlobals`](/docs/api/globals) कैसे सेट किया गया है।

## सेटअप

ब्राउज़र में यूनिट या घटक परीक्षण के लिए WebdriverIO सेट-अप करने के लिए, एक नया WebdriverIO प्रोजेक्ट आरंभ करें:

```bash
npm init wdio@latest ./
# or
yarn create wdio ./
```

एक बार कॉन्फ़िगरेशन विज़ार्ड शुरू होने के बाद, यूनिट और कॉम्पोनेन्ट परीक्षण चलाने के लिए `browser` चुनें और यदि वांछित हो तो प्रीसेट में से एक चुनें अन्यथा _"अन्य"_ के साथ जाएं यदि आप केवल मूल यूनिट परीक्षण चलाना चाहते हैं। यदि आप अपने प्रोजेक्ट में पहले से ही Vite का उपयोग करते हैं, तो आप एक कस्टम Vite कॉन्फ़िगरेशन भी कॉन्फ़िगर कर सकते हैं। अधिक जानकारी के लिए सभी [रनर विकल्प](/docs/runner#runner-options)देखें।

:::info

__नोट:__ WebdriverIO डिफ़ॉल्ट रूप से CI में ब्राउज़र परीक्षण चलाएगा, उदाहरण के लिए `CI` पर्यावरण चर `'1'` या `'true'`पर सेट है। आप रनर के लिए [`headless`](/docs/runner#headless) विकल्प का उपयोग करके मैन्युअल रूप से इस व्यवहार को कॉन्फ़िगर कर सकते हैं।

:::

इस प्रक्रिया के अंत में आपको एक `wdio.conf.js` मिलना चाहिए जिसमें विभिन्न WebdriverIO कॉन्फ़िगरेशन शामिल हैं, जिसमें `runner` प्रॉपर्टी शामिल है, उदाहरण के लिए:

```ts reference useHTTPS runmeRepository="git@github.com:webdriverio/example-recipes.git" runmeFileToOpen="component-testing%2FREADME.md"
https://github.com/webdriverio/example-recipes/blob/fd54f94306ed8e7b40f967739164dfe4d6d76b41/wdio.comp.conf.js
```

विभिन्न [क्षमताओं](/docs/configuration#capabilities) को परिभाषित करके आप अलग-अलग ब्राउज़र में अपने परीक्षण चला सकते हैं, यदि वांछित हो तो समानांतर में।

## हर्नेस परिक्षण

यह पूरी तरह आप पर निर्भर है कि आप अपने परीक्षणों में क्या चलाना चाहते हैं और आप कॉम्पोनेन्ट को कैसे प्रस्तुत करना पसंद करते हैं। हालाँकि हम [टेस्टिंग लाइब्रेरी](https://testing-library.com/) को यूटिलिटी फ्रेमवर्क के रूप में उपयोग करने की सलाह देते हैं क्योंकि यह विभिन्न घटक फ्रेमवर्क के लिए प्लगइन्स प्रदान करता है, जैसे कि React, Preact, Svelte और Vue। परीक्षण पेज में कॉम्पोनेन्ट को प्रस्तुत करने के लिए यह बहुत उपयोगी है और यह प्रत्येक परीक्षण के बाद स्वचालित रूप से इन कॉम्पोनेन्ट को क्लीन करता है।

आप अपनी इच्छानुसार WebdriverIO कमांड के साथ टेस्टिंग लाइब्रेरी प्रिमिटिव को मिला सकते हैं, जैसे:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fd54f94306ed8e7b40f967739164dfe4d6d76b41/component-testing/svelte-example.js
```

__नोट:__ टेस्टिंग लाइब्रेरी से रेंडर विधियों का उपयोग करने से परीक्षणों के बीच बनाए गए कॉम्पोनेन्ट को हटाने में मदद मिलती है। यदि आप परीक्षण लाइब्रेरी का उपयोग नहीं करते हैं तो अपने परीक्षण कॉम्पोनेन्ट को एक ऐसे कंटेनर से जोड़ना सुनिश्चित करें जो परीक्षणों के क्लीन हो जाता है।

## परीक्षण और एप्लिकेशन फ़ाइलें देखें

आप अपने ब्राउज़र परीक्षणों को डीबग करने के कई तरीके हैं। WebdriverIO टेस्टरनर को `--watch` फ़्लैग से शुरू करना सबसे आसान है, जैसे:

```sh
$ npx wdio run ./wdio.conf.js --watch
```

यह शुरू में सभी परीक्षणों के माध्यम से चलेगा और सभी के चलने के बाद रुक जाएगा। फिर आप अलग-अलग फाइलों में बदलाव कर सकते हैं, जो फिर अलग-अलग फिर से चलाए जाएंगे। यदि आप अपनी एप्लिकेशन फ़ाइलों की ओर इशारा करते हुए [`filesToWatch`](/docs/configuration#filestowatch) सेट करते हैं, तो आपके ऐप में बदलाव किए जाने पर यह सभी परीक्षणों को फिर से चलाएगा।

## डीबग करना

हालांकि आपके आईडीई में ब्रेकप्वाइंट सेट करना (अभी तक) संभव नहीं है और उन्हें दूरस्थ ब्राउज़र द्वारा पहचाना जा रहा है, आप किसी भी बिंदु पर परीक्षण को रोकने के लिए [`debug`](/docs/api/browser/debug) कमांड का उपयोग कर सकते हैं। यह आपको [स्रोत टैब](https://buddy.works/tutorials/debugging-javascript-efficiently-with-chrome-devtools)में ब्रेकप्वाइंट सेट करके परीक्षण को डीबग करने के लिए DevTools खोलने की अनुमति देता है।

जब `debug` कमांड को कॉल किया जाता है, तो आपको अपने टर्मिनल में एक Node.js repl इंटरफ़ेस मिलेगा, जो कहेगा:

```
The execution has stopped!
You can now go into the browser or use the command line as REPL
(To exit, press ^C again or type .exit)
```

परीक्षण जारी रखने के लिए `Ctrl` या `Command` + `c` दबाएं या `exit` दबाएँ।

## उदाहरण

आप हमारे [उदाहरण भंडार](https://github.com/webdriverio/component-testing-examples)में लोकप्रिय घटक ढांचे का उपयोग करके कॉम्पोनेन्ट के परीक्षण के लिए विभिन्न उदाहरण पा सकते हैं।
