---
id: service-options
title: Service Options
---

Service options are the options that can be set when the service is instantiated and will be used for each method call.

```js
// wdio.conf.(js|ts)
export const config = {
    // ...
    // =====
    // Setup
    // =====
    services: [
        [
            'image-comparison',
            {
                // The options
            }
        ]
    ]
    // ...
}
```

## Default Options

### `addressBarShadowPadding`

- **Type:** `number`
- **Mandatory:** No
- **Default:** `6`
- **Supported:** Web

The padding needs to be added to the address bar on iOS and Android to do a proper cutout of the viewport.

### `autoElementScroll`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `true`
- **Supported:** Web, Hybrid App (Webview)

This option allows you to disable the automatic scrolling of the element into the view when an element screenshot is created.

### `addIOSBezelCorners`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Supported:** Web, Hybrid App (Webview), Native App

Add bezel corners and notch/dynamic island to the screenshot for iOS devices.

:::info NOTE

- iPhone X: `iphonex`
- iPhone XS: `iphonexs`
- iPhone XS Max: `iphonexsmax`
- iPhone XR: `iphonexr`
- iPhone 11: `iphone11`
- iPhone 11 Pro: `iphone11pro`
- iPhone 11 Pro Max: `iphone11promax`
- iPhone 12: `iphone12`
- iPhone 12 Mini: `iphone12mini`
- iPhone 12 Pro: `iphone12pro`
- iPhone 12 Pro Max: `iphone12promax`
- iPhone 13: `iphone13`
- iPhone 13 Mini: `iphone13mini`
- iPhone 13 Pro: `iphone13pro`
- iPhone 13 Pro Max: `iphone13promax`
- iPhone 14: `iphone14`
- iPhone 14 Plus: `iphone14plus`
- iPhone 14 Pro: `iphone14pro`
- iPhone 14 Pro Max: `iphone14promax`
  **iPads:**
- iPad Mini 6th Generation: `ipadmini`
- iPad Air 4th Generation: `ipadair`
- iPad Air 5th Generation: `ipadair`
- iPad Pro (11-inch) 1st Generation: `ipadpro11`
- iPad Pro (11-inch) 2nd Generation: `ipadpro11`
- iPad Pro (11-inch) 3rd Generation: `ipadpro11`
- iPad Pro (12.9-inch) 3rd Generation: `ipadpro129`
- iPad Pro (12.9-inch) 4th Generation: `ipadpro129`
- iPad Pro (12.9-inch) 5th Generation: `ipadpro129`

:::

### `autoSaveBaseline`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `true`
- **Supported:** Web, Hybrid App (Webview), Native App

If no baseline image is found during the comparison the image is automatically copied to the baseline folder.

### `baselineFolder`

- **Type:** `any`
- **Mandatory:** No
- **Default:** `.path/to/testfile/__snapshots__/`
- **Supported:** Web, Hybrid App (Webview), Native App

The directory will hold all the baseline images that are used during the comparison. If not set, the default value will be used which will store the files in a `__snapshots__/`-folder next to the spec that executes the visual tests. A function that accepts an option object can also be used to set the `baselineFolder` value:

```js
{
    baselineFolder: (options) => {
        const testFolder = path.dirname(options.specs[0])
        return path.join(testFolder, 'snapshots', type)
    }
}
```

### `clearRuntimeFolder`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Supported:** Web, Hybrid App (Webview), Native App

