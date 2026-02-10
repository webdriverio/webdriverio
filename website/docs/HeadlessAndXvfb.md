---
id: headless-and-display-servers
title: Headless & Display Servers
description: How WebdriverIO uses display servers (Wayland and Xvfb) for headless testing on Linux, configuration options, CI recipes, and troubleshooting.
---

This page explains how the WebdriverIO testrunner supports headless execution on Linux using display servers (Wayland and Xvfb). It covers when display servers are useful, how to configure them, automatic selection logic, and CI/Docker recipes.

## Display Server Overview

WebdriverIO supports two display servers for headless testing on Linux:

1. **Wayland** - Modern display protocol, default on most new Linux distributions
2. **Xvfb** (X Virtual Framebuffer) - Traditional X11 display server, for backward compatibility

By default, WebdriverIO uses an intelligent selection strategy:
- **'auto'** (default): Try Wayland first, fall back to Xvfb if Wayland is unavailable
- **'wayland'**: Force Wayland only (recommended for modern systems)
- **'xvfb'**: Force Xvfb only (for legacy systems or when X11 is required)

### When to use a display server vs native headless

- Use **native headless** (e.g., Chrome `--headless=...`) when possible for minimal overhead.
- Use a **display server** (Wayland/Xvfb) when:
  - Testing Electron or apps that require a window manager or desktop environment
  - You rely on GLX or window-manager dependent behaviors
  - Your tooling expects a display server (`DISPLAY` or `WAYLAND_DISPLAY`)
  - You run into Chromium errors such as:
    - `session not created: probably user data directory is already in use ...`
    - `Chrome failed to start: exited abnormally. (DevToolsActivePort file doesn't exist)`
  - The user data directory collision error can be misleading as it is often the result of a browser crash and immediate restart that reuses the same profile directory from the prior instance. Ensuring a stable display (e.g., via Wayland or Xvfb) often resolves it - if not, you should pass a unique `--user-data-dir` per worker.

## Configuration

### New Configuration Options (Recommended)

WebdriverIO now supports new, cleaner configuration options:

- **`enabled`** (boolean, default: true)
  - Authoritative toggle for display server usage. If `false`, the runner never uses a display server.
  - If `true`, the runner may use Wayland or Xvfb when needed.

- **`displayServer`** ('auto' | 'wayland' | 'xvfb', default: 'auto')
  - 'auto': Try Wayland first, then Xvfb fallback
  - 'wayland': Force Wayland only
  - 'xvfb': Force Xvfb only

- **`autoInstall`** (boolean, default: false)
  - Enable automatic installation of display server packages if missing
  - When false, the runner will warn and continue without installing

- **`autoInstallMode`** ('root' | 'sudo', default: 'sudo')
  - 'root': install only if running as root (no sudo)
  - 'sudo': allow non-interactive sudo (`sudo -n`) if not root; skip if sudo missing

- **`autoInstallCommand`** (string | string[], optional)
  - Custom command to use for installation instead of built-in package manager detection
  - When provided, this command is executed as-is and overrides the built-in installation logic

- **`maxRetries`** (number, default: 3)
  - Number of retry attempts for display server startup failures
  - Useful for flaky CI environments where display server startup may occasionally fail

- **`retryDelay`** (number, default: 1000)
  - Base delay between retries in milliseconds for display server failures
  - Uses progressive delay: delay × attempt number (e.g., 1000ms, 2000ms, 3000ms, etc.)

### Legacy Configuration Options (Deprecated)

The following options are deprecated but still supported for backward compatibility:

- `autoXvfb` → Use `enabled` instead
- `xvfbAutoInstall` → Use `autoInstall` instead
- `xvfbAutoInstallMode` → Use `autoInstallMode` instead
- `xvfbAutoInstallCommand` → Use `autoInstallCommand` instead
- `xvfbMaxRetries` → Use `maxRetries` instead
- `xvfbRetryDelay` → Use `retryDelay` instead

Using legacy options will log deprecation warnings. Please update to new options.

### Configuration Examples

#### Automatic Wayland/Xvfb selection (recommended)

```ts
export const config: WebdriverIO.Config = {
  // Enable automatic display server selection (Wayland first, then Xvfb)
  enabled: true,
  displayServer: 'auto', // This is the default

  // Auto-install display server packages using sudo
  autoInstall: true,
  autoInstallMode: 'sudo',

  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox'] }
  }]
}
```

#### Force Wayland only

```ts
export const config: WebdriverIO.Config = {
  // Force Wayland only (modern systems)
  enabled: true,
  displayServer: 'wayland',

  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox'] }
  }]
}
```

#### Force Xvfb only (legacy systems)

```ts
export const config: WebdriverIO.Config = {
  // Force Xvfb only (legacy systems or when X11 is required)
  enabled: true,
  displayServer: 'xvfb',

  // Auto-install Xvfb packages using sudo
  autoInstall: true,
  autoInstallMode: 'sudo',

  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox'] }
  }]
}
```

