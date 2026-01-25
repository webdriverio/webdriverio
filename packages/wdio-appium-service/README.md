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

**⚠️ Performance Impact:** Enabling this feature adds significant overhead to your test execution time as it requires fetching and parsing the page source for each selector analysis. The `replaceWithOptimizedSelector` option especially increases runtime. **Do not enable this feature constantly in your CI/CD pipeline** as it will slow down your tests. Recommended workflow:
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

#### enableCliReport

Enable or disable the CLI report output to the terminal. When enabled, a formatted performance report is printed to the terminal after test execution.

**Note:** The JSON report is always generated when `enabled: true`. This option only controls whether the report is also printed to the terminal.

Type: `boolean`

Default: `false`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true,
                enableCliReport: true  // Enable terminal output
            }
        }]
    ],
    // ...
}
```

#### enableMarkdownReport

Enable markdown report file generation. When enabled, a markdown file with the same content as the CLI report is written to the logs folder (the same directory as the JSON report).

Type: `boolean`

Default: `false`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true,
                enableMarkdownReport: true  // Generate a markdown report file
            }
        }]
    ],
    // ...
}
```

#### reportPath

Path where the performance report files (JSON, and optionally markdown) should be saved. If not provided, falls back to `config.outputDir`, then `appium` service `logPath`. If none are set, an error will be thrown.

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

Maximum line length for terminal and markdown report output. Lines longer than this will be wrapped at word boundaries.

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

#### provideSelectorLocation

Enable file location tracking for selectors found in page objects and test files. When enabled, the report will show clickable file paths (e.g., "📍 Found at: TabBar.ts:3") to help you quickly navigate to the selector definition.

**Note:** This option requires `pageObjectPaths` to be configured. If `pageObjectPaths` is not provided, location tracking will be disabled automatically.

Type: `boolean`

Default: `true` (when `pageObjectPaths` is provided)

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true,
                pageObjectPaths: ['./tests/pageobjects'],
                provideSelectorLocation: true
            }
        }]
    ],
    // ...
}
```

#### pageObjectPaths

Paths to directories containing page objects or helper files where selectors may be defined. When provided, the service will search these directories to find selector locations.

When not provided, the service attempts to automatically discover page objects using common naming patterns (e.g., `tests/pageobjects/`, `tests/pages/`, `tests/page-objects/`). However, **explicitly configuring this option is strongly recommended** for accurate selector location tracking, especially if your page objects follow a custom directory structure.

**Note:** This option is required for `provideSelectorLocation` to work. If `pageObjectPaths` is not provided, `provideSelectorLocation` will be disabled automatically.

Type: `string[]`

Default: `undefined` (auto-discovery using common patterns)

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            trackSelectorPerformance: {
                enabled: true,
                // Single directory
                pageObjectPaths: ['./tests/pageobjects']
                // Or multiple directories
                // pageObjectPaths: ['./tests/pageobjects', './tests/pages', './tests/helpers']
            }
        }]
    ],
    // ...
}
```

When `pageObjectPaths` is configured, the report will show file locations with line numbers:

```
📍 Found at: tests/screenobjects/components/TabBar.ts:3
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
                enableCliReport: true,
                enableMarkdownReport: true,
                reportPath: './reports/selector-performance',
                maxLineLength: 100,
                pageObjectPaths: ['./tests/pageobjects', './tests/helpers'],
                provideSelectorLocation: true
            }
        }]
    ],
    // ...
}
```

### Using with Cloud Services (BrowserStack, Sauce Labs, etc.)

The Mobile Selector Performance Optimizer works independently of the local Appium server. This means you can use it with cloud-based testing services like BrowserStack, Sauce Labs, or any other Appium cloud provider.

When cloud capabilities are detected, the `@wdio/appium-service` automatically skips starting a local Appium server (since the cloud provider manages Appium for you), but the MSPO feature continues to work normally. It hooks into WebdriverIO's command lifecycle to track selector performance, regardless of where the Appium server is running.

**Example configuration with BrowserStack:**

```js
// wdio.conf.js
export const config = {
    // ...
    services: [
        ['browserstack', {
            // BrowserStack service options
        }],
        ['appium', {
            // No need to configure Appium server options - it won't start locally
            // Just configure the MSPO feature:
            trackSelectorPerformance: {
                enabled: true,
                enableCliReport: true,
                enableMarkdownReport: true,
                reportPath: './reports/selector-performance'
            }
        }]
    ],
    // ...
};
```

