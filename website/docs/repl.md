---
id: repl
title: REPL interface
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

With `v4.5.0`, WebdriverIO introduced a [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) interface that helps you to not only learn the framework API, but also debug and inspect your tests. It can be used in multiple ways.

First you can use it as CLI command by installing `npm install -g @wdio/cli` and spawn a WebDriver session from the command line, e.g.

```sh
wdio repl chrome
```

This would open a Chrome browser that you can control with the REPL interface. Make sure you have a browser driver running on port `4444` in order to initiate the session. If you have a [Sauce Labs](https://saucelabs.com) (or other cloud vendor) account, you can also directly run the browser on your command line in the cloud via:

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

If driver is running on different port eg : 9515, it could passed with the command line argument --port or alias -p

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY -p 9515
```

Repl could also be ran using the capabilities from the webdriverIO config file. Wdio supports capabilities object; or ; multiremote capability list or object.

If the config file uses capabilities object then just pass the path to config file, else if its a multiremote capability then, specify which capability to use from list or multiremote using the positional argument . Note: for list we consider zero based index.

### Example

WebdriverIO with capability array:

```ts title="wdio.conf.ts example"
export const config = {
    // ...
    capabilities:[{
        browserName: 'chrome', // options: `firefox`, `chrome`, `opera`, `safari`
        browserVersion: '27.0', // browser version
        platformName: 'Windows 10' // OS platform
    }]
}
```

```sh
wdio repl "./path/to/wdio.config.js" 0 -p 9515
```

WebdriverIO with [multiremote](https://webdriver.io/docs/multiremote/) capability object:

```ts title="wdio.conf.ts example"
export const config = {
    // ...
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    }
}
```

```sh
wdio repl "./path/to/wdio.config.js" "myChromeBrowser" -p 9515
```

Or if you want to run local mobile tests using Appium:

<Tabs
  defaultValue="android"
  values={[
    {label: 'Android', value: 'android'},
    {label: 'iOS', value: 'ios'}
  ]
}>
<TabItem value="android">

```sh
wdio repl android
```

</TabItem>
<TabItem value="ios">

```sh
wdio repl ios
```

</TabItem>
</Tabs>

This would open Chrome/Safari session on connected device/emulator/simulator. Make sure Appium running on port `4444` in order to initiate the session.

```sh
wdio repl './path/to/your_app.apk'
```

This would open App session on connected device/emulator/simulator. Make sure Appium running on port `4444` in order to initiate the session.

Capabilities for iOS device can be passed with arguments:

* `-v`      - `platformVersion`: version of Android/iOS platform
* `-d`      - `deviceName`: name of mobile device
* `-u`      - `udid`: udid for real devices

Usage:

<Tabs
  defaultValue="long"
  values={[
    {label: 'Long Parameter Names', value: 'long'},
    {label: 'Short Parameter Names', value: 'short'}
  ]
}>
<TabItem value="long">

```sh
wdio repl ios --platformVersion 11.3 --deviceName 'iPhone 7' --udid 123432abc
```

</TabItem>
<TabItem value="short">

```sh
wdio repl ios -v 11.3 -d 'iPhone 7' -u 123432abc
```

</TabItem>
</Tabs>

You can apply any options (see `wdio repl --help`) available for your REPL session.

![WebdriverIO REPL](https://webdriver.io/img/repl.gif)

Another way to use the REPL is in inside your tests via the [`debug`](/docs/api/browser/debug) command. This will stop the browser when called, and enables you to jump into the application (e.g. to the dev tools) or control the browser from the command line. This is helpful when some commands don't trigger a certain action as expected. With the REPL, you can then try out the commands to see which are working most reliably.
