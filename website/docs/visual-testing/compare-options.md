---
id: compare-options
title: Compare Options
---

Compare options are options that influence the way the comparison is being executed.

:::info NOTE
All compare options can be used during service instantiation or for each single `checkElement`,`checkScreen` and `checkFullPageScreen`. If a method option has the same key as an option that has been set during the instantiation of the service, then the method compare option will override the service compare option value.
:::


## Visual sensitivity

---

:::info Version history for `ignore*` options
The `ignore*` presets changed behavior once, as a breaking change, when the comparison engine switched from ResembleJS to Pixelmatch:

| Version | Engine | Notes |
| --- | --- | --- |
| v9 and below | ResembleJS | Original `ignore*` semantics (RGB/brightness-based, resemble's own preset ordering). |
| v10 and above | Pixelmatch | `ignore*` presets map to pixelmatch threshold/AA settings. Current defaults and behavior are documented per option below; new features/fixes on top of this are called out with a "Since" note on the relevant option. |

:::

**Last-wins ordering:** when more than one `ignore*` flag is enabled at the same time, only one preset is actually applied, following this order (later wins): `ignoreAlpha` → `ignoreAntialiasing` → `ignoreColors` → `ignoreLess` → `ignoreNothing`. A warning is logged naming which preset won.

### `ignoreColors`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_
-   **Since:** `v10.1.0`: brightness-only comparison using resemble luma weights (`0.3/0.59/0.11`).

Compares brightness only, ignoring hue/color differences. Preset: strict threshold (~16/255), anti-aliasing not forgiven.

**Use this when** color itself is expected to vary (e.g. themeable UI, images that recolor per environment) but you still want to catch layout or brightness changes.

### `ignoreAlpha`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_
-   **Since:** `v10.1.0`: applies its own threshold/AA rule independently of other `ignore*` flags.

Compare images and discard alpha-channel differences. Preset: strict threshold (~16/255), anti-aliasing not forgiven.

**Use this when** transparency/opacity rendering is flaky (e.g. overlays, semi-transparent elements) but the actual pixel colors underneath matter.

### `ignoreAntialiasing`

-   **Type:** `boolean`
-   **Default:** `true`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_
-   **Since:** `v10`: default changed to `true` (was `false` in v9 and below).

Forgives anti-aliased pixels during comparison (relaxed threshold ~32/255). This is the only preset that forgives anti-aliasing, and is enabled by default so sub-pixel rendering noise doesn't fail comparisons out of the box. Set to `false` for strict comparison where anti-aliased pixels should count as mismatches.

**Use this to** solve the most common source of visual-test flakiness: text and shape edges that render with slightly different anti-aliasing between machines/browsers even though nothing actually changed.

### `ignoreLess`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_
-   **Since:** `v10.1.0`: applies its own threshold/AA rule independently of other `ignore*` flags.

Compare images using a relaxed RGB tolerance (~16/255 per channel in YIQ space). Preset: strict threshold, anti-aliasing not forgiven.

**Use this when** you want a little breathing room for minor rendering noise (JPEG-style compression artifacts, slight color rounding) without forgiving anti-aliasing.

### `ignoreNothing`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_
-   **Since:** `v10.1.0`: applies its own threshold/AA rule independently of other `ignore*` flags.

Use zero tolerance: any pixel difference counts as a mismatch, including anti-aliasing.

**Use this when** you need pixel-perfect proof nothing changed at all, e.g. verifying a fix didn't introduce any regression, however small.

### `scaleImagesToSameSize`

-   **Type:** `boolean`
-   **Default:** `false`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting_

Scales 2 images to the same size before execution of comparison. Highly recommended to enable `ignoreAntialiasing` and `ignoreAlpha`


## Direct pixelmatch control

---

:::info Added in v10.1.0
`compareOptions.pixelmatch` has no equivalent in v9 (ResembleJS). It's a net-new way to control the comparison engine directly, instead of using an `ignore*` preset.
:::

### `compareOptions.pixelmatch`

-   **Type:** `object`
-   **Default:** `undefined`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting for that specific used method_
-   **Added in:** `v10.1.0`

Passes settings directly to [pixelmatch](https://github.com/mapbox/pixelmatch) instead of using an `ignore*` preset. **Use this when the five `ignore*` presets are too coarse:** you need a specific threshold value the presets don't offer, or a diff image that's actually readable in your reports/CI output instead of the default magenta highlight.

:::warning Mutually exclusive within the same options object
Putting any `ignore*` key and `pixelmatch` in the **same** options object throws `CompareOptionsConflictError`, even when the `ignore*` value is `false` (see the invalid example below). Pick one mode per object: `ignore*` presets or `pixelmatch`, never both.

This only applies within one object. Service config and a method call's options are separate objects, so a `check*` call **is allowed** to use a different mode than the service config, for example the service uses `ignore*` presets but one call passes `pixelmatch` instead (or vice versa). No error in that case, just a warning logged noting the compare mode switch.
:::

| Field | Type | Default | What it's for |
| --- | --- | --- | --- |
| `threshold` | `number` | `0.1` | Sensitivity from 0 (any pixel difference fails) to 1 (almost nothing fails). Use this to dial in one exact sensitivity value instead of picking the closest `ignore*` preset. |
| `includeAA` | `boolean` | `false` | `true` counts anti-aliased edge pixels as mismatches; `false` forgives them. Turn this off if font/shape edge rendering differences are causing flaky failures. |
| `diffColor` | `[number, number, number]` | `[255, 0, 255]` (magenta) | RGB color for mismatched pixels in the diff image. Change it if magenta blends into your UI (e.g. a pink/purple theme) and mismatches are hard to spot. |
| `aaColor` | `[number, number, number]` | `[255, 0, 255]` (magenta) | RGB color for anti-aliased pixels, kept visually separate from real mismatches so you can tell "rendering noise" apart from "actual bug" at a glance. |
| `diffColorAlt` | `[number, number, number]` | `[255, 0, 255]` (magenta) | RGB color for pixels that were added or removed (not just recolored), useful for spotting layout shifts vs. color changes. |
| `alpha` | `number` | `0.1` | Opacity of the diff overlay on top of the actual screenshot. Raise it to make diffs pop more in reports; lower it to still see the underlying UI clearly. Not related to the `ignoreAlpha` preset. |
| `diffMask` | `boolean` | `false` | Set `true` to output just the raw diff (transparent background) instead of the diff drawn over your screenshot, useful for building your own custom diff viewer/report. |
| `checkerboard` | `boolean` | `true` | Controls how semi-transparent pixels are rendered in the diff. Turn off if the checkerboard pattern is easy to confuse with real content in your screenshots. |

**Service config:**

```js
// wdio.conf.js
export const config = {
    // ...
    services: [
        ['visual', {
            compareOptions: {
                pixelmatch: {
                    threshold: 0.063,
                    includeAA: true,
                },
            },
        }],
    ],
}
```

**Method override when the service uses `ignore*` presets:**

```js
await browser.checkScreen('homepage', {
    pixelmatch: { threshold: 0.05 },
})
```

**Method override when the service uses `pixelmatch`:**

```js
await browser.checkScreen('homepage', {
    ignoreLess: true,
})
```

**Invalid: throws `CompareOptionsConflictError`**

```js
compareOptions: {
    ignoreLess: false,
    pixelmatch: { threshold: 0.063 },
}
```

See the [pixelmatch documentation](https://github.com/mapbox/pixelmatch) for full option semantics.


## Mobile block-outs

---

### `blockOutStatusBar`

-   **Type:** `boolean`
-   **Default:** `true`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting. This is **Mobile only**_

Automatically block out the status and address bar during comparisons. This prevents failures on time, wifi or battery status.

### `blockOutToolBar`

-   **Type:** `boolean`
-   **Default:** `true`
-   **Mandatory:** no
-   **Remark:** _Can also be used for `checkElement`, `checkScreen()` and `checkFullPageScreen()`. It will override the plugin setting. This is **Mobile only**_

Automatically block out the toolbar.

### `blockOutSideBar`

-   **Type:** `boolean`
-   **Default:** `true`
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
