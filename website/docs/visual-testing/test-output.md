---
id: test-output
title: Test Output
---

import useBaseUrl from '@docusaurus/useBaseUrl';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## save(Screen/Element/FullPageScreen)

### Console Output

The `save(Screen/Element/FullPageScreen)` methods will provide the following information after the method has been executed:

```js
const saveResult = {
    // The device pixel ratio of the instance that has run
    devicePixelRatio: 1,
    // The formatted filename, this depends on the options `formatImageName`
    fileName: "examplePage-chrome-latest-1366x768.png",
    // The path where the actual screenshot file can be found
    path: "/Users/wswebcreation/Git/wdio-image-comparison-service/.tmp/actual/desktop_chrome",
};
```

### Image Output

<Tabs
defaultValue="saveelement"
values={[
{label: 'saveElement', value: 'saveelement'},
{label: 'saveScreen', value: 'savescreen'},
{label: 'saveFullPageScreen', value: 'savefullpagescreen'},
]
}>
<TabItem value="saveelement">

```js
await browser.saveElement("#element-id", "example-element-tag");
```

<Tabs
defaultValue="desktop"
values={[
{label: 'Desktop', value: 'desktop'},
{label: 'Android', value: 'android'},
{label: 'iOS', value: 'ios'},
]
}>
<TabItem value="desktop">
![saveElement Desktop](./img/test-output/wdioLogo-chrome-latest-1-1366x768.png)
</TabItem>
<TabItem value="android">
![saveElement Mobile Android](./img/test-output/wdioLogo-EmulatorAndroidGoogleAPIPortraitNativeWebScreenshot14.0-384x640.png)
</TabItem>
<TabItem value="ios">
![saveElement Mobile iOS](./img/test-output/wdioLogo-Iphone12Portrait16-390x844.png)
</TabItem>
</Tabs>
</TabItem>

<TabItem value="savescreen">

```js
await browser.saveScreen("example-page-tag");
```

<Tabs
defaultValue="desktop"
values={[
{label: 'Desktop', value: 'desktop'},
{label: 'Android ChromeDriver', value: 'android-chromedriver'},
{label: 'Android nativeWebScreenshot', value: 'android-native'},
{label: 'iOS', value: 'ios'},
]
}>
<TabItem value="desktop">
![saveScreen Desktop](./img/test-output/examplePage-chrome-latest-1366x768.png)
</TabItem>
<TabItem value="android-chromedriver">
![saveScreen Mobile Android ChromeDriver](./img/test-output/screenshot-EmulatorAndroidGoogleAPIPortraitChromeDriver14.0-384x640.png)
</TabItem>
<TabItem value="android-native">
![saveScreen Mobile Android nativeWebScreenshot](./img/test-output/screenshot-EmulatorAndroidGoogleAPIPortraitNativeWebScreenshot14.0-384x640.png)
</TabItem>
<TabItem value="ios">

:::info TIP
iOS `saveScreen` executions are by default not with the device bezel corners. To have this please add the `addIOSBezelCorners:true` option when instantiating the service, see [this](./service-options#addiosbezelcorners)
:::

![saveScreen Mobile iOS](./img/test-output/screenshot-Iphone12Portrait15-390x844.png)
</TabItem>
</Tabs>
</TabItem>

<TabItem value="savefullpagescreen">

```js
await browser.saveFullPageScreen("full-page-tag");
```

<Tabs
defaultValue="desktop"
values={[
{label: 'Desktop', value: 'desktop'},
{label: 'Android', value: 'android'},
{label: 'iOS', value: 'ios'},
]
}>
<TabItem value="desktop">
![saveFullPageScreens Desktop](./img/test-output/fullPage-chrome-latest-1366x768.png)
</TabItem>
<TabItem value="android">
![saveFullPageScreens Mobile Android](./img/test-output/fullPage-EmulatorAndroidGoogleAPIPortraitChromeDriver14.0-384x640.png)
</TabItem>
<TabItem value="ios">
![saveFullPageScreens Mobile iOS](./img/test-output/fullPage-Iphone12Portrait16-390x844.png)
</TabItem>
</Tabs>
</TabItem>

</Tabs>

## check(Screen/Element/FullPageScreen)

### Console Output

By default, the `check(Screen/Element/FullPageScreen)` methods will only provide a mismatch percentage like `1.23`, but when the plugin has the option `returnAllCompareData: true` the following information is provided after the method has been executed:

```js
const checkResult = {
    // The formatted filename, this depends on the options `formatImageName`
    fileName: "examplePage-chrome-headless-latest-1366x768.png",
    folders: {
        // The actual folder and the file name
        actual: "/Users/wswebcreation/Git/wdio-image-comparison-service/.tmp/actual/desktop_chrome/examplePage-chrome-headless-latest-1366x768.png",
        // The baseline folder and the file name
        baseline:
            "/Users/wswebcreation/Git/wdio-image-comparison-service/localBaseline/desktop_chrome/examplePage-chrome-headless-latest-1366x768.png",
        // This following folder is optional and only if there is a mismatch
        // The folder that holds the diffs and the file name
        diff: "/Users/wswebcreation/Git/wdio-image-comparison-service/.tmp/diff/desktop_chrome/examplePage-chrome-headless-latest-1366x768.png",
    },
    // The mismatch percentage
    misMatchPercentage: 2.34,
};
```

### Image Output

:::info
The images below will only show differences as a result of running the check commands. Only the diff in a browser is shown, but the output for Android and iOS is the same.
:::

<Tabs
defaultValue="checkelement"
values={[
{label: 'checkElement', value: 'checkelement'},
{label: 'checkScreen', value: 'checkscreen'},
{label: 'checkFullPageScreen', value: 'checkfullpagescreen'},
]
}>
<TabItem value="checkelement">

```js
await browser.checkElement("#element-id", "example-element-tag");
```


:::info
The button text has been changed from `Get Started` to `Getting Started!` and detected as a change.
:::

![Button Check Result](./img/test-output/button-check.png)
</TabItem>

<TabItem value="checkscreen">

```js
await browser.checkScreen("example-page-tag");
```

:::info
The button text has been changed from `Get Started` to `Getting Started!` and detected as a change.
:::

![Button Check Result](./img/test-output/screen-check.png)

</TabItem>

<TabItem value="checkfullpagescreen">

```js
await browser.checkFullPageScreen("full-page-tag");
```


:::info
The button text has been changed from `Get Started` to `Getting Started!` and detected as a change.
:::

![Button Check Result](./img/test-output/fullpage-check.png)

</TabItem>

</Tabs>

## Block-Outs

:::info
Not all block-out options are shown here, but below you will find an output for Android NativeWebScreenshot and iOS where the status+address and toolbar are blocked out.
:::

### Android nativeWebScreenshot

![Blockouts Android](./img/test-output/android.blockouts.png)

### iOS

![Blockouts iOS](./img/test-output/ios.blockouts.png)
