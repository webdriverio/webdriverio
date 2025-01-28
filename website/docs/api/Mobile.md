---
id: mobile
title: Mobile Commands
---

# Introduction to custom and enhanced Mobile Commands in WebdriverIO

Testing mobile apps and mobile web applications comes with its own challenges, especially when dealing with platform-specific differences between Android and iOS. While Appium provides the flexibility to handle these differences, it often requires you to dive deep into complex, platform-dependent docs ([Android](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md), [iOS](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/)) and commands. This can make writing test scripts more time-consuming, error-prone, and difficult to maintain.

To simplify the process, WebdriverIO introduces **custom and enhanced mobile commands** tailored specifically for mobile web and native app testing. These commands abstract away the intricacies of underlying Appium APIs, enabling you to write concise, intuitive, and platform-agnostic test scripts. By focusing on ease of use, we aim to reduce the extra load while developing Appium scripts and empower you to automate mobile apps effortlessly.

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

## Why enhance certain mobile commands?

### 1. Adding Flexibility
Certain mobile commands are enhanced to provide additional options and parameters that aren't available in the default Appium APIs. For example, WebdriverIO adds retry logic, timeouts, and the ability to filter webviews by specific criteria, enabling more control over complex scenarios.

```ts
// Example: Customizing retry intervals and timeouts for webview detection
await driver.getContexts({
  returnDetailedContexts: true,
  androidWebviewConnectionRetryTime: 1000, // Retry every 1 second
  androidWebviewConnectTimeout: 10000,    // Timeout after 10 seconds
});
```

These options help adapt automation scripts to dynamic app behavior without additional boilerplate code.

### 2. Improving Usability
Enhanced commands abstract away complexities and repetitive patterns found in the native APIs. They allow you to perform more actions with fewer lines of code, reducing the learning curve for new users and making scripts easier to read and maintain.

```ts
// Example: Enhanced command for switching context by title
await driver.switchContext({
  title: 'My Webview Title',
});
```

Compared to the default Appium methods, enhanced commands eliminate the need for additional steps like manually retrieving available contexts and filtering through them.

### 3. Standardizing Behavior
WebdriverIO ensures that enhanced commands behave consistently across platforms like Android and iOS. This cross-platform abstraction minimizes the need for conditionally branching logic based on the operating system, leading to more maintainable test scripts.

```ts
// Example: Unified scroll command for both platforms
await $('~element').scrollIntoView();
```

This standardization simplifies codebases, especially for teams automating tests on multiple platforms.

### 4. Increasing Reliability
By incorporating retry mechanisms, smart defaults, and detailed error messages, enhanced commands reduce the likelihood of flaky tests. These improvements ensure your tests are resilient to issues like delays in webview initialization or transient app states.

```ts
// Example: Enhanced webview switching with robust matching logic
await driver.switchContext({
  url: /.*my-app\/dashboard/,
  androidWebviewConnectionRetryTime: 500,
  androidWebviewConnectTimeout: 7000,
});
```

This makes test execution more predictable and less prone to failures caused by environmental factors.

### 5. Enhancing Debugging Capabilities
Enhanced commands often return richer metadata, enabling easier debugging of complex scenarios, particularly in hybrid apps. For instance, commands like getContext and getContexts can return detailed information about webviews, including title, url, and visibility status.

```ts
// Example: Retrieving detailed metadata for debugging
const contexts = await driver.getContexts({ returnDetailedContexts: true });
console.log(contexts);
```

This metadata helps identify and resolve issues faster, improving the overall debugging experience.


By enhancing mobile commands, WebdriverIO not only makes automation easier but also aligns with its mission to provide developers with tools that are powerful, reliable, and intuitive to use.

---

## Hybrid Apps

Hybrid apps combine web content with native functionality and require specialized handling during automation. These apps use webviews to render web content within a native application. WebdriverIO provides enhanced methods for working with hybrid apps effectively.

### Understanding Webviews
A webview is a browser-like component embedded in a native app:

- **Android:** Webviews are based on Chrome/System Webview and may contain multiple pages (similar to browser tabs). These webviews require ChromeDriver to automate interactions. Appium can automatically determine the required ChromeDriver version based on the version of the System WebView or Chrome installed on the device and download it automatically if not already available. This approach ensures seamless compatibility and minimizes manual setup. Refer to the [Appium UIAutomator2-documentation](https://github.com/appium/appium-uiautomator2-driver?tab=readme-ov-file#automatic-discovery-of-compatible-chromedriver) to learn how Appium automatically downloads the correct ChromeDriver version.
- **iOS:** Webviews are powered by Safari (WebKit) and identified by generic IDs like `WEBVIEW_{id}`.

### Challenges with Hybrid Apps
1. Identifying the correct webview among multiple options.
2. Retrieving additional metadata such as the title, URL, or package name for better context.
3. Handling platform-specific differences between Android and iOS.
4. Switching to the correct context in a hybrid app reliably.

### Key Commands for Hybrid Apps

#### 1. `getContext`
Retrieves the current context of the session. By default, it behaves like Appium's getContext method but can provide detailed context information when `returnDetailedContext` is enabled. For more information see [`getContext`](/docs/api/mobile/getContext)

#### 2. `getContexts`
Returns a detailed list of available contexts, improving upon Appium's contexts method. This makes it easier to identify the correct webview for interaction without calling extra commands to determine title, url or active `bundleId|packageName`. For more information see [`getContexts`](/docs/api/mobile/getContexts)

#### 3. `switchContext`
Switches to a specific webview based on name, title, or url. Provides additional flexibility, such as using regular expressions for matching. For more information see [`switchContext`](/docs/api/mobile/switchContext)

### Key Features for Hybrid Apps
1. Detailed Metadata: Retrieve comprehensive details for debugging and reliable context switching.
2. Cross-Platform Consistency: Unified behavior for Android and iOS, handling platform-specific quirks seamlessly.
3. Custom Retry Logic (Android): Adjust retry intervals and timeouts for webview detection.


:::info Notes and Limitations
- Android provides additional metadata, such as `packageName` and `webviewPageId`, while iOS focuses on `bundleId`.
- Retry logic is customizable for Android but not applicable to iOS.
- There are several cases that iOS can't find the Webview. Appium provides different extra capabilities for the `appium-xcuitest-driver` to find the Webview. If you believe that the Webview is not found, you can try to set one of the following capabilities:
    - `appium:includeSafariInWebviews`: Add Safari web contexts to the list of contexts available during a native/webview app test. This is useful if the test opens Safari and needs to be able to interact with it. Defaults to `false`.
    - `appium:webviewConnectRetries`: The maximum number of retries before giving up on web view pages detection. The delay between each retry is 500ms, default is `10` retries.
    - `appium:webviewConnectTimeout`: The maximum amount of time in milliseconds to wait for a web view page to be detected. Default is `5000` ms.

For advanced examples and details, see the WebdriverIO Mobile API documentation.
:::


---

Our growing set of commands reflects our commitment to making mobile automation accessible and elegant. Whether you’re performing intricate gestures or working with native app elements, these commands align with WebdriverIO’s philosophy of creating a seamless automation experience. And we’re not stopping here—if there’s a feature you’d like to see, we welcome your feedback. Feel free to submit your requests via [this link](https://github.com/webdriverio/webdriverio/issues/new/choose).
