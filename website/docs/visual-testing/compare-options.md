---
id: compare-options
title: Compare Options
---

Compare options are options that influence the way the comparison, by [ResembleJS](https://github.com/Huddle/Resemble.js) is being executed.

:::info NOTE
All compare options can be used during service instantiation or for each single `checkElement`,`checkScreen` and `checkFullPageScreen`. If a method option has the same key as an option that has been set during the instantiation of the service, then the method compare option will override the service compare option value.
:::


## Visual sensitivity

---

### `ignoreColors`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Even though the images are in color, the comparison will compare 2 black/white images

### `ignoreAlpha`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Compare images and discard alpha.

### `ignoreAntialiasing`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Compare images and discard anti-aliasing.

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

### `scaleImagesToSameSize`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Scales 2 images to the same size before execution of comparison. Highly recommended to enable `ignoreAntialiasing` and `ignoreAlpha`


## Mobile block-outs

---

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

### `blockOutSideBar`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can only be used for `checkScreen()`. It will override the plugin setting. This is **iPad only**_

Automatically block out the sidebar for iPads in landscape mode during comparisons. This prevents failures on the tab/private/bookmark native component.


## Results & reporting

---

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

### `diffPixelBoundingBoxProximity`

-   **Type:** `number`
-   **Default:** `5`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. Only relevant when [`createJsonReportFiles`](/docs/visual-testing/service-options#createjsonreportfiles) is enabled._

The pixel proximity used to group diff pixels together in JSON reports. Higher values group more pixels into fewer bounding boxes; lower values produce more accurate but more numerous boxes.
