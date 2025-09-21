---
id: method-options
title: Method Options
---

Methods options are the options that can be set per [method](./methods). If the option has the same key as an option that has been set during the instantiation of the plugin, this method option will override the plugin option value.

:::info NOTE

-   All options from the [Save Options](#save-options) can be used for the [Compare](#compare-check-options) methods
-   All compare options can be used during service instantiation __or__ for every single check method. If a method option has the same key as an option that has been set during the instantiation of the service, then the method compare option will override the service compare option value.
- All options can be used for the below application contexts unless mentioned otherwise:
    - Web
    - Hybrid App
    - Native App
- The below samples are with the `save*`-methods, but can also be used with the `check*`-methods

:::

## Save Options

### `disableBlinkingCursor`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Used with:** All [methods](./methods)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

En/Disable all `input`, `textarea`, `[contenteditable]` caret "blinking" in the application. If set to `true` the caret will be set to `transparent` before taking a screenshot
and reset when done.

```typescript
await browser.saveScreen(
    'sample-tag',
    {
        disableBlinkingCursor: true
    }
)
```

### `disableCSSAnimation`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Used with:** All [methods](./methods)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

En/Disable all CSS animations in the application. If set to `true` all animations will be disabled before taking a screenshot
and reset when done

```typescript
await browser.saveScreen(
    'sample-tag',
    {
        disableCSSAnimation: true
    }
)
```

### `enableLegacyScreenshotMethod`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Used with:** All [methods](./methods)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

Use this option to switch back to the "older" screenshot method based on the W3C-WebDriver protocol. This can be helpful if your tests rely on existing baseline images or if you're running in environments that don’t fully support the newer BiDi-based screenshots.
Note that enabling this may produce screenshots with slightly different resolution or quality.

```typescript
await browser.saveScreen(
    'sample-tag',
    {
        enableLegacyScreenshotMethod: true
    }
)
```

### `enableLayoutTesting`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Used with:** All [methods](./methods)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

This will hide all text on a page so only the layout will be used for comparison. Hiding will be done by adding the style `'color': 'transparent !important'` to __each__ element.

For the output see [Test Output](./test-output#enablelayouttesting).

:::info
By using this flag each element that contains text (so not only `p, h1, h2, h3, h4, h5, h6, span, a, li`, but also `div|button|..`) will get this property. There is __no__ option to tailor this.
:::

```typescript
await browser.saveScreen(
    'sample-tag',
    {
        enableLayoutTesting: true
    }
)
```

### `hideScrollBars`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `true`
- **Used with:** All [methods](./methods)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

Hide scrollbar(s) in the application. If set to true all scrollbar(s) will be disabled before taking a screenshot. This is set to default `true` to prevent extra issues.

```typescript
await browser.saveScreen(
    'sample-tag',
    {
        hideScrollBars: false
    }
)
```

### `hideElements`

- **Type:** `array`
- **Mandatory:** No
- **Used with:** All [methods](./methods)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

This method can hide 1 or multiple elements by adding the property `visibility: hidden` to them by providing an array of elements.

```typescript
await browser.saveScreen(
    'sample-tag',
    {
        hideElements: [
            await $('#element-1'),
            await $('#element-2'),
        ]
    }
)
```

### `removeElements`

- **Type:** `array`
- **Mandatory:** No
- **Used with:** All [methods](./methods)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

This method can _remove_ 1 or multiple elements by adding the property `display: none` to them by providing an array of elements.

```typescript
await browser.saveScreen(
    'sample-tag',
    {
        removeElements: [
            await $('#element-1'),
            await $('#element-2'),
        ]
    }
)
```

### `resizeDimensions`

- **Type:** `object`
- **Mandatory:** No
- **Default:** `{ top: 0, right: 0, bottom: 0, left: 0}`
- **Used with:** Only for [`saveElement`](./methods#saveelement) or [`checkElement`](./methods#checkelement)
- **Supported Application Contexts:** Web, Hybrid App (Webview), Native App

An object that needs to hold a `top`, `right`, `bottom` and `left` amount of pixels that need to make the element cutout bigger.

```typescript
await browser.saveElement(
    'sample-tag',
    {
        resizeDimensions: {
            top: 50,
            left: 100,
            right: 10,
            bottom: 90,
        },
    }
)
```

### `userBasedFullPageScreenshot`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Used with:** Only for [`saveFullPageScreen`](./methods#savefullpagescreen), [`saveTabbablePage`](./methods#savetabbablepage), [`checkFullPageScreen`](./methods#checkfullpagescreen) or [`checkTabbablePage`](./methods#checktabbablepage)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

When set to `true`, this option enables the **scroll-and-stitch strategy** to capture full-page screenshots.
Instead of using the browser’s native screenshot capabilities, it scrolls through the page manually and stitches multiple screenshots together.
This method is especially useful for pages with **lazy-loaded content** or complex layouts that require scrolling to fully render.

```typescript
await browser.saveScreen(
    'sample-tag',
    {
        userBasedFullPageScreenshot: true
    }
)
```

### `fullPageScrollTimeout`

- **Type:** `number`
- **Mandatory:** No
- **Default:** `1500`
- **Used with:** Only for [`saveFullPageScreen`](./methods#savefullpagescreen) or [`saveTabbablePage`](./methods#savetabbablepage)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

The timeout in milliseconds to wait after a scroll. This might help identify pages with lazy loading.

> **NOTE:** This only works when `userBasedFullPageScreenshot` is set to `true`

```typescript
await browser.saveFullPageScreen(
    'sample-tag',
    {
        fullPageScrollTimeout: 3 * 1000
    }
)
```

### `hideAfterFirstScroll`

- **Type:** `array`
- **Mandatory:** No
- **Used with:** Only for [`saveFullPageScreen`](./methods#savefullpagescreen) or [`saveTabbablePage`](./methods#savetabbablepage)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

This method will hide one or multiple elements by adding the property `visibility: hidden` to them by providing an array of elements.
This will be handy when a page for example holds sticky elements that will scroll with the page if the page is scrolled but will give an annoying effect when a full-page screenshot is made

> **NOTE:** This only works when `userBasedFullPageScreenshot` is set to `true`

```typescript
await browser.saveFullPageScreen(
    'sample-tag',
    {
        hideAfterFirstScroll: [
            await $('#element-1'),
            await $('#element-2'),
        ]
    }
)
```

### `waitForFontsLoaded`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `true`
- **Used with:** All [methods](./methods)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

Fonts, including third-party fonts, can be loaded synchronously or asynchronously. Asynchronous loading means that fonts might load after WebdriverIO determines that a page has fully loaded. To prevent font rendering issues, this module, by default, will wait for all fonts to be loaded before taking a screenshot.

```typescript
await browser.saveScreen(
    'sample-tag',
    {
        waitForFontsLoaded: true
    }
)
```

## Compare (Check) Options

Compare options are options that influence the way the comparison, by [ResembleJS](https://github.com/Huddle/Resemble.js) is being executed.

### `ignoreAlpha`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

Compare images and discard alpha.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        ignoreAlpha: true
    }
)
```

### `blockOutSideBar`

- **Type:** `boolean`
- **Default:** `true`
- **Mandatory:** No
- **Used with:** _Can only be used for `checkScreen()`. This is **iPad only**_
- **Supported Application Contexts:** All

Automatically block out the sidebar for iPads in landscape mode during comparisons. This prevents failures on the tab/private/bookmark native component.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        blockOutSideBar: true
    }
)
```

### `blockOutStatusBar`

- **Type:** `boolean`
- **Default:** `true`
- **Mandatory:** No
- **Used with:** _This is **Mobile only**_
- **Supported Application Contexts:** Hybrid (native part) and Native Apps

Automatically block out the status and address bar during comparisons. This prevents failures on time, wifi or battery status.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        blockOutStatusBar: true
    }
)
```

### `blockOutToolBar`

- **Type:** `boolean`
- **Default:** `true`
- **Mandatory:** No
- **Used with:** _This is **Mobile only**_
- **Supported Application Contexts:** Hybrid (native part) and Native Apps

Automatically block out the toolbar.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        blockOutToolBar: true
    }
)
```

### `ignoreAntialiasing`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

Compare images and discard anti-aliasing.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        ignoreAntialiasing: true
    }
)
```

### `ignoreColors`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

Even though the images are in color, the comparison will compare 2 black/white images

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        ignoreColors: true
    }
)
```

