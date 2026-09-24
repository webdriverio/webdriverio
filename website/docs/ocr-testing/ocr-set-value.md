---
id: ocr-set-value
title: ocrSetValue
description: "Type into an input field located by its visible text with ocrSetValue, which finds the field with OCR and fuzzy matching."
---

Send a sequence of key strokes to an element. It will:

-   automatically detect the element
-   put focus on the field by clicking on it
-   set the value in the field

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

<Option type="string" required="yes">

The text you want to search for to click on.

</Option>
#### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
});
```

### `value`

<Option type="string" required="yes">

Value to be added.

</Option>
#### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
});
```

### `submitValue`

<Option type="boolean" default="false" required="no">

If the value also needs to be submitted into the input field. This means an "ENTER" will be send at the end of the string.

</Option>
#### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    submitValue: true,
});
```

### `clickDuration`

<Option type="number" default="500 milliseconds" required="no">

This is the duration of the click. If you want you can also create a "long click" by increasing the time.

</Option>
#### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    clickDuration: 3000, // This is 3 seconds
});
```

### `contrast`

<Option type="number" default="0.25" required="no">

The higher the contrast, the darker the image and vice versa. This can help to find text in an image. It accepts values between `-1` and `1`.

</Option>
#### Example

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    contrast: 0.5,
});
```

### `haystack`

<Option type="number" required="WebdriverIO.Element | ChainablePromiseElement | Rectangle">

This is the search area in the screen where the OCR needs to look for text. This can be an element or a rectangle containing `x`, `y`, `width` and `height`

</Option>
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

<Option type="string" default="eng" required="No">

The language that Tesseract will recognize. More info can be found [here](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions) and the supported languages can be found [here](https://github.com/webdriverio/visual-testing/blob/main/packages/ocr-service/src/utils/constants.ts).

</Option>
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

<Option type="object" required="no">

You can click on the screen relative to the matching element. This can be done based on relative pixels `above`, `right`, `below` or `left` from the matching element

:::note

The following combinations are allowed

-   single properties
-   `above` + `left` or `above` + `right`
-   `below` + `left` or `below` + `right`

The following combinations are **NOT** allowed

-   `above` plus `below`
-   `left` plus `right`

:::

</Option>
#### `relativePosition.above`

<Option type="number" required="no">

Click x pixels `above` the matching element.

</Option>
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

<Option type="number" required="no">

Click x pixels `right` from the matching element.

</Option>
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

<Option type="number" required="no">

Click x pixels `below` the matching element.

</Option>
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

<Option type="number" required="no">

Click x pixels `left` from the matching element.

</Option>
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

<Option type="number" default="100" required="no">

Determines how close the match must be to the fuzzy location (specified by location). An exact letter match which is distance characters away from the fuzzy location would score as a complete mismatch. A distance of 0 requires the match to be at the exact location specified. A distance of 1000 would require a perfect match to be within 800 characters of the location to be found using a threshold of 0.8.

</Option>
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

<Option type="number" default="0" required="no">

Determines approximately where in the text is the pattern expected to be found.

</Option>
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

<Option type="number" default="0.6" required="no">

At what point does the matching algorithm give up. A threshold of 0 requires a perfect match (of both letters and location), a threshold of 1.0 would match anything.

</Option>
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

<Option type="boolean" default="false" required="no">

Whether the search should be case sensitive.

</Option>
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

<Option type="number" default="2" required="no">

Only the matches whose length exceeds this value will be returned. (For instance, if you want to ignore single character matches in the result, set it to 2)

</Option>
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

<Option type="number" default="false" required="no">

When `true`, the matching function will continue to the end of a search pattern even if a perfect match has already been located in the string.

</Option>
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
