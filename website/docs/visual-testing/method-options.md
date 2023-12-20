---
id: method-options
title: Method Options
---

Methods options are the options that can be set per method. If the option has the same key as an option that has been set during the instantiation of the plugin, this method option will override the plugin option value.

## Save Options

### `disableCSSAnimation`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `false`
-   **Used with:** All methods

En/Disable all CSS animations and the input caret in the application. If set to true all animations will be disabled before taking a screenshot
and reset when done

### `hideScrollBars`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `true`
-   **Used with:** All methods

Hide scrollbar(s) in the application. If set to true all scrollbar(s) will be disabled before taking a screenshot. This is set to default `true` to prevent extra issues.

### `hideElements`

-   **Type:** `array`
-   **Mandatory:** no
-   **Used with:** All methods

This method can hide 1 or multiple elements by adding the property `visibility: hidden` to them by providing an array of elements.

### `removeElements`

-   **Type:** `array`
-   **Mandatory:** no
-   **Used with:** All methods

This method can _remove_ 1 or multiple elements by adding the property `display: none` to them by providing an array of elements.

### `resizeDimensions`

-   **Type:** `object`
-   **Mandatory:** no
-   **Default:** `{ top: 0, right: 0, bottom: 0, left: 0}`
-   **Used with:** Only for `saveElement` or `checkElement`

An object that needs to hold a `top`, `right`, `bottom` and `left` amount of pixels that need to make the element cutout bigger.

### `fullPageScrollTimeout`

-   **Type:** `number`
-   **Mandatory:** No
-   **Default:** `1500`
-   **Used with:** Only for `saveFullPageScreen` or `saveTabbablePage`

The timeout in milliseconds to wait after a scroll. This might help identify pages with lazy loading.

### `hideAfterFirstScroll`

-   **Type:** `array`
-   **Mandatory:** no
-   **Used with:** Only for `saveFullPageScreen` or `saveTabbablePage`

This method will hide one or multiple elements by adding the property `visibility: hidden` to them by providing an array of elements.
This will be handy when a page for example holds sticky elements that will scroll with the page if the page is scrolled but will give an annoying effect when a full-page screenshot is made

## Compare (Check) Options

Compare options are options that influence the way the comparison, by [ResembleJS](https://github.com/Huddle/Resemble.js) is being executed.

:::info NOTE

-   All options from the [Save Options](#save-options) can be used for the Compare methods
-   All compare options can be used during service instantiation or for every single `checkElement`,`checkScreen` and `checkFullPageScreen`. If a method option has the same key as an option that has been set during the instantiation of the service, then the method compare option will override the service compare option value.

:::

### `ignoreAlpha`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Compare images and discard alpha.

### `blockOutSideBar`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can only be used for `checkScreen()`. It will override the plugin setting. This is **iPad only**_

Automatically block out the sidebar for iPads in landscape mode during comparisons. This prevents failures on the tab/private/bookmark native component.

### `blockOutStatusBar`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting. This is **Mobile only**_

Automatically block out the status and address bar during comparisons. This prevents failures on time, wifi or battery status.

### `blockOutToolBar`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting. This is **Mobile only**_

Automatically block out the toolbar.

### `ignoreAntialiasing`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Compare images and discard anti-aliasing.

### `ignoreColors`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Even though the images are in color, the comparison will compare 2 black/white images

### `ignoreLess`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Compare images and compare with `red = 16, green = 16, blue = 16, alpha = 16, minBrightness=16, maxBrightness=240`

### `ignoreNothing`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Compare images and compare with `red = 0, green = 0, blue = 0, alpha = 0, minBrightness=0, maxBrightness=255`

### `ignoreTransparentPixel`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Compare images and it will ignore all pixels that have some transparency in one of the images

### `rawMisMatchPercentage`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

If true the return percentage will be like `0.12345678`, default is `0.12`

### `returnAllCompareData`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

This will return all compare data, not only the mismatch percentage

### `saveAboveTolerance`

-   **Type:** `number`
-   **Default:** `0`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Allowable value of `misMatchPercentage` that prevents saving images with differences

### `largeImageThreshold`

-   **Type:** `number`
-   **Default:** `0`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Comparing large images can lead to performance issues.
When providing a number for the number of pixels here (higher than 0), the comparison algorithm skips pixels when the image width or height is larger than `largeImageThreshold` pixels.

### `scaleImagesToSameSize`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Scales 2 images to the same size before execution of comparison. Highly recommended to enable `ignoreAntialiasing` and `ignoreAlpha`

## Folder options

The baseline folder and screenshot folders(actual, diff) are options that can be set during the instantiation of the plugin or method. To set the folder options on a particular method, pass in folder options to the methods option object.

```ts
import { join } from "path";

const methodOptions = {
    actualFolder: join(process.cwd(), "./customActual"),
    baselineFolder: join(process.cwd(), "./customBaseline"),
    diffFolder: join(process.cwd(), "./customDiff"),
};

// You can use this for all methods
await expect(
    await browser.checkFullPageScreen("checkFullPage", methodOptions)
).toEqual(0);
```
