# @wdio/xvfb

A standalone utility to manage Xvfb (X Virtual Framebuffer) for headless testing on Linux systems.

## Installation

```bash
npm install @wdio/xvfb
```

## Usage

### Automatic Integration

**Most users don't need to use this package directly.** It's automatically integrated into:

- **`@wdio/local-runner`** - Automatically ensures xvfb is available for headless browser testing
- **`wdio-electron-service`** - Provides headless Electron testing capabilities

Simply run your WebDriverIO tests normally, and xvfb will be managed automatically when needed.

### Manual Usage (Advanced)

For custom integrations or non-WDIO environments:

```js
import { xvfb } from "@wdio/xvfb";

// Initialize xvfb-run (only works on Linux in headless environments)
const ready = await xvfb.init();

if (ready) {
    console.log("xvfb-run is ready for use");
    // Use xvfb-run to execute commands that need a display
    // e.g., xvfb-run npm test
}
```

## API

### XvfbManager Class

#### Constructor Options

```ts
interface XvfbOptions {
    enabled?: boolean;         // Authoritative usage toggle (default: true). If false, never uses Xvfb
    force?: boolean;           // Force Xvfb even on non-Linux systems (for testing)
    autoInstall?: boolean;     // Enable automatic installation of xvfb-run if missing (default: false)
    autoInstallMode?: 'root' | 'sudo'; // Installation mode when autoInstall is true (default: 'sudo')
    autoInstallCommand?: string | string[]; // Custom installation command (overrides built-in package manager detection)
    xvfbMaxRetries?: number;   // Number of retry attempts for xvfb failures (default: 3)
    xvfbRetryDelay?: number;   // Base delay between retries in milliseconds (default: 1000)
}
```

#### Methods

-   **`shouldRun(capabilities?): boolean`** - Check if Xvfb should run on this system
-   **`init(capabilities?): Promise<boolean>`** - Initialize xvfb-run, returns true if ready, false if not needed
-   **`executeWithRetry<T>(commandFn, context?): Promise<T>`** - Execute a function with automatic retry on xvfb-related errors

### Advanced Usage Examples

#### Force Mode (Testing Only)

For testing on non-Linux systems:

```js
import { XvfbManager } from "@wdio/xvfb";

const manager = new XvfbManager({
    force: true,
    xvfbMaxRetries: 3,
    xvfbRetryDelay: 1000
});
const ready = await manager.init();
```

#### Custom Retry Configuration

```js
import { XvfbManager } from "@wdio/xvfb";

// High-reliability setup for CI environments
const manager = new XvfbManager({
    xvfbMaxRetries: 10,     // More retries for flaky CI
    xvfbRetryDelay: 500     // Faster retries
});

// Execute operation with automatic retry
const result = await manager.executeWithRetry(async () => {
    // Your operation that might fail due to xvfb issues
    return await runHeadlessTests();
}, 'Running headless tests');
```

## When does it run?

The utility automatically detects when Xvfb is needed:

-   ✅ Linux systems without a DISPLAY environment variable
-   ✅ Linux systems when headless browser flags are detected:
    - **Chrome/Chromium**: `--headless`, `--headless=new`, `--headless=old`
    - **Firefox**: `--headless`, `-headless`
    - **Edge** (Chromium-based): `--headless`, `--headless=new`, `--headless=old`
-   ❌ Non-Linux systems (unless `force: true`)
-   ❌ Linux systems with existing DISPLAY (unless headless flags are detected)

## Features

-   **Conditional execution**: Only runs on Linux systems in headless environments
-   **Smart headless detection**: Automatically detects browser headless flags (`--headless`, `--headless=new`, etc.) and forces XVFB usage for consistent behavior
-   **Automatic retry mechanism**: Built-in retry logic with progressive delays for handling xvfb startup failures
-   **Configurable retry behavior**: Customizable retry count and delay settings via WDIO configuration
-   **Universal package manager support**: Automatically detects and uses the system's package manager (`apt`, `dnf`, `yum`, `zypper`, `pacman`, `apk`, `xbps`)
-   **Cross-distro compatibility**: Works across hundreds of Linux distributions by supporting their underlying package managers
-   **Command execution**: Execute commands under Xvfb using `xvfb-run`
-   **Graceful cleanup**: Automatic cleanup when commands complete
-   **State tracking**: Prevents duplicate starts and handles multiple calls safely
-   **Flexible logging**: Configurable logger support

## Retry Mechanism

The package includes automatic retry functionality for handling xvfb-related failures:

### Automatic Retry Detection

The retry mechanism automatically detects xvfb-specific errors:
- `xvfb-run: error: Xvfb failed to start`
- `Xvfb failed to start`
- `xvfb-run: error:`
- `X server died`

### Progressive Delay Strategy

Retry delays increase progressively to avoid overwhelming the system:
- Attempt 1: Immediate execution
- Attempt 2: Wait `xvfbRetryDelay × 1` ms (default: 1000ms)
- Attempt 3: Wait `xvfbRetryDelay × 2` ms (default: 2000ms)
- Attempt N: Wait `xvfbRetryDelay × (N-1)` ms

### Usage Example

```js
import { XvfbManager } from '@wdio/xvfb';

const manager = new XvfbManager({
    xvfbMaxRetries: 5,
    xvfbRetryDelay: 1500
});

// Automatic retry on xvfb failures
const result = await manager.executeWithRetry(async () => {
    // Your xvfb-dependent operation
    return await someXvfbDependentTask();
}, 'Custom operation name');
```

## Implementation Details

This package uses `xvfb-run` to manage Xvfb sessions, which:

