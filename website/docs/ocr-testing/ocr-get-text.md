---
id: ocr-get-text
title: ocrGetText
description: "Read the text shown on the screen or in a specific area with ocrGetText from the OCR service."
---

Get the text on an image.

### Usage

```js
const result = await browser.ocrGetText();

console.log("result = ", JSON.stringify(result, null, 2));
```

## Output

### Result

```logs
result = "VS docs API Blog Contribute Community Sponsor v8 *Engishy CV} Q OQ G asearch Next-gen browser and mobile automation Welcome! How can | help? i test framework for Node.js Get Started Why WebdriverI0? View on GitHub Watch on YouTube"
```

### Logs

```log
[0-0] 2024-05-25T17:38:25.970Z INFO webdriver: COMMAND ocrGetText()
......................
[0-0] 2024-05-25T17:38:26.738Z INFO webdriver: RESULT VS docs API Blog Contribute Community Sponsor v8 *Engishy CV} Q OQ G asearch Next-gen browser and mobile automation Welcome! How can | help? i test framework for Node.js Get Started Why WebdriverI0? View on GitHub Watch on YouTube
```

## Options

### `contrast`

<Option type="number" default="0.25" required="no">

The higher the contrast, the darker the image and vice versa. This can help to find text in an image. It accepts values between `-1` and `1`.

</Option>
#### Example

```js
await browser.ocrGetText({ contrast: 0.5 });
```

### `haystack`

<Option type="number" required="WebdriverIO.Element | ChainablePromiseElement | Rectangle">

This is the search area in the screen where the OCR needs to look for text. This can be an element or a rectangle containing `x`, `y`, `width` and `height`

</Option>
#### Example

```js
await browser.ocrGetText({ haystack: $("elementSelector") });

// OR
await browser.ocrGetText({ haystack: await $("elementSelector") });

// OR
await browser.ocrGetText({
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
await browser.ocrGetText({
    // Use Dutch as a language
    language: SUPPORTED_OCR_LANGUAGES.DUTCH,
});
```
