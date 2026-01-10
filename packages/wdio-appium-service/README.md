WebdriverIO Appium Service
==========================

Handling the Appium server is out of the scope of the actual WebdriverIO project. This service helps you to run the Appium server seamlessly when running tests with the [WDIO testrunner](https://webdriver.io/docs/clioptions). It starts the [Appium Server](https://appium.io/docs/en/latest/quickstart/install/#starting-appium) in a child process.

This package also includes a CLI command (`npx start-appium-inspector`) to quickly start the Appium server and open the Appium Inspector in your browser. See the [CLI Command](#cli-command) section for usage instructions.

Additionally, this package also includes a **BETA feature** - the **Native Mobile Selector Performance Optimizer** - which helps identify and optimize slow XPath selectors in your mobile tests. It tracks selector performance during test execution, suggests optimized alternatives, and validates them by testing optimized selectors during the run. At the end, you'll receive a comprehensive report showing which selectors should be replaced in your code for better performance. See the [Native Mobile Selector Performance Optimizer](#native-mobile-selector-performance-optimizer) section for details.

## Installation

The easiest way is to keep `@wdio/appium-service` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/appium-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Configuration

In order to use the service you need to add `appium` to your service array:

```js
// wdio.conf.js
export const config = {
    // ...
    port: 4723, // default appium port
    services: ['appium'],
    // ...
};
```

## Options

The following options can be added to the wdio.conf.js file. To define options for the service you need to add the service to the `services` list in the following way:

```js
// wdio.conf.js
export const config = {
    // ...
    port: 4723, // default appium port
    services: [
        ['appium', {
            // Appium service options here
            // ...
        }]
    ],
    // ...
};
```

### logPath
The path where all logs from the Appium server should be stored.

Type: `String`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            logPath : './'
        }]
    ],
    // ...
}
```

### command
To use your installation of Appium, e.g. globally installed, specify the command which should be started.

Type: `String`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            command : 'appium'
        }]
    ],
    // ...
}
```

### args
Map of arguments for the Appium server, passed directly to `appium`.

See [the documentation](https://appium.io/docs/en/latest/cli/args/) for possible arguments.
The arguments are supplied in lower camel case. For instance, `debugLogSpacing: true` transforms into `--debug-log-spacing`, or they can be supplied as outlined in the Appium documentation.

Type: `Object`

Default: `{}`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            args: {
                // ...
                debugLogSpacing: true,
                platformName: 'iOS'
                // ...
            }
        }]
    ],
    // ...
}
```
**Note:** The utilization of aliases is discouraged and unsupported. Instead, please use the full property name in lower camel case.

## CLI Command

This package includes a CLI command to quickly start the Appium server and open the Appium Inspector in your browser. This makes it easier to work with Appium when using WebdriverIO.

### Usage

```sh
npx start-appium-inspector [options]
```

The command will:
- Check if the Appium Inspector plugin is installed (required for the Inspector to work)
- Automatically start the Appium server with the Inspector plugin enabled
- Open the Appium Inspector at `http://localhost:{port}/inspector` in your default browser
- Handle cleanup when you press `Ctrl+C`

### Prerequisites

Make sure you have Appium installed with the drivers you need:

```sh
# Install Appium globally
npm install -g appium

# Install drivers (examples)
appium driver install uiautomator2  # For Android
appium driver install xcuitest      # For iOS
```

Or install Appium locally in your project:

```sh
npm install --save-dev appium
```

**Important:** The Appium Inspector plugin must be installed for this CLI command to work. The command will automatically check if the plugin is installed before starting the server. If it's not installed, you'll see an error with instructions.

Install the Appium Inspector plugin:

```sh
# Add it as a local dependency
npm install --D appium-inspector-plugin

# Add it globally, depending on how you installed it before
appium plugin install inspector
```

