---
id: why-webdriverio
title: Why WebdriverIO?
description: What sets WebdriverIO apart from other test automation tools - one API for every platform, web standards, open governance and first-class support for coding agents.
---

WebdriverIO is an open source test automation framework for Node.js. With one test runner and one API you can automate web browsers, native and hybrid mobile apps, desktop apps and editor extensions, and add visual, accessibility and component testing on top. It is run by its community under the umbrella of the [OpenJS Foundation](https://openjsf.org/).

## One framework for every platform

Most teams ship more than a website. WebdriverIO lets you test all of it with the same selectors, assertions, reporters and CI setup:

| Platform | How WebdriverIO automates it | Start here |
| --- | --- | --- |
| Web browsers | WebDriver and WebDriver BiDi in Chrome, Firefox, Safari and Edge | [Web Browsers](/docs/platforms/web) |
| Web components | Component tests in a real browser for React, Vue, Svelte, Solid, Preact, Lit and Stencil | [Component Testing](/docs/component-testing) |
| Mobile apps | Native, hybrid and mobile web on iOS and Android via Appium, including Flutter | [Mobile Apps](/docs/platforms/mobile) |
| Desktop apps | Electron, Tauri and Dioxus apps on macOS, Windows and Linux, native macOS apps via Appium | [Desktop Apps](/docs/platforms/desktop) |
| Editors and extensions | VS Code extensions and browser extensions | [Extensions & Editors](/docs/platforms/apps-and-extensions) |
| Visual regressions | Screen, element and full-page comparisons for web and mobile | [Visual Testing](/docs/visual-testing) |

The same test can even drive several of these at once, e.g. a mobile app and a web dashboard in one scenario, with [multi-remote](/docs/multiremote).

## Built on web standards

WebdriverIO automates browsers through [WebDriver](https://w3c.github.io/webdriver/) and [WebDriver BiDi](https://w3c.github.io/webdriver-bidi/), the W3C standards that every browser vendor implements and [tests](https://wpt.fyi/results/webdriver/tests). Your tests run against the same browser builds your users have, and interactions such as clicks and key presses are dispatched by the browser itself instead of being emulated with JavaScript. WebDriver BiDi adds network mocking, console and log events and more across browsers, not only Chromium.

When you need browser-specific power, WebdriverIO gives you access to the Chrome DevTools Protocol through [Puppeteer](/docs/api/browser/getPuppeteer). Read more in [Automation Protocols](/docs/automationProtocols).

## Community driven and openly governed

WebdriverIO is not a product of a testing vendor. The project:

- is owned by the [OpenJS Foundation](https://openjsf.org/), a vendor-neutral non-profit, which legally binds it to serve the interests of all its users
- follows a public [governance model](https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md): anyone can contribute, and committers and the Technical Steering Committee grow out of the community
- has no paid tier and no feature gates; every feature is free and you can run your tests anywhere, locally or on any cloud provider
- channels sponsorship back to the people who build it through a [contributor stipend program](/blog/2024/02/15/new-contributor-stipend-program)
- offers free community support on [Discord](https://discord.webdriver.io) and [GitHub Discussions](https://github.com/webdriverio/webdriverio/discussions)

## Ready for coding agents

The docs, the tooling and the test artifacts are designed so that coding agents can work with WebdriverIO on their own:

- **Agent-ready docs**: every page is available as Markdown, there is a curated [`llms.txt`](https://webdriver.io/llms.txt) and a docs MCP server at `https://webdriver.io/mcp`.
- **WebdriverIO MCP**: the [`@wdio/mcp`](/docs/mcp) server lets an agent drive browsers and mobile apps to explore your UI and verify selectors.
- **Traces**: [DevTools trace mode](/docs/devtools/wdio/trace-mode) writes a Markdown transcript, screenshots and accessibility snapshots for every failing test.

See [WebdriverIO for Coding Agents](/docs/ai-agents) for the setup.

## Batteries included, easy to extend

- A [test runner](/docs/testrunner) with Mocha, Jasmine and Cucumber support, parallel execution, [sharding](/docs/sharding), [retries](/docs/retry) and a [watch mode](/docs/watcher)
- [Auto-waiting](/docs/autowait) for every interaction and a built-in [assertion library](/docs/assertion)
- [Network mocking](/docs/mocksandspies), [emulation](/docs/emulation) and [snapshot testing](/docs/snapshot)
- A [debugging dashboard and trace viewer](/docs/devtools)
- [70+ services and reporters](/docs/ecosystem) for clouds, frameworks and CI, plus simple APIs to write your own [commands](/docs/customcommands), [services](/docs/customservices) and [reporters](/docs/customreporter)

## When to choose something else

WebdriverIO is a good fit when you test more than one platform, want to run against real browsers and devices, or value an independent, community-owned tool. If you only ever test a single web app in a single browser and don't need mobile, desktop or cloud devices, a browser-only tool may feel lighter to start with. If you are unsure, [create a project](/docs/gettingstarted) with `npm init wdio@latest` and try it: the setup takes about a minute.

## Next steps

- [Getting Started](/docs/gettingstarted) - create a project and run your first test
- [Setup Types](/docs/setuptypes) - test runner or standalone mode
- [WebdriverIO for Coding Agents](/docs/ai-agents) - set up your agent
