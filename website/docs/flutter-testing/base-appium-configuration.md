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

### Installing the Appium Flutter Driver

You can install the Appium Flutter Driver (`appium-flutter-driver`) in one of two ways:

#### Option 1: As a Dev Dependency (Recommended for CI/CD)

Adding the driver directly to your `devDependencies` ensures that all team members and CI/CD pipelines have the driver installed automatically without requiring extra setup steps:

```bash
npm install --save-dev appium-flutter-driver
```

> You can also install all required packages together in a single command:
> ```bash
> npm install --save-dev @wdio/appium-service appium appium-flutter-finder appium-flutter-driver
> ```

#### Option 2: Via Appium CLI (Local Setup)

Alternatively, you can install the driver locally into your Appium environment using the Appium CLI:

```bash
npx appium driver install flutter
```

### Package Overview

These packages provide:
- **`@wdio/appium-service` & `appium`**: Starts and manages the Appium server during test runs.
- **`appium-flutter-driver`**: The Appium driver responsible for communicating with Flutter's test extension.
- **`appium-flutter-finder`**: Helper library providing Flutter-specific locator strategies (`byValueKey`, `byText`, `byTooltip`).