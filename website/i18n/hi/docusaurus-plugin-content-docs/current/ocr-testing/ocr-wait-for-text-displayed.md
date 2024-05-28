---
id: ocr-wait-for-text-displayed
title: ocrWaitForTextDisplayed
---

Wait for a specific text to be displayed on the screen.

## Usage

```js
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
});
```

## Output

### Logs

```log
[0-0] 2024-05-26T04:32:52.005Z INFO webdriver: COMMAND ocrWaitForTextDisplayed(<object>)
......................
# ocrWaitForTextDisplayed uses ocrGetElementPositionByText under the hood, that is why you see the command ocrGetElementPositionByText in the logs
[0-0] 2024-05-26T04:32:52.735Z INFO @wdio/ocr-service:ocrGetElementPositionByText: Multiple matches were found based on the word "specFileRetries". The match "specFileRetries" with score "100%" will be used.
```

## Options

### `text`

- **Type:** `string`
- **Mandatory:** yes

The text you want to search for to click on.

#### Example

```js
await browser.ocrWaitForTextDisplayed({ text: "specFileRetries" });
```

### `timeout`

- **Type:** `number`
- **Mandatory:** no
- **Default:** 18000 (18 seconds)

Time in milliseconds. Be aware that the OCR process can take some time, so don't set it too low.

#### Example

```js
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries"
    timeout: 25000 // wait for 25 seconds
});
```

### `timeoutMsg`

- **Type:** `string`
- **Mandatory:** no
- **Default:** `Could not find the text "{selector}" within the requested time.`

It overrides the default error message.

#### Example

```js
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries"
    timeoutMsg: "My new timeout message."
});
```

### `contrast`

- **Type:** `number`
- **Mandatory:** no
- **Default:** `0.25`

The higher the contrast, the darker the image and vice versa. This can help to find text in an image. It accepts values between `-1` and `1`.

#### Example

```js
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
    contrast: 0.5,
});
```

### `haystack`

- **Type:** `number`
- **Mandatory:** `WebdriverIO.Element | ChainablePromiseElement | Rectangle`

This is the search area in the screen where the OCR needs to look for text. This can be an element or a rectangle containing `x`, `y`, `width` and `height`

#### Example

```js
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
    haystack: $("elementSelector"),
});

// OR
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
    haystack: await $("elementSelector"),
});

// OR
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
    // Use Dutch as a language
    language: SUPPORTED_OCR_LANGUAGES.DUTCH,
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
    fuzzyFindOptions: {
        findAllMatches: 100,
    },
});
```
