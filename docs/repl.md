---
id: repl
title: REPL interface
---

With `v4.5.0` WebdriverIO introduces a [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) interface that helps you to not only discover the framework API but also debug and inspect your tests. It can be used in multiple ways. First you can use it as CLI command and spawn a WebDriver session from the command line, e.g.

```sh
$ wdio repl chrome
```

This would open a Chrome browser that you can control with the REPL interface. Make sure you have a browser driver running on port `4444` in order to initiate the session. If you have a [SauceLabs](https://saucelabs.com) (or other cloud vendor) account you can also directly run the browser on your command line in the cloud via:

```sh
$ wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

You can apply any options (see `wdio --help`) available for your REPL session.

![WebdriverIO REPL](https://webdriver.io/img/repl.gif)

Another way to use the REPL is in between your tests via the [`debug`](/api/utility/debug.html) command. It will stop the browser when executed and enables you to jump into the application (e.g. to the dev tools) or control the browser from the command line. This is helpful when some commands don't trigger a certain action as expected. With the REPL you can then try out the commands to see which are working most reliable.