For more information about installing and using the Appium Inspector plugin, see the [Appium Inspector documentation](https://appium.github.io/appium-inspector/latest/quickstart/installation/#appium-plugin).

### Examples

Start with default port (4723):
```sh
npx start-appium-inspector
```

Start with a custom port:
```sh
npx start-appium-inspector --port=8080
```

Pass additional Appium server arguments:
```sh
npx start-appium-inspector --port=4723 --base-path=/wd/hub --relaxed-security
```

The command accepts all standard Appium server arguments. For a complete list of available arguments, see the [Appium documentation](https://appium.io/docs/en/latest/cli/args/).

### Appium Inspector

The CLI automatically opens the Appium Inspector web application at `http://localhost:{port}/inspector`, which provides a GUI interface for inspecting and interacting with your mobile apps. The Inspector is served directly from the Appium server when the Inspector plugin is enabled. For more information about the Appium Inspector, visit the [Appium Inspector GitHub repository](https://github.com/appium/appium-inspector).

**Note:**
- The Appium Inspector requires CORS to be enabled on the Appium server. The CLI automatically adds the `--allow-cors` flag to ensure compatibility.
- The CLI uses the `--use-plugins=inspector` flag to enable the Appium Inspector plugin. Before running the command, make sure you have installed the Appium Inspector plugin (see Prerequisites above).

## Native Mobile Selector Performance Optimizer

**⚠️ BETA Feature** - This feature is currently in beta. All feedback is welcome!

The Native Mobile Selector Performance Optimizer helps identify and optimize slow XPath selectors in your mobile tests. During test execution, it:
- Tracks all XPath selector performance and measures execution times
- Analyzes XPath selectors and suggests optimized alternatives (iOS class chain, accessibility ID, etc.)
- **Validates** optimized selectors during the test run to ensure they work correctly
- Generates a comprehensive report at the end showing which selectors need to be replaced in your code

**Important:** This feature **does not replace selectors in your code automatically**. Instead, it provides a report with recommendations. You need to manually update your code based on the report findings. The feature only replaces selectors during test execution for validation purposes.

**⚠️ Performance Impact:** Enabling this feature adds significant overhead to your test execution time. Features like `usePageSource` and `replaceWithOptimizedSelector` especially increase runtime. **Do not enable this feature constantly in your CI/CD pipeline** as it will slow down your tests. Recommended workflow:
1. Enable the feature and run your tests
2. Review the generated performance report
3. Update your code with the optimized selectors from the report
4. Create a PR with the optimizations
5. Merge the PR
6. Disable the feature and run tests normally

**Note:** Currently optimized for iOS only. Android support is coming in a future release.

### Configuration

To enable the Native Mobile Selector Performance Optimizer, add `trackSelectorPerformance` to your Appium service configuration:

```js
// wdio.conf.js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true
            }
        }]
    ],
    // ...
};
```

### Options

#### enabled

Enable or disable selector performance tracking.

Type: `boolean`

Default: `false`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true
            }
        }]
    ],
    // ...
}
```

#### usePageSource

Use page source analysis for more accurate selector suggestions. When enabled, analyzes the actual element from page source to find optimal selectors.

**⚠️ Performance Impact:** This option adds significant overhead to test execution time as it requires fetching and parsing the entire page source for each selector analysis.

Type: `boolean`

Default: `true`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true,
                usePageSource: false  // Disable to reduce overhead
            }
        }]
    ],
    // ...
}
```

#### replaceWithOptimizedSelector

Automatically test optimized selectors during test execution. When enabled, the service tests optimized selectors during the run to validate they work correctly and measure actual performance improvements. This helps ensure the suggested selectors are valid before you update your code.

**⚠️ Performance Impact:** This option significantly increases test execution time as it requires testing each optimized selector in addition to the original XPath selector. Each selector is tested twice (original + optimized), effectively doubling the execution time for element finding operations.

Type: `boolean`

Default: `true`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true,
                replaceWithOptimizedSelector: false  // Only track and suggest, don't validate during test
            }
        }]
    ],
    // ...
}
```

#### enableReporter

Enable the MobileSelectorPerformanceReporter to automatically collect test context information (test file, suite name, test name). This reporter is required for accurate test context tracking in the performance report.

**Important:** When `enableReporter` is `false`:
- No JSON report file is generated
- The `reportPath` and `maxLineLength` options are ignored
- Test context information (test file, suite name, test name) will not be collected
- Performance data is still tracked and can be used during test execution, but no report is generated at the end

Type: `boolean`

Default: `true`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true,
                enableReporter: true
            }
        }]
    ],
    // ...
}
```

