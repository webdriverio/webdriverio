---
id: arm64-chromedriver
title: Chromedriver on ARM64
---

WebdriverIO sets up Chromedriver automatically on ARM64. On **Windows ARM** it just works with no configuration: Chrome for Testing publishes no `win-arm64` Chromedriver, but its `win64` (x64) Chromedriver runs under Windows' transparent [x64 emulation](https://learn.microsoft.com/en-us/windows/arm/apps-on-arm-x86-emulation) and drives native ARM64 Chrome. On **Linux ARM** there is one case that can need your attention, covered below.

## Linux ARM64

Chrome for Testing builds `linux-arm64` Chromedriver from Chromium build **`153.0.8001.0`** onward (in the Beta/Dev/Canary channels now; not yet Stable). On those milestones WebdriverIO uses it directly. Below that floor it falls back to the Chromedriver bundled in a matching [Electron release](https://github.com/electron/electron/releases), the only version-pinned ARM64 Chromedriver available on demand.

### When no matching driver exists

ChromeDriver needs its first three version components (`major.minor.build`) to match Chrome. Electron only ships Chromedrivers for the specific Chromium builds it released, which don't always include your Chrome's build. When neither Chrome for Testing nor an Electron release has a match, WebdriverIO fails with a clear error rather than installing a mismatched driver (which breaks sessions in confusing ways). To resolve it:

- **Use Chrome/Chromium ≥ `153.0.8001.0`** so Chrome for Testing serves the driver directly. This is the durable fix as that floor reaches Stable.
- **Use your distribution's Chromium and driver**, a matched arm64 pair:
  ```bash
  sudo apt-get install -y chromium chromium-driver
  ```
  ```ts
  capabilities: [{
      browserName: 'chrome',
      'goog:chromeOptions': { binary: '/usr/bin/chromium' },
      'wdio:chromedriverOptions': { binary: '/usr/bin/chromedriver' }
  }]
  ```
- **Pin to a covered version** with `wdio:electronVersion`, which sources the driver from that Electron release.
- **Bring your own Chromedriver** with `wdio:chromedriverOptions.binary`, which disables the download entirely.

## Electron apps

`wdio:electronVersion` downloads the Chromedriver bundled with a given Electron release, on both Linux and Windows ARM64. For an Electron app, whose Chromium is an Electron-shipped build by construction, this is an exact match. See [Capabilities](capabilities) for details.