#### Custom retry behavior for flaky CI

```ts
export const config: WebdriverIO.Config = {
  enabled: true,
  displayServer: 'auto',

  // Auto-install display server packages using sudo
  autoInstall: true,
  autoInstallMode: 'sudo',

  // Configure retry behavior for flaky CI environments
  maxRetries: 5,
  retryDelay: 1500,

  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox'] }
  }]
}
```

#### Custom installation command

```ts
export const config: WebdriverIO.Config = {
  enabled: true,
  displayServer: 'auto',

  // Custom installation command
  autoInstall: true,
  autoInstallMode: 'sudo',
  autoInstallCommand: 'curl -L https://example.com/install-display-server.sh | bash',

  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox'] }
  }]
}
```

## Automatic Selection Logic

The runner uses intelligent display server detection:

1. **Linux Detection**: Checks if running on Linux
2. **Display Server Check**:
   - If `displayServer: 'wayland'`: Checks for Wayland availability
   - If `displayServer: 'xvfb'`: Checks for Xvfb availability
   - If `displayServer: 'auto'`: Checks Wayland first, falls back to Xvfb
3. **Environment Variables**:
   - If `DISPLAY` is set: Honors existing X11 server (unless `displayServer: 'wayland'`)
   - If `WAYLAND_DISPLAY` is set: Honors existing Wayland compositor
4. **Browser Headless Mode**: Automatically triggers display server when headless browser flags are detected

### Detection Flow

```
Linux + No DISPLAY + Headless Browser
    ↓
displayServer: 'auto'
    ↓
Wayland available? → Yes → Use Wayland
    ↓ No
Xvfb available? → Yes → Use Xvfb
    ↓ No
Continue without display server (may fail)
```

## CentOS Stream 10 / RHEL 10+ Considerations

CentOS Stream 10 and RHEL 10+ do not support Xvfb (X11). On these systems:

- `displayServer: 'auto'` will automatically use Wayland only
- `displayServer: 'xvfb'` will fail with an appropriate error message
- Use `displayServer: 'wayland'` for best compatibility

## Using an existing DISPLAY/WAYLAND_DISPLAY in CI

If your CI sets up its own display server:

- Leave `enabled: true` and ensure `DISPLAY` or `WAYLAND_DISPLAY` is exported; the runner will honor it
- Or set `enabled: false` to explicitly disable any display server behavior from the runner

## CI and Docker recipes

### GitHub Actions (native headless)

```yaml
- name: Run tests
  run: npx wdio run ./wdio.conf.ts
```

### GitHub Actions (with automatic display server)

```ts
// wdio.conf.ts
export const config = {
  enabled: true,
  displayServer: 'auto',
  autoInstall: true
}
```

### Docker (Ubuntu/Debian - Wayland + Xvfb)

```Dockerfile
# Install Wayland support
RUN apt-get update -qq && apt-get install -y \
    weston \
    wayland-utils \
    xvfb \
    x11-utils
```

### Docker (Fedora/RHEL - Wayland + Xvfb)

```Dockerfile
# Install Wayland support
RUN dnf install -y \
    weston \
    wayland-utils \
    xorg-x11-server-Xvfb \
    xorg-x11-utils
```

### Docker (Alpine - Wayland + Xvfb)

```Dockerfile
# Install Wayland support
RUN apk add --no-cache \
    wayland \
    weston \
    xvfb-run \
    x11-utils
```

### Docker (Arch Linux - Wayland + Xvfb)

```Dockerfile
# Install Wayland support
RUN pacman -Sy --noconfirm \
    weston \
    wayland \
    xorg-server-xvfb \
    xorg-utils
```

## Automatic Installation Support

When `autoInstall` is enabled, WebdriverIO attempts to install display server packages using your system package manager.

### Wayland Packages

| Package Manager | Command         | Distributions (examples)                                       | Package Name(s)                 |
|-----------------|-----------------|---------------------------------------------------------------|----------------------------------|
| apt             | `apt-get`       | Ubuntu, Debian, Pop!_OS, Mint, Elementary, Zorin, etc.        | `weston`, `wayland-utils`        |
| dnf             | `dnf`           | Fedora, Rocky Linux, AlmaLinux, Nobara, Bazzite, etc.          | `weston`, `wayland-utils`        |
| yum             | `yum`           | CentOS, RHEL (legacy)                                          | `weston`, `wayland-utils`        |
| zypper          | `zypper`        | openSUSE, SUSE Linux Enterprise                               | `weston`, `wayland`              |
| pacman          | `pacman`        | Arch Linux, Manjaro, EndeavourOS, CachyOS, etc.               | `weston`, `wayland`              |
| apk             | `apk`           | Alpine Linux, PostmarketOS                                     | `wayland`, `weston`              |
| xbps-install    | `xbps-install`  | Void Linux                                                    | `weston`, `wayland`              |

