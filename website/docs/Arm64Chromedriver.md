---
id: arm64-chromedriver
title: Chromedriver on ARM64
description: How WebdriverIO sets up Chromedriver on ARM64 macOS, Windows and Linux, and what to do when no matching Linux ARM64 driver exists.
---

WebdriverIO sets up Chromedriver automatically on ARM64. On **macOS** (Apple silicon), Chrome for Testing publishes a native `mac-arm64` Chromedriver for every version, so there's nothing to set up. On **Windows 11 on Arm** it also works with no configuration: Chrome for Testing publishes no `win-arm64` Chromedriver, but its `win64` (x64) Chromedriver runs under Windows' transparent [x64 emulation](https://learn.microsoft.com/en-us/windows/arm/apps-on-arm-x86-emulation) and drives both an installed ARM64 Chrome and the x64 Chrome for Testing browser WebdriverIO downloads otherwise. On **Linux ARM64**, Chrome versions older than `153.0.8001.0` need a closer look, covered below.

## Linux ARM64

Chrome for Testing builds `linux-arm64` Chromedriver from Chrome **`153.0.8001.0`** onward, and WebdriverIO uses it directly. For an older Chrome or Chromium, such as one set as `goog:chromeOptions.binary`, it downloads the Chromedriver bundled in an [Electron release](https://github.com/electron/electron/releases) which matches the required Chromium major version. This download comes from GitHub even when `CHROMEDRIVER_CDNURL` is set, because Chrome for Testing has no `linux-arm64` Chromedriver below `153.0.8001.0` for a mirror to serve; offline, use your distribution's Chromium and driver as shown [below](#no-electron-release-ships-a-matching-chromedriver).

Chrome for Testing has no `linux-arm64` browser builds before `153.0.8001.0` either, so pin `browserVersion` below that only together with `goog:chromeOptions.binary` pointing at an ARM64 browser.

## Electron apps

`wdio:electronVersion` downloads the Chromedriver bundled with a given Electron release, on every ARM64 platform. For an Electron app, the Electron service sets it from the app's Electron version. See [Capabilities](capabilities#wdioelectronversion) for details.

## Troubleshooting

### No Electron release ships a matching Chromedriver

A few Chromium majors, such as 145, never shipped in an Electron release. WebdriverIO then fails rather than installing a mismatched driver:

```
Chrome for Testing has no linux-arm64 Chromedriver before v153.0.8001.0, and no Electron release ships one for Chrome v145.0.7632.117. See https://webdriver.io/docs/arm64-chromedriver
```

To resolve it:

- **Use Chrome/Chromium `153.0.8001.0` or later** so Chrome for Testing serves the driver directly.
- **On Debian, use its Chromium and driver**, a matched arm64 pair:
  ```bash
  sudo apt-get install -y chromium chromium-driver
  ```
  ```ts title="wdio.conf.ts"
  export const config: WebdriverIO.Config = {
      // ...
      capabilities: [{
          browserName: 'chrome',
          'goog:chromeOptions': { binary: '/usr/bin/chromium' },
          'wdio:chromedriverOptions': { binary: '/usr/bin/chromedriver' }
      }]
  }
  ```
- **Bring your own Chromedriver** with `wdio:chromedriverOptions.binary`, which disables the download entirely.

## Related

- [Driver Binaries](driverbinaries): how WebdriverIO downloads and caches browser drivers.
- [Capabilities](capabilities#wdioelectronversion): the `wdio:electronVersion` option.
