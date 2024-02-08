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

#### `wdio:chromedriverOptions`

Specific options passed into Chromedriver when starting it.

#### `wdio:geckodriverOptions`

Specific options passed into Geckodriver when starting it.

#### `wdio:edgedriverOptions`

Specific options passed into Edgedriver when starting it.

#### `wdio:safaridriverOptions`

Specific options passed into Safari when starting it.

#### `wdio:maxInstances`

Maximum number of total parallel running workers for the specific browser/capability. Takes precedence over [maxInstances](#configuration#maxInstances) and [maxInstancesPerCapability](configuration/#maxinstancespercapability).

Type: `number`

#### `wdio:specs`

Define specs for test execution for that browser/capability. Same as the [regular `specs` configuration option](configuration#specs), but specific to the browser/capability. Takes precedence over `specs`.

Type: `(String | String[])[]`

#### `wdio:exclude`

Exclude specs from test execution for that browser/capability. Same as the [regular `exclude` configuration option](configuration#exclude), but specific to the browser/capability. Takes precedence over `exclude`.

Type: `String[]`

#### Common Driver Options

While all driver offer different parameters for configuration, there are some common ones that WebdriverIO understand and uses for setting up your driver or browser:

##### `cacheDir`

The path to the root of the cache directory. This directory is used to store all drivers that are downloaded when attempting to start a session.

Type: `string`<br /> Default: `process.env.WEBDRIVER_CACHE_DIR || os.tmpdir()`

##### `binary`

Path to a custom driver binary. If set WebdriverIO won't attempt to download a driver but will use the one provided by this path. Make sure the driver is compatible with the browser you are using.

Type: `string`

:::caution

If the driver `binary` is set, WebdriverIO won't attempt to download a driver but will use the one provided by this path. Make sure the driver is compatible with the browser you are using.

:::

#### Browser Specific Driver Options

In order to propagate options to the driver you can use the following custom capabilities:

- Chrome or Chromium: `wdio:chromedriverOptions`
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
    browserName: 'chrome',
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
    browserName: 'chrome',
    browserVersion: '116' // or '116.0.5845.96', 'stable', 'latest', 'dev', 'canary', 'beta'
}
```

If you like to test a manually downloaded browser, you can provide a binary path to the browser via:

```ts
{
    browserName: 'chrome',
    'goog:chromeOptions': {
        binary: '/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary'
    }
}
```

Additionally, if you like to use a manually downloaded driver, you can provide a binary path to the driver via:

```ts
{
    browserName: 'chrome',
    'wdio:chromedriverOptions': {
        binary: '/path/to/chromdriver'
    }
}
```

</TabItem>
<TabItem value="firefox">

When testing on Firefox, WebdriverIO will automatically download the desired browser version and driver for you based on the defined `browserVersion`, e.g.:

```ts
{
    browserName: 'firefox',
    browserVersion: '119.0a1' // or 'latest'
}
```

If you like to test a manually downloaded version you can provide a binary path to the browser via:

```ts
{
    browserName: 'firefox',
    'moz:firefoxOptions': {
        binary: '/Applications/Firefox\ Nightly.app/Contents/MacOS/firefox'
    }
}
```

Additionally, if you like to use a manually downloaded driver, you can provide a binary path to the driver via:

```ts
{
    browserName: 'firefox',
    'wdio:geckodriverOptions': {
        binary: '/path/to/geckodriver'
    }
}
```

</TabItem>
<TabItem value="msedge">

When testing on Microsoft Edge, make sure you have the desired browser version installed on your machine. You can point WebdriverIO to the browser to execute via:

```ts
{
    browserName: 'msedge',
    'ms:edgeOptions': {
        binary: '/Applications/Microsoft\ Edge\ Canary.app/Contents/MacOS/Microsoft\ Edge\ Canary'
    }
}
```

WebdriverIO will automatically download the desired driver version for you based on the defined `browserVersion`, e.g.:

```ts
{
    browserName: 'msedge',
    browserVersion: '109' // or '109.0.1467.0', 'stable', 'dev', 'canary', 'beta'
}
```

Additionally, if you like to use a manually downloaded driver, you can provide a binary path to the driver via:

```ts
{
    browserName: 'msedge',
    'wdio:edgedriverOptions': {
        binary: '/path/to/msedgedriver'
    }
}
```

</TabItem>
<TabItem value="safari">

When testing on Safari, make sure you have the [Safari Technology Preview](https://developer.apple.com/safari/technology-preview/) installed on your machine. You can point WebdriverIO to that version via:

```ts
{
    browserName: 'safari technology preview'
}
```

</TabItem>
</Tabs>

## Extend Custom Capabilities

If you like to define your own set of capabilities in order to e.g. store arbitrary data to be used within the tests for that specific capability, you can do so by e.g. setting:

```js title=wdio.conf.ts
export const config = {
    // ...
    capabilities: [{
        browserName: 'chrome',
        'custom:caps': {
            // custom configurations
        }
    }]
}
```

It is advised to follow the [W3C protocol](https://w3c.github.io/webdriver/#dfn-extension-capability) when it comes to capability naming which requires a `:` (colon) character, denoting an implementation specific namespace. Within your tests you can access your custom capability through, e.g.:

```ts
browser.capabilities['custom:caps']
```

In order to ensure type safety you can extend WebdriverIOs capability interface via:

```ts
declare global {
    namespace WebdriverIO {
        interface Capabilities {
            'custom:caps': {
                // ...
            }
        }
    }
}
```