#### reportPath

Path where the performance report JSON file should be saved. If not provided, falls back to `config.outputDir`, then `appium` service `logPath`. If none are set, an error will be thrown.

**Note:** This option is only used when `enableReporter` is `true`. When `enableReporter` is `false`, this option is ignored and no report file is created.

Type: `string`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true,
                reportPath: './reports/selector-performance'
            }
        }]
    ],
    // ...
}
```

#### maxLineLength

Maximum line length for terminal report output. Lines longer than this will be wrapped at word boundaries.

**Note:** This option is only used when `enableReporter` is `true`. When `enableReporter` is `false`, this option is ignored and no report is generated.

Type: `number`

Default: `100`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true,
                maxLineLength: 120
            }
        }]
    ],
    // ...
}
```

#### Complete Example

```js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true,
                usePageSource: true,
                replaceWithOptimizedSelector: true,
                enableReporter: true,
                reportPath: './reports/selector-performance',
                maxLineLength: 100
            }
        }]
    ],
    // ...
}
```

### How It Works

#### During Test Execution

1. **Tracking**: The service tracks all element-finding commands (`$`, `$$`, `custom$`, `custom$$`) and measures their execution time.

2. **Analysis**: When XPath selectors are detected, the service analyzes them and suggests optimized alternatives (iOS class chain, accessibility ID, etc.).

3. **Validation** (optional): If `replaceWithOptimizedSelector` is enabled, the service automatically tests optimized selectors during the test run to:
   - Verify the optimized selector works correctly
   - Measure actual performance improvements
   - Ensure the suggestion is valid before you update your code

4. **Data Collection**: All performance data is collected along with test context (test file, suite name, test name) for accurate reporting.

#### After Test Execution

5. **Report Generation**: At the end of the test run, a comprehensive performance report is generated showing:
   - Top optimizations with the biggest performance gains
   - Quick wins (shared selectors with high impact)
   - All optimizations grouped by test file
   - Performance metrics and improvement percentages
   - Exact selector replacements needed in your code

#### Recommended Workflow

**Step 1: Initial Analysis Run**
```js
// Enable the feature in your config
services: [
    ['appium', {
        trackSelectorPerformance: {
            enabled: true,
            usePageSource: true, // Enabled by default, this is for demo purpose
            replaceWithOptimizedSelector: true, // Enabled by default, this is for demo purpose
            enableReporter: true // Enabled by default, this is for demo purpose
        }
    }]
]
```

Run your tests and review the generated report.

**Step 2: Review the Report**
- Check the "Top 10 Most Impactful Optimizations" section for the biggest wins
- Review "Quick Wins" for shared selectors used across multiple tests
- Look at "All Actions Required" grouped by test file to see what needs updating

**Step 3: Update Your Code**
- Manually replace XPath selectors in your code with the optimized alternatives from the report
- Example: Replace `//XCUIElementTypeButton[@name="Submit"]` with `-ios class chain:**/XCUIElementTypeButton[\`name == "Submit"\`]`

**Step 4: Create Pull Request**
- Commit your optimized selectors
- Create a PR with a clear description of the optimizations

**Step 5: Merge and Disable**
- After merging the PR, disable the feature:
```js
services: [
    ['appium', {
        // trackSelectorPerformance removed or `enabled` set to false
    }]
]
```
- Your tests will now run faster without the overhead of the optimizer

**⚠️ Important:** Do not keep this feature enabled constantly in your CI/CD pipeline. Use it periodically (e.g., weekly/monthly) to identify new optimization opportunities, then disable it for normal test runs.

### Report Output

**Note:** The performance report is only generated when `enableReporter` is `true` (which is the default). When `enableReporter` is `false`, no report is generated and no JSON file is created.

