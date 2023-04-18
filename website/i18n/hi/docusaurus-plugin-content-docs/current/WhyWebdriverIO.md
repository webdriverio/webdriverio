---
id: why-webdriverio
title: WebdriverIO क्यों?
---

WebdriverIO आधुनिक वेब और मोबाइल एप्लिकेशन को स्वचालित करने के लिए बनाया गया एक प्रगतिशील स्वचालन ढांचा है। यह आपके ऐप के साथ सहभागिता को सरल करता है और प्लगइन्स का एक सेट प्रदान करता है जो आपको स्केलेबल, मजबूत और स्थिर परीक्षण सूट बनाने में मदद करता है।

यह होने के लिए डिज़ाइन किया गया है:

- __विस्तार योग्य__ - सहायक कार्य, या अधिक जटिल सेट और मौजूदा कमांड के संयोजन जोड़ना __सरल__ और __वास्तव में उपयोगी है__
- __संगत__ - WebdriverIO को [वेबड्राइवर प्रोटोकॉल](https://w3c.github.io/webdriver/) पर __ट्रू क्रॉस-ब्राउज़र टेस्टिंग__ के साथ-साथ [क्रोमियम आधारित ऑटोमेशन के लिए [Puppeteer](https://pptr.dev/)का उपयोग करके चलाया जा सकता है](https://chromedevtools.github.io/devtools-protocol/)
- __फ़ीचर रिच__ - बिल्ट-इन और कम्युनिटी प्लगइन्स की विशाल विविधता आपको __आसानी से एकीकृत करने की अनुमति देती है__ और __आपकी आवश्यकताओं को पूरा करने के लिए आपके सेटअप को__ करती है।

आप स्वचालित करने के लिए WebdriverIO का उपयोग कर सकते हैं:

- 🌐 <span>&nbsp;</span> __आधुनिक वेब एप्लिकेशन__ React, Vue, Angular, Svelte या अन्य फ्रंटएंड फ्रेमवर्क में लिखे गए हैं
- 📱 <span>&nbsp;</span> __हाइब्रिड__ या __देशी मोबाइल एप्लिकेशन__ एक इम्यूलेटर/सिम्युलेटर में या वास्तविक डिवाइस पर चल रहा है
- 💻 <span>&nbsp;</span> __देशी डेस्कटॉप अनुप्रयोग__ (उदाहरण के लिए इलेक्ट्रॉन.जेएस के साथ लिखा गया)
- ब्राउज़र में वेब घटकों के 📦 <span>&nbsp;</span> __इकाई या घटक परीक्षण__

## वेब मानकों के आधार पर

WebdriverIO [WebDriver](https://w3c.github.io/webdriver/) और [WebDriver-BiDi](https://github.com/w3c/webdriver-bidi) प्रोटोकॉल की शक्ति का लाभ उठाता है जो सभी ब्राउज़र विक्रेताओं द्वारा विकसित और समर्थित है और एक सच्चे क्रॉस-ब्राउज़र परीक्षण अनुभव की गारंटी देता है। While other automation tools require you to download modified browser engines that aren't used by actual users or emulate user behavior by injecting JavaScript, WebdriverIO relies on a common agreed standard for automation that is [properly tested](https://wpt.fyi/results/webdriver/tests?label=experimental&label=master&aligned) and ensures compatibility for decades to come.

Furthermore WebdriverIO has also support for alternative, proparitary automation protocols like [Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/) for debugging and introspection purposes. This allows the user to seamlessly switch between conventional commands based on WebDriver and powerful browser interactions through [Puppeteer](https://pptr.dev/).

Read more about the differences of these automation standards in the section on [Automation Protocols](./AutomationProtocols.md).

## True Open Source

Compared to many automation tools in the ecosystem, WebdriverIO is a truly open source project that is run with open governance and owned by a non-profit entity called [OpenJS Foundation](https://openjsf.org/). This legally binds the project to grow and be directed in the interest of all participants. The project team values openness and collaboration and is not driven by monetary interests.

This makes the project independent in how it is being developed and where it is supposed to go. It allows us to provide a free 24/7 support in our [community channel](https://discord.webdriver.io) as we build a sustainable community that supports and learns from each other. Lastly, it gives a lot of opportunities to the people that contribute and engage with the project due to its [open governance](https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md).
