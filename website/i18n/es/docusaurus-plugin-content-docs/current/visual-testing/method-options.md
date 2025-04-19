---
id: method-options
title: Method Options
---

Methods options are the options that can be set per [method](./methods). If the option has the same key as an option that has been set during the instantiation of the plugin, this method option will override the plugin option value.

## Save Options

### `disableBlinkingCursor`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Supported:** Web, Hybrid App (Webview)

En/Disable all `input`, `textarea`, `[contenteditable]` caret "blinking" in the application. If set to `true` the caret will be set to `transparent` before taking a screenshot
and reset when done

### `disableCSSAnimation`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Supported:** Web, Hybrid App (Webview)

En/Disable all CSS animations in the application. If set to `true` all animations will be disabled before taking a screenshot
and reset when done

### `enableLayoutTesting`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Used with:** All [methods](./methods)
- **Supported:** Web

This will hide all text on a page so only the layout will be used for comparison. Hiding will be done by adding the style `'color': 'transparent !important'` to **each** element.

For the output see [Test Output](./test-output#enablelayouttesting)

:::info
By using this flag each element that contains text (so not only `p, h1, h2, h3, h4, h5, h6, span, a, li`, but also `div|button|..`) will get this property. There is **no** option to tailor this.
:::

### `hideScrollBars`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `true`
- **Used with:** All [methods](./methods)
- **Supported:** Web, Hybrid App (Webview)

Hide scrollbar(s) in the application. If set to true all scrollbar(s) will be disabled before taking a screenshot. This is set to default `true` to prevent extra issues.

### `hideElements`

- **Type:** `array`
- **Mandatory:** no
- **Used with:** All [methods](./methods)
- **Supported:** Web, Hybrid App (Webview), Native App

This method can hide 1 or multiple elements by adding the property `visibility: hidden` to them by providing an array of elements.

### `removeElements`

- **Type:** `array`
- **Mandatory:** no
- **Used with:** All [methods](./methods)
- **Supported:** Web, Hybrid App (Webview), Native App

This method can _remove_ 1 or multiple elements by adding the property `display: none` to them by providing an array of elements.

### `resizeDimensions`

- **Type:** `object`
- **Mandatory:** no
- **Default:** `{ top: 0, right: 0, bottom: 0, left: 0}`
- **Used with:** Only for [`saveElement`](./methods#saveelement) or [`checkElement`](./methods#checkelement)
- **Supported:** Web, Hybrid App (Webview), Native App

An object that needs to hold a `top`, `right`, `bottom` and `left` amount of pixels that need to make the element cutout bigger.

### `fullPageScrollTimeout`

- **Type:** `number`
- **Mandatory:** No
- **Default:** `1500`
- **Used with:** Only for [`saveFullPageScreen`](./methods#savefullpagescreen) or [`saveTabbablePage`](./methods#savetabbablepage)
- **Supported:** Web

The timeout in milliseconds to wait after a scroll. This might help identify pages with lazy loading.

### `hideAfterFirstScroll`

- **Type:** `array`
- **Mandatory:** no
- **Used with:** Only for [`saveFullPageScreen`](./methods#savefullpagescreen) or [`saveTabbablePage`](./methods#savetabbablepage)
- **Supported:** Web

This method will hide one or multiple elements by adding the property `visibility: hidden` to them by providing an array of elements.
This will be handy when a page for example holds sticky elements that will scroll with the page if the page is scrolled but will give an annoying effect when a full-page screenshot is made

### `waitForFontsLoaded`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `true`
- **Used with:** All [methods](./methods)
- **Supported:** Web, Hybrid App (Webview)

Fonts, including third-party fonts, can be loaded synchronously or asynchronously. Asynchronous loading means that fonts might load after WebdriverIO determines that a page has fully loaded. To prevent font rendering issues, this module, by default, will wait for all fonts to be loaded before taking a screenshot.

## Compare (Check) Options

Compare options are options that influence the way the comparison, by [ResembleJS](https://github.com/Huddle/Resemble.js) is being executed.

:::info NOTE

- All options from the [Save Options](#save-options) can be used for the Compare methods
- All compare options can be used during service instantiation **or** for every single check method. If a method option has the same key as an option that has been set during the instantiation of the service, then the method compare option will override the service compare option value.
- All options can be used for:
    - Web
    - Hybrid App
    - Native App

:::

### `ignoreAlpha`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** no

Compare images and discard alpha.

### `blockOutSideBar`

- **Type:** `boolean`
- **Default:** `true`
- **Mandatory:** no
- **Remark:** _Can only be used for `checkScreen()`. This is **iPad only**_

Automatically block out the sidebar for iPads in landscape mode during comparisons. This prevents failures on the tab/private/bookmark native component.

### `blockOutStatusBar`

- **Type:** `boolean`
- **Default:** `true`
- **Mandatory:** no
- **Remark:** _This is **Mobile only**_

Automatically block out the status and address bar during comparisons. This prevents failures on time, wifi or battery status.

### `blockOutToolBar`

- **Type:** `boolean`
- **Default:** `true`
- **Mandatory:** no
- **Remark:** _This is **Mobile only**_

Automatically block out the toolbar.

### `ignoreAntialiasing`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** no

Compare images and discard anti-aliasing.

### `ignoreColors`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** no

Even though the images are in color, the comparison will compare 2 black/white images

### `ignoreLess`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** no

Compare images and compare with `red = 16, green = 16, blue = 16, alpha = 16, minBrightness=16, maxBrightness=240`

### `ignoreNothing`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** no

Compare images and compare with `red = 0, green = 0, blue = 0, alpha = 0, minBrightness=0, maxBrightness=255`

### `rawMisMatchPercentage`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** no

If true the return percentage will be like `0.12345678`, default is `0.12`

### `returnAllCompareData`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** no

This will return all compare data, not only the mismatch percentage

### `saveAboveTolerance`

- **Type:** `number`
- **Default:** `0`
- **Mandatory:** no

Allowable value of `misMatchPercentage` that prevents saving images with differences

### `largeImageThreshold`

- **Type:** `number`
- **Default:** `0`
- **Mandatory:** no

Comparing large images can lead to performance issues.
When providing a number for the number of pixels here (higher than 0), the comparison algorithm skips pixels when the image width or height is larger than `largeImageThreshold` pixels.

### `scaleImagesToSameSize`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** no

Scales 2 images to the same size before execution of comparison. Highly recommended to enable `ignoreAntialiasing` and `ignoreAlpha`

## Folder options

The baseline folder and screenshot folders(actual, diff) are options that can be set during the instantiation of the plugin or method. To set the folder options on a particular method, pass in folder options to the methods option object. This can be used for:

- Web
- Hybrid App
- Native App

```ts
import path from 'node:path'

const methodOptions = {
    actualFolder: path.join(process.cwd(), 'customActual'),
    baselineFolder: path.join(process.cwd(), 'customBaseline'),
    diffFolder: path.join(process.cwd(), 'customDiff'),
}

// You can use this for all methods
await expect(
    await browser.checkFullPageScreen("checkFullPage", methodOptions)
).toEqual(0)
```

### `actualFolder`

- **Type:** `string`
- **Mandatory:** no

Folder for the snapshot that has been captured in the test.

### `baselineFolder`

- **Type:** `string`
- **Mandatory:** no

Folder for the baseline image that is being used to compare against.

### `diffFolder`

- **Type:** `string`
- **Mandatory:** no

Folder for the image difference rendered by ResembleJS.
