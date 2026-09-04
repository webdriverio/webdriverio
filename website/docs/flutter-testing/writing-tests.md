---
id: writing-tests
title: Writing Tests
---

This section covers the practical structure for creating automated test scenarios, how to interact directly with Flutter's internal component tree using WebdriverIO.

### Why is Context Switching Necessary?

When initiating an automation session with Appium, the driver begins execution by mapping the native context of the operating system, known as `NATIVE_APP`. This context can only see the native shell wrapping the application (such as the system status bar or native Android/iOS dialogs).

Since Flutter renders its user interface inside an isolated Canvas, internal elements are invisible within the `NATIVE_APP` context. To send commands directly to Flutter's test extension (`flutter_driver`), we must explicitly switch the automation focus to the `FLUTTER` context. Without this switch, any attempt to locate a Widget will result in an element not found error.

:::tip Best Practice: Always Switch Context in `beforeEach`
It is a recommended best practice to include `await driver.switchContext('FLUTTER')` in a `beforeEach` hook in every test file. This ensures that every test begins execution in the `FLUTTER` context, avoiding flakiness or state leakage if a previous test switched to `NATIVE_APP` (e.g., to handle OS permission dialogs) or if a session resets the active context.
:::

### Why is `appium-flutter-finder` Necessary?

Traditional WebdriverIO selectors, like `$('~selector')` or `$('#id')`, are designed to locate elements using strategies intended for Web or mobile native interfaces (such as resource IDs or XPath).

Flutter manages its own internal elements and uses proprietary search methods (such as `byValueKey`, `byText`, `byType`). The `appium-flutter-finder` library is required because it acts as a translator: it exposes these Flutter-specific locator strategies into a serialized format (Base64/JSON) that the `appium-flutter-driver` can interpret and execute inside the Dart Virtual Machine (VM).

### Practical Test Examples

We document common scenarios using `appium-flutter-finder` to locate widgets, combined with direct extension commands executed through `driver.execute('flutter:<command>')`.

:::info Flutter Driver Extension Commands & Finders
The `appium-flutter-driver` provides specialized commands for interacting with Flutter applications, including:
- `flutter:waitFor`: Waits for a widget to become visible.
- `flutter:waitForAbsent`: Waits for a widget to disappear.
- `flutter:scroll` / `flutter:scrollIntoView` / `flutter:scrollUntilVisible`: Handles scrolling within scrollable views.
- `flutter:setTextEntryEmulation`: Configures text input behavior.

For the full list of available commands, parameters, and return types, see the [Appium Flutter Driver Commands Documentation](https://github.com/appium/appium-flutter-driver#commands), the [Node.js Finder source code](https://github.com/appium/appium-flutter-driver/tree/main/finder/nodejs), and the [appium-flutter-finder on npm](https://www.npmjs.com/package/appium-flutter-finder).
:::

### Example A — Simple interaction (Counter flow)

```typescript
// counter.spec.ts
import find from 'appium-flutter-finder';

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

```typescript
// redirects.spec.ts
import find from 'appium-flutter-finder';

describe('Flutter Redirects Flow', () => {

    beforeEach(async () => {
        await driver.switchContext('FLUTTER');
    });

    it('The user should be able to navigate between the Redirect Example views and back to the first view.', async () => {
        const buttonGoToRedirectExampleTwoView = find.byValueKey('redirect_example_two_button');
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
    });
});
```

### Example C — Switching Contexts (Native OS Dialogs & Permissions)

```typescript
// native_dialog_context.spec.ts
import find from 'appium-flutter-finder';

describe('Flutter & Native Context Switching Flow', () => {
    beforeEach(async () => {
        await driver.switchContext('FLUTTER');
    });

    it('The user should trigger a native dialog, interact with OS controls, and return to Flutter context.', async () => {
        // 1. In FLUTTER context: click widget that triggers an OS-level permission or alert dialog
        const buttonRequestPermission = find.byValueKey('request_permission_button');
        await driver.elementClick(buttonRequestPermission);

        // 2. Switch to NATIVE_APP context to interact with the OS dialog
        await driver.switchContext('NATIVE_APP');

        // Locate and click native button using standard WebdriverIO selectors
        const nativeAllowButton = await $('//*[@text="Allow" or @text="While using the app" or @label="Allow"]');
        await nativeAllowButton.waitForDisplayed();
        await nativeAllowButton.click();

        // 3. Switch back to FLUTTER context to continue verifying Flutter widgets
        await driver.switchContext('FLUTTER');

        const permissionStatusText = find.byValueKey('permission_status_text');
        await driver.execute('flutter:waitFor', permissionStatusText);
        const status = await driver.getElementText(permissionStatusText);
        expect(status).toBe('Permission Granted');
    });
});
```

## Build and Execution Flow

To ensure your recent Dart code and Key changes are visible to the tests, always follow these steps:

```bash
flutter build apk -t lib/main_e2e.dart --debug
npx wdio run wdio.conf.ts
```

You can see the code examples in the repository: https://github.com/webdriverio/appium-boilerplate