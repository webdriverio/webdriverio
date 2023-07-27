---
id: component-testing
title: कॉम्पोनेन्ट टेस्टिंग
---

WebdriverIOs [Browser Runner](/docs/runner#browser-runner) के साथ आप WebdriverIO और WebDriver प्रोटोकॉल का उपयोग करते हुए एक वास्तविक डेस्कटॉप या मोबाइल ब्राउज़र के भीतर परीक्षण चला सकते हैं ताकि पेज पर जो प्रस्तुत किया जाता है उसे स्वचालित और इंटरैक्ट किया जा सके। इस दृष्टिकोण के अन्य परीक्षण ढांचे की तुलना में [कई फायदे](/docs/runner#browser-runner) हैं जो केवल [JSDOM](https://www.npmjs.com/package/jsdom)के खिलाफ परीक्षण की अनुमति देते हैं।

## यह कैसे काम करता है?

ब्राउज़र रनर एक परीक्षण पेज प्रस्तुत करने के लिए [Vite](https://vitejs.dev/) का उपयोग करता है और ब्राउज़र में आपके परीक्षण चलाने के लिए एक परीक्षण फ्रेमवर्क आरंभ करता है। वर्तमान में यह केवल मोचा का समर्थन करता है लेकिन जैस्मीन और कुकुम्बर [रोडमैप पर है](https://github.com/orgs/webdriverio/projects/1). यह उन परियोजनाओं के लिए भी किसी भी प्रकार के कॉम्पोनेन्ट का परीक्षण करने की अनुमति देता है जो Vite का उपयोग नहीं करते हैं।

Vite सर्वर WebdriverIO टेस्टरनर द्वारा शुरू किया गया है और कॉन्फ़िगर किया गया है ताकि आप सभी रिपोर्टर और सेवाओं का उपयोग कर सकें जैसा कि आप सामान्य e2e परीक्षणों के लिए करते थे। इसके अलावा यह [`browser`](/docs/api/browser) इंस्टेंस को इनिशियलाइज़ करता है जो आपको पेज पर किसी भी तत्व के साथ इंटरैक्ट करने के लिए [WebdriverIO API](/docs/api) के एक सबसेट तक पहुँचने की अनुमति देता है। E2e परीक्षणों के समान आप वैश्विक दायरे से जुड़े `browser` वेरिएबल के माध्यम से या `@wdio/globals` से आयात करके इस उदाहरण तक पहुंच सकते हैं, यह इस बात पर निर्भर करता है कि [`njectGlobals`](/docs/api/globals) कैसे सेट किया गया है।

WebdriverIO has built-in support for the following frameworks:

- [__Nuxt__](https://nuxt.com/): WebdriverIO's testrunner detects a Nuxt application and automatically sets up your project composables and helps mock out the Nuxt backend, read more in the [Nuxt docs](/docs/component-testing/vue#testing-vue-components-in-nuxt)
- [__TailwindCSS__](https://tailwindcss.com/): WebdriverIO's testrunner detects if you are using TailwindCSS and loads the environment properly into the test page

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

## सेटअप स्क्रिप्ट

आप Node.js या ब्राउज़र में मनमानी स्क्रिप्ट चलाकर अपने परीक्षण सेट कर सकते हैं, उदाहरण के लिए शैलियों को इंजेक्ट करना, ब्राउज़र API का मज़ाक उड़ाना या किसी तृतीय पक्ष सेवा से कनेक्ट करना। WebdriverIO [हुक](/docs/configuration#hooks) का उपयोग Node.js में कोड चलाने के लिए किया जा सकता है जबकि [`mochaOpts.require`](/docs/frameworks#require) आपको परीक्षण लोड होने से पहले ब्राउज़र में स्क्रिप्ट आयात करने की अनुमति देता है, जैसे:

```js wdio.conf.js
एक्सपोर्ट const config = {
    // ...
    मोचाऑप्ट्स: {
         यूआई: 'टीडीडी',
         // ब्राउज़र में चलने के लिए एक सेटअप स्क्रिप्ट प्रदान करें
         आवश्यकता: './__fixtures__/setup.js'
     },
     पहले: () => {
         // Node.js में परीक्षण वातावरण सेट करें
     }
     // ...
}
```

उदाहरण के लिए, यदि आप निम्न सेट-अप स्क्रिप्ट के साथ अपने परीक्षण में सभी [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) कॉलों का मजाक उड़ाना पसंद करते हैं:

```js ./fixtures/setup.js
'@wdio/browser-runner' से { fn } आयात करें

// रन कोड सभी परीक्षण लोड होने से पहले
विंडो.फ़ेच = fn ()

निर्यात const mochaGlobalSetup = () => {
     // रन कोड परीक्षण फ़ाइल लोड होने के बाद
}

Export const mochaGlobalTeardown = () => {
     // युक्ति फ़ाइल निष्पादित होने के बाद रन कोड
}

```

अब अपने परीक्षणों में आप सभी ब्राउज़र अनुरोधों के लिए कस्टम प्रतिक्रिया मान प्रदान कर सकते हैं। [मोचा डॉक्स](https://mochajs.org/#global-fixtures)में वैश्विक फिक्स्चर पर अधिक पढ़ें।

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
