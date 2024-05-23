---
id: ocr-wait-for-text-displayed
title: ocrWaitForTextDisplayed
---

Wait for a specific text to be displayed on the screen.

### Usage

```js
driver.ocrWaitForTextDisplayed("Username");
```

### Options

| Name                                 | Type                   | Default                                                           | Details                                                                                  |
| ------------------------------------ | ---------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| selector                             | `string`               |                                                                   | The text you want to wait for (mandatory)                                                |
| options (optional)                   | `WaitForTextDisplayed` | `{}`                                                              | command options                                                                          |
| options.androidRectangles (optional) | `Rectangles`           |                                                                   | Rectangles for Android to crop the search area for OCR                                   |
| options.androidRectangles.top        | `number`               |                                                                   | Start position from the top of the screen to start cropping the search area for OCR      |
| options.androidRectangles.left       | `number`               |                                                                   | Start position from the left of the screen to start cropping the search area for OCR     |
| options.androidRectangles.right      | `number`               |                                                                   | Start position from the right of the screen to start cropping the search area for OCR    |
| options.androidRectangles.bottom     | `number`               |                                                                   | Start position from the bottom of the screen to start cropping the search area for OCR   |
| options.iOSRectangles (optional)     | `Rectangles`           |                                                                   | Rectangles for Android to crop the search area for OCR                                   |
| options.iOSRectangles.top            | `number`               |                                                                   | Start position from the top of the screen to start cropping the search area for OCR      |
| options.iOSRectangles.left           | `number`               |                                                                   | Start position from the left of the screen to start cropping the search area for OCR     |
| options.iOSRectangles.right          | `number`               |                                                                   | Start position from the right of the screen to start cropping the search area for OCR    |
| options.iOSRectangles.bottom         | `number`               |                                                                   | Start position from the bottom of the screen to start cropping the search area for OCR   |
| options.timeout (optional)           | `number`               | `180000`                                                          | Time in ms. _Be aware that the OCR process can take some time, so don't set it too low._ |
| options.timeoutMsg (optional)        | `string`               | `Could not find the text "{selector}" within the requested time.` | If exists it overrides the default error message                                         |

### Example

```js
it("should detect when text is shown on the screen", () => {
    driver.ocrWaitForTextDisplayed("Username");

    // Wait with options
    driver.ocrWaitForTextDisplayed("Username", {
        // Same as for iOSRectangles
        androidRectangles: {
            top: 200,
            left: 0,
            right: 800,
            bottom: 400,
        },
        timeout: 45000,
    });
});
```
