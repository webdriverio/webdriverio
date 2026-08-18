---
id: base-appium-configuration
title: Base Appium Configuration
---

WebdriverIO uses Appium to run tests across mobile emulators, simulators, and real devices. The `@wdio/appium-service` automatically manages the Appium server lifecycle during test execution.

For general Appium setup and capability options, see the [Appium Service Documentation](https://webdriver.io/docs/appium-service/).

## Installing Dependencies

To test Flutter applications, install the Appium service and the Flutter finder package:

```bash
npm install --save-dev @wdio/appium-service appium appium-flutter-finder
```

Next, install the Appium Flutter Driver (`appium-flutter-driver`) to enable communication with Flutter apps:

```bash
npx appium driver install flutter
```

These packages provide:
- **`@wdio/appium-service` & `appium`**: Starts and manages the Appium server during test runs.
- **`appium-flutter-driver`**: The Appium driver responsible for communicating with Flutter's test extension.
- **`appium-flutter-finder`**: Helper library providing Flutter-specific locator strategies (`byValueKey`, `byText`, `byTooltip`).