-   Automatically selects available display numbers with `--auto-servernum`
-   Configures screen resolution, DPI, and other display settings
-   Handles process cleanup automatically when commands complete
-   Supports custom arguments for advanced Xvfb configuration

## Supported Package Managers

The utility automatically detects the system's package manager and installs xvfb accordingly:

| Package Manager | Command | Distributions | Package Name |
|----------------|---------|---------------|--------------|
| **`apt`** | `apt-get` | Ubuntu, Debian, Pop!_OS, Mint, Elementary, Zorin, etc. | `xvfb` |
| **`dnf`** | `dnf` | Fedora, Rocky Linux, AlmaLinux, Nobara, Bazzite, etc. | `xorg-x11-server-Xvfb` |
| **`yum`** | `yum` | CentOS, RHEL (legacy) | `xorg-x11-server-Xvfb` |
| **`zypper`** | `zypper` | openSUSE, SUSE Linux Enterprise | `xvfb-run` |
| **`pacman`** | `pacman` | Arch Linux, Manjaro, EndeavourOS, CachyOS, etc. | `xorg-server-xvfb` |
| **`apk`** | `apk` | Alpine Linux, PostmarketOS | `xvfb-run` |
| **`xbps`** | `xbps-install` | Void Linux | `xvfb` |

### Future-Proof Design

This package manager-focused approach means **new Linux distributions automatically work** without code changes, as long as they use one of the supported package managers. For example:
- New Ubuntu derivatives automatically use `apt`
- New Arch derivatives automatically use `pacman`
- New Fedora derivatives automatically use `dnf`

The 7 supported package managers cover **95%+ of all Linux users** and hundreds of distributions, making this solution both comprehensive and maintainable.

## Examples

### Basic Setup for Custom Tools

```js
import { xvfb } from "@wdio/xvfb";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runCustomTests() {
    const ready = await xvfb.init();

    const command = ready
        ? "xvfb-run your-custom-test-command"
        : "your-custom-test-command";

    await execAsync(command);
}
```

### WebDriverIO Configuration

For most users, no configuration is needed. WDIO automatically handles xvfb:

```js
// wdio.conf.js - Minimal configuration
export const config = {
    // No xvfb configuration needed - handled automatically
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['--headless', '--no-sandbox'] // Automatically detected - will force XVFB
        }
    }],
    services: [
        'chromedriver',
        // xvfb is automatically managed by local-runner
    ]
};
```

#### Advanced WDIO Configuration

You can customize xvfb behavior and retry settings in your WDIO config file:

```js
// wdio.conf.js - Custom xvfb configuration
export const config = {
    // Xvfb configuration options (all optional)
    autoXvfb: true,              // Authoritative usage toggle (default: true). If false, never uses Xvfb
    xvfbAutoInstall: false,      // Enable automatic installation of xvfb-run if missing (default: false)
    xvfbAutoInstallMode: 'sudo', // Installation mode: 'root' or 'sudo' (default: 'sudo')
    xvfbAutoInstallCommand: undefined, // Custom installation command (optional)
    xvfbMaxRetries: 5,           // Max retry attempts for xvfb failures (default: 3)
    xvfbRetryDelay: 2000,        // Base delay between retries in ms (default: 1000)

    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['--headless', '--no-sandbox']
        }
    }]
};
```

**WDIO Testrunner Configuration Options:**

- **`autoXvfb`** *(boolean, default: true)*: Authoritative usage toggle – if `false`, Xvfb is never used
- **`xvfbAutoInstall`** *(boolean, default: false)*: Enable automatic installation when `xvfb-run` is missing
- **`xvfbAutoInstallMode`** *('root' | 'sudo', default: 'sudo')*: Installation mode
  - 'root': install only if running as root (no sudo)
  - 'sudo': allow non-interactive sudo (`sudo -n`) when not root; skip if sudo not present
- **`xvfbAutoInstallCommand`** *(string | string[], optional)*: Custom installation command that overrides built-in package manager detection
- **`xvfbMaxRetries`** *(number, default: 3)*: Number of retry attempts when xvfb process fails
- **`xvfbRetryDelay`** *(number, default: 1000)*: Base delay between retries in milliseconds. Uses progressive delay (delay × attempt number)

### Headless Flag Detection

The utility automatically detects browser headless flags and forces XVFB usage even when a DISPLAY is available:

```js
// These configurations will automatically trigger XVFB on Linux:

// Chrome/Chromium
capabilities: [{
    'goog:chromeOptions': {
        args: ['--headless']        // Detected
    }
}]

// Firefox
capabilities: [{
    'moz:firefoxOptions': {
        args: ['--headless']        // Detected
    }
}]

// Edge (Chromium-based)
capabilities: [{
    'ms:edgeOptions': {
        args: ['--headless=new']    // Detected
    }
}]

// Legacy formats also supported
capabilities: [{
    chromeOptions: { args: ['--headless'] },     // Legacy Chrome
    edgeOptions: { args: ['--headless'] }        // Legacy Edge
}]

// Multiremote scenarios are also supported
capabilities: {
    browserA: { 'goog:chromeOptions': { args: ['--headless'] }},
    browserB: { 'ms:edgeOptions': { args: ['--no-sandbox'] }}
    // XVFB will be used because browserA has headless flag
}
```

This ensures consistent headless behavior regardless of host environment setup.

## Logging

The utility uses `@wdio/logger` with the namespace `@wdio/xvfb`. Enable debug logging:

```bash
DEBUG=@wdio/xvfb npm run test
```

The logger is automatically created with the namespace `@wdio/xvfb` and cannot be customized in the current interface.

## License

MIT
