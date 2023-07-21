---
id: debugging
title: डीबग करना
---

डिबगिंग काफी अधिक कठिन है जब कई प्रक्रियाएँ कई ब्राउज़रों में दर्जनों परीक्षण उत्पन्न करती हैं।

<iframe width="560" height="315" src="https://www.youtube.com/embed/_bw_VWn5IzU" frameborder="0" allowFullScreen></iframe>

शुरुआत करने वालों के लिए, `maxInstances` से `1`सेट करके और केवल उन विनिर्देशों और ब्राउज़रों को लक्षित करके समांतरता को सीमित करना बेहद सहायक होता है जिन्हें डीबग करने की आवश्यकता होती है।

`wdio.conf`में:

```js
export const config = {
    // ...
    maxInstances: 1,
    specs: [
        '**/myspec.spec.js'
    ],
    capabilities: [{
        browserName: 'firefox'
    }],
    // ...
}
```

## डिबग कमांड

कई मामलों में, आप अपने परीक्षण को रोकने और ब्राउज़र का निरीक्षण करने के लिए [`browser.debug()`](/docs/api/browser/debug) का उपयोग कर सकते हैं।

आपका कमांड लाइन इंटरफ़ेस भी आरईपीएल मोड में बदल जाएगा। यह मोड आपको पेज पर कमांड और एलिमेंट के साथ फिडल करने की अनुमति देता है। REPL मोड में, आप `browser` ऑब्जेक्ट&mdash;या `$` और `$$` फ़ंक्शंस&mdash;तक पहुँच सकते हैं जैसे आप अपने परीक्षणों में कर सकते हैं।

`browser.debug()`का उपयोग करते समय, आपको टेस्ट रनर को लंबे समय तक परीक्षण में विफल होने से रोकने के लिए टेस्ट रनर के टाइमआउट को बढ़ाने की आवश्यकता होगी।  उदाहरण के लिए:

In `wdio.conf`:

```js
jasmineOpts: {
    defaultTimeoutInterval: (24 * 60 * 60 * 1000)
}
```

अन्य ढांचे का उपयोग करके इसे कैसे करें इस बारे में अधिक जानकारी के लिए [टाइमआउट](timeouts) देखें।

डिबगिंग के बाद परीक्षण जारी रखने के लिए, शेल में `^C` शॉर्टकट या `.exit` कमांड का उपयोग करें।
## गतिशील विन्यास

ध्यान दें कि `wdio.conf.js` में जावास्क्रिप्ट हो सकता है। चूंकि आप संभवत: अपने टाइमआउट मान को 1 दिन में स्थायी रूप से बदलना नहीं चाहते हैं, इसलिए पर्यावरण चर का उपयोग करके कमांड लाइन से इन सेटिंग्स को बदलना अक्सर मददगार हो सकता है।

इस तकनीक का उपयोग करके, आप गतिशील रूप से कॉन्फ़िगरेशन को बदल सकते हैं:

```js
const debug = process.env.DEBUG
const defaultCapabilities = ...
const defaultTimeoutInterval = ...
const defaultSpecs = ...

export const config = {
    // ...
    maxInstances: debug ? 1 : 100,
    capabilities: debug ? [{ browserName: 'chrome' }] : defaultCapabilities,
    execArgv: debug ? ['--inspect'] : [],
    jasmineOpts: {
      defaultTimeoutInterval: debug ? (24 * 60 * 60 * 1000) : defaultTimeoutInterval
    }
    // ...
}
```

फिर आप `wdio` कमांड को `debug` फ्लैग के साथ प्रीफिक्स कर सकते हैं:

```
$ DEBUG=true npx wdio wdio.conf.js --spec ./tests/e2e/myspec.test.js
```

...और DevTools के साथ अपनी कल्पना फ़ाइल को डीबग करें!

## विजुअल स्टूडियो कोड (VSCode) के साथ डिबगिंग

यदि आप नवीनतम VSCode में ब्रेकप्वाइंट के साथ अपने परीक्षणों को डीबग करना चाहते हैं, तो आपको जावास्क्रिप्ट डीबगर [रात्रिकालीन संस्करण को स्थापित और सक्षम करना होगा](https://marketplace.visualstudio.com/items?itemName=ms-vscode.js-debug-nightly)।

> https://github.com/microsoft/vscode/issues/82523#issuecomment-609934308 के अनुसार यह केवल विंडोज़ और लिनक्स के लिए आवश्यक है। मैक ओएस एक्स रात के संस्करण के बिना काम कर रहा है।

अतिरिक्त जानकारी: https://code.visualstudio.com/docs/nodejs/nodejs-debugging

सभी या चयनित विशिष्ट फ़ाइल (फ़ाइलों) को चलाना संभव है। डीबग कॉन्फ़िगरेशन(ओं) को `.vscode/launch.json`में जोड़ा जाना चाहिए, चयनित युक्ति को डीबग करने के लिए निम्न कॉन्फ़िगरेशन जोड़ें:
```
{
    "name": "run select spec",
    "type": "node",
    "request": "launch",
    "args": ["wdio.conf.js", "--spec", "${file}"],
    "cwd": "${workspaceFolder}",
    "autoAttachChildProcesses": true,
    "program": "${workspaceRoot}/node_modules/@wdio/cli/bin/wdio.js",
    "console": "integratedTerminal",
    "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "${workspaceFolder}/lib/**/*.js",
        "<node_internals>/**/*.js"
    ]
},
```

सभी विशिष्ट फ़ाइलों को चलाने के लिए `"--spec", "${file}"` `"args"`से हटा दें

उदाहरण: [.vscode/launch.json](https://github.com/mgrybyk/webdriverio-devtools/blob/master/.vscode/launch.json)

## एटम के साथ गतिशील उत्तर

यदि आप [एटम](https://atom.io/) हैकर हैं तो आप [`wdio-repl`](https://github.com/kurtharriger/wdio-repl) by [@kurtharriger](https://github.com/kurtharriger) आज़मा सकते हैं जो एक गतिशील उत्तर है जो आपको एटम में एकल कोड लाइनों को निष्पादित करने की अनुमति देता है। डेमो देखने के लिए [यह](https://www.youtube.com/watch?v=kdM05ChhLQE) यू ट्यूब वीडियो देखें।

## WebStorm / Intellij के साथ डिबगिंग
You can create a node.js debug configuration like this: ![Screenshot from 2021-05-29 17-33-33](https://user-images.githubusercontent.com/18728354/120088460-81844c00-c0a5-11eb-916b-50f21c8472a8.png) Watch this [YouTube Video](https://www.youtube.com/watch?v=Qcqnmle6Wu8) for more information about how to make a configuration.
