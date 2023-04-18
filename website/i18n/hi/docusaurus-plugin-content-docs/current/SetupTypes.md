---
id: setuptypes
title: सेटअप प्रकार
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

WebdriverIO का उपयोग विभिन्न उद्देश्यों के लिए किया जा सकता है। यह वेबड्राइवर प्रोटोकॉल एपीआई को लागू करता है और स्वचालित तरीके से ब्राउज़र चला सकता है। ढांचे को किसी भी मनमाने वातावरण में और किसी भी प्रकार के कार्य के लिए डिज़ाइन किया गया है। यह किसी भी तीसरे पक्ष के ढांचे से स्वतंत्र है और इसे चलाने के लिए केवल Node.js की आवश्यकता होती है।

## प्रोटोकॉल बाइंडिंग

WebDriver और अन्य ऑटोमेशन प्रोटोकॉल के साथ बुनियादी इंटरैक्शन के लिए WebdriverIO [`webdriver`](https://www.npmjs.com/package/webdriver) NPM पैकेज के आधार पर अपने स्वयं के प्रोटोकॉल बाइंडिंग का उपयोग करता है:

<Tabs
  defaultValue="webdriver"
  values={[
    {label: 'WebDriver', value: 'webdriver'},
 {label: 'Chrome DevTools', value: 'devtools'},
 ]
}>
<TabItem value="webdriver">

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/webdriver.js#L5-L20
```

</TabItem>
<TabItem value="devtools">

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/devtools.js#L2-L17
```

</TabItem>
</Tabs>

सभी [प्रोटोकॉल कमांड](./api/_webdriver.md) ऑटोमेशन ड्राइवर से अपरिष्कृत प्रतिक्रिया लौटाते हैं। पैकेज बहुत हल्का है और प्रोटोकॉल उपयोग के साथ बातचीत को आसान बनाने के लिए ऑटो-वेट जैसे __नंबर__ स्मार्ट लॉजिक है।

उदाहरण के लिए लागू प्रोटोकॉल आदेश ड्राइवर के प्रारंभिक सत्र की प्रतिक्रिया पर निर्भर करते हैं। For example if the response indicates that a mobile session was started, the package applies all Appium and Mobile JSON Wire protocol commands to the instance prototype.

You can run the same set of commands (except mobile ones) using the Chrome DevTools protocol when importing the [`devtools`](https://www.npmjs.com/package/devtools) NPM package. It has the same interface as the `webdriver` package but runs its automation based on [Puppeteer](https://pptr.dev/).

For more information on these package interfaces, see [Modules API](/docs/api/modules).

## Standalone Mode

To simplify the interaction with the WebDriver protocol the `webdriverio` package implements a variety of commands on top of the protocol (e.g. the [`dragAndDrop`](./api/element/_dragAndDrop.md) command) and core concepts such as [smart selectors](./Selectors.md) or [auto-waits](./AutoWait.md). The example from above can be simplified like this:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/standalone.js#L2-L19
```

Using WebdriverIO in standalone mode still gives you access to all protocol commands but provides a super set of additional commands that provide a higher level interaction with the browser. It allows you to integrate this automation tool in your own (test) project to create a new automation library. Popular examples include [Spectron](https://www.electronjs.org/spectron) or [CodeceptJS](http://codecept.io). You can also write plain Node scripts to scrape the web for content (or anything else that requires a running browser).

If no specific options are set WebdriverIO will try to find a browser driver on `http://localhost:4444/` and automatically switches to the Chrome DevTools protocol and Puppeteer as automation engine if such a driver can't be found. If you like to run based on WebDriver you need to either start that driver manually or through a script or [NPM package](https://www.npmjs.com/package/chromedriver).

For more information on the `webdriverio` package interfaces, see [Modules API](/docs/api/modules).

## The WDIO Testrunner

The main purpose of WebdriverIO, though, is end-to-end testing on a big scale. We therefore implemented a test runner that helps you to build a reliable test suite that is easy to read and maintain.

The test runner takes care of many problems that are common when working with plain automation libraries. For one, it organizes your test runs and splits up test specs so your tests can be executed with maximum concurrency. It also handles session management and provides lots of features to help you to debug problems and find errors in your tests.

Here is the same example from above, written as a test spec and executed by WDIO:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/testrunner.js
```

The test runner is an abstraction of popular test frameworks like Mocha, Jasmine, or Cucumber. To run your tests using the WDIO test runner, check out the [Getting Started](GettingStarted.md) section for more information.

For more information on the `@wdio/cli` testrunner package interface, see [Modules API](/docs/api/modules).
