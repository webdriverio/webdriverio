---
id: introduction
title: Introduction
---

This guide covers configuring, structuring, and running End-to-End (E2E) tests for **Flutter** applications using **WebdriverIO** and **Appium**.

WebdriverIO provides a Node.js-based test framework with native support for the WebDriver and Appium protocols, allowing you to automate Flutter applications across both Android and iOS.

---

### The Architectural Challenge: Why Flutter is Different

When automating standard native mobile apps (Kotlin/Java on Android or Swift/Objective-C on iOS), Appium drivers (`UiAutomator2` for Android, `XCUITest` for iOS) act as the access point for inspecting and interacting with the application by querying the operating system's native accessibility tree. These drivers read OS-level UI components (buttons, inputs, labels) and expose them to inspection tools and test scripts using standard locator strategies such as ID, Accessibility ID, or XPath.

Flutter works differently:

Flutter does not use the operating system's native UI components. Instead, it renders its UI directly onto a canvas rendered via an internally hosted graphics engine. The framework draws its own widgets pixel by pixel.

#### Impact on Traditional Automation
For standard native drivers and inspectors, a Flutter app often appears as a single graphic surface. Internal widgets (such as buttons or text fields) do not exist in the OS accessibility tree by default. As a result, standard native locator strategies cannot interact directly with internal Flutter widgets.

---

### How WebdriverIO and Appium Handle Flutter

WebdriverIO and Appium provide the tooling required to interact with Flutter's internal widget tree, but you need to install and configure the appropriate driver and locator extensions for your project.

By using the [Appium Flutter Driver](https://github.com/appium/appium-flutter-driver), Appium connects to Flutter's test extension (`flutter_driver`). This gives you access to Flutter-specific locator strategies (Finders), including:

* `byValueKey`: Locates widgets by their explicit `Key` in Flutter code.
* `byText`: Locates widgets by visible text content.
* `byTooltip`: Locates widgets by their tooltip text.

The following sections walk through the prerequisites, environment setup, and writing your first test suite.
