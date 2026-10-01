---
id: headless-and-display-servers
title: Headless & Display Servers
description: Run headed browsers and desktop apps on Linux CI and in containers with the Weston or Xvfb virtual display that the testrunner starts, including its options, CI recipes and troubleshooting.
---

On Linux, when no display is available, the testrunner starts a virtual display server for the run: [Weston](https://gitlab.freedesktop.org/wayland/weston) in headless mode, or [Xvfb](https://xorg.freedesktop.org/archive/current/doc/man/man1/Xvfb.1.xhtml) (X Virtual Framebuffer) as a fallback. This page covers when that happens, how to configure it, and how it behaves in CI and Docker. In most setups, all you need is Weston or Xvfb installed in your image, or `displayServerAutoInstall: true` in your config.

## When to use a virtual display vs native headless

The virtual display gives browsers and apps a screen where there is none, such as on CI runners and in containers. Keep it when:

- You test desktop apps, which need a real window.
- Your tests need a headed browser, for example to match screenshot baselines taken with a visible browser.
- Chrome fails to start with `DevToolsActivePort file doesn't exist` or `user data directory is already in use`, as described in [Troubleshooting](#troubleshooting).

For browser tests that don't need a visible window, native headless mode, such as Chrome's `--headless=new`, has less overhead. Set `displayServerEnabled: false` with it, or the testrunner still starts a display server. Do the same when all your browsers run on a cloud service or a remote grid, since nothing local needs a display.

## How it works

The testrunner starts one display server before any service's `onPrepare` hook and sets its environment on `process.env`:

| Variable | Weston | Xvfb |
|----------|--------|------|
| `WAYLAND_DISPLAY` | `wayland-0` | not set |
| `DISPLAY` | not set | the first free display, such as `:0` |
| `XDG_RUNTIME_DIR` | a private directory under `/tmp` for the run | unchanged |
| `XDG_SESSION_TYPE`, `GDK_BACKEND`, `ELECTRON_OZONE_PLATFORM_HINT` | `wayland` | `x11` |

Workers inherit these variables, and so do drivers and apps that services start in `onPrepare`. Browsers and GUI toolkits pick Wayland or X11 from them. Under Weston, the private `XDG_RUNTIME_DIR` replaces any value you had for the run.

The display server keeps running until the `onComplete` hooks finish, so services can still use it while they tear down. The testrunner then stops it and restores the previous values. If the process exits earlier, including on Ctrl+C, the display server is killed with it.

The testrunner only starts a display server when all of these are true:

- It runs on Linux.
- Neither `DISPLAY` nor `WAYLAND_DISPLAY` is set.
- `displayServerEnabled` is not `false`.

If a display already exists, the testrunner uses it and starts nothing. With only `WAYLAND_DISPLAY` set, for example by a Weston your CI starts, the testrunner still sets `XDG_SESSION_TYPE`, `GDK_BACKEND` and `ELECTRON_OZONE_PLATFORM_HINT` to `wayland` for the run. This ensures browsers use the correct display by overriding inherited values, such as `XDG_SESSION_TYPE=tty` from an SSH login, that would send them to X11, where there is no server. It does this even with `displayServerEnabled: false`, which only controls whether a display server starts.

### Which display server is used

With the default `displayServer: 'auto'`, the testrunner tries Weston first and Xvfb second. Installed servers are tried before anything is installed, so an existing Xvfb is used instead of installing Weston. If Weston fails to start, the testrunner falls back to Xvfb. If no display server starts, the testrunner logs a warning and the run continues without one. With `displayServer: 'wayland'` or `displayServer: 'xvfb'`, the testrunner only tries that server.

Weston 10 and later are supported. Ubuntu 22.04 and Debian 11 ship Weston 9, and Enterprise Linux 9 with EPEL enabled gets Weston 8, so set `displayServer: 'xvfb'` there. Weston starts without Xwayland, so it provides no `DISPLAY`. If your tests or tools need X11, for example `xdotool`, `xclip` or a Java app, set `displayServer: 'xvfb'`.

### Window focus

All workers use the same display. In WebdriverIO v9, each worker was wrapped in `xvfb-run` and got a display of its own, so its browser always had focus. Chromium-based browsers such as Chrome and Edge can now lack focus: under Weston no window gets focus, and under Xvfb only the most recently opened window has it. WebDriver input still reaches the page, but `document.hasFocus()` returns `false`, `focus` events don't fire and `:focus` styles don't apply. If your tests depend on focus, turn on focus emulation, an experimental Chrome DevTools Protocol (CDP) command that persists across page loads:

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    // ...
    before: async () => {
        if (browser.isChromium) {
            await browser.sendCommandAndGetResult('Emulation.setFocusEmulationEnabled', { enabled: true })
        }
    }
}
```

Firefox isn't affected, since under WebDriver it treats its pages as focused.

### Standalone scripts

The testrunner starts the display server itself. A standalone script that calls `remote()` can start one with `startDisplayDaemonFromConfig` from `@wdio/display-server`. It takes the same `displayServer*` options, sets the display's variables on `process.env` so the browser inherits them, and restores them on `stop()`:

```ts title="standalone.ts"
import { remote } from 'webdriverio'
import { startDisplayDaemonFromConfig } from '@wdio/display-server'

// null off Linux, when an X11 display already exists, or when none starts. With an existing
// Wayland display, it returns a handle whose stop() restores the session variables it set.
const display = await startDisplayDaemonFromConfig({ displayServerAutoInstall: true })
try {
    const browser = await remote({ capabilities: { browserName: 'chrome' } })
    // ...
    await browser.deleteSession()
} finally {
    await display?.stop()
}
```

You can also run the script under `xvfb-run`, as in [Using an existing display](#using-an-existing-display).

## Browser setup

### Browsers WebdriverIO launches

These browsers need no configuration:

- Chrome and Edge 140 and later, and Chrome for Testing 135 and later, follow the `XDG_SESSION_TYPE=wayland` that the display server sets.
- Older Chrome and Edge ignore `XDG_SESSION_TYPE`. For them, WebdriverIO adds `--ozone-platform=wayland` to the args of every Chrome and Edge it launches while Wayland is up without an X server, unless the args already set `--ozone-platform` or `--headless`.
- Electron apps: Electron 38 and later follow `XDG_SESSION_TYPE`, and Electron 28 to 37 follow `ELECTRON_OZONE_PLATFORM_HINT`, which the display server also sets. Electron 27 and earlier rely on the `--ozone-platform=wayland` flag, which WebdriverIO adds when it starts the app through Chromedriver.
- Firefox and GTK apps, such as Tauri apps, pick Wayland from `WAYLAND_DISPLAY` and `GDK_BACKEND`. Firefox before 120 is untested.

### Browsers WebdriverIO doesn't launch

Browsers on a grid or cloud service need no configuration, since they run on the remote host's display.

Local browsers that something else launches, such as a driver you started, an Appium server or a service's own launcher, don't get WebdriverIO's `--ozone-platform=wayland` flag. Chrome and Edge 140 and later, and Electron 28 and later, don't need it, since they follow the session variables, but older Chrome and Edge do. What to do depends on when the browser starts:

- **During the run**, for example from a service's `onPrepare`, newer browsers need nothing, since they inherit the display and the session variables. For older Chrome and Edge, either:
  - set `displayServer: 'xvfb'` to use Xvfb, or
  - set `displayServer: 'wayland'` and add `--ozone-platform=wayland` to their args to use Weston.
- **Before WebdriverIO**, for example from an earlier CI step or another shell, they can't use a display server that WebdriverIO starts, since they don't inherit its variables. Start the display yourself, as in [Using an existing display](#using-an-existing-display), and either:
  - use Xvfb, which needs nothing more, or
  - use Weston, then export `XDG_SESSION_TYPE=wayland` (Chrome and Edge 140 and later, Electron 38 and later) or `ELECTRON_OZONE_PLATFORM_HINT=wayland` (Electron 28 to 37), and add `--ozone-platform=wayland` to the args of older Chrome and Edge.

## Configuration

All options are listed in the [configuration reference](/docs/configuration#displayserverenabled). For example:

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    // ...
    // Install a display server if none is installed
    displayServerAutoInstall: true
}
```

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    // ...
    // Always use Xvfb at a smaller size, installed by a custom command that assumes a root container
    displayServer: 'xvfb',
    displayServerAutoInstall: true,
    displayServerAutoInstallCommand: 'apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb',
    displayServerWidth: 1280,
    displayServerHeight: 720
}
```

The custom command is shared by both servers. With `displayServer: 'auto'`, it runs for Weston first, and again for Xvfb only if Weston still isn't available or fails to start and Xvfb is still missing. Set `displayServer` to the server your command installs, as this example does.

The v9 options `autoXvfb` and `xvfb*` are deprecated and will be removed in v11. See the [v10 migration guide](/docs/v10-migration#virtual-displays-on-linux) for their replacements.

## CI and Docker

Preinstall a display server in your image, or set `displayServerAutoInstall: true` to install one when the run starts.

### Preinstalling a display server

#### Weston

On Ubuntu 24.04 or Debian 12 and later:

```Dockerfile
RUN apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y weston
```

On RHEL 10 and Oracle Linux 10, enable EPEL and CodeReady Builder yourself, following the [EPEL documentation](https://docs.fedoraproject.org/en-US/epel/getting-started/), then install `weston`.

To wrap the testrunner in a Weston of your own, as in [Using an existing display](#using-an-existing-display), also install `xwayland-run`. It's packaged for Debian 13, Ubuntu 24.04, Fedora and openSUSE Tumbleweed. Without it, you need to start Weston in the background with its own `XDG_RUNTIME_DIR` and `WAYLAND_DISPLAY`, and wait for its socket before starting WebdriverIO. Alternatively, use Xvfb.

#### Xvfb

On Ubuntu or Debian:

```Dockerfile
RUN apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb
```

Ubuntu 22.04 and Debian 11 ship a Weston that's too old, so use Xvfb there. With only Xvfb installed, the testrunner uses it without further configuration.

For other distributions, use the package names in [Automatic installation support](#automatic-installation-support).

### Using an existing display

If your CI already provides a display, the testrunner uses it and starts nothing.

To use Weston, wrap the testrunner with `wlheadless-run` from the `xwayland-run` package. It gives Weston a private runtime directory and waits for its socket, and the flags match the Weston the testrunner starts:

```sh
wlheadless-run -c weston --renderer=pixman --idle-time=0 -- npx wdio run wdio.conf.ts
```

To use Xvfb, wrap the testrunner with `xvfb-run`:

```sh
xvfb-run -a npx wdio run wdio.conf.ts
```

## Automatic installation support

`displayServerAutoInstall` works with the package managers below. Installs are non-interactive and time out after 240 seconds. With any other package manager, install the display server yourself.

| Package manager | Distributions | Weston | Xvfb |
|-----------------|---------------|--------|------|
| `apt-get` | Ubuntu, Debian | `weston` | `xvfb` |
| `dnf` | Fedora, CentOS Stream, RHEL, Rocky Linux, AlmaLinux | `weston` | `xorg-x11-server-Xvfb` |
| `zypper` | openSUSE, SUSE Linux Enterprise | `weston` | `xvfb-run` |
| `pacman` | Arch Linux, Manjaro | `weston` | `xorg-server-xvfb` |
| `apk` | Alpine Linux | `weston` `weston-backend-headless` `weston-shell-desktop` | `xvfb-run` |
| `xbps-install` | Void Linux | `weston` | `xvfb-run` |

- On Arch Linux, the install runs `pacman -Syu`, a full system upgrade, since Arch doesn't support partial upgrades. On an outdated image this can exceed the 240-second limit, so preinstall the display server there.
- Enterprise Linux 10 has no Xvfb and ships Weston only in EPEL, which needs CRB. On CentOS Stream, AlmaLinux and Rocky Linux, the install enables both and leaves them enabled. On RHEL and Oracle Linux, set them up yourself, as in [Preinstalling a display server](#preinstalling-a-display-server).

## Logs

The display server runs in the launcher process, so its messages are in the launcher log: `wdio.log` in your `outputDir`, or the terminal if `outputDir` isn't set. The log shows which display server started and the variables it set. For more detail, raise its log level:

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    // ...
    outputDir: './logs',
    logLevels: { '@wdio/display-server': 'debug' }
}
```

