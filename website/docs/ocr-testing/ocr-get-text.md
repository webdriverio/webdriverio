---
id: ocr-get-text
title: ocrGetText
---

Get the text on an image.

### Usage

```js
driver.ocrGetText();
```

### Options

| Name                                 | Type             | Default | Details                                                                                |
| ------------------------------------ | ---------------- | ------- | -------------------------------------------------------------------------------------- |
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

Returns the text on the screen

### Example

```js
it("should be able to the the text of a screen", () => {
    // Assert that the word `PRODUCTS` is shown
    expect(driver.ocrGetText()).toContain("PRODUCTS");

    // OR assert with options
    expect(
        driver.ocrGetText({
            // Same as for iOSRectangles
            androidRectangles: {
                top: 200,
                left: 0,
                right: 800,
                bottom: 400,
            },
            reuseOcr: true,
        })
    ).toContain("PRODUCTS");
});
```
