---
id: setting-up-webdriverio
title: Setting up WebdriverIO in your environment
---

The `wdio.conf.ts` file is the core configuration file of any WebdriverIO project. This is where you define where tests run, which test frameworks to use, and the necessary `capabilities` for Appium to correctly initialize the Flutter application.

:::warning
The `appium-flutter-driver` operates differently from traditional native drivers (such as `UiAutomator2` or `XCUITest`). It communicates with Flutter's test extension (`flutter_driver`) through a customized protocol. Because of this, standard native automation commands might not work the same way or may strictly require using `appium-flutter-finder`.

To fully understand the limitations, supported commands, and protocol extensions, refer to the tool's official repository: [Appium Flutter Driver on GitHub](https://github.com/appium/appium-flutter-driver).
:::

### Capabilities Configuration (Android & iOS)

```typescript
export const config: WebdriverIO.Config = {
    // ... other wdio.conf.ts configurations (runner, specs, etc.)
    

    services: [
        ['appium', {
            // WebdriverIO manages the Appium server lifecycle
            args: {},
            command: 'appium'
        }]
    ],

    capabilities: [
        // ==========================================
        // ANDROID CONFIGURATION
        // ==========================================
        {
            'platformName': 'Android',
            'appium:automationName': 'Flutter', // Sets the mandatory use of the Flutter driver
            'appium:deviceName': 'Android_Emulator', // Name of your configured emulator or real device
            // PATH OBSERVATION (See Operating Systems note below)
            'appium:app': './build/app/outputs/flutter-apk/app-debug.apk', 
            'appium:autoGrantPermissions': true
        },
        
        // ==========================================
        // IOS CONFIGURATION (Requires macOS)
        // ==========================================
        {
            'platformName': 'iOS',
            'appium:automationName': 'Flutter', // Sets the mandatory use of the Flutter driver
            'appium:deviceName': 'iPhone Simulator', // Name of the iOS simulator or real device
            'appium:platformVersion': '17.2', // Change to your target OS version
            // PATH OBSERVATION (See Operating Systems note below)
            // Use .app for iOS Simulator, or .ipa for real iOS devices
            'appium:app': './ios/build/Build/Products/Debug-iphonesimulator/Runner.app',
            'appium:noReset': false
        }
    ],

    // ... rest of configuration
};
```

### Important Observations on File Paths (appium:app)

Defining the binary application path (`.apk` for Android, `.app` or `.ipa` for iOS) inside the `appium:app` property requires careful attention depending on the operating system and target environment:

- **On Windows**: The operating system uses backslashes (`\`) for directory paths. When mapping the path to your `.apk` file on Windows, ensure you escape the backslashes in your configuration file (e.g., `.\\build\\app\\outputs\\flutter-apk\\app-debug.apk`) or use consistent forward slashes (`/`), which are correctly parsed by Node.js.
- **On macOS / Linux**: Standard paths with forward slashes (`/`) are used. Remember that iOS builds (`.app` for Simulator or `.ipa` for real devices) can only be compiled within macOS environments.
- **iOS Simulator vs Real Devices**: Use `.app` bundles when executing against the iOS Simulator and signed `.ipa` packages when running against physical iOS devices.
- **Absolute vs Relative Paths**: It is highly recommended to use relative paths starting from the project root (using `./`) to guarantee portability across different development machines and Continuous Integration (CI) environments.