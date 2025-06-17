---
id: electron
title: Electron
---

Electron is a framework for building desktop applications using JavaScript, HTML, and CSS. By embedding Chromium and Node.js into its binary, Electron allows you to maintain one JavaScript codebase and create cross-platform apps that work on Windows, macOS, and Linux — no native development experience is required.

WebdriverIO provides an integrated service that simplifies the interaction with your Electron app and makes testing it very simple. The advantages of using WebdriverIO for testing Electron applications are:

- 🚗 auto-setup of required Chromedriver
- 📦 automatic path detection of your Electron application - supports [Electron Forge](https://www.electronforge.io/) and [Electron Builder](https://www.electron.build/)
- 🧩 access Electron APIs within your tests
- 🕵️ mocking of Electron APIs via a Vitest-like API

You just need a few simple steps to get started. Watch this simple step-by-step getting started video tutorial from the [WebdriverIO YouTube](https://www.youtube.com/@webdriverio) channel:

<LiteYouTubeEmbed
    id="iQNxTdWedk0"
    title="Getting Started with ElectronJS Testing in WebdriverIO"
/>

Or follow the guide in the following section.

## Getting Started

To initiate a new WebdriverIO project, run:

```sh
npm create wdio@latest ./
```

An installation wizard will guide you through the process. Ensure you select _"Desktop Testing - of Electron Applications"_ when it asks you what type of testing you'd like to do. Afterwards provide the path to your compiled Electron application, e.g. `./dist`, then just keep the defaults or modify based on your preference.

The configuration wizard will install all required packages and create a `wdio.conf.js` or `wdio.conf.ts` with the necessary configuration to test your application. If you agree to autogenerate some test files you can run your first test via `npm run wdio`.

## Manual Setup

If you are already using WebdriverIO in your project you can skip the installation wizard and just add the following dependencies:

```sh
npm install --save-dev wdio-electron-service
```

Then you can use the following configuration:

```ts reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/desktop-testing/electron.js
```

That's it 🎉

Learn more about how [to configure the Electron Service](/docs/desktop-testing/electron/configuration), [how to mock Electron APIs](/docs/desktop-testing/electron/mocking) and [how to access Electron APIs](/docs/desktop-testing/electron/api).