**Example configuration with Sauce Labs:**

```js
// wdio.conf.js
export const config = {
    // ...
    services: [
        ['sauce', {
            // Sauce Labs service options
        }],
        ['appium', {
            trackSelectorPerformance: {
                enabled: true,
                enableCliReport: true,
                enableMarkdownReport: true,
                reportPath: './reports/selector-performance'
            }
        }]
    ],
    // ...
};
```

**What happens:**
- The Appium launcher detects cloud capabilities and logs: `Could not identify any capability that indicates a local Appium session, skipping Appium launch`
- MSPO tracks all selector performance during test execution on the cloud device
- Each worker writes its performance data locally
- After all tests complete, the aggregator combines data from all workers and generates the final report

**Expected output:** The same comprehensive performance report (JSON, CLI, and/or Markdown) is generated locally, containing all selector performance data collected from your cloud-based iOS test runs. See the [Report Output](#report-output) section for sample output.

### Logging

The Mobile Selector Performance Optimizer logs via `@wdio/logger` with the namespace `@wdio/appium-service:selector-optimizer`. This means that all output respects WebdriverIO `logLevel` and per-logger overrides.

**Log Level Hierarchy** (from most verbose to silent):
- `trace` → Most verbose, includes all log messages
- `debug` → Includes debug, info, warn, and error messages
- `info` → Includes info, warn, and error messages (default)
- `warn` → Includes only warn and error messages
- `error` → Includes only error messages
- `silent` → No log output

When you set a log level, all levels at or above that level will be shown. For example, setting `logLevel: 'info'` will show `info`, `warn`, and `error` messages, but not `debug` or `trace` messages.

Behavior by mode:
- **`replaceWithOptimizedSelector: true` (validation mode):**
  - `info` logs cover research steps, timing, testing of optimized selectors, and comparisons.
  - `debug` logs add detailed selector testing steps (enable by setting logger level to `debug`).
  - Warnings are always emitted at `warn`.

- **`replaceWithOptimizedSelector: false` (tracking-only mode):**
  - `info` logs cover tracking and suggested optimizations.
  - `debug` adds detailed selector analysis when enabled.

To silence the optimizer logs entirely, set:

```js
export const config = {
    // ...
    logLevel: 'silent', // silences all @wdio/logger output, including the optimizer
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
            enableCliReport: true, // Enable CLI report output to terminal
            enableMarkdownReport: true // Enable markdown report file generation
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
═══════════════════════════════════════════════════════════════════════════════
📊 Mobile Selector Performance Optimizer Report
═══════════════════════════════════════════════════════════════════════════════

   Device: iPhone 16 Pro
   Run Time: 07:46:00 → 07:53:15 (7m 14s)
   Analyzed: 67 unique selectors (50 optimizable, 17 not recommended)
   Total Potential Savings: 10.98s per test run (2.5% of total run time)
   Average Improvement per Selector: 30.3% faster

📈 Summary
───────────────────────────────────────────────────────────────────────────────
   🔴 High (>50% gain):        2 → Fix immediately
   🟠 Medium (20-50% gain):   47 → Recommended
   🟡 Low (10-20% gain):       1 → Minor optimization
   ⚠️  Slower in Testing:     17 → See warnings below

🎯 File-Based Fixes
───────────────────────────────────────────────────────────────────────────────
   Update these specific lines for immediate impact:

   📁 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/components/NativeAlert.ts
            L8: $('//XCUIElementTypeAlert') → $("-ios predicate string:type == 'XCUIElementTyp...")
                ⚡ 410.0ms/use × 14 uses = 5.74s total
      └─ File total: 5.74s saved (1 selector)

   📁 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/DragScreen.ts
            L5: $('//*[@name="Drag-drop-screen"]') → $("~Drag-drop-screen")
                ⚡ 61.0ms/use × 3 uses = 183.1ms total
            L8: $('//*[@name="drag-l1"]') → $("~drag-l1") [73.6ms]
            L9: $('//*[@name="drag-c1"]') → $("~drag-c1") [70.1ms]
            L10: $('//*[@name="drag-r1"]') → $("~drag-r1") [73.0ms]
            L11: $('//*[@name="drag-l2"]') → $("~drag-l2") [71.7ms]
            L12: $('//*[@name="drag-c2"]') → $("~drag-c2") [53.9ms]
            L13: $('//*[@name="drag-r2"]') → $("~drag-r2") [51.3ms]
            L14: $('//*[@name="drag-l3"]') → $("~drag-l3") [59.3ms]
            L15: $('//*[@name="drag-c3"]') → $("~drag-c3") [58.1ms]
            L16: $('//*[@name="drag-r3"]') → $("~drag-r3") [50.1ms]
            L26: $('//*[@name="renew"]') → $("~renew") [36.3ms]
            L27: $('//*[@name="button-Retry"]') → $("~button-Retry")
                ⚡ 347.1ms/use × 2 uses = 694.3ms total
      └─ File total: 1.47s saved (12 selectors)

   📁 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/FormsScreen.ts
            L13: $('//*[@name="text-input"]') → $("~text-input") [25.4ms]
            L14: $('//*[@name="input-text-result"]') → $("~input-text-result")
                ⚡ 32.7ms/use × 2 uses = 65.3ms total
            L15: $('//*[@name="switch"]') → $("~switch")
                ⚡ 36.5ms/use × 5 uses = 182.4ms total
            L18: $('//*[@name="dropdown-chevron"]') → $("~dropdown-chevron")
                ⚡ 27.4ms/use × 3 uses = 82.3ms total
            L19: $('//*[@name="button-Active"]') → $("~button-Active")
                ⚡ 57.3ms/use × 4 uses = 229.3ms total
            L20: $('//*[@name="button-Inactive"]') → $("~button-Inactive")
                ⚡ 47.7ms/use × 2 uses = 95.4ms total
            L72: $('//*[@name="Dropdown"]//XCUIElementTypeTextFie...') → $("~text_input")
                ⚡ 31.8ms/use × 3 uses = 95.4ms total
      └─ File total: 775.4ms saved (7 selectors)

   📁 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/LoginScreen.ts
            L13: $('//*[@name="button-login-container"]') → $("~button-login-container")
                ⚡ 24.1ms/use × 3 uses = 72.4ms total
            L14: $('//*[@name="button-sign-up-container"]') → $("~button-sign-up-container")
                [23.6ms]
            L15: $('//*[@name="button-LOGIN"]') → $("~button-LOGIN")
                ⚡ 56.6ms/use × 2 uses = 113.3ms total
            L16: $('//*[@name="button-SIGN UP"]') → $("~button-SIGN UP")
                ⚡ 53.3ms/use × 2 uses = 106.6ms total
            L17: $('//*[@name="input-email"]') → $("~input-email")
                ⚡ 55.4ms/use × 2 uses = 110.8ms total
            L18: $('//*[@name="input-password"]') → $("~input-password")
                ⚡ 35.6ms/use × 2 uses = 71.3ms total
            L19: $('//*[@name="input-repeat-password"]') → $("~input-repeat-password") [41.7ms]
            L20: $('//*[@name="button-biometric"]') → $("~button-biometric")
                ⚡ 29.2ms/use × 4 uses = 116.7ms total
      └─ File total: 656.3ms saved (8 selectors)

   📁 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/components/Picker.ts
            L3: $('//XCUIElementTypePickerWheel') → $("-ios predicate string:type ==
                'XCUIElementTyp...")
                ⚡ 46.2ms/use × 6 uses = 277.4ms total
            L4: $('//*[@name="done_button"]') → $("~done_button")
                ⚡ 48.2ms/use × 3 uses = 144.7ms total
      └─ File total: 422.1ms saved (2 selectors)

   📁 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/components/TabBar.ts
            L15: $('//*[@name="Forms"]') → $("~Forms")
                ⚡ 29.5ms/use × 6 uses = 177.0ms total
            L19: $('//*[@name="Swipe"]') → $("~Swipe")
                ⚡ 35.1ms/use × 3 uses = 105.3ms total
            L23: $('//*[@name="Drag"]') → $("~Drag")
                ⚡ 33.2ms/use × 2 uses = 66.4ms total
      └─ File total: 348.8ms saved (3 selectors)

   📁 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/SwipeScreen.ts
            L10: $('//*[@name="WebdriverIO logo"]') → $("~WebdriverIO logo")
                ⚡ 86.9ms/use × 2 uses = 173.9ms total
      └─ File total: 173.9ms saved (1 selector)

   📁 tests/specs/app.biometric.login.spec.ts
            L64: $('//XCUIElementTypeStaticText[@name="LOGIN"]/an...') → $("~button-LOGIN") [24.0ms]
            L66: $('//XCUIElementTypeStaticText[@name="LOGIN"]/pa...') → $("~button-LOGIN") [22.0ms]
            L67: $('//XCUIElementTypeStaticText[@name="LOGIN"]/.....') → $("~button-LOGIN") [21.6ms]
            L68: $('//XCUIElementTypeOther[@name="button-LOGIN"]/...') → $("~button-biometric")
                [21.2ms]
            L69: $('//XCUIElementTypeOther[@name="button-biometri...') → $("~button-LOGIN") [23.6ms]
      └─ File total: 112.4ms saved (5 selectors)

   📁 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/HomeScreen.ts
            L5: $('//*[@name="Home-screen"]') → $("~Home-screen")
                ⚡ 27.4ms/use × 2 uses = 54.8ms total
      └─ File total: 54.8ms saved (1 selector)

🔍 Workspace-Wide Optimizations
───────────────────────────────────────────────────────────────────────────────
   Source file unknown. Search your IDE (Cmd+Shift+F) for these selectors:

            $('//*[@name="Carousel"]') → $("~Carousel")
               ⚡ 57.0ms/use × 10 uses = 570.5ms total
            $('//*[@name="OK"]') → $("~OK")
               ⚡ 48.5ms/use × 4 uses = 193.9ms total
            $('//*[@name="__CAROUSEL_ITEM_0__"]') → $("~__CAROUSEL_ITEM_0__")
               ⚡ 51.1ms/use × 2 uses = 102.2ms total
            $('//*[@name="Cancel"]') → $("~Cancel")
               ⚡ 38.9ms/use × 2 uses = 77.7ms total
            $('//*[@name="__CAROUSEL_ITEM_5__"]') → $("~__CAROUSEL_ITEM_5__")
               ⚡ 61.3ms
            $('//*[@name="__CAROUSEL_ITEM_4__"]') → $("~__CAROUSEL_ITEM_4__")
               ⚡ 54.9ms
            $('//*[@name="__CAROUSEL_ITEM_3__"]') → $("~__CAROUSEL_ITEM_3__")
               ⚡ 51.8ms
            $('//*[@name="__CAROUSEL_ITEM_2__"]') → $("~__CAROUSEL_ITEM_2__")
               ⚡ 41.4ms
            $('//*[@name="__CAROUSEL_ITEM_1__"]') → $("~__CAROUSEL_ITEM_1__")
               ⚡ 37.2ms
            $('//*[@name="Ask me later"]') → $("~Ask me later")
               ⚡ 29.4ms

⚠️  Performance Warnings
───────────────────────────────────────────────────────────────────────────────
   Native selectors were SLOWER than XPath for these cases.
   This can happen due to app-specific optimizations, element hierarchy,
   caching effects, or Appium/driver version differences.
   Recommendation: Keep using XPath for these selectors.

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/components/TabBar.ts:3
            XPath:  $('//*[@name="Home"]') → 841ms
            Native: $('~Home') → 1052ms
                    ❌ Native was 212ms slower (25%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/components/TabBar.ts:11
            XPath:  $('//*[@name="Login"]') → 902ms
            Native: $('~Login') → 1068ms
                    ❌ Native was 167ms slower (18%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/LoginScreen.ts:4
            XPath:  $('//*[@name="Login-screen"]') → 118ms
            Native: $('~Login-screen') → 431ms
                    ❌ Native was 313ms slower (265%)

   📍 tests/specs/app.biometric.login.spec.ts:65
            XPath:  $('//XCUIElementTypeStaticText[@name="LOGIN...') → 96ms
            Native: $('~button-LOGIN') → 106ms
                    ❌ Native was 10ms slower (11%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/FormsScreen.ts:4
            XPath:  $('//*[@name="Forms-screen"]') → 126ms
            Native: $('~Forms-screen') → 507ms
                    ❌ Native was 381ms slower (303%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/SwipeScreen.ts:2
            XPath:  $('//*[@name="Swipe-screen"]') → 158ms
            Native: $('~Swipe-screen') → 1134ms
                    ❌ Native was 976ms slower (619%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/DragScreen.ts:17
            XPath:  $('//*[@name="drop-l1"]') → 124ms
            Native: $('~drop-l1') → 582ms
                    ❌ Native was 458ms slower (370%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/DragScreen.ts:18
            XPath:  $('//*[@name="drop-c1"]') → 122ms
            Native: $('~drop-c1') → 491ms
                    ❌ Native was 369ms slower (303%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/DragScreen.ts:19
            XPath:  $('//*[@name="drop-r1"]') → 122ms
            Native: $('~drop-r1') → 452ms
                    ❌ Native was 330ms slower (271%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/DragScreen.ts:20
            XPath:  $('//*[@name="drop-l2"]') → 114ms
            Native: $('~drop-l2') → 420ms
                    ❌ Native was 306ms slower (268%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/DragScreen.ts:21
            XPath:  $('//*[@name="drop-c2"]') → 100ms
            Native: $('~drop-c2') → 371ms
                    ❌ Native was 270ms slower (269%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/DragScreen.ts:22
            XPath:  $('//*[@name="drop-r2"]') → 93ms
            Native: $('~drop-r2') → 334ms
                    ❌ Native was 240ms slower (257%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/DragScreen.ts:23
            XPath:  $('//*[@name="drop-l3"]') → 92ms
            Native: $('~drop-l3') → 279ms
                    ❌ Native was 187ms slower (204%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/DragScreen.ts:24
            XPath:  $('//*[@name="drop-c3"]') → 87ms
            Native: $('~drop-c3') → 237ms
                    ❌ Native was 150ms slower (172%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/DragScreen.ts:25
            XPath:  $('//*[@name="drop-r3"]') → 80ms
            Native: $('~drop-r3') → 198ms
                    ❌ Native was 118ms slower (148%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/components/TabBar.ts:7
            XPath:  $('//*[@name="Webview"]') → 948ms
            Native: $('~Webview') → 1060ms
                    ❌ Native was 111ms slower (12%)

   📍 /Users/wimselles/Git/wdio/appium-boilerplate/tests/screenobjects/WebviewScreen.ts:8
            XPath:  $('*//XCUIElementTypeWebView') → 102ms
            Native: $('-ios predicate string:type == 'XCUIEleme...') → 153ms
                    ❌ Native was 51ms slower (50%)

💡 Why Change?
───────────────────────────────────────────────────────────────────────────────
   • Speed: Native selectors bypass expensive XML tree traversal
   • Stability: Less affected by UI hierarchy changes
   • Priority: ~accessibilityId > -ios predicate string > -ios class chain > //xpath
   • Docs: https://webdriver.io/docs/selectors#mobile-selectors
═══════════════════════════════════════════════════════════════════════════════

───────────────────────────────────────────────────────────────────────────────
📝 Mobile Selector Performance Optimizer - Markdown Report
───────────────────────────────────────────────────────────────────────────────
   📁 Markdown report written to: /Users/wimselles/Git/wdio/appium-boilerplate/logs/mobile-selector-performance-optimizer-report-iphone_16_pro-1769237599894.md
───────────────────────────────────────────────────────────────────────────────
```

</details>

#### Understanding Performance Results

While native selectors (like accessibility IDs) are generally faster than XPath, you may occasionally see cases in your report where the suggested selector performed slower during testing. This is normal and can happen for a few reasons:

- **Timing variations**: Mobile devices aren't perfectly consistent. Background processes, screen animations, or momentary CPU load can affect individual measurements. A selector tested during a busy moment may appear slower than one tested when the device was idle.

- **App-specific behavior**: Some apps have unique UI structures where certain selector strategies work better than others. The "typical" performance ranking doesn't apply universally to every element in every app.

- **Measurement represents a single snapshot**: Each selector is tested once during your test run. This captures real performance but includes normal variation. A selector showing 10-15% slower results may actually perform the same or better on average.

**What to do with "slower" results**: The report flags these cases in the "Performance Warnings" section so you can make informed decisions. For selectors showing significantly slower native performance (50%+), it's reasonable to keep using XPath. For borderline cases, the difference is likely negligible in practice, and native selectors are typically more stable and less brittle than XPath since they don't depend on the exact UI hierarchy, which can change between app versions.

The optimizer helps you find clear wins, and most selectors will show genuine improvements. The warnings simply ensure you have complete information rather than blindly replacing every selector.

#### Platform Support

- ✅ **iOS**: Fully supported and optimized
- ⚠️ **Android**: Currently disabled (support coming in a future release)
- ⚠️ **MultiRemote**: Not supported yet (feature is automatically disabled for MultiRemote sessions)

When running on Android or with MultiRemote, the service will log a warning message indicating it's disabled and skip optimization.

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