### `ignoreLess`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

Compare images and compare with `red = 16, green = 16, blue = 16, alpha = 16, minBrightness=16, maxBrightness=240`

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        ignoreLess: true
    }
)
```

### `ignoreNothing`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

Compare images and compare with `red = 0, green = 0, blue = 0, alpha = 0, minBrightness=0, maxBrightness=255`

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        ignoreNothing: true
    }
)
```

### `rawMisMatchPercentage`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

If true the return percentage will be like `0.12345678`, default is `0.12`

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        rawMisMatchPercentage: true
    }
)
```

### `returnAllCompareData`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

This will return all compare data, not only the mismatch percentage, see also [Console Output](./test-output#console-output-1)

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        returnAllCompareData: true
    }
)
```

### `saveAboveTolerance`

- **Type:** `number`
- **Default:** `0`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

Allowable value of `misMatchPercentage` that prevents saving images with differences

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        saveAboveTolerance: 0.25
    }
)
```

### `largeImageThreshold`

- **Type:** `number`
- **Default:** `0`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

Comparing large images can lead to performance issues.
When providing a number for the number of pixels here (higher than 0), the comparison algorithm skips pixels when the image width or height is larger than `largeImageThreshold` pixels.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        largeImageThreshold: 1500
    }
)
```

### `scaleImagesToSameSize`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

Scales 2 images to the same size before execution of comparison. Highly recommended to enable `ignoreAntialiasing` and `ignoreAlpha`

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        scaleImagesToSameSize: true
    }
)
```

### `ignore`

- **Type:** `array`
- **Mandatory:** No
- **Used with:** Only with the `checkScreen`-method, **NOT** with the `checkElement`-method
- **Supported Application Contexts:** Native App

This method will automatically blockout elements or an area on a screen based on an array of elements or an object of `x|y|width|height`.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        ignore: [
            $('~element-1'),
            await $('~element-2'),
            {
                x: 150,
                y: 250,
                width: 100,
                height: 100,
            }
        ]
    }
)
```

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
- **Mandatory:** No
- **Supported Application Contexts:** All

Folder for the snapshot that has been captured in the test.

### `baselineFolder`

- **Type:** `string`
- **Mandatory:** No
- **Supported Application Contexts:** All

Folder for the baseline image that is being used to compare against.

### `diffFolder`

- **Type:** `string`
- **Mandatory:** No
- **Supported Application Contexts:** All

Folder for the image difference rendered by ResembleJS.
