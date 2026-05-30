---
title: E2E Automation with WebdriverIO and Flutter
sidebar_label: Flutter
description: End-to-end testing guide for Flutter apps using WebdriverIO and Appium
---

Definitive Guide: E2E Automation with WebdriverIO and Flutter

This document describes the architectural patterns and the step-by-step guide for setting up and writing End-to-End (E2E) tests for Flutter applications using WebdriverIO and Appium.

Automating Flutter has particularities compared to traditional Web automation. It requires a specific communication bridge (`flutter_driver`), custom selectors (`Finders`), and solid strategies to handle screen synchronization and native dialogs (context switching).

## Environment

For Appium to manage the emulator and install applications during test execution, the environment needs to locate the Android SDK.

Ensure the following environment variables are configured on your system (typically pointing to `C:\Users\YourUser\AppData\Local\Android\Sdk` on Windows):

- `ANDROID_HOME`
- `ANDROID_SDK_ROOT`

**Tip:** to avoid failures on other developers' machines, our `wdio.conf.js` includes a dynamic fallback that attempts to locate these variables automatically.

## Preparing the Flutter application (Dart)

Appium is "blind" to Flutter's rendering by default. To automate it, open the VM Service port in the app and ensure interactive elements have unique identifiers (`ValueKey`).

### Enabling the driver extension

Include the driver extension before running the app. Example `main.dart`:

```dart
import 'package:flutter/material.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_driver/driver_extension.dart';
import 'package:webdriverio_examples/couter_view.dart';

void main() {
  enableFlutterDriverExtension();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    final primary = const Color.fromARGB(255, 255, 145, 0); // warm accent
    final accent = const Color(0xFF6F2DBD); // WebdriverIO-inspired purple

    return MaterialApp(
      title: 'WebDriverIO Examples',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: primary,
          primary: primary,
          secondary: accent,
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: primary,
            foregroundColor: Colors.white,
          ),
        ),
        textTheme: Theme.of(context).textTheme.apply(
              bodyColor: Colors.white,
              displayColor: Colors.white,
            ),
        scaffoldBackgroundColor: const Color(0xFF0F0F17),
      ),
      home: CouterView(title: 'Counter Example'),
      debugShowCheckedModeBanner: false,
    );
  }
}
```

### Use `ValueKey`

To prevent flaky tests, give interactive components stable keys. Example in `couter_view.dart`:

```dart
Text(
  '$_counter',
  key: const ValueKey('counter_text'),
  style: Theme.of(context).textTheme.headlineMedium,
),
```

Inside dialogs, also add keys for the body and the close button (e.g. `change_context_dialog_body`).

## WebdriverIO configuration (`wdio.conf.js`)

Our project uses Appium 2.x. The configuration opens a Flutter session and typically forces app reinstall to ensure a clean state. Add or adapt this block:

```js
const path = require('path');

// Automatic Fallback for Android SDK
process.env.ANDROID_HOME = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');
process.env.ANDROID_SDK_ROOT = process.env.ANDROID_HOME;

exports.config = {
    // ...
    onPrepare: function (config, capabilities) {
        console.log('🚀 Starting E2E tests. Checking SDK at:', process.env.ANDROID_HOME);
    },
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Android Emulator', 
        
        // Absolute path to the compiled test APK
        'appium:app': 'C:\\path\\to\\your\\app-debug.apk',
        
        // Activates the Flutter Driver
        'appium:automationName': 'Flutter',
        
        // Prevents "dirty" states by forcing a reinstall
        'appium:enforceAppInstall': true, 
        'appium:autoGrantPermissions': true
    }],
    // ...
};
```

## Test examples and navigation patterns

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

Developed by: [kauanldsbarbosa](https://github.com/Kauanldsbarbosa)
