---
id: dioxus
title: Dioxus
---

[Dioxus](https://dioxuslabs.com/) is a Rust framework for building cross-platform apps from a single codebase. Its desktop apps render in the operating system's native webview (Wry), and WebdriverIO's Dioxus service automates their discovery, launch, and driving on Windows (WebView2), macOS (WKWebView), and Linux (WebKitGTK) so the same test suite works everywhere.

The advantages of using WebdriverIO for testing Dioxus applications are:

- 🚗 auto-provisioning of the WebDriver layer — the recommended embedded in-process driver needs no external driver binary on any platform
- 📦 cross-platform binary detection (Edge WebView2 driver bundled on Windows for the `external` provider)
- 🧩 `browser.dioxus.execute()`, mocking and window management, provided by the service via the `wdio-dioxus-bridge` crate
- 🔗 deeplink + protocol handler testing
- 🪵 forwarding of Rust + frontend logs into the WebdriverIO test reporter

## Getting Started

To initiate a new WebdriverIO project, run:

```sh
npm create wdio@latest ./
```

When the wizard asks what type of testing you'd like to do, select _"Desktop Testing - of Electron, Tauri, Dioxus, or macOS Applications"_, then choose _Dioxus_ at the framework prompt. The wizard will then ask which WebDriver provider you want to use (the recommended embedded in-process driver, or the Windows-only external driver) and the path to your built debug binary.

The wizard installs the npm packages automatically and prints the required Cargo additions to stdout for you to paste into your `Cargo.toml`.

## Manual Setup

If you already have a WebdriverIO project, install the service:

```sh
npm install --save-dev @wdio/dioxus-service
```

Testing requires the `wdio-dioxus-bridge` crate — it enables `browser.dioxus.execute()`, mocking, and log capture. Add it to your `Cargo.toml`:

```toml
[dependencies]
wdio-dioxus-bridge = "1"
```

…and install it into your Dioxus desktop config in `src/main.rs`. The `#[cfg(debug_assertions)]` guard keeps the bridge out of release builds:

```rust
fn main() {
    let mut config = dioxus::desktop::Config::new();

    #[cfg(debug_assertions)]
    {
        config = wdio_dioxus_bridge::install(config);
    }

    dioxus::LaunchBuilder::desktop()
        .with_cfg(config)
        .launch(App);
}
```

Build the app for testing (a debug build keeps the bridge active):

```sh
cargo build
```

Then add the service and capabilities to your config:

```ts
// wdio.conf.ts
export const config: WebdriverIO.Config = {
    // ...
    services: [['dioxus', { driverProvider: 'embedded' }]],
    capabilities: [{
        browserName: 'dioxus',
        'dioxus:options': {
            application: './target/debug/my-app'
        }
    }]
}
```

That's it 🎉

Learn more about [configuring the Dioxus Service](/docs/desktop-testing/dioxus/configuration), [the bridge setup](/docs/desktop-testing/dioxus/plugin-setup), [platform-specific notes](/docs/desktop-testing/dioxus/platform-support), and [common usage patterns](/docs/desktop-testing/dioxus/usage-examples).
