---
id: writing-tests
title: Writing Tests
---

This section covers the practical structure for creating automated test scenarios, how to interact directly with Flutter's internal component tree using WebdriverIO.

### Why is Context Switching Necessary?
When initiating an automation session with Appium, the driver begins execution by mapping the native context of the operating system, known as `NATIVE_APP`. This context can only see the native shell wrapping the application (such as the system status bar or native Android/iOS dialogs).

Since Flutter renders its user interface inside an isolated Canvas, internal elements are invisible within the `NATIVE_APP` context. To send commands directly to Flutter's test extension (`flutter_driver`), we must explicitly switch the automation focus to the `FLUTTER` context. Without this switch, any attempt to locate a Widget will result in an element not found error.

### Why is `appium-flutter-finder` Necessary?

Traditional WebdriverIO selectors, like `$('~selector')` or `$('#id')`, are designed to locate elements using strategies intended for Web or mobile native interfaces (such as resource IDs or XPath).

Flutter manages its own internal elements and uses proprietary search methods (such as `byValueKey`, `byText`, `byType`). The `appium-flutter-finder` library is required because it acts as a translator: it exposes these Flutter-specific locator strategies into a serialized format (Base64/JSON) that the `appium-flutter-driver` can interpret and execute inside the Dart Virtual Machine (VM).

### Practical Test Example

We document common scenarios using `appium-flutter-finder` and direct `flutter:` commands via `driver.execute`.

### Example A — Simple interaction (Counter flow)

```js
// couter.spec.js
const find = require('appium-flutter-finder');

describe('Flutter Counter Flow', () => {

    beforeEach(async () => {
        await driver.switchContext('FLUTTER');
    });

    it('The counter should be successfully incremented by clicking the button.', async () => {
        const incrementButton = find.byTooltip('Increment');
        const counterText = find.byValueKey('counter_text');

        const initialValue = await driver.getElementText(counterText);
        expect(initialValue).toBe('0');

        await driver.elementClick(incrementButton);

        const finalValue = await driver.getElementText(counterText);
        expect(finalValue).toBe('1');
    });
});
```

### Example B — Stable Navigation (Avoiding Timeouts)

```js
// redirects.spec.js
const find = require('appium-flutter-finder');

describe('Flutter Redirects Flow', () => {

    beforeEach(async () => {
        await driver.switchContext('FLUTTER');
    });

    it('The user should be able to navigate between the Redirect Example views and back to the first view.', async () => {
        const buttonGoToRedirectExampleTwoView = find.byValueKey('redirect_example_back_button');
        await driver.elementClick(buttonGoToRedirectExampleTwoView);

        const redirectExampleTwoBody = find.byValueKey('redirect_example_two_body');
        await driver.execute('flutter:waitFor', redirectExampleTwoBody);
        const textRedirectExampleTwoBody = await driver.getElementText(redirectExampleTwoBody);
        expect(textRedirectExampleTwoBody).toBe('This is the Redirect Example Two View');

        const buttonGoBackToRedirectExampleView = find.byValueKey('redirect_example_two_back_button');
        await driver.elementClick(buttonGoBackToRedirectExampleView);

        const redirectExampleBody = find.byValueKey('redirect_example_body');
        await driver.execute('flutter:waitFor', redirectExampleBody);
        const textRedirectExampleBody = await driver.getElementText(redirectExampleBody);
        expect(textRedirectExampleBody).toBe('This is the Redirect Example View');
    })
})
```

### Example C — Interacting with Dialogs (Changing the context)

```js
// change_context.spec.js
const find = require('appium-flutter-finder');

describe('Flutter Change Context Flow', () => {
    beforeEach(async () => {
        await driver.switchContext('FLUTTER');
    });

    it('The user should be able to open the Change Context Example View dialog and close it.', async () => {
        const buttonToOpenADialog = find.byValueKey('change_context_button');
        await driver.elementClick(buttonToOpenADialog);

        const changeContextDialogBody = find.byValueKey('change_context_dialog_body');
        await driver.execute('flutter:waitFor', changeContextDialogBody);
        const textChangeContextDialogBody = await driver.getElementText(changeContextDialogBody);
        expect(textChangeContextDialogBody).toBe('WebDriver is awesome for testing Flutter apps!');

        const buttonToCloseDialog = find.byValueKey('change_context_dialog_close_button');
        await driver.elementClick(buttonToCloseDialog);

        const changeContextViewTitle = find.byValueKey('change_context_title');
        await driver.execute('flutter:waitFor', changeContextViewTitle);
        const textChangeContextViewTitle = await driver.getElementText(changeContextViewTitle);
        expect(textChangeContextViewTitle).toBe('Change Context Example View');
    })
})
```

## Build and Execution Flow

To ensure your recent Dart code and Key changes are visible to the tests, always follow these steps:

```bash
flutter build apk -t test_driver/main.dart --debug
npx wdio run wdio.conf.js
```

You can see the code examples in the repository: https://github.com/webdriverio/appium-boilerplate