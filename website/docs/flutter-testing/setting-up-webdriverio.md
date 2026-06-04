---
id: setting-up-webdriverio
title: Setting up WebdriverIO in your environment
---

# Setting up WebdriverIO in your environment

The `wdio.conf.js` file is the core of any WebdriverIO project. This is where we define where tests will run, which test frameworks to use, and the necessary `capabilities` for Appium to correctly initialize the Flutter application.

⚠️ IMPORTANT API WARNING

The `appium-flutter-driver` operates differently from traditional native drivers (such as `UiAutomator2` or `XCUITest`). It communicates with Flutter's test extension (`flutter_driver`) through a customized protocol. Because of this, standard native automation commands might not work the same way or may strictly require using `appium-flutter-finder`.

To fully understand the limitations, supported commands, and protocol extensions, refer to the tool's official repository: [Appium Flutter Driver on GitHub.](https://github.com/appium/appium-flutter-driver)

### Capabilities Configuration (Android & iOS)

```javascript
exports.config = {
    // ... other wdio.conf.js configurations (runner, specs, etc.)
    
    port: 4723, // Default Appium server port

    services: [
        ['appium', {
            // The command below ensures the server lifecycle is managed by WDIO
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
            'appium:deviceName': 'Android_Emulator', // Name of your configured emulator
            // PATH OBSERVATION (See Operating Systems note below)
            'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk', 
            'appium:autoGrantPermissions': true
        },
        
        // ==========================================
        // IOS CONFIGURATION (Requires macOS)
        // ==========================================
        {
            'platformName': 'iOS',
            'appium:automationName': 'Flutter', // Sets the mandatory use of the Flutter driver
            'appium:deviceName': 'iPhone Simulator', // Name of the iOS simulator
            'appium:platformVersion': '17.2', // Change to your simulator's version
            // PATH OBSERVATION (See Operating Systems note below)
            'appium:app': './ios/build/Build/Products/Debug-iphonesimulator/Runner.app',
            'appium:noReset': false
        }
    ],

    // ... rest of configuration
};
```

### Important Observations on File Paths (appium:app)

Defining the binary application path (`.apk` or `.app`) inside the appium:app property requires careful attention depending on the operating system executing the test suite:

- **On Windows**: The operating system uses backslashes (`\`) for directory paths. When mapping the path to your `.apk` file on Windows, ensure you escape the backslashes in your configuration file (e.g., `.\\android\\app\\build\\...`) or use consistent forward slashes (`/`), which are correctly parsed by Node.js.
- **On macOS / Linux**: Standard paths with forward slashes (`/`) are used. Remember that iOS tests (`.app`) can only be compiled and executed within macOS environments.

- **Absolute vs Relative Paths**: It is highly recommended to use relative paths starting from the project root (using `./`) to guarantee portability across different development machines and Continuous Integration (CI) environments.