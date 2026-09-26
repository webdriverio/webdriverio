WebdriverIO Display Server
==========================

> Starts a virtual display, Weston or Xvfb, for headless testing on Linux

**Most users don't need to install this package directly.** `@wdio/local-runner` depends on it and starts a display server when a testrunner run needs one: on Linux, when neither `DISPLAY` nor `WAYLAND_DISPLAY` is set. Configure it with the `displayServer*` options at the root of your `wdio.conf.ts`. See [Headless & Display Servers](https://webdriver.io/docs/headless-and-display-servers) for how it works, its options, CI recipes and troubleshooting.

## Install

```sh
npm install @wdio/display-server
```

## Usage outside the testrunner

To start a display server from a standalone `remote()` script, see [Standalone scripts](https://webdriver.io/docs/headless-and-display-servers#standalone-scripts).

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
