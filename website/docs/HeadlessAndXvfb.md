---
id: headless-and-xvfb
title: Headless & Xvfb with the Testrunner
description: How WebdriverIO uses Xvfb for headless testing on Linux, configuration options, CI recipes, and troubleshooting.
---

This page explains how the WebdriverIO testrunner supports headless execution on Linux using Xvfb (X Virtual Framebuffer). It covers when Xvfb is useful, how to configure it, and how it behaves in CI and Docker.

## When to use Xvfb vs native headless

- Use native headless (e.g., Chrome `--headless=...`) when possible for minimal overhead.
- Use Xvfb when:
  - Testing Electron or apps that require a window manager or desktop environment
  - You rely on GLX or window-manager dependent behaviors
  - Your tooling expects a display server (`DISPLAY`)
  - You run into Chromium errors such as:
    - `session not created: probably user data directory is already in use ...`
    - `Chrome failed to start: exited abnormally. (DevToolsActivePort file doesn't exist)`
    The user data directory collision error can be misleading as it is often the result of a browser crash and immediate restart that reuses the same profile directory from the prior instance. Ensuring a stable display (e.g., via Xvfb) often resolves it - if not, you should pass a unique `--user-data-dir` per worker.

## Configuration

Two runner options control Xvfb behavior:

- `autoXvfb` (boolean, default: true)
  - Authoritative toggle for usage. If `false`, the runner never uses Xvfb.
  - If `true`, the runner may use Xvfb when needed.

- `xvfbAutoInstall` (boolean, default: false)
  - Opt-in package installation. If `true` and `xvfb-run` is missing, the runner attempts to install it via the system package manager.
  - If `false` and `xvfb-run` is missing, the runner warns and continues without Xvfb.

Example:

```ts
export const config: WebdriverIO.Config = {
  // Use Xvfb when needed
  autoXvfb: true,

  // Do not auto-install OS packages by default
  xvfbAutoInstall: false,

  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox'] }
  }]
}
```

## Detection logic

- The runner considers Xvfb when:

  - Running on Linux
  - No `DISPLAY` is set (headless environment), or headless browser flags are passed

- If `DISPLAY` is set, the runner won’t force Xvfb by default and will honor your existing X server/window manager.

Notes:
- `autoXvfb: false` disables Xvfb usage entirely (no wrapping with `xvfb-run`).
- `xvfbAutoInstall` only affects installation if `xvfb-run` is missing; it does not turn usage on/off.

## Using an existing DISPLAY in CI

If your CI sets up its own X server/window manager (e.g., with `Xvfb :99` and a WM), either:

- Leave `autoXvfb: true` and ensure `DISPLAY` is exported; the runner will honor it and avoid wrapping.
- Or set `autoXvfb: false` to explicitly disable any Xvfb behavior from the runner.

## CI and Docker recipes

GitHub Actions (using native headless):

```yaml
- name: Run tests
  run: npx wdio run ./wdio.conf.ts
```

GitHub Actions (virtual display via Xvfb if missing and opted in):

```ts
// wdio.conf.ts
export const config = {
  autoXvfb: true,
  xvfbAutoInstall: true
}
```

Docker (Ubuntu/Debian example – preinstall xvfb to avoid auto-install):

```Dockerfile
RUN apt-get update -qq && apt-get install -y xvfb
```

For other distributions, adjust the package manager and package name accordingly (e.g., `dnf install xorg-x11-server-Xvfb` on Fedora/RHEL-based, `zypper install xvfb` on openSUSE/SLE).

## Automatic installation support (xvfbAutoInstall)

When `xvfbAutoInstall: true` is enabled, WebdriverIO attempts to install `xvfb` using your system package manager. The following managers and packages are supported:

| Package Manager | Command         | Distributions (examples)                                   | Package Name(s)                 |
|-----------------|-----------------|-------------------------------------------------------------|----------------------------------|
| apt             | `apt-get`       | Ubuntu, Debian, Pop!_OS, Mint, Elementary, Zorin, etc.     | `xvfb`                           |
| dnf             | `dnf`           | Fedora, Rocky Linux, AlmaLinux, Nobara, Bazzite, etc.       | `xorg-x11-server-Xvfb`           |
| yum             | `yum`           | CentOS, RHEL (legacy)                                       | `xorg-x11-server-Xvfb`           |
| zypper          | `zypper`        | openSUSE, SUSE Linux Enterprise                             | `xvfb-run`                       |
| pacman          | `pacman`        | Arch Linux, Manjaro, EndeavourOS, CachyOS, etc.             | `xorg-server-xvfb`               |
| apk             | `apk`           | Alpine Linux, PostmarketOS                                  | `xvfb-run`                       |
| xbps-install    | `xbps-install`  | Void Linux                                                  | `xvfb`                           |

Notes:
- If your environment uses a different package manager, the install will fail with an error; install `xvfb` manually.
- Package names are distro-specific; the table reflects the common names per family.

## Troubleshooting

- “xvfb-run failed to start”
  - The runner retries Xvfb-related failures with backoff. Ensure sufficient system packages are present (e.g., `xorg-x11-server-Xvfb` on RPM-based distros).

- Xvfb wrapped unexpectedly in CI
  - If you have a custom `DISPLAY` / WM setup, set `autoXvfb: false` or ensure `DISPLAY` is exported before the runner starts.

- Missing `xvfb-run`
  - Keep `xvfbAutoInstall: false` to avoid modifying the environment; install via your base image or set `xvfbAutoInstall: true` to opt in.

## Advanced

- The runner creates processes via a factory that may wrap the node worker with `xvfb-run` if Xvfb is needed and available.
- Headless browser flags (Chrome/Edge/Firefox) signal headless usage and can trigger Xvfb in environments without a `DISPLAY`.

