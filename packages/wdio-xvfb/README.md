# @wdio/xvfb

A standalone utility to manage Xvfb (X Virtual Framebuffer) for headless testing on Linux systems.

## Installation

```bash
npm install @wdio/xvfb
```

## Usage

### Basic Usage

```js
import { xvfb } from '@wdio/xvfb'

// Start Xvfb if needed (only on Linux in headless environments)
const started = await xvfb.start()

if (started) {
    console.log(`Xvfb running on display ${xvfb.getDisplay()}`)
    
    // Your headless browser tests here...
    
    // Clean up when done
    await xvfb.stop()
}
```

### Custom Instance

```js
import XvfbManager from '@wdio/xvfb'

const manager = new XvfbManager({
    display: 42,
    screen: '1280x720x24',
    dpi: 96,
    args: ['--extension', 'GLX']
})

await manager.start()
// ... your tests
await manager.stop()
```

### Integration with @wdio/local-runner

The `@wdio/local-runner` can use this utility to ensure Xvfb is running:

```js
// In local-runner
import { xvfb } from '@wdio/xvfb'

export class LocalRunner {
    async onPrepare() {
        await xvfb.start()
    }
    
    async onComplete() {
        await xvfb.stop()
    }
}
```

## API

### XvfbManager Class

#### Constructor Options

```ts
interface XvfbOptions {
    display?: number              // Display number (default: 99)
    screen?: string              // Screen resolution (default: '1024x768x24')
    dpi?: number                 // DPI setting (default: 96)
    args?: string[]              // Additional Xvfb arguments
    force?: boolean              // Force Xvfb even on non-Linux systems
    logger?: Logger              // Custom logger instance
}
```

#### Methods

- **`shouldRun(): boolean`** - Check if Xvfb should run on this system
- **`start(): Promise<boolean>`** - Start Xvfb if needed, returns true if started
- **`stop(): Promise<void>`** - Stop Xvfb and cleanup
- **`getDisplay(): string`** - Get the current display (e.g., ':99')
- **`isXvfbRunning(): boolean`** - Check if Xvfb is currently running

### Default Instance

A default instance is exported for convenience:

```js
import { xvfb } from '@wdio/xvfb'
```

## When does it run?

The utility automatically detects when Xvfb is needed:

- ✅ Linux systems without a DISPLAY environment variable
- ✅ Linux systems in CI environments (CI, GITHUB_ACTIONS, JENKINS_URL)
- ❌ Non-Linux systems (unless `force: true`)
- ❌ Linux systems with existing DISPLAY (unless in CI)

## Features

- **Conditional execution**: Only runs on Linux systems in headless environments
- **Cross-distro support**: Works on Ubuntu, Debian, Fedora, CentOS, RHEL, SUSE, Arch, and Alpine
- **Automatic setup**: Installs required packages if not present using the appropriate package manager
- **Environment management**: Sets up proper display and desktop environment variables
- **Graceful cleanup**: Properly terminates Xvfb processes on cleanup
- **State tracking**: Prevents duplicate starts and handles multiple calls safely
- **Flexible logging**: Configurable logger support

## Environment Variables Set

When active, the utility sets these environment variables:

- `DISPLAY`: Set to `:${display}` (e.g., `:99`)
- `XDG_SESSION_TYPE`: Set to `x11`
- `XDG_CURRENT_DESKTOP`: Auto-detected based on current environment or set to generic fallback

## Supported Linux Distributions

The utility automatically detects and supports package installation on:

- **Ubuntu/Debian**: Uses `apt-get` to install `xvfb` and `x11-utils`
- **Fedora**: Uses `dnf` to install `xorg-x11-server-Xvfb` and `xorg-x11-utils`
- **CentOS/RHEL**: Uses `yum` to install `xorg-x11-server-Xvfb` and `xorg-x11-utils`
- **SUSE**: Uses `zypper` to install `xvfb` and `x11-utils`
- **Arch Linux**: Uses `pacman` to install `xorg-server-xvfb` and `xorg-xdpyinfo`
- **Alpine**: Uses `apk` to install `xvfb` and `x11vnc`

## Examples

### Electron Testing

```js
import { xvfb } from '@wdio/xvfb'
import { spawn } from 'child_process'

async function testElectronApp() {
    await xvfb.start()
    
    const electron = spawn('electron', ['./app'])
    
    // Wait for tests to complete
    await new Promise(resolve => electron.on('exit', resolve))
    
    await xvfb.stop()
}
```

### Browser Testing Setup

```js
import { xvfb } from '@wdio/xvfb'
import { Builder } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'

async function setupBrowser() {
    await xvfb.start()
    
    const options = new chrome.Options()
    if (xvfb.isXvfbRunning()) {
        options.addArguments('--no-sandbox')
        options.addArguments('--disable-dev-shm-usage')
    }
    
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build()
    
    return driver
}
```

### Custom Display Management

```js
import XvfbManager from '@wdio/xvfb'

// Multiple displays for parallel testing
const displays = [
    new XvfbManager({ display: 99 }),
    new XvfbManager({ display: 100 }),
    new XvfbManager({ display: 101 })
]

// Start all displays
await Promise.all(displays.map(d => d.start()))

// Run parallel tests on different displays...

// Cleanup all displays
await Promise.all(displays.map(d => d.stop()))
```

## Logging

The utility uses `@wdio/logger` with the namespace `@wdio/xvfb`. Enable debug logging:

```bash
DEBUG=@wdio/xvfb npm run test
```

Or provide a custom logger:

```js
import logger from '@wdio/logger'
import XvfbManager from '@wdio/xvfb'

const customLogger = logger('my-app:xvfb')
const manager = new XvfbManager({ logger: customLogger })
```

## Requirements

- Linux system (for automatic operation)
- `sudo` access for installing packages
- Node.js >= 18

## Error Handling

The utility handles common error scenarios:

- **Missing Xvfb**: Attempts automatic installation
- **Unsupported distros**: Provides clear error messages
- **Process failures**: Graceful cleanup and error reporting
- **Multiple starts**: Safe to call `start()` multiple times
- **Cleanup failures**: Best-effort cleanup with logging

## License

MIT