---
id: base-appium-configuration
title: Base Appium Configuration
---

## 1. Base Appium Configuration

Mobile test execution within the WebdriverIO ecosystem relies on the Appium protocol to manage sessions across emulators, simulators, and real devices. WebdriverIO handles the Appium server lifecycle, including automatic startup and shutdown, through its dedicated service.

For complete details on supported capabilities, advanced configurations, and server execution architecture, refer to the [Official WebdriverIO Appium Service Documentation](https://webdriver.io/docs/appium-service/).

## 2. Dependency Installation

To support E2E test execution and enable communication with Flutter's internal widget tree, install the core WebdriverIO packages, the Appium automation service, and the Flutter locator library.

Run the following command in the root of your project to add the required development dependencies:

```bash
npm install --save-dev @wdio/cli @wdio/appium-service appium appium-flutter-finder
```

After installing the Node.js dependencies, install the Appium 2 Flutter driver as well:

```bash
appium driver install flutter
```

Installed packages:

- `@wdio/cli`: The command-line interface for managing WebdriverIO configuration, test suites, and test execution.
- `@wdio/appium-service`: A service that manages the Appium server lifecycle in the background during test runs.
- `appium`: The core mobile test automation server.
- `appium-flutter-finder`: A utility library that provides Flutter-specific locator strategies based on keys, text, and tooltips.