## Troubleshooting

### Chrome fails with `DevToolsActivePort file doesn't exist`

The full message is `Chrome failed to start: exited abnormally. (DevToolsActivePort file doesn't exist)`. A common cause is a headed Chrome with no display to open its window on. Check the [launcher log](#logs) for the display server that started. If none did, see [The launcher log shows `No display server could be started`](#the-launcher-log-shows-no-display-server-could-be-started). If your tests don't need a visible window, use native headless mode instead, as in [When to use a virtual display vs native headless](#when-to-use-a-virtual-display-vs-native-headless).

### Chrome fails with `user data directory is already in use`

The full message starts with `session not created: probably user data directory is already in use`. It is often misleading: it usually means the browser crashed and restarted with the previous instance's profile directory. A stable display often resolves it. If not, pass a unique `--user-data-dir` per worker.

### The launcher log shows `No display server could be started`

The full message is `No display server could be started; continuing without a virtual display`. No display server is installed, or none started. The messages before it say why:

- `wayland not found. To enable auto-install, set 'displayServerAutoInstall: true' in your WDIO config.` or `xvfb not found. To enable auto-install, set 'displayServerAutoInstall: true' in your WDIO config.`: nothing is installed and auto-install is off.
- `wayland failed to start: ...` or `xvfb failed to start: ...`: the server's error output follows.
- `Failed to install Weston` or `Failed to install Xvfb`: the install failed.
- `wayland still not found after installing` or `xvfb still not found after installing`: the install succeeded but didn't provide that server, for example because a custom `displayServerAutoInstallCommand` installs only the other one. Set `displayServer` to the server your command installs.

Install Weston or Xvfb in your image, or set `displayServerAutoInstall: true`.

### Xvfb exits with `Failed to find a socket to listen on`

Xvfb creates its socket in `/tmp/.X11-unix`. If that directory exists, it must be writable by the test user, as mode `1777` is.

### Chrome or Electron fails under Weston with `Missing X server or $DISPLAY`

The browser tried X11 instead of Wayland. If WebdriverIO didn't launch it, see [Browsers WebdriverIO doesn't launch](#browsers-webdriverio-doesnt-launch). Otherwise, remove `--ozone-platform=x11` from its args.

### Focus-dependent tests fail in Chrome or Edge

`document.hasFocus()` returns `false` because pages on the shared display can lack focus. Turn on focus emulation, as in [Window focus](#window-focus).

### An X11 tool or app fails under Weston with `cannot open display` or `Can't open display`

Weston provides no `DISPLAY`. Set `displayServer: 'xvfb'` so the testrunner starts Xvfb instead. If you started Weston yourself, wrap the run with `xvfb-run`, since the testrunner uses an existing display rather than starting one.

## Next steps

- [Configuration](/docs/configuration#displayserverenabled) reference for every `displayServer*` option.
- [v10 migration guide](/docs/v10-migration#virtual-displays-on-linux) for the replacements of the v9 options `autoXvfb` and `xvfb*`.
- [Docker](/docs/docker) and [GitHub Actions](/docs/githubactions) to run your suite in CI.
- [Desktop Apps](/docs/platforms/desktop#linux) for Electron, Tauri and Dioxus on Linux.