When enabled, the service generates a detailed performance report that includes:
- **Top 10 Most Impactful Optimizations**: Selectors with the biggest performance improvements, showing original selector, optimized selector, and improvement metrics
- **Quick Wins**: Shared selectors used across multiple tests with high impact - optimize once, benefit everywhere
- **All Actions Required**: Complete list of optimizations grouped by test file, making it easy to update code systematically
- **Performance Metrics**: Duration improvements in milliseconds and percentages for each optimization

The report is saved as a JSON file in the specified `reportPath` (or default location) and also displayed in the terminal at the end of the test run.

#### Sample Report Output

<details>
<summary>Click to expand sample terminal report output</summary>

```
 "Mobile Selector Performance Optimizer" Reporter:

═══════════════════════════════════════════════════════════════════════════════
📊 Mobile Selector Performance: Summary Report
═══════════════════════════════════════════════════════════════════════════════
   Device: iPhone 16 Pro
   Total selectors analyzed: 20
   Positive optimizations found: 20
   Average improvement: 29.6% faster
   Total time saved: 1096.03ms (1.10s) per test run
   Impact breakdown: 1 high (>50%), 15 medium (20-50%), 1 low (10-20%), 1 minor (<10%)

🏆 Top 10 Most Impactful Optimizations
───────────────────────────────────────────────────────────────────────────
   1. $('//*[@name="Home"]') → $("~Home") (7.9% faster, 92.06ms saved) ⚠️ (shared)
   2. $('//*[@name="OK"]') → $("~OK") (31.4% faster, 46.14ms saved)
   3. $('//*[@name="Swipe-screen"]') → $("~Swipe-screen") (24.3% faster, 40.36ms saved)
   4. $('//*[@name="button-biometric"]') → $("~button-biometric") (31.6% faster, 37.02ms saved) ⚠️
      (shared)
   5. $('//*[@name="Drag-drop-screen"]') → $("~Drag-drop-screen") (29.7% faster, 36.82ms saved)
   6. $('//*[@name="Login-screen"]') → $("~Login-screen") (27.7% faster, 33.67ms saved) ⚠️ (shared)
   7. $('//*[@name="Forms-screen"]') → $("~Forms-screen") (24.2% faster, 30.28ms saved)
   8. $('//*[@name="button-login-container"]') → $("~button-login-container") (28.5% faster,
      29.26ms saved)
   9. $('//XCUIElementTypeAlert') → $("-ios predicate string:type == 'XCUIElementTypeAlert'") (17.8%
      faster, 23.70ms saved) ⚠️ (shared)
   10. $('//*[@name="Home-screen"]') → $("~Home-screen") (24.9% faster, 20.21ms saved)

⚡ Quick Wins (Shared Selectors with High Impact)
───────────────────────────────────────────────────────────────────────────
   These selectors appear in multiple tests and have high improvement. Fix once, benefit everywhere!
   • $('//*[@name="Home"]') → $("~Home") (51.4% faster, appears in 7 test(s))
     → Search in: page-objects/**/*.ts or helpers/**/*.ts
   • $('//*[@name="button-biometric"]') → $("~button-biometric") (31.6% faster, appears in 2
     test(s))
     → Search in: page-objects/**/*.ts or helpers/**/*.ts
   • $('//*[@name="Login-screen"]') → $("~Login-screen") (23.1% faster, appears in 2 test(s))
     → Search in: page-objects/**/*.ts or helpers/**/*.ts

📋 All Actions Required - Grouped by Test
───────────────────────────────────────────────────────────────────────────
   📁 tests/specs/app.biometric.login.spec.ts
      📦 Suite: "WebdriverIO and Appium, when interacting with a biometric button,"
         🧪 Test: "should be able to login with a matching touch/faceID/fingerprint"
            • Replace: $('//*[@name="Home"]') → $("~Home") (51.4% faster) ⚠️ (also in other test(s))
            • Replace: $('//*[@name="Login"]') → $("~Login") (21.8% faster)
            • Replace: $('//*[@name="Login-screen"]') → $("~Login-screen") (23.1% faster) ⚠️ (also
              in other test(s))
            • Replace: $('//*[@name="button-biometric"]') → $("~button-biometric") (31.6% faster) ⚠️
              (also in other test(s))
            • Replace: $('//*[@name="button-login-container"]') → $("~button-login-container")
              (28.5% faster)
            • Replace: $('//XCUIElementTypeAlert') → $("-ios predicate string:type ==
              'XCUIElementTypeAlert'") (17.8% faster) ⚠️ (also in other test(s))
            • Replace: $('//*[@name="OK"]') → $("~OK") (31.4% faster)
   📁 tests/specs/app.deep.link.navigation.spec.ts
      📦 Suite: "WebdriverIO and Appium, when navigating by deep link"
         🧪 Test: "should be able to open the webview"
            • Replace: $('//*[@name="Home"]') → $("~Home") (39.8% faster) ⚠️ (also in other test(s))
         🧪 Test: "should be able to open the login form screen"
            • Replace: $('//*[@name="Login-screen"]') → $("~Login-screen") (27.7% faster) ⚠️ (also
              in other test(s))
            • 1 minor optimization(s) (<10% improvement) - see detailed report
         🧪 Test: "should be able to open the forms screen"
            • Replace: $('//*[@name="Home"]') → $("~Home") (22.2% faster) ⚠️ (also in other test(s))
            • Replace: $('//*[@name="Forms-screen"]') → $("~Forms-screen") (24.2% faster)
         🧪 Test: "should be able to open the swipe screen"
            • Replace: $('//*[@name="Home"]') → $("~Home") (27.5% faster) ⚠️ (also in other test(s))
            • Replace: $('//*[@name="Swipe-screen"]') → $("~Swipe-screen") (24.3% faster)
         🧪 Test: "should be able to open the drag and drop screen"
            • Replace: $('//*[@name="Home"]') → $("~Home") (26.4% faster) ⚠️ (also in other test(s))
            • Replace: $('//*[@name="Drag-drop-screen"]') → $("~Drag-drop-screen") (29.7% faster)
         🧪 Test: "should be able to open the home screen"
            • Replace: $('//*[@name="Home"]') → $("~Home") (26.3% faster) ⚠️ (also in other test(s))
            • Replace: $('//*[@name="Home-screen"]') → $("~Home-screen") (24.9% faster)

⚠️  [Shared Selectors Detected]
───────────────────────────────────────────────────────────────────────────
      The following selectors appear in multiple tests and are likely in Page Objects:
      • $('//*[@name="Home"]') - appears in 7 test(s) across 2 file(s)
         → Search in: page-objects/**/*.ts or helpers/**/*.ts
         → Replace with: $("~Home")
      • $('//*[@name="Login-screen"]') - appears in 2 test(s) across 2 file(s)
         → Search in: page-objects/**/*.ts or helpers/**/*.ts
         → Replace with: $("~Login-screen")
      • $('//*[@name="button-biometric"]') - appears in 2 test(s) across 1 file(s)
         → Search in: page-objects/**/*.ts or helpers/**/*.ts
         → Replace with: $("~button-biometric")
      • $('//XCUIElementTypeAlert') - appears in 2 test(s) across 1 file(s)
         → Search in: page-objects/**/*.ts or helpers/**/*.ts
         → Replace with: $("-ios predicate string:type == 'XCUIElementTypeAlert'")

💡 [Why Change?]
───────────────────────────────────────────────────────────────────────────
      • Average 29.6% performance improvement (total of 1.10 seconds faster per run of this suite)
      • More stable: uses native iOS accessibility ID, uses iOS predicate strings
      • Documentation:
        - Accessibility ID: https://webdriver.io/docs/selectors#accessibility-id
        - Predicate String: https://webdriver.io/docs/selectors#ios-predicate-string
═══════════════════════════════════════════════════════════════════════════════
```

</details>

#### Platform Support

- ✅ **iOS**: Fully supported and optimized
- ⚠️ **Android**: Currently disabled (support coming in a future release)

When running on Android, the service will log a message indicating it's disabled and skip optimization.

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
