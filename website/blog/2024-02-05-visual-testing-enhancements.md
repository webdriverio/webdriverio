---
title: "Introducing Enhanced Native App Support in WebdriverIO's Visual Testing Module!"
author: Wim Selles
authorURL: http://twitter.com/wswebcreation
authorImageURL: https://avatars.githubusercontent.com/u/11979740?v=4
---

We're excited to announce an update to the Visual Testing Module with a key focus: **Native App Snapshot Testing**. Our vision has always been to provide a comprehensive, versatile testing tool that simplifies your workflow. This update is a step towards creating a 'Swiss Army Knife' for visual testing, catering to diverse requirements across platforms and extending our support to native mobile applications, making your testing process more efficient and seamless.

#### Native App Snapshot Testing

The module now supports `saveElement`, `checkElement`, `saveScreen`, and `checkScreen` methods, along with `toMatchElementSnapshot` and `toMatchScreenSnapshot` matchers for native apps. It automatically detects the testing context (web, webview, or native_app) to streamline your workflow.

#### Key Changes and Improvements

- **`resizeDimensions` Update**: Now exclusively accepts an object format.
- **Native App Context**: Methods like `saveFullPageScreen` and `checkTabbablePage` are not compatible with native mobile apps.
- **Baseline Image Handling**: `autoSaveBaseline` is now true by default, auto-creating new baselines when needed.
- **Mobile Screenshot Enhancements**: Automatically excludes OS elements like notification bars; `blockOutSideBar`, `blockOutStatusBar`, and `blockOutToolBar` are set to `true`.

#### Special Thanks to wswebcreation

We owe a big thank you to [wswebcreation](https://github.com/wswebcreation) for his work in [`wdio-native-app-compare`](https://github.com/wswebcreation/wdio-native-app-compare), which inspired this enhancement. His contribution has been vital in advancing our module's capabilities.

Thank you for your continued support, and we look forward to your feedback on these new features.

Happy testing!

*The WebdriverIO Team*
