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

At the end of this process you should find a `wdio.conf.js` that contains various WebdriverIO configurations, including a `runner` property, e.g.:

```ts reference useHTTPS runmeRepository="git@github.com:webdriverio/example-recipes.git" runmeFileToOpen="component-testing%2FREADME.md"
https://github.com/webdriverio/example-recipes/blob/fd54f94306ed8e7b40f967739164dfe4d6d76b41/wdio.comp.conf.js
```

By defining different [capabilities](/docs/configuration#capabilities) you can run your tests in different browser, in parallel if desired.

## Test Harness

It is totally up to you what you want to run in your tests and how you like to render the components. However we recommend to use the [Testing Library](https://testing-library.com/) as utility framework as it provides plugins for various of component frameworks, such as React, Preact, Svelte and Vue. It is very useful for rendering components into the test page and it automatically cleans up these components after every test.

You can mix Testing Library primitives with WebdriverIO commands as you wish, e.g.:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fd54f94306ed8e7b40f967739164dfe4d6d76b41/component-testing/svelte-example.js
```

__Note:__ using render methods from Testing Library helps remove created components between the tests. If you don't use Testing Library ensure to attach your test components to a container that gets cleaned up between tests.

## Watch Test and Application Files

There are multiple ways how you can debug your browser tests. The easiest is to start the WebdriverIO testrunner with the `--watch` flag, e.g.:

```sh
$ npx wdio run ./wdio.conf.js --watch
```

This will run through all tests initially and halt once all are run. You can then make changes to individual files which then will be rerun individually. If you set a [`filesToWatch`](/docs/configuration#filestowatch) pointing to your application files, it will re-run all tests when changes to your app are being made.

## Debugging

While it is not (yet) possible to set breakpoints in your IDE and have them being recognised by the remote browser, you can use the [`debug`](/docs/api/browser/debug) command to stop the test at any point. This allows you to open DevTools to then debug the test by setting breakpoints in the [sources tab](https://buddy.works/tutorials/debugging-javascript-efficiently-with-chrome-devtools).

When the `debug` command is called, you will also get a Node.js repl interface in your terminal, saying:

```
The execution has stopped!
You can now go into the browser or use the command line as REPL
(To exit, press ^C again or type .exit)
```

Press `Ctrl` or `Command` + `c` or enter `.exit` to continue with the test.

## Examples

You can find various examples for testing components using popular component frameworks in our [example repository](https://github.com/webdriverio/component-testing-examples).
