---
id: ocr-get-element-position-by-text
title: ocrGetElementPositionByText
description: "Get the on-screen position of a text with ocrGetElementPositionByText, using OCR and fuzzy matching to find it."
---

Get the position of a text on the screen. The command will search for the provided text and try to find a match based on Fuzzy Logic from [Fuse.js](https://fusejs.io/). This means that if you might provide a selector with a typo, or the found text might not be a 100% match it will still try to give you back an element. See the [logs](#logs) below.

## Usage

```js
const result = await browser.ocrGetElementPositionByText("Username");

console.log("result = ", JSON.stringify(result, null, 2));
```

## Output

### Result

```logs
result = {
  "dprPosition": {
    "left": 373,
    "top": 606,
    "right": 439,
    "bottom": 620
  },
  "filePath": ".tmp/ocr/desktop-1716658199410.png",
  "matchedString": "Started",
  "originalPosition": {
    "left": 373,
    "top": 606,
    "right": 439,
    "bottom": 620
  },
  "score": 85.71,
  "searchValue": "Start3d"
}
```

### Logs

```log
# Still finding a match even though we searched for "Start3d" and the found text was "Started"
[0-0] 2024-05-25T17:29:59.179Z INFO webdriver: COMMAND ocrGetElementPositionByText(<object>)
......................
[0-0] 2024-05-25T17:29:59.993Z INFO @wdio/ocr-service:ocrGetElementPositionByText: Multiple matches were found based on the word "Start3d". The match "Started" with score "85.71%" will be used.
```

## Options

### `text`

<Option type="string" required="yes">

The text you want to search for to click on.

</Option>
#### Example

```js
await browser.ocrGetElementPositionByText({ text: "WebdriverIO" });
```

### `contrast`

<Option type="number" default="0.25" required="no">

The higher the contrast, the darker the image and vice versa. This can help to find text in an image. It accepts values between `-1` and `1`.

</Option>
#### Example

```js
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    contrast: 0.5,
});
```

### `haystack`

<Option type="number" required="WebdriverIO.Element | ChainablePromiseElement | Rectangle">

This is the search area in the screen where the OCR needs to look for text. This can be an element or a rectangle containing `x`, `y`, `width` and `height`

</Option>
#### Example

```js
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    haystack: $("elementSelector"),
});

// OR
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    haystack: await $("elementSelector"),
});

// OR
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
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
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    // Use Dutch as a language
    language: SUPPORTED_OCR_LANGUAGES.DUTCH,
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
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
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
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
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
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
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
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
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
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
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
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    fuzzyFindOptions: {
        findAllMatches: 100,
    },
});
```