### Xvfb Packages

| Package Manager | Command         | Distributions (examples)                                       | Package Name(s)                 |
|-----------------|-----------------|---------------------------------------------------------------|----------------------------------|
| apt             | `apt-get`       | Ubuntu, Debian, Pop!_OS, Mint, Elementary, Zorin, etc.          | `xvfb`                           |
| dnf             | `dnf`           | Fedora, Rocky Linux, AlmaLinux, Nobara, Bazzite, etc.          | `xorg-x11-server-Xvfb`           |
| yum             | `yum`           | CentOS, RHEL (legacy)                                          | `xorg-x11-server-Xvfb`           |
| zypper          | `zypper`        | openSUSE, SUSE Linux Enterprise                               | `xvfb-run`                       |
| pacman          | `pacman`        | Arch Linux, Manjaro, EndeavourOS, CachyOS, etc.                | `xorg-server-xvfb`               |
| apk             | `apk`           | Alpine Linux, PostmarketOS                                     | `xvfb-run`                       |
| xbps-install    | `xbps-install`  | Void Linux                                                    | `xvfb`                           |

Notes:
- If your environment uses a different package manager, the install will fail with an error; install manually.
- Package names are distro-specific; the table reflects the common names per family.
- Built-in package installs are always non-interactive.

## Troubleshooting

### Common Issues

#### "Display server failed to start"

- The runner automatically retries display server failures with progressive backoff
- If failures persist, increase `maxRetries` and `retryDelay` for flaky environments
- Check that required packages are installed (use `autoInstall: true` or install manually)
- For Xvfb issues: ensure no other X server is using the same display number
- For Wayland issues: ensure `WAYLAND_DISPLAY` is not already in use by another compositor

#### Display server wrapped unexpectedly in CI

- If you have a custom `DISPLAY` or `WAYLAND_DISPLAY` setup, set `enabled: false` or ensure the environment variable is exported before the runner starts
- Check for conflicting display server configurations in your CI environment

#### Missing display server packages

- Keep `autoInstall: false` to avoid modifying the environment; install via your base image
- Or set `autoInstall: true` to opt in to automatic installation
- Manually install the required packages using your distribution's package manager

#### CentOS Stream 10 / RHEL 10+ specific issues

- These distributions do not support Xvfb
- Use `displayServer: 'wayland'` or `displayServer: 'auto'`
- Install Wayland packages: `dnf install weston wayland-utils`

#### Frequent display server startup failures in CI

- Increase `maxRetries` (e.g., to 5-10) and `retryDelay` (e.g., to 2000ms) for more resilient behavior
- Consider using `displayServer: 'wayland'` if your CI environment has a Wayland compositor available
- Check CI resource constraints; display servers need adequate memory and CPU

### Debugging Tips

1. **Enable verbose logging**:
   ```ts
   export const config = {
     logLevel: 'debug',
     enabled: true,
     displayServer: 'auto'
   }
   ```

2. **Check display server availability**:
   ```bash
   # Check for Wayland
   which weston
   echo $WAYLAND_DISPLAY

   # Check for Xvfb
   which xvfb-run
   echo $DISPLAY
   ```

3. **Manual display server test**:
   ```bash
   # Test Wayland
   weston --version

   # Test Xvfb
   xvfb-run --version
   xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" echo "Xvfb works"
   ```

## Advanced

### How it works

1. **Display Server Manager**: A central manager handles display server lifecycle:
   - Checks availability of Wayland and Xvfb
   - Automatically selects the best option based on configuration
   - Handles installation of missing packages (when enabled)
   - Manages startup retries with progressive backoff

2. **Process Wrapping**: The runner creates processes via a factory that wraps the node worker:
   - Wayland: Uses Weston or native Wayland compositor
   - Xvfb: Uses `xvfb-run` wrapper

3. **Browser Integration**: Headless browser flags (Chrome/Edge/Firefox) signal headless usage and can trigger display server in environments without `DISPLAY` or `WAYLAND_DISPLAY`.

### Environment Variables

The display server sets up the following environment variables for child processes:

- **Wayland**: `WAYLAND_DISPLAY` (e.g., `wayland-0`)
- **Xvfb**: `DISPLAY` (e.g., `:99`)
- Both: Sets appropriate `GDK_BACKEND`, `QT_QPA_PLATFORM`, and other toolkit-specific variables

### Performance Considerations

- **Wayland**: Generally faster and more modern, recommended for new systems
- **Xvfb**: Slightly more overhead due to X11 emulation, but wider compatibility
- For minimal overhead, consider using native headless mode when display server features aren't needed

### Security Considerations

- Display servers run with user-level privileges
- Xvfb: No network exposure, runs locally only
- Wayland: More secure than X11, better sandboxing support
- Both are suitable for CI environments without network exposure to the display
