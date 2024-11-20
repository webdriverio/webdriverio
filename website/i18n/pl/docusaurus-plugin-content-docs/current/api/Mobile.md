---
id: mobile
title: Mobile Commands
---

# Introduction to Mobile Commands in WebdriverIO

Testing mobile apps and mobile web applications comes with its own challenges, especially when dealing with platform-specific differences between Android and iOS. While Appium provides the flexibility to handle these differences, it often requires you to dive deep into complex, platform-dependent docs ([Android](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md), [iOS](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/)) and commands. This can make writing test scripts more time-consuming, error-prone, and difficult to maintain.

To simplify the process, WebdriverIO introduces **custom mobile commands** tailored specifically for mobile web and native app testing. These commands abstract away the intricacies of underlying Appium APIs, enabling you to write concise, intuitive, and platform-agnostic test scripts. By focusing on ease of use, we aim to reduce the extra load while developing Appium scripts and empower you to automate mobile apps effortlessly.

## Why Custom Mobile Commands?

### 1. **Simplifying Complex APIs**

Some Appium commands, like gestures or element interactions, involve verbose and intricate syntax. For example, executing a long press action with the native Appium API requires constructing an `action` chain manually:

```ts
const element = $('~Contacts')

await browser
    .action( 'pointer', { parameters: { pointerType: 'touch' } })
    .move({ origin: element })
    .down()
    .pause(1500)
    .up()
    .perform()
```

With WebdriverIO's custom commands, the same action can be performed with a single, expressive line of code:

```ts
await $('~Contacts').longPress();
```

This drastically reduces boilerplate code, making your scripts cleaner and easier to understand.

### 2. **Cross-Platform Abstraction**

Mobile apps often require platform-specific handling. For instance, scrolling in native apps differs significantly between [Android](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md#mobile-scrollgesture) and [iOS](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-scroll). WebdriverIO bridges this gap by providing unified commands like `scrollIntoView()` that work seamlessly across platforms, regardless of the underlying implementation.

```ts
await $('~element').scrollIntoView();
```

This abstraction ensures your tests are portable and do not require constant branching or conditional logic to account for OS differences.

### 3. **Increased Productivity**

By reducing the need to understand and implement low-level Appium commands, WebdriverIO's mobile commands enable you to focus on testing your app's functionality rather than wrestling with platform-specific nuances. This is especially beneficial for teams with limited experience in mobile automation or those seeking to accelerate their development cycle.

### 4. **Consistency and Maintainability**

Custom commands bring uniformity to your test scripts. Instead of having varying implementations for similar actions, your team can rely on standardized, reusable commands. This not only makes the codebase more maintainable but also lowers the barrier for onboarding new team members.

---

Our growing set of commands reflects our commitment to making mobile automation accessible and elegant. Whether you’re performing intricate gestures or working with native app elements, these commands align with WebdriverIO’s philosophy of creating a seamless automation experience. And we’re not stopping here—if there’s a feature you’d like to see, we welcome your feedback. Feel free to submit your requests via [this link](https://github.com/webdriverio/webdriverio/issues/new/choose).
