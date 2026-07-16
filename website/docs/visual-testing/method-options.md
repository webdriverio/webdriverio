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

# Save Options

## Display & rendering

---

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

### `enableLegacyScreenshotMethod`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Used with:** All [methods](./methods)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

Use this option to switch back to the "older" screenshot method based on the W3C-WebDriver protocol. This can be helpful if your tests rely on existing baseline images or if you're running in environments that don't fully support the newer BiDi-based screenshots.
Note that enabling this may produce screenshots with slightly different resolution or quality.

```typescript
await browser.saveScreen(
    'sample-tag',
    {
        enableLegacyScreenshotMethod: true
    }
)
```

### `ignoreRegionPadding`

- **Type:** `number`
- **Mandatory:** No
- **Default:** `1`
- **Used with:** All [methods](./methods)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

Padding in device pixels added to each side of ignore regions, making each region 2× this value wider and taller. This helps avoid 1 px boundary differences that can appear on high-DPR displays or with the BiDi screenshot protocol. Set to `0` to disable.

```typescript
await browser.saveScreen(
    'sample-tag',
    {
        ignoreRegionPadding: 0
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

## Element visibility

---

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

## Element-specific

---

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

### `biDiOrigin`

- **Type:** `'document' | 'viewport'`
- **Mandatory:** No
- **Default:** `'document'`
- **Used with:** Only for [`saveElement`](./methods#saveelement) or [`checkElement`](./methods#checkelement)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

BiDi-only option that controls which coordinate origin is used when capturing element screenshots via the WebDriver BiDi protocol.

- `'document'` _(default)_: renders the document layout. Works for any element position but does **not** capture composited layers (e.g. scrollbars, fixed/sticky overlays, `will-change` elements).
- `'viewport'`: captures the composited frame as painted, including scrollbars and overlays. Requires the element to be **fully visible** in the viewport, throws a descriptive error when the element is outside or larger than the viewport.

```typescript
await browser.saveElement(
    await $('#my-element'),
    'sample-tag',
    {
        biDiOrigin: 'viewport'
    }
)
```

## Full-page specific

---

### `userBasedFullPageScreenshot`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Used with:** Only for [`saveFullPageScreen`](./methods#savefullpagescreen), [`saveTabbablePage`](./methods#savetabbablepage), [`checkFullPageScreen`](./methods#checkfullpagescreen) or [`checkTabbablePage`](./methods#checktabbablepage)
- **Supported Application Contexts:** Web, Hybrid App (Webview)

When set to `true`, this option enables the **scroll-and-stitch strategy** to capture full-page screenshots.
Instead of using the browser's native screenshot capabilities, it scrolls through the page manually and stitches multiple screenshots together.
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

# Compare (Check) Options

Compare options are options that influence the way the comparison is being executed.

## Visual sensitivity

---

:::info Version history for `ignore*` options
These presets changed behavior once, as a breaking change, when the comparison engine switched from ResembleJS (v9 and below) to Pixelmatch (v10 and up). See the [version history table](./compare-options#visual-sensitivity) on the Compare Options page for details. Anything since v10.0.0 is called out with a "Since" note on the relevant option below.
:::

**Last-wins ordering:** when more than one `ignore*` flag is enabled at the same time, only one preset is applied, following this order (later wins): `ignoreAlpha` → `ignoreAntialiasing` → `ignoreColors` → `ignoreLess` → `ignoreNothing`. As of `v10.1.0` a warning is logged naming which preset won.

### `ignoreColors`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All
- **Since:** `v10.1.0`: brightness-only comparison using resemble luma weights (`0.3/0.59/0.11`).

Compares brightness only (resemble luma weights `0.3/0.59/0.11`), ignoring hue/color differences. Use this when color itself is expected to vary but you still want to catch layout or brightness changes.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        ignoreColors: true
    }
)
```

### `ignoreAlpha`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All
- **Since:** `v10.1.0`: applies its own threshold/AA rule independently of other `ignore*` flags.

Compare images and discard alpha-channel differences. Use this when transparency/opacity rendering is flaky but the pixel colors underneath matter.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        ignoreAlpha: true
    }
)
```

### `ignoreAntialiasing`

- **Type:** `boolean`
- **Default:** `true`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All
- **Since:** `v10`: default changed to `true` (was `false` in v9 and below).

Forgives anti-aliased pixels during comparison. Set to `false` for strict comparison where anti-aliased pixels should count as mismatches. This solves the most common source of visual-test flakiness: text/shape edges rendering with slightly different anti-aliasing across machines even though nothing changed.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        ignoreAntialiasing: true
    }
)
```

### `ignoreLess`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All
- **Since:** `v10.1.0`: applies its own threshold/AA rule independently of other `ignore*` flags.

Compare images using a relaxed RGB tolerance (~16/255 per channel in YIQ space). Anti-aliasing is not forgiven. Use this for a little breathing room on rendering noise (compression artifacts, color rounding) without forgiving anti-aliasing.

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
- **Since:** `v10.1.0`: applies its own threshold/AA rule independently of other `ignore*` flags.

Use zero tolerance: any pixel difference counts as a mismatch, including anti-aliasing. Use this when you need pixel-perfect proof nothing changed at all.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        ignoreNothing: true
    }
)
```

### `pixelmatch`

- **Type:** `object`
- **Default:** `undefined`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All
- **Added in:** `v10.1.0`

Overrides the compare mode for a single `check*` call with direct [pixelmatch](https://github.com/mapbox/pixelmatch) settings (`threshold`, `includeAA`, `diffColor`, `aaColor`, `diffColorAlt`, `alpha`, `diffMask`, `checkerboard`), instead of an `ignore*` preset. Use this when the presets are too coarse for one specific test, e.g. it needs its own threshold value, or a diff color that actually stands out in your report. See [Direct pixelmatch control](./compare-options#direct-pixelmatch-control) for the full field reference and what each field solves.

Cannot be combined with `ignore*` options in the same call's options object: that throws `CompareOptionsConflictError`. It can, however, override a service config that uses `ignore*` presets (or vice versa); a warning is logged when a method call switches the compare mode this way.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        pixelmatch: { threshold: 0.05 }
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

## Mobile block-outs

---

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

## Region handling

---

### `blockOut`

- **Type:** `array`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

An array of rectangular areas to block out before comparison. Each entry must be an object with `x`, `y`, `width`, and `height` values (in pixels). The blocked-out areas are painted over before the diff is calculated, preventing those regions from contributing to the mismatch percentage.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        blockOut: [
            { x: 0, y: 0, width: 100, height: 50 },
            { x: 300, y: 200, width: 80, height: 80 },
        ]
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

## Results & reporting

---


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

### `diffPixelBoundingBoxProximity`

- **Type:** `number`
- **Default:** `5`
- **Mandatory:** No
- **Used with:** All [Check methods](./methods#check-methods)
- **Supported Application Contexts:** All

The pixel proximity used to group diff pixels together in JSON reports. Higher values group more pixels into fewer bounding boxes; lower values produce more accurate but more numerous boxes. Only relevant when [`createJsonReportFiles`](/docs/visual-testing/service-options#createjsonreportfiles) is enabled.

```typescript
await browser.checkScreen(
    'sample-tag',
    {
        diffPixelBoundingBoxProximity: 10
    }
)
```

# Folder options

---

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

Folder for the image difference rendered during comparison.
