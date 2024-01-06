---
id: visual-testing
title: Visual Testing
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## What can it do?

WebdriverIO provides image comparisons on screens, elements or a full-page for browsers, mobile browsers as well as hybrid apps through the [`wdio-image-comparison-service`](https://www.npmjs.com/package/wdio-image-comparison-service) which is a lightweight WebdriverIO service.

This allows you to:

-   save or compare screens/elements/full-page screens against a baseline
-   automatically create a baseline when no baseline is there
-   block out custom regions and even automatically exclude a status and or toolbars (mobile only) during a comparison
-   increase the element dimensions screenshots
-   use different comparison methods
-   We now support Puppeteer with WebdriverIO
-   You can now verify how your website will support tabbing with your keyboard, see also here @TODO
-   and much more, see the options here @TODO

The module is now based on the power of the new [`webdriver-image-comparison`](https://github.com/wswebcreation/webdriver-image-comparison) module. This is a lightweight module to retrieve the needed data and screenshots for all browsers/devices.
The comparison power comes from [ResembleJS](https://github.com/Huddle/Resemble.js). If you want to compare images online you can check the [online tool](http://rsmbl.github.io/Resemble.js/)

It can be used for:

-   Desktop browsers (Chrome / Firefox / Safari / Microsoft Edge)
-   Mobile / Tablet browsers (Chrome / Safari on emulators / real devices) via Appium
-   Hybrid apps via Appium

:::info NOTE For Hybrid Apps
Please use the property `isHybridApp:true` in your service settings
:::

## Installation

The easiest way is to keep `wdio-image-comparison-service` as a dev-dependency in your `package.json`, via:

```sh
npm install --save-dev wdio-image-comparison-service
```

## Usage

`wdio-image-comparison-service` can be used as a normal service. You can set it up in your configuration file with the following

```js
const { join } = require("path");
// wdio.conf.(js|ts)
exports.config = {
    // ...
    // =====
    // Setup
    // =====
    services: [
        [
            "image-comparison",
            // The options
            {
                // Some options, see the docs for more
                baselineFolder: join(
                    process.cwd(),
                    "./tests/sauceLabsBaseline/"
                ),
                formatImageName: "{tag}-{logName}-{width}x{height}",
                screenshotPath: join(process.cwd(), ".tmp/"),
                savePerInstance: true,
                autoSaveBaseline: true,
                blockOutStatusBar: true,
                blockOutToolBar: true,
                // NOTE: When you are testing a hybrid app please use this setting
                isHybridApp: true,
                // Options for the tabbing image
                tabbableOptions: {
                    circle: {
                        size: 18,
                        fontSize: 18,
                        // ...
                    },
                    line: {
                        color: "#ff221a", // hex-code or for example words like `red|black|green`
                        width: 3,
                    },
                },
                // ... more options
            },
        ],
    ],
    // ...
};
```

More service options can be found [here](./service-options).

### WebdriverIO MultiRemote

We also support [MultiRemote](https://webdriver.io/docs/multiremote/). To make this work properly make sure that you add `wdio-ics:options` to your
capabilities as you can see below. This will make sure that each screenshot will have its own unique name.

[Writing your tests](./visual-testing/writing-tests) will not be any different in comparison to using the [TestRunner](https://webdriver.io/docs/testrunner)

```js
exports.config = {
    capabilities: {
        chromeBrowserOne: {
            capabilities: {
                browserName: "chrome",
                "goog:chromeOptions": {
                    args: ["disable-infobars"],
                },
                // THIS!!!
                "wdio-ics:options": {
                    logName: "chrome-latest-one",
                },
            },
        },
        chromeBrowserTwo: {
            capabilities: {
                browserName: "chrome",
                "goog:chromeOptions": {
                    args: ["disable-infobars"],
                },
                // THIS!!!
                "wdio-ics:options": {
                    logName: "chrome-latest-two",
                },
            },
        },
    },
};
```

### Running Programmatically

Here is a minimal example of how to use `wdio-image-comparison-service` via `remote` options

```js
import { remote } from "webdriverio";

import WdioImageComparisonService from "wdio-image-comparison-service";

let wdioImageComparisonService = new WdioImageComparisonService({});

async function main() {
    const browser = await remote({
        logLevel: "silent",
        capabilities: {
            browserName: "chrome",
        },
    });

    wdioImageComparisonService.defaultOptions.autoSaveBaseline = true;
    browser.defaultOptions = wdioImageComparisonService.defaultOptions;
    browser.folders = wdioImageComparisonService.folders;

    wdioImageComparisonService.before(browser.capabilities);

    await browser.url("https://webdriver.io/");

    // or use this for ONLY saving a screenshot
    await browser.saveFullPageScreen("examplePaged", {});

    // or use this for validating. Both methods don't need to be combined, see the FAQ
    await browser.checkFullPageScreen("examplePaged", {});

    await browser.deleteSession();
}

main().catch(async (e) => {
    console.error(e);
});
```

### DEV-TOOLS support

You can also use the Chrome DevTools as an automation protocol in combination with this module. You don't need to do anything,
just change `automationProtocol: 'devtools'` in your config.
More information about how to use the DEV-TOOLS can be found in [this](https://webdriver.io/blog/2019/09/16/devtools.html) blog post.

### Typescript support

We now also support typescript types. Add the following to the `types` in your `tsconfig.json`:

```json
{
    "compilerOptions": {
        "types": ["wdio-image-comparison-service"]
    }
}
```

## System Requirements

-   [Node.js](#nodejs)
-   [WebdriverIO](#webdriverio/) V8 or higher
-   [Node Canvas](#node-canvas)

### Node.js

You’ll need [Node.js](http://nodejs.org) installed.

-   Install at least v18.x or higher as this is the oldest active LTS version
-   Only releases that are or will become an LTS release are officially supported

If Node is not currently installed on your system, we suggest utilizing a tool such as [NVM](https://github.com/creationix/nvm) to assist in managing multiple active Node.js versions.

### WebdriverIO

If you don't have a project, please check the WebdriverIO [Getting Started Docs](https://webdriver.io/docs/gettingstarted) to set up your project.

### Node Canvas

This module relies on [Canvas](https://github.com/Automattic/node-canvas) which is a canvas implementation for Node.js. It relies on [Cairo](https://cairographics.org/).

By default, binaries for macOS, Linux and Windows will be downloaded during your project's `npm install`. If you don't have a supported OS or processor architecture, the module will be compiled on your system. This requires several dependencies, including Cairo and Pango.

For detailed installation information, see the [node-canvas wiki](https://github.com/Automattic/node-canvas/wiki/_pages). One-line installation instructions for common OSes are below. Note that libgif/giflib, librsvg and libjpeg are optional and only required if you need GIF, SVG and JPEG support, respectively. Cairo v1.10.0 or later is required.

<Tabs
defaultValue="osx"
values={[
{label: 'OS X', value: 'osx'},
{label: 'Ubuntu X', value: 'ubuntu'},
{label: 'Fedora X', value: 'fedora'},
{label: 'Solaris X', value: 'solaris'},
{label: 'OpenBSD X', value: 'openbsd'},
{label: 'Window X', value: 'windows'},
{label: 'Others X', value: 'others'},
]
}>
<TabItem value="osx">

     Using [Homebrew](https://brew.sh/):

     ```sh
     brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
     ```

    **Mac OS X v10.11+:** If you have recently updated to Mac OS X v10.11+ and are experiencing trouble when compiling, run the following command: `xcode-select --install`. Read more about the problem [on Stack Overflow](http://stackoverflow.com/a/32929012/148072).
    If you have Xcode 10.0 or higher installed, to build from source you need NPM 6.4.1 or higher.

</TabItem>
<TabItem value="ubuntu">

    ```sh
    sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
    ```

</TabItem>
<TabItem value="fedora">

    ```sh
    sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel
    ```

</TabItem>
<TabItem value="solaris">

    ```sh
    pkgin install cairo pango pkg-config xproto renderproto kbproto xextproto
    ```

</TabItem>
<TabItem value="openbsd">

    ```sh
    doas pkg_add cairo pango png jpeg giflib
    ```

</TabItem>
<TabItem value="windows">

    See the [wiki](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)

</TabItem>
<TabItem value="others">
    See the [wiki](https://github.com/Automattic/node-canvas/wiki)
</TabItem>
</Tabs>
