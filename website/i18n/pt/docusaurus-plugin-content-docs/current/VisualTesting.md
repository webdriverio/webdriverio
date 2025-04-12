---
id: visual-testing
title: Visual Testing
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## What can it do?

WebdriverIO provides image comparisons on screens, elements or a full-page for

- 🖥️ Desktop browsers (Chrome / Firefox / Safari / Microsoft Edge)
- 📱 Mobile / Tablet browsers (Chrome on Android emulators / Safari on iOS Simulators / Simulators / real devices) via Appium
- 📱 Native Apps (Android emulators / iOS Simulators / real devices) via Appium (🌟 **NEW** 🌟)
- 📳 Hybrid apps via Appium

through the [`@wdio/visual-service`](https://www.npmjs.com/package/@wdio/visual-service) which is a lightweight WebdriverIO service.

This allows you to:

- save or compare **screens/elements/full-page** screens against a baseline
- automatically **create a baseline** when no baseline is there
- **block out custom regions** and even **automatically exclude** a status and or toolbars (mobile only) during a comparison
- increase the element dimensions screenshots
- **hide text** during website comparison to:
    - **improve stability** and prevent font rendering flakiness
    - only focus on the **layout** of a website
- use **different comparison methods** and a set of **additional matchers** for better readable tests
- verify how your website will **support tabbing with your keyboard)**, see also [Tabbing through a website](#tabbing-through-a-website)
- and much more, see the [service](./visual-testing/service-options) and [method](./visual-testing/method-options) options

The service is a lightweight module to retrieve the needed data and screenshots for all browsers/devices. The comparison power comes from [ResembleJS](https://github.com/Huddle/Resemble.js). If you want to compare images online you can check the [online tool](http://rsmbl.github.io/Resemble.js/).

:::info NOTE For Native/Hybrid Apps

Please use the property `isHybridApp:true` in your service settings when you want to use it for Hybrid Apps.
:::

## Installation

The easiest way is to keep `@wdio/visual-service` as a dev-dependency in your `package.json`, via:

```sh
npm install --save-dev @wdio/visual-service
```

## Usage

`@wdio/visual-service` can be used as a normal service. You can set it up in your configuration file with the following:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/visual-testing/config.js
```

More service options can be found [here](/docs/visual-testing/service-options).

Once set up in your WebdriverIO configuration, you can go ahead and add visual assertions to [your tests](/docs/visual-testing/writing-tests).

### Capabilities

To use the Visual Testing module, **you don’t need to add any extra options to your capabilities**. However, in some cases, you may want to add additional metadata to your visual tests, such as a `logName`.

The `logName` allows you to assign a custom name to each capability, which can then be included in the image filenames. This is particularly useful for distinguishing screenshots taken across different browsers, devices, or configurations.

To enable this, you can define `logName` in the `capabilities` section and ensure the `formatImageName` option in the Visual Testing service references it. Here's how you can set it up:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/visual-testing/capabilities.js
```

#### How it works

1. Setting Up the `logName`:

    - In the `capabilities` section, assign a unique `logName` to each browser or device. For example, `chrome-mac-15` identifies tests running on Chrome on macOS version 15.

2. Custom Image Naming:

    - The `formatImageName` option integrates the `logName` into the screenshot filenames. For example, if the `tag` is homepage and the resolution is `1920x1080`, the resulting filename might look like this:

        `homepage-chrome-mac-15-1920x1080.png`

3. Benefits of Custom Naming:

    - Distinguishing between screenshots from different browsers or devices becomes much easier, especially when managing baselines and debugging discrepancies.

4. Note on Defaults:

    -If `logName` is not set in the capabilities, the `formatImageName` option will show it as an empty string in the filenames (`homepage--15-1920x1080.png`)

### WebdriverIO MultiRemote

We also support [MultiRemote](https://webdriver.io/docs/multiremote/). To make this work properly make sure that you add `wdio-ics:options` to your
capabilities as you can see below. This will make sure that each screenshot will have its own unique name.

[Writing your tests](/docs/visual-testing/writing-tests) will not be any different in comparison to using the [testrunner](https://webdriver.io/docs/testrunner)

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/visual-testing/logs.js
```

### Running Programmatically

Here is a minimal example of how to use `@wdio/visual-service` via `remote` options:

```js
import { remote } from "webdriverio";
import VisualService from "@wdio/visual-service";

let visualService = new VisualService({
    autoSaveBaseline: true,
});

const browser = await remote({
    logLevel: "silent",
    capabilities: {
        browserName: "chrome",
    },
});

// "Start" the service to add the custom commands to the `browser`
visualService.remoteSetup(browser);

await browser.url("https://webdriver.io/");

// or use this for ONLY saving a screenshot
await browser.saveFullPageScreen("examplePaged", {});

// or use this for validating. Both methods don't need to be combined, see the FAQ
await browser.checkFullPageScreen("examplePaged", {});

await browser.deleteSession();
```

### Tabbing through a website

You can check if a website is accessible by using the keyboard <kbd>TAB</kbd>-key. Testing this part of accessibility has always been a time-consuming (manual) job and pretty hard to do through automation.
With the methods `saveTabbablePage` and `checkTabbablePage`, you can now draw lines and dots on your website to verify the tabbing order.

Be aware of the fact that this is only useful for desktop browsers and **NOT\*\*** for mobile devices. All desktop browsers support this feature.

:::note

The work is inspired by [Viv Richards](https://github.com/vivrichards600) his blog post about ["AUTOMATING PAGE TABABILITY (IS THAT A WORD?) WITH VISUAL TESTING"](https://vivrichards.co.uk/accessibility/automating-page-tab-flows-using-visual-testing-and-javascript).

The way tabbable elements are selected is based on the module [tabbable](https://github.com/davidtheclark/tabbable). If there are any issues regarding the tabbing please check the [README.md](https://github.com/davidtheclark/tabbable/blob/master/README.md) and especially the [More ](https://github.com/davidtheclark/tabbable/blob/master/README.md#more-details)Details section.

:::

#### How does it work

Both methods will create a `canvas` element on your website and draw lines and dots to show you where your TAB would go if an end-user would use it. After that, it will create a full-page screenshot to give you a good overview of the flow.

:::important

\*\*Use the `saveTabbablePage` only when you need to create a screenshot and DON'T want to compare it \*\*with a **baseline** image.\*\*\*\*

:::

When you want to compare the tabbing flow with a baseline, then you can use the `checkTabbablePage`-method. You **DON'T** need to use the two methods together. If there is already a baseline image created, which can automatically be done by providing `autoSaveBaseline: true` when you instantiate the service,
the `checkTabbablePage` will first create the _actual_ image and then compare it against the baseline.

##### Options

Both methods use the same options as the [`saveFullPageScreen`](https://github.com/wswebcreation/webdriver-image-comparison/blob/master/docs/OPTIONS.md#savefullpagescreen-or-savetabbablepage) or the
[`compareFullPageScreen`](https://github.com/wswebcreation/webdriver-image-comparison/blob/master/docs/OPTIONS.md#comparefullpagescreen-or-comparetabbablepage).

#### Example

This is an example of how the tabbing works on our [guinea pig website](https://guinea-pig.webdriver.io/image-compare.html):

![WDIO tabbing example](/img/visual/tabbable-chrome-latest-1366x768.png)

### Automatically update failed Visual Snapshots

Update the baseline images through the command line by adding the argument `--update-visual-baseline`. This will

- automatically copy the actual take screenshot and put it in the baseline folder
- if there are differences it will let the test pass because the baseline has been updated

**Usage:**

```sh
npm run test.local.desktop  --update-visual-baseline
```

When running logs info/debug mode you will see the following logs added

```logs
[0-0] ..............
[0-0] #####################################################################################
[0-0]  INFO:
[0-0]  Updated the actual image to
[0-0]  /Users/wswebcreation/Git/wdio/visual-testing/localBaseline/chromel/demo-chrome-1366x768.png
[0-0] #####################################################################################
[0-0] ..........
```

## Typescript support

This module includes TypeScript support, allowing you to benefit from auto-completion, type safety, and improved developer experience when using the Visual Testing service.

### Step 1: Add Type Definitions

To ensure TypeScript recognizes the module types, add the following entry to the types field in your tsconfig.json:

```json
{
    "compilerOptions": {
        "types": ["@wdio/visual-service"]
    }
}
```

### Step 2: Enable Type Safety for Service Options

To enforce type checking on the service options, update your WebdriverIO configuration:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/visual-testing/service-options.js
```

## System Requirements

### Version 5 and up

For version 5 and up, this module is a purely JavaScript-based module with no additional system dependencies beyond the general [project requirements](/docs/gettingstarted#system-requirements). It uses [Jimp](https://github.com/jimp-dev/jimp) which is an image processing library for Node written entirely in JavaScript, with zero native dependencies.

### Version 4 and Lower

For version 4 and lower, this module relies on [Canvas](https://github.com/Automattic/node-canvas), a canvas implementation for Node.js. Canvas depends on [Cairo](https://cairographics.org/).

#### Installation Details

By default, binaries for macOS, Linux and Windows will be downloaded during your project's `npm install`. If you don't have a supported OS or processor architecture, the module will be compiled on your system. This requires several dependencies, including Cairo and Pango.

For detailed installation information, see the [node-canvas wiki](https://github.com/Automattic/node-canvas/wiki/_pages). Below are one-line installation instructions for common operating systems. Note that `libgif/giflib`, `librsvg`, and `libjpeg` are optional and only needed for GIF, SVG, and JPEG support, respectively. Cairo v1.10.0 or later is required.

<Tabs
defaultValue="osx"
values={[
{label: 'OS', value: 'osx'},
{label: 'Ubuntu', value: 'ubuntu'},
{label: 'Fedora', value: 'fedora'},
{label: 'Solaris', value: 'solaris'},
{label: 'OpenBSD', value: 'openbsd'},
{label: 'Window', value: 'windows'},
{label: 'Others', value: 'others'},
]}

> <TabItem value="osx">

````
 Using [Homebrew](https://brew.sh/):

 ```sh
 brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
 ```

**Mac OS X v10.11+:** If you have recently updated to Mac OS X v10.11+ and are experiencing trouble when compiling, run the following command: `xcode-select --install`. Read more about the problem [on Stack Overflow](http://stackoverflow.com/a/32929012/148072).
If you have Xcode 10.0 or higher installed, to build from source you need NPM 6.4.1 or higher.
````

</TabItem>
<TabItem value="ubuntu">

````
```sh
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```
````

</TabItem>
<TabItem value="fedora">

````
```sh
sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel
```
````

</TabItem>
<TabItem value="solaris">

````
```sh
pkgin install cairo pango pkg-config xproto renderproto kbproto xextproto
```
````

</TabItem>
<TabItem value="openbsd">

````
```sh
doas pkg_add cairo pango png jpeg giflib
```
````

</TabItem>
<TabItem value="windows">

```
See the [wiki](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)
```

</TabItem>
<TabItem value="others">

```
See the [wiki](https://github.com/Automattic/node-canvas/wiki)
```

</TabItem>
</Tabs>
