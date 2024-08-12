---
title: "Introducing Major Updates to WebdriverIO's Visual Testing Module"
author: WebdriverIO Team
authorURL: https://twitter.com/webdriverio
authorImageURL: https://avatars.githubusercontent.com/u/6512473?s=400&u=69d781679fe5cda99067d8193890ad5cb7450e4a&v=4
---

We are thrilled to announce the latest update to the WebdriverIO Visual Testing module. This release brings two significant enhancements: making the Visual Testing Module a pure JS module and the introduction of a new CLI argument for automatic baseline updates.

<!-- truncate -->

### Making The Visual Testing Module a Pure JS module

One of the major changes in this update is the replacement of the [Canvas](https://github.com/Automattic/node-canvas) library with [Jimp](https://github.com/jimp-dev/jimp). This shift eliminates the need for system dependencies, which often cause issues on local machines due to missing dependencies and complicate CI/CD pipelines. By using Jimp, we have streamlined the installation and setup process, making it more straightforward, less prone to errors and more important, a **pure JS module**.

### New CLI Argument for Baseline Updates

In response to user feedback, we've introduced a new command-line argument that allows you to automatically update your baseline images. This feature simplifies the process of maintaining and updating your baseline images, ensuring your visual regression tests remain accurate and up-to-date with minimal manual intervention. By adding the argument `--update-visual-baseline` to your command your tests will be executed again and failed tests will automatically be updated.

Learn everything about WebdriverIO's visual testing capabilities in our [Visual docs](/docs/visual-testing) and join our [👁️-visual-testing](https://discord.webdriver.io) channel on Discord.

Thank you for your continued support, and we look forward to your feedback on these new features.

Happy testing!

_The WebdriverIO Team_
