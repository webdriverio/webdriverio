# @wdio/display-server

A standalone utility to manage display servers (Wayland/Xvfb) for headless testing on Linux systems.

## Overview

This package provides automatic display server management for headless testing:

- **Wayland** (`weston`) - Primary display server for modern Linux distributions
- **Xvfb** (X Virtual Framebuffer) - Fallback for X11-based systems

The package automatically selects the appropriate display server based on availability, with Wayland preferred and Xvfb as fallback.

## Installation

```bash
npm install @wdio/display-server
```

## Usage

### Automatic Integration

**Most users don't need to use this package directly.** It's automatically integrated into:

- **`@wdio/local-runner`** - Automatically manages display servers for headless browser testing
- **`wdio-electron-service`** - Provides headless Electron testing capabilities

Simply run your WebDriverIO tests normally, and the display server will be managed automatically.

### Manual Usage (Advanced)

For custom integrations or non-WDIO environments:

```js
import { displayServer } from "@wdio/display-server";

// Initialize display server (Wayland preferred, Xvfb fallback)
const ready = await displayServer.init();

if (ready) {
    console.log("Display server is ready for use");
    const server = displayServer.getDisplayServer();
    console.log(`Using: ${server.name}`); // 'wayland' or 'xvfb'
}
```

## API

### DisplayServerManager Class

#### Constructor Options

```ts
interface DisplayServerOptions {
    enabled?: boolean;              // Authoritative usage toggle (default: true)
    displayServer?: 'auto' | 'wayland' | 'xvfb'; // Which display server to use (default: 'auto')
    auto          // Enable automatic installation if missing (default: false)
Install?: boolean;    autoInstallMode?: 'root' | 'sudo'; // Installation mode (default: 'sudo')
    autoInstallCommand?: string | string[]; // Custom installation command
    maxRetries?: number;            // Number of retry attempts (default: 3)
    retryDelay?: number;            // Base delay between retries in ms (default: 1000)
    force?: boolean;                // Force display server even on non-Linux (for testing)
}
```

#### Methods

- **`shouldRun(capabilities?): boolean`** - Check if display server should run
- **`init(capabilities?): Promise<boolean>`** - Initialize display server
- **`getDisplayServer(): DisplayServer | null`** - Get the active display server instance
- **`executeWithRetry<T>(commandFn, context?): Promise<T>`** - Execute with automatic retry

#### DisplayServer Interface

```ts
interface DisplayServer {
    readonly name: 'wayland' | 'xvfb';
    isAvailable(): Promise<boolean>;
    install(options?: DisplayServerInstallOptions): Promise<boolean>;
    getEnvironment(): Record<string, string>;
    getProcessWrapper(): string[] | null;
    getChromeFlags(): string[];
}
```

## Display Server Selection

### Auto Mode (Default)

The package automatically selects the best display server:

1. **Try Wayland first** (`weston --backend=headless`)
2. **Fall back to Xvfb** if Wayland is unavailable
3. **Skip Xvfb on CentOS Stream 10** (Xvfb not available in RHEL 10+)

### Manual Override

```js
// Force Wayland only
const manager = new DisplayServerManager({ displayServer: 'wayland' });

// Force Xvfb only
const manager = new DisplayServerManager({ displayServer: 'xvfb' });
```

## When does it run?

The utility automatically detects when a display server is needed:

- ✅ Linux systems without a DISPLAY environment variable
- ✅ Linux systems when headless browser flags are detected
- ❌ Non-Linux systems (unless `force: true`)
- ❌ Linux systems with existing DISPLAY (unless headless flags are detected)

### Headless Flag Detection

Automatically detected flags:
- **Chrome/Chromium**: `--headless`, `--headless=new`, `--headless=old`
- **Firefox**: `--headless`, `-headless`
- **Edge** (Chromium-based): `--headless`, `--headless=new`, `--headless=old`

## Features

- **Wayland-first design**: Uses Weston headless backend on modern distributions
- **Automatic fallback**: Falls back to Xvfb when Wayland unavailable
- **Cross-distro support**: Works on all major Linux distributions
- **Smart headless detection**: Automatically detects browser headless flags
- **Automatic retry mechanism**: Handles display server startup failures
- **Universal package manager support**: Detects and uses `apt`, `dnf`, `yum`, `zypper`, `pacman`, `apk`, `xbps`
- **Chrome Wayland flags**: Automatically injects `--ozone-platform=wayland` for Chrome/Edge
- **Electron support**: Sets `ELECTRON_OZONE_PLATFORM_HINT=wayland`
- **Custom installation**: Supports custom install commands and sudo modes

## Supported Package Managers

### Wayland (weston)

| Package Manager | Command | Distributions | Package Name |
|----------------|---------|---------------|--------------|
| **`apt`** | `apt-get` | Ubuntu, Debian, Pop!_OS, Mint | `weston` |
| **`dnf`** | `dnf` | Fedora, Rocky Linux, AlmaLinux | `weston` |
| **`yum`** | `yum` | CentOS, RHEL (legacy) | `weston` |
| **`zypper`** | `zypper` | openSUSE, SUSE Linux Enterprise | `weston` |
| **`pacman`** | `pacman` | Arch Linux, Manjaro, EndeavourOS | `weston` |
| **`apk`** | `apk` | Alpine Linux | `weston` |
| **`xbps`** | `xbps-install` | Void Linux | `weston` |

