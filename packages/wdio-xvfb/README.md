# @wdio/xvfb

A standalone utility to manage Xvfb (X Virtual Framebuffer) for headless testing on Linux systems.

## Installation

```bash
npm install @wdio/xvfb
```

## Usage

### Basic Usage

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

### Custom Instance

```js
import XvfbManager from "@wdio/xvfb";

const manager = new XvfbManager({
    force: true, // Force on non-Linux systems for testing
});

const ready = await manager.init();
if (ready) {
    // xvfb-run is available for use
}
```

### Integration with @wdio/local-runner

The `@wdio/local-runner` can use this utility to ensure xvfb-run is available:

```js
// In local-runner
import { xvfb } from "@wdio/xvfb";

export class LocalRunner {
    async onPrepare() {
        await xvfb.init(); // Ensures xvfb-run is available
    }
}
```

## API

### XvfbManager Class

#### Constructor Options

```ts
interface XvfbOptions {
    force?: boolean; // Force Xvfb even on non-Linux systems (for testing)
}
```

#### Methods

-   **`shouldRun(): boolean`** - Check if Xvfb should run on this system
-   **`init(): Promise<boolean>`** - Initialize xvfb-run, returns true if ready, false if not needed

### Default Instance

A default instance is exported for convenience:

```js
import { xvfb } from "@wdio/xvfb";
```

## When does it run?

The utility automatically detects when Xvfb is needed:

-   ✅ Linux systems without a DISPLAY environment variable
-   ✅ Linux systems in CI environments (uses `is-ci` package for detection)
-   ❌ Non-Linux systems (unless `force: true`)
-   ❌ Linux systems with existing DISPLAY (unless in CI)

## Features

-   **Conditional execution**: Only runs on Linux systems in headless environments
-   **Cross-distro support**: Works on Ubuntu, Debian, Fedora, CentOS, RHEL, SUSE, Arch, Alpine, and Void Linux
-   **Automatic setup**: Installs required packages if not present using the appropriate package manager
-   **Command execution**: Execute commands under Xvfb using `xvfb-run`
-   **Graceful cleanup**: Automatic cleanup when commands complete
-   **State tracking**: Prevents duplicate starts and handles multiple calls safely
-   **Flexible logging**: Configurable logger support

## Implementation Details

This package uses `xvfb-run` to manage Xvfb sessions, which:

-   Automatically selects available display numbers with `--auto-servernum`
-   Configures screen resolution, DPI, and other display settings
-   Handles process cleanup automatically when commands complete
-   Supports custom arguments for advanced Xvfb configuration

## Supported Linux Distributions

The utility automatically detects and supports package installation on:

-   **Ubuntu/Debian**: Uses `apt-get` to install `xvfb`
-   **Fedora**: Uses `dnf` to install `xorg-x11-server-Xvfb`
-   **Rocky Linux**: Uses `dnf` to install `xorg-x11-server-Xvfb`
-   **CentOS/RHEL**: Uses `yum` to install `xorg-x11-server-Xvfb`
-   **SUSE**: Uses `zypper` to install `xvfb`
-   **Arch Linux**: Uses `pacman` to install `xorg-server-xvfb`
-   **Alpine**: Uses `apk` to install `xvfb`
-   **Void Linux**: Uses `xbps-install` to install `xvfb`

## Examples

### Basic Setup for Testing

```js
import { xvfb } from "@wdio/xvfb";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runTests() {
    // Ensure xvfb-run is available
    const ready = await xvfb.init();

    if (ready) {
        // Use xvfb-run to execute tests that need a display
        const { stdout, stderr } = await execAsync("xvfb-run npm test");
        console.log("Test output:", stdout);
        if (stderr) console.error("Errors:", stderr);
    } else {
        // Not on Linux or display already available
        const { stdout, stderr } = await execAsync("npm test");
        console.log("Test output:", stdout);
    }
}
```

### Electron Testing

```js
import { xvfb } from "@wdio/xvfb";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function testElectronApp() {
    const ready = await xvfb.init();

    const command = ready
        ? "xvfb-run electron ./app --test"
        : "electron ./app --test";
    const { stdout, stderr } = await execAsync(command);

    console.log("Electron output:", stdout);
}
```

### Force Mode for Testing

```js
import XvfbManager from "@wdio/xvfb";

const manager = new XvfbManager({
    force: true, // Force even on non-Linux systems
});

async function runTestsWithForce() {
    const ready = await manager.init();

    if (ready) {
        console.log("xvfb-run is ready for use");
        // Proceed with xvfb-run commands
    }
}
```

### Multiple Instances

```js
import XvfbManager from "@wdio/xvfb";

// Multiple managers for different scenarios
const managers = [
    new XvfbManager(), // Default
    new XvfbManager({ force: true }), // Forced
];

// Initialize all managers
const results = await Promise.all(managers.map((m) => m.init()));

console.log("Managers ready:", results);
```

## Logging

The utility uses `@wdio/logger` with the namespace `@wdio/xvfb`. Enable debug logging:

```bash
DEBUG=@wdio/xvfb npm run test
```

The logger is automatically created with the namespace `@wdio/xvfb` and cannot be customized in the current interface.

## License

MIT
