---
id: ocr-testing
title: OCR Testing
---

Automated testing on mobile native apps and desktop sites can be particularly challenging when dealing with elements that lack unique identifiers. Standard [WebdriverIO selectors](https://webdriver.io/docs/selectors) may not always help you. Enter the world of the `@wdio/ocr-service`, a powerful service that leverages OCR ([Optical Character Recognition](https://en.wikipedia.org/wiki/Optical_character_recognition)) to search, wait for, and interact with on-screen elements based on their **visible text**.

The following custom commands will be provided and added to the `browser/driver` object so you will get the right toolset to do your job.

- [`await browser.ocrGetText`](./ocr-get-text.md)
- [`await browser.ocrGetElementPositionByText`](./ocr-get-element-position-by-text.md)
- [`await browser.ocrWaitForTextDisplayed`](./ocr-wait-for-text-displayed.md)
- [`await browser.ocrClickOnText`](./ocr-click-on-text.md)
- [`await browser.ocrSetValue`](./ocr-set-value.md)

### How does it work

This service will

1. create a screenshot of your screen/device. (If needed you can provide a haystack, which can be an element or a rectangle object, to pinpoint a specific area. See the documentation for each command.)
2. optimize the result for OCR by turning the screenshot into black/white with a high contrast screenshot (the high contrast is needed to prevent a lot of image background noise. This can be customized per command.)
3. uses [Optical Character Recognition](https://en.wikipedia.org/wiki/Optical_character_recognition) from [Tesseract.js](https://github.com/naptha/tesseract.js)/[Tesseract](https://github.com/tesseract-ocr/tesseract) to get all text from the screen and highlight all found text on an image. It can support several languages which can be found [here.](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html)
4. uses Fuzzy Logic from [Fuse.js](https://fusejs.io/) to find strings that are _approximately equal_ to a given pattern (rather than exactly). This means for example that the search value `Username` can also find the text `Usename` or vice versa.
5. Provide a cli wizzard (`npx ocr-service`) to validate your images and retrieve text through your terminal

An example of steps 1, 2 and 3 can be found in this image

![Process steps](/img/ocr/processing-steps.jpg)

It works with **ZERO** system dependencies (besides what WebdriverIO uses), but if needed it can also work with a local installation from [Tesseract](https://tesseract-ocr.github.io/tessdoc/) which will reduce the execution time drastically! (See also the [Test Execution Optimization](#test-execution-optimization) on how to speed up your tests.)

Enthusiastic? Start using it today by following the [Getting Started](./getting-started) guide.

:::caution Important

See also [this page](https://tesseract-ocr.github.io/tessdoc/ImproveQuality) for more information from Tesseract.

Also don't forget to read the [FAQ](./ocr-faq).
:::
