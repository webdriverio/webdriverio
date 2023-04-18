---
id: protractor-migration
title: कोणमापक से
---

यह ट्यूटोरियल उन लोगों के लिए है जो कोणमापक का उपयोग कर रहे हैं और अपने ढांचे को WebdriverIO में माइग्रेट करना चाहते हैं। यह एंगुलर टीम [द्वारा](https://github.com/angular/protractor/issues/5502) घोषणा के बाद शुरू किया गया था कि प्रोटैक्टर अब समर्थित नहीं होगा। WebdriverIO बहुत सारे प्रोट्रैक्टर डिज़ाइन निर्णयों से प्रभावित रहा है, यही कारण है कि यह संभवतः माइग्रेट करने के लिए निकटतम ढांचा है। WebdriverIO टीम हर एक कोणमापक योगदानकर्ता के काम की सराहना करती है और आशा करती है कि यह ट्यूटोरियल WebdriverIO में संक्रमण को आसान और सीधा बनाता है।

जबकि हम इसके लिए पूरी तरह से स्वचालित प्रक्रिया चाहते हैं, वास्तविकता अलग दिखती है। हर किसी का एक अलग सेटअप होता है और अलग-अलग तरीकों से प्रोटैक्टर का उपयोग करता है। हर कदम को मार्गदर्शन के रूप में देखा जाना चाहिए और कदम दर कदम निर्देश की तरह नहीं। अगर आपको माइग्रेशन से जुड़ी कोई समस्या है, तो बेझिझक [हमसे संपर्क करें](https://github.com/webdriverio/codemod/discussions/new).

## सेटअप

प्रोट्रैक्टर और वेबड्राइवरआईओ एपीआई वास्तव में एक बिंदु पर बहुत समान हैं, जहां अधिकांश कमांड को [कोडमॉड](https://github.com/webdriverio/codemod)के माध्यम से स्वचालित तरीके से फिर से लिखा जा सकता है।

कोडमोड इंस्कोटाल करने के लिए, रन करें:

```sh
npm install jscodeshift @wdio/codemod
```

## रणनीति

कई प्रवासन रणनीतियाँ हैं। आपकी टीम के आकार, परीक्षण फ़ाइलों की मात्रा और माइग्रेट करने की अत्यावश्यकता के आधार पर आप एक बार में सभी परीक्षणों को बदलने या फ़ाइल द्वारा फ़ाइल करने का प्रयास कर सकते हैं। यह देखते हुए कि कोणीय संस्करण 15 (2022 के अंत) तक आपके पास अभी भी पर्याप्त समय है, तब तक कोणमापक को बनाए रखा जाएगा। आप एक ही समय में प्रोटेक्टर और WebdriverIO परीक्षण चला सकते हैं और WebdriverIO में नए परीक्षण लिखना शुरू कर सकते हैं। अपने समय के बजट को देखते हुए आप पहले महत्वपूर्ण परीक्षण मामलों को माइग्रेट करना शुरू कर सकते हैं और उन परीक्षणों पर अपना काम कर सकते हैं जिन्हें आप हटा भी सकते हैं।

## सबसे पहले कॉन्फिग फाइल

कोडमॉड स्थापित करने के बाद हम पहली फ़ाइल को बदलना शुरू कर सकते हैं। पहले [WebdriverIOs कॉन्फ़िगरेशन विकल्प](Configuration.md)में देखें। कॉन्फिग फाइलें बहुत जटिल हो सकती हैं और यह केवल आवश्यक भागों को पोर्ट करने के लिए समझ में आ सकता है और यह देख सकता है कि कुछ विकल्पों को माइग्रेट किए जाने वाले संबंधित परीक्षणों के बाद बाकी को कैसे जोड़ा जा सकता है।

For the first migration we only transform the config file and run:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/protractor ./conf.ts
```

:::info

 Your config can be named differently, however the principle should be the same: start migration the config first.

:::

## Install WebdriverIO Dependencies

Next step is to configure a minimal WebdriverIO setup that we start building up as we migrate from one framework to another. First we install the WebdriverIO CLI via:

```sh
npm install --save-dev @wdio/cli
```

Next we run the configuration wizard:

```sh
npx wdio config
```

This will walk you through a couple of questions. For this migration scenario you:
- pick the default choices
- we recommend not to auto-generate example files
- pick a different folder for WebdriverIO files
- and to choose Mocha above Jasmine.

:::info Why Mocha?
Even though you might have been using Protractor with Jasmine before, Mocha however provides better retry mechanisms. The choice is yours!
:::

After the little questionaire the wizard will install all necessary packages and stores them in your `package.json`.

## Migrate Configuration File

After we have a transformed `conf.ts` and a new `wdio.conf.ts`, it is now time to migrate the configuration from one config to another. Make sure to only port code that is essential for all tests to be able to run. In ours we port the hook function and framework timeout.

We will now continue with our `wdio.conf.ts` file only and therefore won't need any changes to the original Protractor config anymore. We can revert those so that both frameworks can run next to each other and we can port on file at the time.

## Migrate Test File

We are now set to port over the first test file. To start simple, let's start with one that has not many dependencies to 3rd party packages or other files like PageObjects. In our example the first file to migrate is `first-test.spec.ts`. First create the directory where the new WebdriverIO configuration expects its files and then move it over:

```sh
mv mkdir -p ./test/specs/
mv test-suites/first-test.spec.ts ./test/specs
```

Now let's transform this file:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/protractor ./test/specs/first-test.spec.ts
```

That's it! This file is so simple that we don't need any additional changes anymore and directly can try to run WebdriverIO via:

```sh
npx wdio run wdio.conf.ts
```

Congratulations 🥳 you just migrated the first file!

## Next Steps

From this point you continue to transform test by test and page object by page object. There are chances that the codemod will fail for certain files with an error such as:

```
ERR /path/to/project/test/testdata/failing_submit.js Transformation error (Error transforming /test/testdata/failing_submit.js:2)
Error transforming /test/testdata/failing_submit.js:2

> login_form.submit()
  ^

The command "submit" is not supported in WebdriverIO. We advise to use the click command to click on the submit button instead. For more information on this configuration, see https://webdriver.io/docs/api/element/click.
  at /path/to/project/test/testdata/failing_submit.js:132:0
```

For some Protractor commands there is just no replacement for it in WebdriverIO. In this case the codemod will give you some advice how to refactor it. If you stumble upon such error messages too often, feel free to [raise an issue](https://github.com/webdriverio/codemod/issues/new) and request to add a certain transformation. While the codemod already transforms the majority of the Protractor API there is still a lot of room for improvements.

## Conclusion

We hope this tutorial guides you a little bit through the migration process to WebdriverIO. The community continues to improve the codemod while testing it with various teams in various organisations. Don't hesitate to [raise an issue](https://github.com/webdriverio/codemod/issues/new) if you have feedback or [start a discussion](https://github.com/webdriverio/codemod/discussions/new) if you struggle during the migration process.
