---
id: repl
title: REPL interface
---

With `v4.5.0`, WebdriverIO introduced a [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) interface that helps you to not only learn the framework API, but also debug and inspect your tests. It can be used in multiple ways.

First you can use it as CLI command and spawn a WebDriver session from the command line, e.g.

```sh
wdio repl chrome
```

This would open a Chrome browser that you can control with the REPL interface. Make sure you have a browser driver running on port `4444` in order to initiate the session. If you have a [SauceLabs](https://saucelabs.com) (or other cloud vendor) account, you can also directly run the browser on your command line in the cloud via:

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

```sh
wdio repl android
```
OR
```sh
wdio repl ios
```

This would open Chrome/Safari session on connected device/emulator/simulator. Make sure Appium running on port `4444` in order to initiate the session.

```sh
wdio repl './path/to/your_app.apk'
```

This would open App session on connected device/emulator/simulator. Make sure Appium running on port `4444` in order to initiate the session.

Capabilities for iOS device can be passed with arguments:
* `-v`      - `platformVersion`: version of Android/iOS platform
* `-d`      - `deviceName`: name of mobile device
* `-u`      - `udid`: udid for real devices

USAGE:
```sh
wdio repl ios --platformVersion 11.3 --deviceName 'iPhone 7' --udid 123432abc
```
OR
```sh
wdio repl ios -v 11.3 -d 'iPhone 7' -u 123432abc
```

You can apply any options (see `wdio repl --help`) available for your REPL session.

![WebdriverIO REPL](https://webdriver.io/img/repl.gif)

Another way to use the REPL is in inside your tests via the [`debug`](/api/utility/debug.html) command. This will stop the browser when called, and enables you to jump into the application (e.g. to the dev tools) or control the browser from the command line. This is helpful when some commands don't trigger a certain action as expected. With the REPL, you can then try out the commands to see which are working most reliably.
