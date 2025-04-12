---
id: ocr-faq
title: Frequently Asked Questions
---

## My tests are very slow

When you are using this `@wdio/ocr-service` you are not using it to speed up your tests, you use it because you have a hard time locating elements in your web/mobile app, and you want an easier way to locate them. And we all hopefully know that when you want something, you lose something else. **But....**, there is a way to make the `@wdio/ocr-service` execute faster than normal. More information about that can be found [here](./more-test-optimization).

## Can I use the commands from this service with the default WebdriverIO commands/selectors?

Yes, you can combine the commands to make your script even more powerful! The advice is to use the default WebdriverIO commands/selectors as much as possible and only use this service when you can't find a unique selector, or your selector will become too brittle.

## My text isn't found, how is that possible?

First, it's important to understand how the OCR process in this module works, so please read [this](./ocr-testing) page. If you still can't find your text, you might try the following things.

### The image area is too big

When the module needs to process a large area of the screenshot it might not find the text. You can provide a smaller area by providing a haystack when you use a command. Please check the [commands](./ocr-click-on-text) which commands support providing a haystack.

### The contrast between the text and background is not correct

This means that you might have light text on a white background or dark text on a dark background. This can result in not being able to find text. In the examples below you can see that the text `Why WebdriverIO?` is white and surrounded by a grey button. In this case, it will result in not finding the `Why WebdriverIO?` text. By increasing the contrast for the specific command it finds the text and can click on it, see the second image.

```js
await driver.ocrClickOnText({
    haystack: { height: 44, width: 1108, x: 129, y: 590 },
    text: "WebdriverIO?",
    // // With the default contrast of 0.25, the text is not found
    contrast: 1,
});
```

![Contrast issues](/img/ocr/increased-contrast.jpg)

## Why is my element getting clicked but the keyboard on my mobile devices never pops up?

This can happen on some text fields where the click is determined too long and considered a long tap. You can use the `clickDuration` option on [`ocrClickOnText`](./ocr-click-on-text) and [`ocrSetValue`](./ocr-set-value) to alleviate this. See [here](./ocr-click-on-text#options).

## Can this module provide multiple elements back like WebdriverIO normally can do?

No, this is currently not possible. If the module finds multiple elements that match the provided selector it will automatically find the element that has the highest matching score.

## Can I fully automate my app with the OCR commands provided by this service?

I've never done it, but in theory, it should be possible. Please let us know if you succeed with that ☺️.

## I see an extra file called `{languageCode}.traineddata` being added, what is this?

`{languageCode}.traineddata` is a language data file used by Tesseract. It contains the training data for the selected language, which includes the necessary information for Tesseract to recognize English characters and words effectively.

### Contents of `{languageCode}.traineddata`

The file generally contains:

1. **Character Set Data:** Information about the characters in the English language.
2. **Language Model:** A statistical model of how characters form words and words form sentences.
3. **Feature Extractors:** Data on how to extract features from images for the recognition of characters.
4. **Training Data:** Data derived from training Tesseract on a large set of English text images.

### Why is the `{languageCode}.traineddata` Important?

1. **Language Recognition:** Tesseract relies on these trained data files to accurately recognize and process text in a specific language. Without `{languageCode}.traineddata`, Tesseract would not be able to recognize English text.
2. **Performance:** The quality and accuracy of OCR are directly related to the quality of the training data. Using the correct trained data file ensures that the OCR process is as accurate as possible.
3. **Compatibility:** Ensuring that the `{languageCode}.traineddata` file is included in your project making it easier to replicate the OCR environment across different systems or team members' machines.

### Versioning `{languageCode}.traineddata`

Including `{languageCode}.traineddata` in your version control system is recommended for the following reasons:

1. **Consistency:** It ensures that all team members or deployment environments use the exact same version of the training data, leading to consistent OCR results across different environments.
2. **Reproducibility:** Storing this file in version control makes it easier to reproduce results when running the OCR process at a later date or on a different machine.
3. **Dependency Management:** Including it in the version control system helps in managing dependencies and ensures that any setup or environment configuration includes the necessary files for the project to run correctly.

## Is there an easy way to see which text is found on my screen without running a test?

Yes, you can use our CLI wizard for that. Documentation can be found [here](./cli-wizard)
