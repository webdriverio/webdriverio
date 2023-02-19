---
id: why-webdriverio
title: Why Webdriver.IO?
---

WebdriverIO is a progressive automation framework built to automate modern web and mobile applications. It simplifies the interaction with your app and provides a set of plugins that help you create a scalable, robust and stable test suite.

It is designed to be:

- __Extendable__ - Adding helper functions, or more complicated sets and combinations of existing commands is __simple__ and __really useful__
- __Compatible__ - WebdriverIO can be run on the [WebDriver Protocol](https://w3c.github.io/webdriver/) for __true cross-browser testing__ as well as [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) for Chromium based automation using [Puppeteer](https://pptr.dev/).
- __Feature Rich__ - The huge variety of built-in and community plugins allows you to __easily integrate__ and __extend__ your setup to fulfill your requirements.

You can use WebdriverIO to automate:

- 🌐 <span>&nbsp;</span> __modern web applications__ written in React, Vue, Angular, Svelte or other frontend frameworks
- 📱 <span>&nbsp;</span> __hybrid__ or __native mobile applications__ running in an emulator/simulator or on a real device
- 💻 <span>&nbsp;</span> __native desktop applications__ (e.g. written with Electron.js)
- 📦 <span>&nbsp;</span> __unit or component testing__ of web components in the browser

## Based on Web Standards

WebdriverIO leverages the power of the [WebDriver](https://w3c.github.io/webdriver/) and [WebDriver-BiDi](https://github.com/w3c/webdriver-bidi) protocol that is developed and supported by all browser vendors and guarantees a true cross-browser testing experience. While other automation tools require you to download modified browser engines that aren't used by actual users or emulate user behavior by injecting JavaScript, WebdriverIO relies on a common agreed standard for automation that is [properly tested](https://wpt.fyi/results/webdriver/tests?label=experimental&label=master&aligned) and ensures compatibility for decades to come.

Furthermore WebdriverIO has also support for alternative, proparitary automation protocols like [Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/) for debugging and introspection purposes. This allows the user to seamlessly switch between conventional commands based on WebDriver and powerful browser interactions through [Puppeteer](https://pptr.dev/).

Read more about the differences of these automation standards in the section on [Automation Protocols](./AutomationProtocols.md).

## True Open Source

Compared to many automation tools in the ecosystem, WebdriverIO is a truly open source project that is run with open governance and owned by a non-profit entity called [OpenJS Foundation](https://openjsf.org/). This legally binds the project to grow and be directed in the interest of all participants. The project team values openness and collaboration and is not driven by monetary interests.

This makes the project independent in how it is being developed and where it is supposed to go. It allows us to provide a free 24/7 support in our [community channel](https://matrix.to/#/#webdriver.io:gitter.im) as we build a sustainable community that supports and learns from each other. Lastly, it gives a lot of opportunities to the people that contribute and engage with the project due to its [open governance](https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md).
