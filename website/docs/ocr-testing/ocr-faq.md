---
id: ocr-faq
title: Frequently asked questions
---

## My tests are very slow

When you are using this `wdio-ocr-service` you are not using it to speed up your tests, you use it because you have a
hard time locating elements in your mobile app, and you want an easier way to locate them. And we all hopefully know
that when you want something, you _loose_ something else. **But....**, there is a way to make the `wdio-ocr-service`
execute faster than normal. More information about that can be found

## Can I use the commands from this service with the default WebdriverIO Mobile commands/selectors?

Yes, you can combine the commands to make your script even more powerful! The advice is to use the default WebdriverIO
mobile commands/selectors as much as possible. You can inspect your app with
[Appium Desktop](https://github.com/appium/appium-desktop), but when you can find a unique selector, or your selector
will become to brittle then the commands from this service can definitely help you.

## My text isn't found, how is that possible?

First it's important to understand how the OCR process in this module works, so please read [this](./) page. If you still can't find your text, you might try the following things.

### Image area is too big

When the module needs to process a large area of the screenshot it might not find the text. You can provide a smaller
area by providing rectangles when you use a command. Please check the [commands](/ocr-click-on-text) which commands support providing rectangles.

See below image for an example. The first image can't locate the text `Login`, but when rectangles are provided to
narrow the search area the OCR engine CAN find the text.

<!-- ![Cropped search area](../static/img/cropped-search-area.png) -->

### Contrast between text and background is not correct

This means that you might have a light text on a white background, or a dark text on a dark background. This can result
in not being able to find text. In the examples below you can see that the text `Email` and `Password` are too light in
comparison to the white background. The text `Login` from the button is too dark in comparison to the background. This
will result in not finding the `Email`, `Password` or `Login` text.

<!-- ![Contrast issues](../static/img/contrast-issue.png) -->

## Why is my element getting clicked but the keyboard never pops up?

This can happen on some text fields where the click is determined too long and considered a long tap.
You can use the `clickDuration` option on `ocrClickOnText` and `ocrSetValue` to alleviate this. See [here](./ocr-click-on-text#options).

## Can I provide an offset for interacting with an element?

No, this is currently not possible, but is on the roadmap.

## Can this module provide multiple elements back like WebdriverIO normally can do?

No, this is currently not possible. If the module finds multiple elements that match the provided selector it will
automatically find the element that has the highest matching score.

## Can I fully automate my app with the ocr commands provided by this service?

I've never done it, but in theory, it should be possible. Please let me know if you succeed with that ☺️.

## Is there an easy way to see which text is found on my screen without running a test?

No, there is currently no API or something else to easily scan an image and return the data that is found. I have
this on the roadmap, but any help is appreciated ☺️.
