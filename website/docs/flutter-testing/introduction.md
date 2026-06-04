---
id: introduction
title: Introduction
---

This document aims to guide the configuration, structuring, and execution of End-to-End (E2E) tests in applications developed with **Flutter**, utilizing the **WebdriverIO** automation framework in conjunction with **Appium**.

Mobile test automation is an essential pillar to ensure software quality in continuous delivery pipelines. Combining the flexibility of WebdriverIO — with its robust Node.js-based ecosystem and native support for the WebDriver/Appium protocol, with Flutter's multi-platform ecosystem offers a powerful solution to validate complete user journeys across both Android and iOS.

---

### The Architectural Challenge: Why is Flutter Different?

When automating traditional native mobile applications (developed in Kotlin/Java for Android or Swift/Objective-C for iOS), automation tools like Appium interact directly with the operating system's **native accessibility tree**.
* Appium exposes inspectors (such as Appium Inspector) that rely on underlying native drivers (`UiAutomator2` for Android and `XCUITest` for iOS).
* These drivers read the visual components exposed by the OS (Buttons, Inputs, Texts) and allow the tester to locate them using common strategies like ID, XPath, or ClassName.

**Flutter breaks this paradigm.**

Flutter does not use the operating system's native UI components. Instead, it operates as a **high-performance Canvas** (rendered via the Skia or Impeller graphics engine). The framework "paints" its own components (Widgets) directly onto the screen, pixel by pixel.

#### The Consequence for Traditional Automation:
For traditional native inspectors (such as UiAutomator Viewer or the XCUITest Inspector), a Flutter application often appears as a **"blind" screen** or as a single monolithic graphic block. The internal elements (such as a specific button inside the Canvas) do not exist in the native accessibility tree by default in the same way OS components do, making it impossible to capture traditional selectors natively and directly.

---

### How WebdriverIO and Appium Solve This Problem (Additional Information)

To overcome Flutter's "closed canvas" nature, the WebdriverIO and Appium community integrates specific strategies to expose and interact with the internal component tree (Flutter Widgets):

WebdriverIO supports invoking capabilities from [appium-flutter-driver](https://github.com/appium/appium-flutter-driver), which connects to Flutter's test extension (flutter_driver). This enables the use of framework-specific internal locators (Finders), such as:
   * `byValueKey` (location by explicit keys defined in Flutter code).
   * `byText` (location by displayed text).
   * `byTooltip` (location by tooltip text).

With this architectural foundation understood, the next sections of this document will detail the prerequisites, environment setup, and the implementation of the first automated test suites.
