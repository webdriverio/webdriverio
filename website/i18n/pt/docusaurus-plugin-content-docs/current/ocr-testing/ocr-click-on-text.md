---
id: ocr-click-on-text
title: ocrClickOnText
---

Clique em um elemento com base nos textos fornecidos. O comando pesquisará o texto fornecido e tentará encontrar uma correspondência com base na Lógica Fuzzy do [Fuse.js](https://fusejs.io/). Isso significa que se você fornecer um erro de digitação a um seletor, ou se o texto encontrado não for 100% correspondente, ele ainda tentará retornar um elemento. Veja os [logs](#logs) abaixo.

## Uso

```js
await browser.ocrClickOnText({ text: "Start3d" });
```

## Saída

### Logs

```log
# Still finding a match even though we searched for "Start3d" and the found text was "Started"
[0-0] 2024-05-25T05:05:20.096Z INFO webdriver: COMMAND ocrClickOnText(<object>)
......................
[0-0] 2024-05-25T05:05:21.022Z INFO @wdio/ocr-service:ocrGetElementPositionByText: Multiple matches were found based on the word "Start3d". The match "Started" with score "85.71%" will be used.
```

### Imagem

Você encontrará uma imagem em seu (default)[`imagesFolder`](./getting-started#imagesfolder) com um alvo para mostrar onde o módulo clicou.

![Etapas do processo](/img/ocr/ocr-click-on-text-target.jpg)

## Opções

### `text`

- **Tipo:** `string`
- **Obrigatório:** sim

O texto que você deseja pesquisar para clicar.

#### Example

```js
await browser.ocrClickOnText({ text: "WebdriverIO" });
```

### `clickDuration`

- **Type:** `number`
- **Mandatory:** no
- **Default:** `500` milliseconds

This is the duration of the click. If you want you can also create a "long click" by increasing the time.

#### Example

```js
await browser.ocrClickOnText({
    text: "WebdriverIO",
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
    contrast: 0.5,
});
```

### `haystack`

- **Type:** `number`
- **Mandatory:** `WebdriverIO.Element | ChainablePromiseElement | Rectangle`

This is the search area in the screen where the OCR needs to look for text. This can be an element or a rectangle containing `x`, `y`, `width` and `height`

#### Example

```js
await browser.ocrClickOnText({
    text: "WebdriverIO",
    haystack: $("elementSelector"),
});

// OR
await browser.ocrClickOnText({
    text: "WebdriverIO",
    haystack: await $("elementSelector"),
});

// OR
await browser.ocrClickOnText({
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

- **Type:** `string`
- **Mandatory:** No
- **Default:** `eng`

The language that Tesseract will recognize. More info can be found [here](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions) and the supported languages can be found [here](https://github.com/webdriverio/visual-testing/blob/main/packages/ocr-service/src/utils/constants.ts).

#### Example

```js
import { SUPPORTED_OCR_LANGUAGES } from "@wdio/ocr-service";
await browser.ocrClickOnText({
    text: "WebdriverIO",
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
    fuzzyFindOptions: {
        findAllMatches: 100,
    },
});
```
