---
id: capabilities
title: क्षमताएं
---

एक क्षमता एक रिमोट इंटरफ़ेस की परिभाषा है। यह WebdriverIO को यह समझने में मदद करता है कि आप किस ब्राउज़र या मोबाइल वातावरण में अपने परीक्षण चलाना पसंद करते हैं। स्थानीय रूप से परीक्षण विकसित करते समय क्षमताएँ कम महत्वपूर्ण होती हैं क्योंकि आप इसे अधिकांश समय एक रिमोट इंटरफ़ेस पर चलाते हैं लेकिन CI/CD में एकीकरण परीक्षणों का एक बड़ा सेट चलाते समय यह अधिक महत्वपूर्ण हो जाता है।

:::info

एक क्षमता ऑब्जेक्ट का फोर्मेट [वेबड्राइवर विनिर्देश](https://w3c.github.io/webdriver/#capabilities)द्वारा अच्छी तरह से परिभाषित किया गया है। यदि उपयोगकर्ता परिभाषित क्षमताएं उस विनिर्देश का पालन नहीं करती हैं तो WebdriverIO टेस्टरनर जल्दी विफल हो जाएगा।

:::

## कस्टम क्षमताएं

While the amount of fixed defined capabilities is very low, everyone can provide and accept custom capabilities that are specific to the automation driver or remote interface:

### ब्राउज़र विशिष्ट क्षमता एक्सटेंशन

- `goog: chromeOptions`: [Chromedriver](https://chromedriver.chromium.org/capabilities) एक्सटेंशन, केवल क्रोम में परीक्षण के लिए लागू
- `moz:firefoxOptions`: [Geckodriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html) एक्सटेंशन, केवल फायरफॉक्स में परीक्षण के लिए लागू
- `ms:edgeOptions`: [EdgeOptions](https://learn.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options) क्रोमियम एज के परीक्षण के लिए EdgeDriver का उपयोग करते समय परिवेश निर्दिष्ट करने के लिए

### क्लाउड वेंडर क्षमता एक्सटेंशन

- `sauce:options`: [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#w3c-webdriver-browser-capabilities--optional)
- `bstack:options`: [BrowserStack](https://www.browserstack.com/docs/automate/selenium/organize-tests)
- `tb:options`: [TestingBot](https://testingbot.com/support/other/test-options)
- और भी कई...

### स्वचालन इंजन क्षमता एक्सटेंशन

- `appium:xxx`: [Appium](https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/)
- `selenoid:xxx`: [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)
- और भी कई...

### WebdriverIO Capabilities to manage browser driver options

WebdriverIO manages installing and running browser driver for you. WebdriverIO uses a custom capability that allows you to pass in parameters to the driver.

#### Common Driver Options

While all driver offer different parameters for configuration, there are some common ones that WebdriverIO understand and uses for setting up your driver or browser:

##### `cacheDir`

The path to the root of the cache directory. This directory is used to store all drivers that are downloaded when attempting to start a session.

Type: `string`<br /> Default: `process.env.WEBDRIVER_CACHE_DIR || os.tmpdir()`

##### `binary`

Path to a custom driver binary. If set WebdriverIO won't attempt to download a driver but will use the one provided by this path. Make sure the driver is compatible with the browser you are using.

Type: `string`

#### Browser Specific Driver Options

In order to propagate options to the driver you can use the following custom capabilities:

- Chrome: `wdio:chromedriverOptions`
- Firefox: `wdio:geckodriverOptions`
- Microsoft Egde: `wdio:edgedriverOptions`
- Safari: `wdio:safaridriverOptions`

<Tabs
  defaultValue="chrome"
  values={[
    {label: 'wdio:chromedriverOptions', value: 'chrome'},
 {label: 'wdio:geckodriverOptions', value: 'firefox'},
 {label: 'wdio:edgedriverOptions', value: 'msedge'},
 {label: 'wdio:safaridriverOptions', value: 'safari'},
 ]
}>
<TabItem value="chrome">

##### adbPort
The port on which the ADB driver should run.

Example: `9515`

Type: `number`

##### urlBase
Base URL path prefix for commands, e.g. `wd/url`.

Example: `/`

Type: `string`

##### logPath
Write server log to file instead of stderr, increases log level to `INFO`

Type: `string`

##### logLevel
Set log level. Possible options `ALL`, `DEBUG`, `INFO`, `WARNING`, `SEVERE`, `OFF`.

Type: `string`

##### verbose
Log verbosely (equivalent to `--log-level=ALL`)

Type: `boolean`

##### silent
Log nothing (equivalent to `--log-level=OFF`)

Type: `boolean`

##### appendLog
Append log file instead of rewriting.

Type: `boolean`

##### replayable
Log verbosely and don't truncate long strings so that the log can be replayed (experimental).

Type: `boolean`

##### readableTimestamp
Add readable timestamps to log.

Type: `boolean`

##### enableChromeLogs
Show logs from the browser (overrides other logging options).

Type: `boolean`

##### bidiMapperPath
Custom bidi mapper path.

Type: `string`

##### allowedIps
Comma-separated allowlist of remote IP addresses which are allowed to connect to EdgeDriver.

Type: `string[]`<br />
Default: `['']`

##### allowedOrigins
Comma-separated allowlist of request origins which are allowed to connect to EdgeDriver. Using `*` to allow any host origin is dangerous!

Type: `string[]`<br />
Default: `['*']`

</TabItem>
<TabItem value="firefox">

See all Geckodriver options in the official [driver package](https://github.com/webdriverio-community/node-geckodriver#options).

</TabItem>
<TabItem value="msedge">

See all Edgedriver options in the official [driver package](https://github.com/webdriverio-community/node-edgedriver#options).

</TabItem>
<TabItem value="safari">

See all Safaridriver options in the official [driver package](https://github.com/webdriverio-community/node-safaridriver#options).

</TabItem>
</Tabs>

## विशिष्ट उपयोग मामलों के लिए विशेष क्षमताएं

यह उदाहरणों की एक सूची है जो दिखाती है कि एक निश्चित उपयोग के मामले को प्राप्त करने के लिए किन क्षमताओं को लागू करने की आवश्यकता है।

### ब्राउजर हेडलेस चलाएं

हेडलेस ब्राउजर चलाने का मतलब विंडो या यूआई के बिना ब्राउजर इंस्टेंस चलाना है। यह ज्यादातर सीआई/सीडी परिवेशों में उपयोग किया जाता है जहां कोई डिस्प्ले उपयोग नहीं किया जाता है। ब्राउज़र को हेडलेस मोड में चलाने के लिए, निम्नलिखित क्षमताओं को लागू करें:

<Tabs
  defaultValue="chrome"
  values={[
    {label: 'Chrome', value: 'chrome'},
 {label: 'Firefox', value: 'firefox'},
 {label: 'Microsoft Edge', value: 'msedge'},
 {label: 'Safari', value: 'safari'},
 ]
}>
<TabItem value="chrome">

```ts
{
    browserName: 'chrome',    // or 'chromium'
    'goog:chromeOptions': {
        args: ['headless', 'disable-gpu']
    }
}
```

</TabItem>
<TabItem value="firefox">

```ts
    browserName: 'firefox',
    'moz:firefoxOptions': {
        args: ['-headless']
    }
```

</TabItem>
<TabItem value="msedge">

```ts
    browserName: 'msedge',
    'ms:edgeOptions': {
        args: ['--headless']
    }
```

</TabItem>
<TabItem value="safari">

It seems that Safari [doesn't support](https://discussions.apple.com/thread/251837694) running in headless mode.

</TabItem>
</Tabs>

### Automate Different Browser Channels

If you like to test a browser version that is not yet released as stable, e.g. Chrome Canary, you can do so by setting capabilities and pointing to the browser you like to start, e.g.:

<Tabs
  defaultValue="chrome"
  values={[
    {label: 'Chrome', value: 'chrome'},
 {label: 'Firefox', value: 'firefox'},
 {label: 'Microsoft Edge', value: 'msedge'},
 {label: 'Safari', value: 'safari'},
 ]
}>
<TabItem value="chrome">

When testing on Chrome, WebdriverIO will automatically download the desired browser version and driver for you based on the defined `browserVersion`, e.g.:

```ts
{
    browserName: 'chrome',// or 'chromium'
    browserVersion: '116' // or '116.0.5845.96', 'stable', 'dev', 'canary', 'beta'
}
```

</TabItem>
<TabItem value="firefox">

When testing on Firefox, you can let WebdriverIO setup Firefox Nightly for you by providing `latest` as `browserVersion`:

```ts
    browserName: 'firefox',
    browserVersion: 'latest'
```

If you like to test a manually downloaded version you can provide a binary path to the browser via:

```ts
    browserName: 'firefox',
    'moz:firefoxOptions': {
        bin: '/Applications/Firefox\ Nightly.app/Contents/MacOS/firefox'
    }
```

</TabItem>
<TabItem value="msedge">

When testing on Microsoft Edge, make sure you have the desired browser version installed on your machine. You can point WebdriverIO to the browser to execute via:

```ts
    browserName: 'msedge',
    'ms:edgeOptions': {
        bin: '/Applications/Microsoft\ Edge\ Canary.app/Contents/MacOS/Microsoft\ Edge\ Canary'
    }
```

</TabItem>
<TabItem value="safari">

When testing on Safari, make sure you have the [Safari Technology Preview](https://developer.apple.com/safari/technology-preview/) installed on your machine. You can point WebdriverIO to that version via:

```ts
    browserName: 'safari technology preview'
```

</TabItem>
</Tabs>
