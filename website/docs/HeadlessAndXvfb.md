---
id: headless-and-xvfb
title: Headless & Xvfb with the Testrunner
description: How the WebdriverIO testrunner starts a Wayland or Xvfb display server for headless testing on Linux, configuration options, CI recipes, and troubleshooting.
---

This page explains how the WebdriverIO testrunner provides a display server for headless execution on Linux. It starts Wayland (Weston headless) or Xvfb (X Virtual Framebuffer) once for the run, and every worker uses it. It covers when a display server is useful, how to configure it, and how it behaves in CI and Docker.

## When to use a display server vs native headless

- Use native headless (e.g., Chrome `--headless=...`) when possible for minimal overhead.
- Use a display server when:
  - Testing Electron or apps that require a window manager or desktop environment
  - You rely on GLX or window-manager dependent behaviors
  - Your tooling expects a display (`DISPLAY` or `WAYLAND_DISPLAY`)
  - You run into Chromium errors such as:
    - `session not created: probably user data directory is already in use ...`
    - `Chrome failed to start: exited abnormally. (DevToolsActivePort file doesn't exist)`
    The user data directory collision error can be misleading as it is often the result of a browser crash and immediate restart that reuses the same profile directory from the prior instance. Ensuring a stable display often resolves it - if not, you should pass a unique `--user-data-dir` per worker.

## How it works

- `@wdio/local-runner` starts the display server in its `initialize()` step, before any service's `onPrepare`, and stops it when the run ends. Workers, and the drivers that services start, inherit `DISPLAY` or `WAYLAND_DISPLAY` from the environment.
- It starts only on Linux, only when `displayServerEnabled` is not `false`, and only when neither `DISPLAY` nor `WAYLAND_DISPLAY` is set. An existing display is always used as is.
- In `'auto'` mode it tries Wayland first and falls back to Xvfb. Xvfb is skipped on CentOS Stream 10, which does not ship it.
- Chrome and Edge capabilities, and Electron `appArgs` when `wdio:electronServiceOptions` is set, get the `--ozone-platform` flag for the display server (plus `--enable-features=UseOzonePlatform` on Wayland). If you already pass a `--ozone-platform=` flag, none of these flags are added.
- Startup makes up to 3 attempts, with a longer delay before each retry. If every attempt fails, the run stops with the error.
- If neither Weston nor Xvfb is available, and auto-install is off or fails, the runner logs a warning and runs without a display server.

## Configuration

These runner options control the display server:

- `displayServerEnabled` (boolean, default: true)
  - Authoritative toggle. If `false`, the runner never starts a display server.

- `displayServer` ('auto' | 'wayland' | 'xvfb', default: 'auto')
  - `'auto'` tries Wayland first and falls back to Xvfb. `'wayland'` and `'xvfb'` use only that backend.

- `displayServerAutoInstall` (boolean, default: false)
  - Install the backend if it is missing.
  - When false, the runner warns and continues without installing.

- `displayServerAutoInstallMode` ('root' | 'sudo', default: 'sudo')
  - 'root': install only if running as root (no sudo)
  - 'sudo': use non-interactive sudo (`sudo -n`) if not root; without sudo, try the install unprivileged
  - Applies to the built-in package manager installs only.

- `displayServerAutoInstallCommand` (string | string[], optional)
  - Custom command to use for installation instead of built-in package manager detection. It runs as is, without `sudo` being added.
  - It runs for whichever backend is being installed, and a zero exit code counts as a successful install. In `'auto'` mode that is Wayland first, so a command that installs Xvfb needs `displayServer: 'xvfb'`.

- `displayServerWidth`, `displayServerHeight` (number, default: 1920 and 1080)
  - Screen size of the display server.

- `displayServerDepth` (number, default: 24)
  - Color depth. Xvfb only, ignored by Wayland.

Examples:

```ts
export const config: WebdriverIO.Config = {
  // Wayland first, Xvfb as a fallback
  displayServer: 'auto',

  // Auto-install the display server using sudo
  displayServerAutoInstall: true,
  displayServerAutoInstallMode: 'sudo',

  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox'] }
  }]
}
```