### Xvfb (Fallback)

| Package Manager | Command | Distributions | Package Name |
|----------------|---------|---------------|--------------|
| **`apt`** | `apt-get` | Ubuntu, Debian | `xvfb` |
| **`dnf`** | `dnf` | Fedora, Rocky Linux | `xorg-x11-server-Xvfb` |
| **`yum`** | `yum` | CentOS, RHEL (legacy) | `xorg-x11-server-Xvfb` |
| **`zypper`** | `zypper` | openSUSE | `xvfb-run` |
| **`pacman`** | `pacman` | Arch Linux | `xorg-server-xvfb` |
| **`apk`** | `apk` | Alpine Linux | `xvfb-run` |
| **`xbps`** | `xbps-install` | Void Linux | `xvfb` |

**Note**: Xvfb is not available on CentOS Stream 10 / RHEL 10+ (Wayland-only distributions).

## Retry Mechanism

The package includes automatic retry functionality for handling display server failures:

### Progressive Delay Strategy

Retry delays increase progressively:
- Attempt 1: Immediate execution
- Attempt 2: Wait `retryDelay × 1` ms (default: 1000ms)
- Attempt 3: Wait `retryDelay × 2` ms (default: 2000ms)
- Attempt N: Wait `retryDelay × (N-1)` ms

### Usage Example

```js
import { DisplayServerManager } from '@wdio/display-server';

const manager = new DisplayServerManager({
    maxRetries: 5,
    retryDelay: 1500
});

// Automatic retry on display server failures
const result = await manager.executeWithRetry(async () => {
    return await runHeadlessTests();
}, 'Running headless tests');
```

## Environment Variables

### Wayland

When Wayland is active, the following environment variables are set:

```bash
WAYLAND_DISPLAY=wayland-1
XDG_RUNTIME_DIR=/tmp/wdio-wayland-{pid}
ELECTRON_OZONE_PLATFORM_HINT=wayland
```

### Xvfb

When Xvfb is active:

```bash
DISPLAY=:99
```

## Chrome/Edge Wayland Support

When Wayland is active, the package automatically injects Chrome flags:

```bash
--ozone-platform=wayland --enable-features=UseOzonePlatform
```

This enables Chrome/Edge to run under Weston headless.

## WebDriverIO Configuration

### Minimal Configuration

No configuration needed - handled automatically:

```js
export const config = {
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['--headless', '--no-sandbox']
        }
    }],
    services: ['chromedriver']
};
```

### Advanced Configuration

```js
export const config = {
    // Display server selection
    displayServer: 'auto',         // 'auto' | 'wayland' | 'xvfb' (default: 'auto')

    // Auto-install options
    autoInstall: false,            // Enable automatic installation (default: false)
    autoInstallMode: 'sudo',       // 'root' | 'sudo' (default: 'sudo')
    autoInstallCommand: undefined, // Custom install command

    // Retry settings
    maxRetries: 3,                 // Max retry attempts (default: 3)
    retryDelay: 1000,             // Base delay in ms (default: 1000)

    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['--headless', '--no-sandbox']
        }
    }]
};
```

### Legacy Options (Backward Compatible)

The following options are still supported (deprecated):

```js
export const config = {
    autoXvfb: true,           // → maps to 'enabled'
    xvfbAutoInstall: false,   // → maps to 'autoInstall'
    xvfbAutoInstallMode: 'sudo', // → maps to 'autoInstallMode'
    xvfbAutoInstallCommand: undefined, // → maps to 'autoInstallCommand'
    xvfbMaxRetries: 3,       // → maps to 'maxRetries'
    xvfbRetryDelay: 1000      // → maps to 'retryDelay'
};
```

## Examples

### Custom Integration

```js
import { DisplayServerManager } from "@wdio/display-server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runTests() {
    const manager = new DisplayServerManager({
        displayServer: 'auto',
        autoInstall: true
    });

    const ready = await manager.init();
    const server = manager.getDisplayServer();

    if (server) {
        const wrapper = server.getProcessWrapper();
        if (wrapper) {
            // Run command with display server
            const command = [...wrapper, 'node', 'test-runner.js'].join(' ');
            await execAsync(command);
        } else {
            await execAsync('node test-runner.js');
        }
    }
}
```

### Force Wayland Only

```js
import { DisplayServerManager } from "@wdio/display-server";

const manager = new DisplayServerManager({
    displayServer: 'wayland'
});

const ready = await manager.init();
if (!ready) {
    throw new Error("Wayland not available and cannot be installed");
}
```

## Logging

The utility uses `@wdio/logger` with the namespace `@wdio/display-server`. Enable debug logging:

```bash
DEBUG=@wdio/display-server npm run test
```

## CentOS Stream 10 / RHEL 10+ Support

CentOS Stream 10 and RHEL 10+ do not include Xvfb in their repositories due to the Wayland transition. This package:

1. **Detects CentOS Stream 10** automatically
2. **Skips Xvfb** availability checks
3. **Uses Wayland exclusively** on these distributions
4. **Installs Weston** from EPEL repository if not present

Example CentOS Stream 10 setup:

```bash
# Enable CRB and EPEL for Weston
sudo dnf config-manager --set-enabled crb
sudo dnf install -y epel-release
sudo dnf install -y weston
```

## License

MIT
