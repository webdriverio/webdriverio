---
id: macos
title: MacOS
---

WebdriverIO can automate arbitrary MacOS application using [Appium](https://appium.io/docs/en/2.0/). All you need is [XCode](https://developer.apple.com/xcode/) installed on your system, Appium and the [Mac2 Driver](https://github.com/appium/appium-mac2-driver) installed as dependency and the correct capabilities set.

## Getting Started

To initiate a new WebdriverIO project, run:

```sh
npm create wdio@latest ./
```

An installation wizard will guide you through the process. Ensure you select _"Desktop Testing - of MacOS Applications"_ when it asks you what type of testing you'ld like to do. Afterwards just keep the defaults or modify based on your preference.

The configuration wizard will install all required Appium packages and creates a `wdio.conf.js` or `wdio.conf.ts` with the necessary configuration to test on MacOS. If you agreed to autogenerate some tests files you can run your first test via `npm run wdio`.

That's it 🎉

## Example

This is how a simple test can look like that opens the Calculator application, makes a calculation and verifies its result:

```js
describe('My Login application', () => {
    it('should set a text to a text view', async function () {
        await $('//XCUIElementTypeButton[@label="seven"]').click()
        await $('//XCUIElementTypeButton[@label="multiply"]').click()
        await $('//XCUIElementTypeButton[@label="six"]').click()
        await $('//XCUIElementTypeButton[@title="="]').click()
        await expect($('//XCUIElementTypeStaticText[@label="main display"]')).toHaveText('42')
    });
})
```

__Note:__ the calculator app was opened automatically at the beginning of the session because `'appium:bundleId': 'com.apple.calculator'` was defined as capability option. You can switch apps during the session at all times.

## More Information

For information about specifics around testing on MacOS we recommend to go checkout the [Appium Mac2 Driver](https://github.com/appium/appium-mac2-driver) project.