```ts
export const config: WebdriverIO.Config = {
  // The custom command below installs Xvfb, so keep it on Xvfb
  displayServer: 'xvfb',

  // Auto-install using a custom command, which runs as is
  displayServerAutoInstall: true,
  displayServerAutoInstallCommand: 'sudo -n apt-get install -y xvfb',

  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox'] }
  }]
}
```

## Using an existing display in CI

If your CI sets up its own display (e.g., `Xvfb :99` with a window manager, or a Wayland compositor), either:

- Export `DISPLAY` or `WAYLAND_DISPLAY` before the runner starts. The runner uses it and does not start its own display server.
- Or set `displayServerEnabled: false` to turn the runner's display server off.

Wrapping the run in `xvfb-run -a npx wdio run ./wdio.conf.ts` works the same way, since `xvfb-run` sets `DISPLAY`.

## CI and Docker recipes

GitHub Actions (using native headless):

```yaml
- name: Run tests
  run: npx wdio run ./wdio.conf.ts
```

GitHub Actions (display server installed if missing and opted in):

```ts
// wdio.conf.ts
export const config = {
  displayServerAutoInstall: true
}
```

Docker (Ubuntu/Debian example – preinstall Weston or Xvfb):

```Dockerfile
RUN apt-get update -qq && apt-get install -y weston
```

For other distributions, adjust the package manager and package name accordingly, see the table below.

## Automatic installation support (displayServerAutoInstall)

When `displayServerAutoInstall` is enabled, WebdriverIO installs the backend it is trying with your system package manager. The following managers and packages are supported:

| Package Manager | Command         | Distributions (examples)                                   | Wayland package | Xvfb package(s)                                   |
|-----------------|-----------------|-------------------------------------------------------------|-----------------|---------------------------------------------------|
| apt             | `apt-get`       | Ubuntu, Debian, Pop!_OS, Mint, Elementary, Zorin, etc.      | `weston`        | `xvfb`                                            |
| dnf             | `dnf`           | Fedora, Rocky Linux, AlmaLinux, Nobara, Bazzite, etc.       | `weston`        | `xorg-x11-server-Xvfb`, `xorg-x11-server-utils`   |
| yum             | `yum`           | CentOS, RHEL (legacy)                                       | `weston`        | `xorg-x11-server-Xvfb`, `xorg-x11-server-utils`   |
| zypper          | `zypper`        | openSUSE, SUSE Linux Enterprise                             | `weston`        | `xvfb-run`                                        |
| pacman          | `pacman`        | Arch Linux, Manjaro, EndeavourOS, CachyOS, etc.             | `weston`        | `xorg-server-xvfb`                                |
| apk             | `apk`           | Alpine Linux, PostmarketOS                                  | `weston`        | `xvfb-run`                                        |
| xbps-install    | `xbps-install`  | Void Linux                                                  | `weston`        | `xvfb-run`                                        |

Notes:
- If your environment uses a different package manager, the install fails and the run continues without a display server; install `weston` or Xvfb manually.
- Package names are distro-specific; the table reflects the common names per family.
- On CentOS Stream 10, Weston comes from EPEL. WebdriverIO does not enable CRB or EPEL for you, so enable them before installing it.

## Troubleshooting

- The display server fails to start
  - The runner tries startup up to 3 times with a growing delay. If it still fails, check the `@wdio/display-server` log output for the backend and the error.

- A display server starts unexpectedly in CI
  - If you have a custom display setup, export `DISPLAY` or `WAYLAND_DISPLAY` before the runner starts, or set `displayServerEnabled: false`.

- Neither Weston nor Xvfb is installed
  - Keep `displayServerAutoInstall: false` to avoid modifying the environment and install one via your base image, or set `displayServerAutoInstall: true` to opt in.

- A custom install command installs Xvfb, but the runner tries Wayland
  - Set `displayServer: 'xvfb'`. In `'auto'` mode the command runs for Wayland first, and a zero exit code counts as a successful install.
