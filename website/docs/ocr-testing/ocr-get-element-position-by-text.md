---
id: ocr-get-element-position-by-text
title: ocrGetElementPositionByText
---

Get the position of a text on the screen.
The command will search for the provided text and tries to find a match
based on Fuzzy Logic from [Fuse.js](https://fusejs.io/). This means that if you might provide a selector with a typo, or
the found text might not be a 100% match it will still try to give you back an element. See the [logs](#logs) below.

### Usage

```js
driver.ocrGetElementPositionByText("Username");
```

### Logs

```log
# Still finding a match even though we searched for "Usernames" and the found text was "Username"
[0-0] 2021-04-07T09:51:07.806Z INFO webdriver: COMMAND ocrGetElementPositionByText("Usernames")
[0-0] 2021-04-07T09:51:07.807Z INFO webdriver: RESULT true
[0-0] 2021-04-07T09:51:07.811Z INFO wdio-ocr-service: We searched for the word "Usernames" and found one match "Username" with score "88.89%"
```

### Options

| Name                                 | Type             | Default | Details                                                                                |
| ------------------------------------ | ---------------- | ------- | -------------------------------------------------------------------------------------- |
| selector                             | `string`         |         | The visual name of the field                                                           |
| options (optional)                   | `GetTextOptions` | `{}`    | command options                                                                        |
| options.reuseOcr (optional)          | `boolean`        | `false` | Re-use a previous OCR scan if it is available                                          |
| options.androidRectangles (optional) | `Rectangles`     |         | Rectangles for Android to crop the search area for OCR                                 |
| options.androidRectangles.top        | `number`         |         | Start position from the top of the screen to start cropping the search area for OCR    |
| options.androidRectangles.left       | `number`         |         | Start position from the left of the screen to start cropping the search area for OCR   |
| options.androidRectangles.right      | `number`         |         | Start position from the right of the screen to start cropping the search area for OCR  |
| options.androidRectangles.bottom     | `number`         |         | Start position from the bottom of the screen to start cropping the search area for OCR |
| options.iOSRectangles (optional)     | `Rectangles`     |         | Rectangles for Android to crop the search area for OCR                                 |
| options.iOSRectangles.top            | `number`         |         | Start position from the top of the screen to start cropping the search area for OCR    |
| options.iOSRectangles.left           | `number`         |         | Start position from the left of the screen to start cropping the search area for OCR   |
| options.iOSRectangles.right          | `number`         |         | Start position from the right of the screen to start cropping the search area for OCR  |
| options.iOSRectangles.bottom         | `number`         |         | Start position from the bottom of the screen to start cropping the search area for OCR |

### Returns

Returns the search value, the matched text, and the position of the element on the screen

```js
const result = {
    searchValue: "Username",
    matchedString: "Username",
    originalPosition: { left: 83, top: 326, right: 248, bottom: 352 },
    dprPosition: { left: 41.5, top: 163, right: 124, bottom: 176 },
    score: 100,
};
```

### Example

```js
it("should be able to the position of the visble text on the screen", () => {
    driver.ocrGetElementPositionByText("Username");

    // OR with options
    driver.ocrGetElementPositionByText("Username", {
        // Same as for iOSRectangles
        androidRectangles: {
            top: 200,
            left: 0,
            right: 800,
            bottom: 400,
        },
        reuseOcr: true,
    });
});
```
