---
id: ocr-set-value
title: ocrSetValue
---

Send a sequence of key strokes to an element. It will:

- automatically detect the element
- put focus on the field by clicking on it
- set the value in the field

The command will search for the provided text and try to find a match based on Fuzzy Logic from [Fuse.js](https://fusejs.io/). This means that if you might provide a selector with a typo, or the found text might not be a 100% match it will still try to give you back an element. See the [logs](#logs) below.

## Usage

```js
await brower.ocrSetValue({
    text: "docs",
    value: "specfileretries",
});
```

## Output

### Logs

```log
[0-0] 2024-05-26T04:17:51.355Z INFO webdriver: COMMAND ocrSetValue(<object>)
......................
[0-0] 2024-05-26T04:17:52.356Z INFO @wdio/ocr-service:ocrGetElementPositionByText: We searched for the word "docs" and found one match "docs" with score "100%"
```

## Options

### `text`

- **Type:** `string`
- **Mandatory:** yes

The text you want to search for to click on.

#### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
});
```

### `value`

- **Type:** `string`
- **Mandatory:** yes

Value to be added.

#### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
});
```

### `submitValue`

- **Type:** `boolean`
- **Mandatory:** no
- **Default:** `false`

If the value also needs to be submitted into the input field. This means an "ENTER" will be send at the end of the string.

#### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    submitValue: true,
});
```

### `clickDuration`

- **Type:** `number`
- **Mandatory:** no
- **Default:** `500` milliseconds

This is the duration of the click. If you want you can also create a "long click" by increasing the time.

#### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    clickDuration: 3000, // This is 3 seconds
});
```

### `contrast`

- **Type:** `number`
- **Mandatory:** no
- **Default:** `0.25`

The higher the contrast, the darker the image and vice versa. This can help to find text in an image. It accepts values between `-1` and `1`.

#### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    contrast: 0.5,
});
```

### `haystack`

- **Type:** `number`
- **Mandatory:** `WebdriverIO.Element | ChainablePromiseElement | Rectangle`

This is the search area in the screen where the OCR needs to look for text. This can be an element or a rectangle containing `x`, `y`, `width` and `height`

#### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    haystack: $("elementSelector"),
});

// OR
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    haystack: await $("elementSelector"),
});

// OR
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    haystack: {
        x: 10,
        y: 50,
        width: 300,
        height: 75,
    },
});
```

### `language`

- **Type:** `string`
- **Mandatory:** No
- **Default:** `eng`

The language that Tesseract will recognize. More info can be found [here](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions) and the supported languages can be found [here](https://github.com/webdriverio/visual-testing/blob/main/packages/ocr-service/src/utils/constants.ts).

#### Example

```js
import { SUPPORTED_OCR_LANGUAGES } from "@wdio/ocr-service";
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    // Use Dutch as a language
    language: SUPPORTED_OCR_LANGUAGES.DUTCH,
});
```

### `relativePosition`

- **Type:** `object`
- **Mandatory:** no

You can click on the screen relative to the matching element. This can be done based on relative pixels `above`, `right`, `below` or `left` from the matching element

:::note

The following combinations are allowed

- single properties
- `above` + `left` or `above` + `right`
- `below` + `left` or `below` + `right`

The following combinations are **NOT** allowed

- `above` plus `below`
- `left` plus `right`

:::

#### `relativePosition.above`

- **Type:** `number`
- **Mandatory:** no

Click x pixels `above` the matching element.

##### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    relativePosition: {
        above: 100,
    },
});
```

#### `relativePosition.right`

- **Type:** `number`
- **Mandatory:** no

Click x pixels `right` from the matching element.

##### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    relativePosition: {
        right: 100,
    },
});
```

#### `relativePosition.below`

- **Type:** `number`
- **Mandatory:** no

Click x pixels `below` the matching element.

##### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    relativePosition: {
        below: 100,
    },
});
```

#### `relativePosition.left`

- **Type:** `number`
- **Mandatory:** no

Click x pixels `left` from the matching element.

##### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    relativePosition: {
        left: 100,
    },
});
```

### `fuzzyFindOptions`

You can alter the fuzzy logic to find text with the following options. This might help find a better match

#### `fuzzyFindOptions.distance`

- **Type:** `number`
- **Mandatory:** no
- **Default:** 100

Determines how close the match must be to the fuzzy location (specified by location). An exact letter match which is distance characters away from the fuzzy location would score as a complete mismatch. A distance of 0 requires the match to be at the exact location specified. A distance of 1000 would require a perfect match to be within 800 characters of the location to be found using a threshold of 0.8.

##### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    fuzzyFindOptions: {
        distance: 20,
    },
});
```

#### `fuzzyFindOptions.location`

- **Type:** `number`
- **Mandatory:** no
- **Default:** 0

Determines approximately where in the text is the pattern expected to be found.

##### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    fuzzyFindOptions: {
        location: 20,
    },
});
```

#### `fuzzyFindOptions.threshold`

- **Type:** `number`
- **Mandatory:** no
- **Default:** 0.6

At what point does the matching algorithm give up. A threshold of 0 requires a perfect match (of both letters and location), a threshold of 1.0 would match anything.

##### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    fuzzyFindOptions: {
        threshold: 0.8,
    },
});
```

#### `fuzzyFindOptions.isCaseSensitive`

- **Type:** `boolean`
- **Mandatory:** no
- **Default:** false

Whether the search should be case sensitive.

##### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    fuzzyFindOptions: {
        isCaseSensitive: true,
    },
});
```

#### `fuzzyFindOptions.minMatchCharLength`

- **Type:** `number`
- **Mandatory:** no
- **Default:** 2

Only the matches whose length exceeds this value will be returned. (For instance, if you want to ignore single character matches in the result, set it to 2)

##### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    fuzzyFindOptions: {
        minMatchCharLength: 5,
    },
});
```

#### `fuzzyFindOptions.findAllMatches`

- **Type:** `number`
- **Mandatory:** no
- **Default:** false

When `true`, the matching function will continue to the end of a search pattern even if a perfect match has already been located in the string.

##### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    fuzzyFindOptions: {
        findAllMatches: 100,
    },
});
```
