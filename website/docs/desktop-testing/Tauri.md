---
id: tauri
title: Tauri
---

[Tauri](https://tauri.app/) is a framework for building lightweight, secure cross-platform desktop applications using a Rust backend and the operating system's native webview. WebdriverIO's Tauri service automates the discovery, launch, and driving of Tauri apps on Windows (WebView2), macOS (WKWebView), and Linux (WebKitGTK) so the same test suite works everywhere.

The advantages of using WebdriverIO for testing Tauri applications are:

- 🚗 auto-provisioning of the WebDriver layer — choose `tauri-driver`, the CrabNebula driver, or the in-app embedded plugin
- 📦 cross-platform binary detection (Edge WebView2 driver bundled on Windows)
- 🧩 optional `@wdio/tauri-plugin` for richer in-webview integration (`browser.tauri.execute`, mocking)
- 🔗 deeplink + protocol handler testing
- 🪵 forwarding of Rust + frontend logs into the WebdriverIO test reporter

## Getting Started

To initiate a new WebdriverIO project, run:

```sh
npm create wdio@latest ./
```

When the wizard asks what type of testing you'd like to do, select _"Desktop Testing - of Electron, Tauri, or macOS Applications"_, then choose _Tauri_ at the framework prompt. The wizard will then ask which WebDriver provider you want to use (official `tauri-driver`, CrabNebula, or the embedded plugin) and whether you'd like the optional `@wdio/tauri-plugin` for richer integration.

The wizard installs the npm packages automatically and prints any required Cargo additions to stdout for you to paste into your `src-tauri/Cargo.toml`.

## Manual Setup

If you already have a WebdriverIO project, install the service:

```sh
npm install --save-dev @wdio/tauri-service
# optional: richer in-webview integration
npm install --save-dev @wdio/tauri-plugin
```

For the embedded WebDriver plugin (recommended — runs the W3C server inside your app, no external `tauri-driver` needed), add the Cargo crate to `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri-plugin-wdio-webdriver = "1"
```

…and register it in `src-tauri/src/lib.rs`:

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_wdio_webdriver::init())
    // ...
```

Then add the service to your config:

```ts
// wdio.conf.ts
export const config: WebdriverIO.Config = {
    // ...
    services: [['tauri', {
        appBinaryPath: './src-tauri/target/release/my-tauri-app',
        driverProvider: 'embedded'
    }]]
}
```

That's it 🎉

Learn more about [configuring the Tauri Service](/docs/desktop-testing/tauri/configuration), [the Tauri plugin setup](/docs/desktop-testing/tauri/plugin-setup), [platform-specific notes](/docs/desktop-testing/tauri/platform-support), and [common usage patterns](/docs/desktop-testing/tauri/usage-examples).
