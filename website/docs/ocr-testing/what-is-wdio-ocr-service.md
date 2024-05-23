---
id: ocr-testing
title: OCR Testing
---

Sometimes it can be hard to find an element in a mobile native app or desktop site, with an interactable Canvas, with the default [WebdriverIO selectors](https://webdriver.io/docs/selectors). In that case, it would be nice if you would be able to use something like OCR ([Optical Character Recognition](https://en.wikipedia.org/wiki/Optical_character_recognition)) to interact with elements on your device/screen.

The new `@wdio/ocr-service` service provides you with the option to interact with elements based on **visible text**. It will provide multiple commands to:

-   wait
-   search
-   and interact

with an element, all based on text.

The following commands will be provided to you so you will get the right toolset to do your job.

-   [`ocrGetText`](./ocr-get-text.md)
-   [`ocrGetElementPositionByText`](./ocr-get-element-position-by-text.md)
-   [`ocrWaitForTextDisplayed`](./ocr-wait-for-text-displayed.md)
-   [`ocrClickOnText`](./ocr-click-on-text.md)
-   [`ocrSetValue`](./ocr-set-value.md)

### How does it work

This service will

1. create a screenshot of your screen/device. (If needed you can provide a haystack, which can be an element or a rectangle object, to pinpoint a specific area)
1. optimize the result for OCR by turning the screenshot into black/white with a high contrast screenshot (the high contrast is needed to prevent a lot of image background noise).
1. uses [Optical Character Recognition](https://en.wikipedia.org/wiki/Optical_character_recognition) from [Tesseract](https://github.com/tesseract-ocr/tesseract) to get all text from the screen and highlight all found text on an image. It can support several languages, all supported languages can be found [here.](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html)
1. uses Fuzzy Logic from [Fuse.js](https://fusejs.io/) to find strings that are _approximately equal_ to a given pattern (rather than exactly). This means for example that the search value `Username` can also find the text `Usename` or vice versa.
1. Provide a cli wizzard (`npx ocr-service`) to validate your images and retrieve text through your terminal

An example of steps 1, 2 and 3 can be found in this image

<!-- ![Process steps](../static/img/processing-steps.png) -->

It works with **ZERO** system dependencies (besides what WebdriverIO uses), but if needed it can also work with a local installation from [Tesseract](https://tesseract-ocr.github.io/tessdoc/) which will reduce the execution time drastically! (See also the [Test Execution Optimization](#test-execution-optimization) on how to speed up your tests.)

Enthusiastic? Start using it today by following the [installation](./getting-started) instructions below.

:::caution Important
There are a variety of reasons you might not get good quality output from Tesseract. One of the biggest reasons that could be related to your app and this module could be the fact that there is no proper color distinguish between the text that needs to be found, and the background. For example, white text on a dark background can _easily_ be found, but light text on a white background or dark text on a dark background can hardly be found.

See also [this page](https://tesseract-ocr.github.io/tessdoc/ImproveQuality) for more information from Tesseract.

Also don't forget to read the [FAQ](./more-faq).
:::
