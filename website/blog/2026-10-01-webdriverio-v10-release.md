---
title: "WebdriverIO v10: Still Here, Still Shipping"
authors: bromann
---

Wait, WebdriverIO still ships major releases?

If that was your first thought, fair enough. Over the last few years a lot of people decided the end-to-end testing question was settled: Playwright won, and everything else is legacy. We hear it at conferences, in issue threads, and in the occasional "is this project still maintained?" message on Discord.

So here is the answer: **yes. WebdriverIO v10 is out today.** It was built in the open by a governed community of people who care about one thing other tools treat as an afterthought: testing on the real browsers and devices your users have, on every platform. That means real browsers automated through open web standards, native iOS and Android apps, Electron, Tauri and native desktop apps, and the TVs in people's living rooms.

<!-- truncate -->

import DevToolsDemo from '@site/src/components/home/DevToolsDemo'

## Fifteen years of changing with the job

WebdriverIO has been around for about fifteen years, and it has never stayed the same project for long. It started as a small Node.js binding for the Selenium JSON Wire Protocol. Then it became a test runner. Then it added mobile automation through Appium, component testing in the browser, visual testing, and full [WebDriver BiDi](https://w3c.github.io/webdriver-bidi/) support in v9. Each time, the industry changed how software gets built and tested, and WebdriverIO changed with it.

The next change is already underway. More and more code is written by coding agents rather than typed by hand. [Addy Osmani](https://x.com/addyosmani) describes what this does to engineering in [The Code Nobody Reads](https://addyo.substack.com/p/the-code-nobody-reads). Line-by-line review stops scaling once agents produce most of the diff, but someone still has to own what ships. Trust has to come from somewhere else: from **independent verification**, checks that prove a change works instead of a human reading every line of it. As Addy puts it, "the team that wins isn't the one that reads nothing."

That is where a testing framework comes in. An agent that writes a feature should also be able to open the app, click through the feature, check what it sees, and leave behind a test that keeps proving it. Run that loop on every change and you get code you can trust without reading all of it.

**With v10, WebdriverIO is becoming the best tool for agents to automate and verify features in applications on every platform.** The protocols, drivers, services and assertions we built over fifteen years are what make that possible. v10 points all of it at the agent.

## What's new in v10

v10 has two halves: a set of features built for agents and verification loops, and a long overdue cleanup of the core. Both came from contributors across the community, so this section names the people who did the work.

### `wdio session`: let the agent drive the app

The headline feature of v10 is [`wdio session`](/docs/session). It keeps one WebdriverIO session alive across many short shell commands, the way a coding agent naturally works:

```sh
npx wdio session open chrome http://localhost:3000
npx wdio session snapshot --interactive
npx wdio session click e3
npx wdio session exec -e "await expect($('aria/Cart (1)')).toBeDisplayed()"
npx wdio session export --out test/specs/cart.e2e.ts
npx wdio session close
```

Here is the same demo app driven step by step in three places. Pick a platform to see it in a browser, on an Android emulator, or as an Electron desktop app:

<Tabs lazy>
  <TabItem value="browser" label="Browser" default>
    <SessionTarget id="browser" />
  </TabItem>
  <TabItem value="android" label="Android">
    <SessionTarget id="android" />
  </TabItem>
  <TabItem value="electron" label="Electron">
    <SessionTarget id="electron" />
  </TabItem>
</Tabs>

The agent opens the app, reads a snapshot of what is on screen, acts on element refs, checks the result, and exports the steps that worked as a regular WebdriverIO test. The same commands work with Chrome, Firefox, Edge and Safari, Android and iOS through Appium 3, Electron, Tauri and Dioxus, and native macOS and Windows apps. `npx wdio session doctor android` tells the agent what is missing before it gets stuck.

`npm init wdio` now offers to set up coding agent support. It installs a `wdio-session` [agent skill](/docs/ai-agents) into your project so Claude Code, Cursor, Codex, Copilot and others know how to use it.

`wdio session` started as [`wdiox`](https://github.com/Winify/webdriverio-execute) (WebdriverIO Execute), a side project by [Vince Graics](https://github.com/Winify). It kept a session on disk between commands, gave every element on screen a short ref, and recorded each step. That turned out to be exactly how agents like to work, so for v10 we moved it into the core CLI. It now ships with every WebdriverIO project.

### Traces an agent can debug

A verification loop is only useful if a failure tells you why it failed. For years, this was where other frameworks were ahead of us. Playwright's trace viewer and Cypress's time-travel debugging set the standard for seeing what a test actually did, and WebdriverIO users had to piece the same story together from logs and screenshots.

[WebdriverIO DevTools](/docs/devtools) closes that gap. It has two parts. A live dashboard opens while your tests run: you see every command, the page, console and network logs, and you can rerun a single test with one click. Trace mode records a portable `trace.zip` that you can replay offline, attach to a CI run, or hand to an agent to compare against a passing run. Read the [tracing announcement](/blog/2026/06/18/webdriverio-tracing) for the details. This is where we are catching up, and it is only the start: more powerful debugging features are coming during the v10 cycle.

DevTools exists thanks to [BrowserStack](https://www.browserstack.com/automation-webdriverio), one of the project's Premium sponsors. [Vishnu Vardhan](https://github.com/vishnuv688) from BrowserStack has been the driving force behind the [DevTools repository](https://github.com/webdriverio/devtools), building everything from the live debugger to per-test trace slices and hybrid-app webview capture. BrowserStack also did not keep the work to WebdriverIO alone. They extended the trace format and the UI to [Selenium WebDriver and Nightwatch.js](/docs/devtools/cross-framework), so teams on those frameworks get the same debugging experience. That helps the whole WebDriver ecosystem, not just our users, and it is exactly the kind of contribution that makes an open project stronger. [Mrunal Chaudhari](https://github.com/mccmrunal) and [Vince Graics](https://github.com/Winify) contributed tracing follow-ups.

Here is what DevTools shows you, from the live dashboard and native mobile tests to the trace player. Click a recording to enlarge it:

<DevToolsDemo />

### MCP: one server for browsers, phones and desktop apps

If your agent prefers tools over the shell, [`@wdio/mcp`](/docs/mcp) gives it the same reach. [Vince Graics](https://github.com/Winify) turned it into a cross-platform MCP server: browsers, Appium mobile sessions, Electron, session logs, browser mocking, a `query_docs` tool, and cloud sessions on Sauce Labs, BrowserStack and TestMu AI. Read the [launch post](/blog/2026/02/04/introducing-webdriverio-mcp) if you missed it.

Other people kept adding to it. [Ned Thompson](https://github.com/nthompson-bitwarden) added Electron support and session-scoped API mocking. [Arundoss](https://github.com/Arundoss-digitalai) added Digital.ai Testing as a cloud provider, and [Jochen](https://github.com/jochen-testingbot) added TestingBot. [ned](https://github.com/nathom791) added browser extension install and uninstall. [Aaron Zhou](https://github.com/Clarkkkk) added external WebDriver providers, and [faiz](https://github.com/fbmcipher) made it possible to attach to an existing session. [Ben Atkinson](https://github.com/apuck) added iframe switching, [Netzulo](https://github.com/netzulo) added capability passthrough, and [Vansh Sukhija](https://github.com/VanshSukhija) fixed Sauce Labs options.

### Assertions, protocols and drivers

Verification needs precise assertions and a typed protocol underneath them. [David Prevost](https://github.com/dprevost-LMI) has been one of the most active contributors across the whole organization, with work across every layer that verification depends on:

- **expect-webdriverio 8**, the assertion library v10 ships with. Types are published the way users compile them, and the real matcher name now reaches the `beforeAssertion` / `afterAssertion` hooks. Finally, robust multi-remote support: browser, element, network and snapshot matchers now check every instance of a multi-remote session.
- **[cddl](https://github.com/webdriverio/cddl)**, the parser and code generator behind our typed WebDriver BiDi client.
- **The new [driver](https://github.com/webdriverio/driver) monorepo** with `geckodriver`, `edgedriver` and `safaridriver`.
- **The v10 upgrades** to Vitest 5 in the browser runner, pnpm 11, and Jasmine matchers that stay synchronous.

### Visual and mobile verification

Sometimes "does it work" means "does it look right", and sometimes "the app" is a native app on a phone. [Wim Selles](https://github.com/wswebcreation) has spent these two years making WebdriverIO great at both, and much of what makes visual and mobile verification in v10 feel effortless is Wim's work.

**Visual testing on a new engine.** In v10, [visual testing](/docs/visual-testing) compares screenshots with [Pixelmatch](https://github.com/mapbox/pixelmatch) instead of ResembleJS, and handles images with `fast-png` instead of the no-longer-maintained Jimp: still pure JavaScript, now on actively maintained libraries. Wim made sure the existing `ignore*` options keep their meaning, and the [FAQ](/docs/visual-testing/faq) explains the one-time baseline update. The comparison logic now lives in its own package, `@wdio/image-comparison-core`. Web screenshots use WebDriver BiDi where available, full-page screenshots on iOS and desktop Safari are stitched correctly, and the [Visual Reporter](/docs/visual-testing/visual-reporter) lets you review differences in the browser.

**Native mobile commands.** Wim gave WebdriverIO mobile commands that work the same on Android and iOS: [`tap`](/docs/api/mobile/tap), [`swipe`](/docs/api/mobile/swipe), [`longPress`](/docs/api/mobile/longPress), [`dragAndDrop`](/docs/api/mobile/dragAndDrop), [`pinch`](/docs/api/mobile/pinch), [`zoom`](/docs/api/mobile/zoom), native [`scrollIntoView`](/docs/api/mobile/scrollIntoView) and [`deepLink`](/docs/api/mobile/deepLink). [`getContext`](/docs/api/mobile/getContext) and [`switchContext`](/docs/api/mobile/switchContext) tell you much more about the webviews in a hybrid app, and `isDisplayed` works for Windows and macOS apps. These are the commands an agent reaches for when it verifies a feature on a phone, and they hide the platform differences that used to make mobile tests brittle.

**Appium 3 and a place to start.** Wim updated the protocol and mobile commands for Appium 3, the version v10 now requires. The Appium service gained the [Native Mobile Selector Performance Optimizer](/docs/appium-service#native-mobile-selector-performance-optimizer) (beta, iOS for now), which times your XPath selectors during a run and reports faster replacements, and `npx start-appium-inspector` opens [Appium Inspector](https://github.com/appium/appium-inspector) in one step. To try it all, start with the [native demo app](https://github.com/webdriverio/native-demo-app) that Wim moved to Expo, the updated [Appium boilerplate](https://github.com/webdriverio/appium-boilerplate), and the [mobile automation workshop](https://github.com/webdriverio/setup-workshop-mobile-automation-with-appium).

### Desktop apps, mobile frameworks and headless CI

**One family of services for app frameworks.** Not every app lives in a browser tab. [goosewobbler](https://github.com/goosewobbler) built and maintains [WebdriverIO Desktop & Mobile](https://github.com/webdriverio/desktop-mobile), and has carried nearly all of the work on it. It is a set of services that test apps the way their frameworks build them. [Electron](/docs/desktop-testing/electron) is now `@wdio/electron-service`. [Tauri](/docs/desktop-testing/tauri) (including the CrabNebula driver on macOS) and [Dioxus](/docs/desktop-testing/dioxus) are stable. React Native and Flutter services are feature-complete on the `next` tag, and Electrobun has early support. Each service sets up, starts and tears down the right driver for you, so a desktop test starts as simply as a browser test.

**The same toolbox in every framework.** Across all of them you get the same API: mock the app's native APIs for deterministic tests, run code in the app's own runtime (such as Electron's main process or the Dart VM in Flutter), test deeplinks and multiple windows, run several app instances with multi-remote, and capture the app's logs. A browser mode tests the app's UI in Chrome against its dev server, without building the native binary. For agents, that means verifying a desktop feature works just like verifying a web page, and `wdio session open electron`, `open tauri` and `open dioxus` build on exactly these services.

**Real apps in CI, without a screen.** Agents run in CI, and CI machines have no display. goosewobbler first solved this in v9 with `@wdio/xvfb`, which gave Linux runners a virtual display automatically. In v10 it grew into `@wdio/display-server`, which adds native headless Wayland through Weston. The testrunner now starts one display server for the whole run: Weston first, with Xvfb as the fallback. Browsers and desktop apps run on a headless Linux machine without extra setup. The [headless and display server guide](/docs/headless-and-display-servers) covers the options, and the [migration guide](/docs/v10-migration#virtual-displays-on-linux) shows how to rename the old `xvfb*` settings.

### Tabs, windows and frames you can hold

Until v10, a WebdriverIO session had one implicit "current" browsing context. `switchWindow` and `switchFrame` moved that pointer, and every following command ran wherever it pointed. Checking a payment iframe, a second tab and the main page in one test meant switching back and forth, and forgetting a single switch sent the next command to the wrong place.

In a WebDriver BiDi session, a tab, a window and a frame are now a `WebdriverIO.BrowsingContext` value you hold. `browser.url()` returns the page it opened, `browser.newWindow()` returns the new tab without switching to it, and `context.frame()` returns a frame of that page. Commands on each value run in that context, so you can work with several at once:

```ts
const checkout = await browser.url('https://example.com/checkout')
const docs = await browser.newWindow('https://webdriver.io', { type: 'tab' })
const payment = await checkout.frame('#payment')

await payment.$('#card').setValue('4242')
await checkout.$('h1').getText()
await docs.getTitle()
```

Windows the test didn't open, like a `window.open` popup, come from `browser.browsingContexts()`. Because nothing moves a hidden pointer anymore, `switchWindow` and `switchFrame` throw in BiDi sessions. Classic sessions keep them, and the [migration guide](/docs/v10-migration#switchtoframe) shows the new calls.

### Small API changes you will notice

- **`$` is strict.** [Mrunal Chaudhari](https://github.com/mccmrunal) made `$` throw when a selector matches more than one element. An ambiguous selector is a common source of flaky tests, and agents write a lot of them. The [migration guide](/docs/v10-migration#-is-strict) shows how to audit your suite and how to opt out.
- **`$$` returns a real array.** `$$`, `custom$$`, `react$$` and `shadow$$` return an `ElementArray` that stays awaitable, so `for await` and the async array helpers work on the list directly.
- **`installExtension` / `uninstallExtension`** install and remove browser extensions in the middle of a session over BiDi, from a directory, an archive or base64 bytes, locally or on a remote grid.
- **Multi-remote cleanup.** [Plone Mraz](https://github.com/PloneMraz) made multi-remote `$$` return a `MultiRemoteElementArray`, stabilized `select()`, and added a lock so concurrent setups share one driver install.
- **Lighthouse 13** in the Lighthouse service, **Allure 3** support in the Allure reporter from [Alex](https://github.com/todti), and the soft assertion service now included automatically by the runner thanks to [JustasM](https://github.com/JustasMonkev).

### Clearing out fifteen years of legacy

v10 removes a lot of old code, which makes WebdriverIO smaller, faster and easier for humans and agents to reason about:

- Node.js **22.19** is the minimum version.
- Every session is a **W3C session**. The last parts of the JSON Wire Protocol are gone.
- **Appium 3** is required, and the Appium 1/2 HTTP fallbacks are removed.
- **Mocha 12**, **Cucumber 13** and **Vitest 5**.
- Deprecated commands are removed, including `executeAsync`, `throttle` and `touchAction`, along with legacy command signatures and old config globals. [devangpratap](https://github.com/devangpratap) and [JustasM](https://github.com/JustasMonkev) did a large share of this.
- The test runner hot path got faster, [Matteo Pietro Dazzi](https://github.com/ilteoood) upgraded `@puppeteer/browsers` to v3 to fix a security advisory, and the repository moved to Oxlint.

The website got the same treatment. webdriver.io now only hosts the v10 and v9 docs, organized around tasks and platforms, and every page is available as Markdown for agents through [`llms.txt`](https://webdriver.io/llms.txt) or the docs MCP server at `https://webdriver.io/mcp`. [David Burns](https://github.com/AutomatedTester) made the API pages machine-readable, and the [AI agents guide](/docs/ai-agents) shows how to connect them.

The [migration guide](/docs/v10-migration) covers every breaking change. Most of them depend on what your tests mean, so a codemod can't apply them, but your agent can. Install the v10 migration skill and ask your agent to upgrade the suite:

```sh
npx skills add webdriverio/webdriverio --skill wdio-v10-migration
```

### The people keeping the core trustworthy

A framework that agents rely on has to hold up under the large volume of tests they generate. Few people did more for that over the last two years than [Mrunal Chaudhari](https://github.com/mccmrunal), who fixed bugs across nearly every part of the core:

- **The test runner:** workers that hang on shutdown are now killed, `afterSession` runs even when a session fails to start, a memory leak in the session managers is gone, and retries and timeouts propagate the way you expect.
- **Frameworks and reporters:** Mocha's `this.skip()` in hooks is no longer reported as a failure, Jasmine 5.10+ hooks work again, and Cucumber retries, data tables and multi-remote runs show up correctly in the Allure and JUnit reporters.
- **Browser automation:** WebDriver BiDi got sturdier around closed frames, dialogs, cookies and network-idle waits. Shadow roots no longer leak into scoped element lookups, `scrollIntoView` works in nested scroll containers, overlapping capabilities are normalized, and the BiDi response timeout is configurable.
- **Assertions:** fixes to `toHaveText`, `toHaveStyle`, `toBeRequestedWith` and soft assertions in Cucumber steps.

Mrunal also added the `--headless` CLI flag, CPU and heap profiling, and support for custom Chromedriver download mirrors, kept our dependencies free of known vulnerabilities, made `$` strict for v10, and started the [WebdriverIO agent skills](https://github.com/webdriverio/webdriverio-agent-skills) catalog. Much of the reliability you won't notice in v10 is Mrunal's work.

Thanks also to:

- [Erwin Heitzman](https://github.com/erwinheitzman) of the TSC, for element chaining, a faster default wait interval, and visibility checks that behave.
- [Taiki Abe](https://github.com/mato533) for building most of the [VS Code extension](https://github.com/webdriverio/vscode-webdriverio), where a person and an agent can share the same test run, and for WebSocket options on the BiDi connection.
- [Sri Harsha](https://github.com/harsha509) for BiDi types and window switching.
- [Chanatan Charnkijtawarush](https://github.com/ccharnkij) for shadow roots and multi-remote commands.
- [Nikolas Sapalidis](https://github.com/nikolas-sapa) for the stale-element and worker-exit fixes that show up as flaky runs.
- [Navin Chandra](https://github.com/navin772) from LambdaTest for BiDi request headers, window switching in classic sessions, and `attachToSession` fixes.
- [Swastik Baranwal](https://github.com/Delta456) from LambdaTest for `.entries()` on element arrays and for letting Electron start when `NODE_OPTIONS` is set.
- [Sai Krishna](https://github.com/saikrishna321) from LambdaTest for shutting down the Appium server cleanly when a run completes.
- [Kirill Gavrilov](https://github.com/gavvvr), whose docs fixes keep agents from copying wrong examples.
- [Luis Zurro](https://github.com/Nyaran) for Sauce Labs service settings, Cucumber skip tags with complex patterns, and retries when a server answers with HTML instead of JSON.
- [Siarhei Kliushnikau](https://github.com/udarrr) for wildcards in `--spec` and `--exclude`.
- [Martsin Lazouski](https://github.com/ML642) for a long series of core fixes, including mock responses that respect `fetchResponse`.
- [Noritaka Kobayashi](https://github.com/noritaka1166) for keeping the assertion library clean.
- [Rondley Gregório](https://github.com/Rondleysg) for the docs generator, BiDi dialog handling, and the bot that brings Stack Overflow questions into Discord.
- [Mykola Mokhnach](https://github.com/mykola-mokhnach) from the Appium project for a fallback that resolves the host's IP address when a BiDi connection can't be opened.

### Everyone who made v10

In the two years since September 2024, **191 people** merged **1,725 pull requests** across 41 repositories in the WebdriverIO organization. Thank you, all of you:

[Дамян Минков](https://github.com/damencho), [-bimlote-](https://github.com/bimlote), [Aakash Hotchandani](https://github.com/AakashHotchandani), [Aaron Zhou](https://github.com/Clarkkkk), [Abdel](https://github.com/abdel-ships-it), [Adi Dziurdzikowski](https://github.com/Dziurdzikowski), [Aditya Hirapara](https://github.com/AdityaHirapara), [Agnes Au](https://github.com/Agnes-Au), [Akanksha singh](https://github.com/akanksha1909), [alcpereira](https://github.com/alcpereira), [Alex Parish](https://github.com/alexparish), [Alex](https://github.com/todti), [alphabetkrish](https://github.com/alphabetkrish), [Amaan Hakim](https://github.com/amaanbs), [Amiya Pattanaik](https://github.com/amiya-pattnaik), [Andrew Boyton](https://github.com/aboyton), [Anish Kumar Sinha](https://github.com/anish353), [Artem Sukhinin](https://github.com/ArtMathArt), [Arundoss](https://github.com/Arundoss-digitalai), [Aswin Chembath](https://github.com/aswinchembath), [Avron Souto](https://github.com/Norva-bugged), [b-kirby](https://github.com/b-kirby), [Badisi](https://github.com/Badisi), [Ben Atkinson](https://github.com/apuck), [bgrozev](https://github.com/bgrozev), [Bhargavi Vaidya](https://github.com/Bhargavi-BS), [Boris Osipov](https://github.com/BorisOsipov), [Brad DerManouelian](https://github.com/therealbrad), [Brian Birtles](https://github.com/birtles), [Carlo Jeske](https://github.com/plusgut), [Cesar Montoya](https://github.com/mcwanza), [Chanatan Charnkijtawarush](https://github.com/ccharnkij), [Changsu Seong](https://github.com/scs0209), [Christian Bromann](https://github.com/christian-bromann), [Craig Sirota](https://github.com/csirota97), [daksh-r](https://github.com/daksh-r), [Daniel Jacobs](https://github.com/danielhjacobs), [David Burns](https://github.com/AutomatedTester), [David Chau](https://github.com/chauhaidang), [David Prevost](https://github.com/dprevost-LMI), [devangpratap](https://github.com/devangpratap), [Dhruvin Mehta](https://github.com/dhruvin-bs), [Diego Molina](https://github.com/diemol), [Dimitar Mihaylov](https://github.com/mitk0936), [Dmitrii](https://github.com/formaceft-93), [Dmitriy Dudkevich](https://github.com/DudaGod), [Dmitriy Mukhin](https://github.com/mitya555), [Dmytro 🇺🇦](https://github.com/DQRI), [Dory](https://github.com/DoreyKiss), [Dragos Campean](https://github.com/dragosMC91), [Edgars Eglītis](https://github.com/eglitise), [Eric Saari](https://github.com/esaari), [Erin](https://github.com/dlowzzxx), [Erkan Erol](https://github.com/erkanerol), [Erwin Heitzman](https://github.com/erwinheitzman), [Fabien CELLIER](https://github.com/lacell75), [Fábio Correia](https://github.com/fabioatcorreia), [faiz](https://github.com/fbmcipher), [fetsorn](https://github.com/fetsorn), [Filype](https://github.com/fpereira1), [Flavio Barbosa](https://github.com/flaviobdev), [Fnine59](https://github.com/Fnine59), [franklincg](https://github.com/franklincg), [goosewobbler](https://github.com/goosewobbler), [Harish Kumar](https://github.com/harry-harish), [harshit-browserstack](https://github.com/harshit-browserstack), [Haseeb Nazir](https://github.com/iamhaseebn), [HeeSeok Kim](https://github.com/HeeSeok-kim), [Ian Renauld](https://github.com/ianrenauld), [Ilia Choly](https://github.com/icholy), [Jack VanSickle](https://github.com/jackvansickle1), [Jainam Shah](https://github.com/jainam-bs), [Jan Molak](https://github.com/jan-molak), [Jason Cantfell](https://github.com/jcantfell), [jbblanchet](https://github.com/jbblanchet), [Jens Kuhr Hansen](https://github.com/jenskuhrjorgensen), [Jesse Hines](https://github.com/jesse-r-s-hines), [JinHyuk Sung](https://github.com/sjh9714), [Jochen](https://github.com/jochen-testingbot), [Joe Grinstead](https://github.com/grinstead), [Johannes](https://github.com/johant87), [jonathan terry](https://github.com/jonyet), [Joseph Mearman](https://github.com/Mearman), [Josh Patsey](https://github.com/brickfungus), [JustasM](https://github.com/JustasMonkev), [Kaan Çelebi](https://github.com/kaanisthatyou), [Kamalpreet Kaur](https://github.com/kamal-kaur04), [Kauan Barbosa](https://github.com/Kauanldsbarbosa), [Kirill Gavrilov](https://github.com/gavvvr), [Kitsios Konstantinos](https://github.com/kitsiosk), [Krish Pavuluri](https://github.com/krishtoautomate), [Kyle Brooks](https://github.com/kbrooks), [la122](https://github.com/la122), [Liliyan Krumov](https://github.com/segfaultincoming), [Lorenas](https://github.com/lorenaskosinskas), [Luan Taraschi](https://github.com/luantaraschi), [Luca Müller](https://github.com/cuvar), [lucasmariano003-wq](https://github.com/lucasmariano003-wq), [Luis Zurro](https://github.com/Nyaran), [Luke](https://github.com/NaamuKim), [Marc Hassan](https://github.com/mhassan1), [Marcel Veselka](https://github.com/marcel-veselka), [Marcel](https://github.com/lezram), [Mark](https://github.com/remarkablemark), [Martsin Lazouski](https://github.com/ML642), [Matteo Pietro Dazzi](https://github.com/ilteoood), [Mauricio Lauffer](https://github.com/mauriciolauffer), [Michael Naumov](https://github.com/mnaoumov), [Michael Scrivo](https://github.com/mscrivo), [Michał Budziak](https://github.com/budziam), [Mihir Rawool](https://github.com/MihirR-BS), [Millan Kaul](https://github.com/eaccmk), [Minav Karia](https://github.com/minavkaria-bs), [Mohamed Nishath N](https://github.com/nishath-bs), [Mrunal Chaudhari](https://github.com/mccmrunal), [Mykola Mokhnach](https://github.com/mykola-mokhnach), [Mykyta Chursin](https://github.com/unickq), [nair-sumesh](https://github.com/nair-sumesh), [Nathan Zhao](https://github.com/phantomwolf), [Navin Chandra](https://github.com/navin772), [Ned Thompson](https://github.com/nthompson-bitwarden), [ned](https://github.com/nathom791), [Netzulo](https://github.com/netzulo), [nheiser](https://github.com/nheiser), [Nikolas Sapalidis](https://github.com/nikolas-sapa), [Nikos Lytras](https://github.com/nikoslytras), [Noritaka Kobayashi](https://github.com/noritaka1166), [omjadas](https://github.com/omjadas), [P-Courteille](https://github.com/P-Courteille), [Payman Delshad](https://github.com/paymand), [Plone Mraz](https://github.com/PloneMraz), [Pokdeep Sandhu](https://github.com/pokdeep), [Pranay Varma](https://github.com/pranay-v29), [Pritish Chugh](https://github.com/Pritishchugh22), [Priyanka Gadhiya](https://github.com/pri-gadhiya), [Rahul Dandona](https://github.com/dandonarahul2002), [Randolf J.](https://github.com/jrandolf), [Raul Macarie](https://github.com/macarie), [Rayan Salhab](https://github.com/cyphercodes), [rbronz](https://github.com/rbronz), [Regan Karlewicz](https://github.com/regan-karlewicz), [Ricardo Barbosa](https://github.com/nextlevelbeard), [ricardo larrahondo](https://github.com/ricardorlg), [Ritwick Raj Makhal](https://github.com/ritwickrajmakhal), [Rodrigo Rodriguez](https://github.com/RodBuild), [Romain Menke](https://github.com/romainmenke), [Roman Kuznetsov](https://github.com/KuznetsovRoman), [Roman](https://github.com/gameroman), [Rondley Gregório](https://github.com/Rondleysg), [Rounak Bhatia](https://github.com/rounak610), [Sai Krishna](https://github.com/saikrishna321), [Samuel Freiberg](https://github.com/samuelfreiberg), [Sandi2212](https://github.com/Sandi2212), [sauravdas1997](https://github.com/sauravdas1997), [Shirsh Zibbu](https://github.com/zhirzh), [Shiv Jirwankar](https://github.com/shiv-jirwankar), [Shivam Kumar](https://github.com/shivamku-BS), [Shixi Li](https://github.com/shixi-li), [Shrey Shekhar](https://github.com/sh011), [Shubham Garg](https://github.com/xxshubhamxx), [Siarhei Kliushnikau](https://github.com/udarrr), [Simon Coen](https://github.com/Siolto), [Simon Markowski](https://github.com/smarkows), [Sindhu Pullapantula](https://github.com/sindhupullapantula), [Sourav Kunda](https://github.com/07souravkunda), [Sri Harsha](https://github.com/harsha509), [Steve Hall](https://github.com/sh41), [Sven](https://github.com/sventschui), [Swastik Baranwal](https://github.com/Delta456), [Syamphaneendra Kalluri](https://github.com/syamphaneendra), [Taiki Abe](https://github.com/mato533), [Tanmay-Bstack](https://github.com/Tanmay-Bstack), [Taro Nonoyama](https://github.com/n2-freevas), [Titus Fortner](https://github.com/titusfortner), [uladhsi](https://github.com/uladhsi), [Ulises Gascón](https://github.com/UlisesGascon), [Uros Ivanovic](https://github.com/ivanovicu), [Vansh Sukhija](https://github.com/VanshSukhija), [Vince Graics](https://github.com/Winify), [vipin-bs](https://github.com/vipin-bs), [Vishnu Vardhan](https://github.com/vishnuv688), [Vitor de Mello Freitas](https://github.com/vitmf), [vjuturu](https://github.com/vjuturu), [Vladimir](https://github.com/sheremet-va), [Volodymyr Parlah](https://github.com/vparlah), [Will Brock](https://github.com/WillBrock), [Will Stone](https://github.com/will-stone), [Wim Selles](https://github.com/wswebcreation), [Yash Jain](https://github.com/osho-20), [Yash Lunawat](https://github.com/Yash121l), [Yevhen Laichenkov](https://github.com/elaichenkov)

This is a community project with no single company behind it, and that list is how it ships.

## Who uses WebdriverIO

WebdriverIO runs in small startups and in some of the largest enterprises in the world, usually in exactly the places where "works in Chromium" is not enough. Companies keep reaching out to support the project. [Rapidproxy](https://www.rapidproxy.io/?ref=webdriverio) recently joined as a Bronze sponsor, and the AI testing company [Momentic](https://momentic.ai/) committed to being a **Platinum sponsor for the next two years**. We are also working on a collaboration with Momentic that we will announce soon.

Sponsorship goes back to the people in the list above. Through our [Open Collective](https://opencollective.com/webdriverio) and the [contributor stipend program](/blog/2024/02/15/new-contributor-stipend-program), contributors get paid for the work they do on WebdriverIO. In the two years this release covers, we paid out more than **$47,000 to 68 contributors**, from people fixing their first bug to long-time maintainers. That is about three quarters of everything sponsors and backers gave us in that time. Every expense is public on our [Open Collective page](https://opencollective.com/webdriverio/transactions).

## WebdriverIO is here to stay

v10 is a starting point, not a finish line. Many of the agent-facing features are new, and we expect to ship many improvements during the v10 cycle as more teams put agents into their verification loops.

If you want to be part of it:

- **Upgrade**: follow the [v10 migration guide](/docs/v10-migration), or let your agent do it with the migration skill.
- **Join the community**: say hi on our [Discord server](https://discord.webdriver.io), where the WebdriverIO family hangs out.
- **Contribute and get paid**: pick up an [issue](https://github.com/webdriverio/webdriverio/issues), read the [contributing guide](https://github.com/webdriverio/webdriverio/blob/main/CONTRIBUTING.md), and claim your work through the [contributor stipend program](/blog/2024/02/15/new-contributor-stipend-program).

WebdriverIO is here to stay. See you in the issue tracker. 🤖