Delete runtime folder (`actual` & \`diff) on initialization

:::info NOTE
This will only work when the [`screenshotPath`](#screenshotpath) is set through the plugin options, and **WILL NOT WORK** when you set the folders in the methods
:::

### `disableCSSAnimation`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Supported:** Web, Hybrid App (Webview)

En/Disable all CSS animations and the input caret and the input caret in the application. If set to true all animations will be disabled before taking a screenshot
and reset when done

### `enableLayoutTesting`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Supported:** Web

This will hide all text on a page so only the layout will be used for comparison. Hiding will be done by adding the style `'color': 'transparent !important'` to **each** element.

For the output see [Test Output](./test-output#enablelayouttesting)

:::info
By using this flag each element that contains text (so not only `p, h1, h2, h3, h4, h5, h6, span, a, li`, but also `div|button|..`) will get this property. There is **no** option to tailor this.
:::

### `formatImageName`

- **Type:** `string`
- **Mandatory:** No
- **Default:** `{tag}-{browserName}-{width}x{height}-dpr-{dpr}`
- **Supported:** Web, Hybrid App (Webview), Native App

The name of the saved images can be customized by passing the parameter `formatImageName` with a format string like:

```sh
{tag}-{browserName}-{width}x{height}-dpr-{dpr}
```

The following variables can be passed to format the string and will automatically be read from the instance capabilities.
If they can't be determined the defaults will be used.

- `browserName`: The name of the browser in the provided capabilities
- `browserVersion`: The version of the browser provided in the capabilities
- `deviceName`: The device name from the capabilities
- `dpr`: The device pixel ratio
- `height`: The height of the screen
- `logName`: The logName from capabilities
- `mobile`: This will add `_app`, or the browser name after the `deviceName` to distinguish app screenshots from browser screenshots
- `platformName`: The name of the platform in the provided capabilities
- `platformVersion`: The version of the platform provided in the capabilities
- `tag`: The tag that is provided in the methods that is being called
- `width`: The width of the screen

### `fullPageScrollTimeout`

- **Type:** `number`
- **Mandatory:** No
- **Default:** `1500`
- **Supported:** Web

The timeout in milliseconds to wait after a scroll. This might help identify pages with lazy loading.

### `hideScrollBars`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `true`
- **Supported:** Web, Hybrid App (Webview)

Hide scrollbars in the application. If set to true all scrollbars will be disabled before taking a screenshot. This is set to default `true` to prevent extra issues.

### `isHybridApp`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `false`
- **Supported:** Hybrid App

Tell the module if the used app is a Hybrid app, this will not calculate the address bar height because it is not there.

### `logLevel`

- **Type:** `string`
- **Mandatory:** No
- **Default:** `info`
- **Supported:** Web, Hybrid App (Webview), Native App

Adds extra logs, options are `debug | info | warn | silent`

Errors are always logged to the console.

### `savePerInstance`

- **Type:** `boolean`
- **Default:** `false`
- **Mandatory:** no
- **Supported:** Web, Hybrid App (Webview), Native App

Save the images per instance in a separate folder so for example all Chrome screenshots will be saved in a Chrome folder like `desktop_chrome`.

### `screenshotPath`

- **Type:** `any`
- **Default:** `.tmp/`
- **Mandatory:** no
- **Supported:** Web, Hybrid App (Webview), Native App

The directory that will hold all the actual/different screenshots. If not set, the default value will be used. A function that
accepts an option object can also be used to set the screenshotPath value:

```js
getFolder = type = (options) => {
    const testFolder = path.dirname(options.specs[0]);

    return path.join(testFolder, "snapshots", type);
};
{
    screenshotPath: getFolder(options);
}
```

### `toolBarShadowPadding`

- **Type:** `number`
- **Mandatory:** No
- **Default:** `6` for Android and `15` for iOS (`6` by default and `9` will be added automatically for the possible home bar on iPhones with a notch or iPads that have a home bar)
- **Supported:** Web

The padding which needs to be added to the toolbar bar on iOS and Android to do a proper cutout of the viewport.

## Tabbable Options

:::info NOTE

This module also supports drawing the way a user would use his keyboard to _tab_ through the website by drawing lines and dots from tabbable element to tabbable element.<br/>
The work is inspired by [Viv Richards](https://github.com/vivrichards600) his blog post about ["AUTOMATING PAGE TABABILITY (IS THAT A WORD?) WITH VISUAL TESTING"](https://vivrichards.co.uk/accessibility/automating-page-tab-flows-using-visual-testing-and-javascript).<br/>
The way tabbable elements are selected is based on the module [tabbable](https://github.com/davidtheclark/tabbable). If there are any issues regarding the tabbing please check the [README.md](https://github.com/davidtheclark/tabbable/blob/master/README.md) and especially the [More details section](https://github.com/davidtheclark/tabbable/blob/master/README.md#more-details).

:::

### `tabbableOptions`

- **Type:** `object`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The options that can be changed for the lines and dots if you use the `{save|check}Tabbable`-methods. The options are explained below.

#### `tabbableOptions.circle`

- **Type:** `object`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The options to change the circle.

##### `tabbableOptions.circle.backgroundColor`

- **Type:** `string`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The background color of the circle.

##### `tabbableOptions.circle.borderColor`

- **Type:** `string`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The border color of the circle.

##### `tabbableOptions.circle.borderWidth`

- **Type:** `number`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The border width of the circle.

##### `tabbableOptions.circle.fontColor`

- **Type:** `string`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The color of the font of the text in the circle. This will only be shown if [`showNumber`](./#tabbableoptionscircleshownumber) is set to `true`.

##### `tabbableOptions.circle.fontFamily`

- **Type:** `string`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The family of the font of the text in the circle. This will only be shown if [`showNumber`](./#tabbableoptionscircleshownumber) is set to `true`.

Make sure to set fonts that are supported by the browsers.

##### `tabbableOptions.circle.fontSize`

- **Type:** `number`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The size of the font of the text in the circle. This will only be shown if [`showNumber`](./#tabbableoptionscircleshownumber) is set to `true`.

##### `tabbableOptions.circle.size`

- **Type:** `number`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The size of the circle.

##### `tabbableOptions.circle.showNumber`

- **Type:** `showNumber`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

Show the tab sequence number in the circle.

#### `tabbableOptions.line`

- **Type:** `object`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The options to change the line.

##### `tabbableOptions.line.color`

- **Type:** `string`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The color of the line.

##### `tabbableOptions.line.width`

- **Type:** `number`
- **Mandatory:** No
- **Default:** See [here](https://github.com/webdriverio/visual-testing/blob/b7d66afadc88f03f09646c28806a687d2ae46000/packages/webdriver-image-comparison/src/helpers/options.ts#L6-L68) for all default values
- **Supported:** Web

The width of the line.

### `waitForFontsLoaded`

- **Type:** `boolean`
- **Mandatory:** No
- **Default:** `true`
- **Supported:** Web, Hybrid App (Webview)

Fonts, including third-party fonts, can be loaded synchronously or asynchronously. Asynchronous loading means that fonts might load after WebdriverIO determines that a page has fully loaded. To prevent font rendering issues, this module, by default, will wait for all fonts to be loaded before taking a screenshot.

## Compare options

The compare options can also be set as service options, they are described in the [Method Compare options](./method-options#compare-check-options)
