---
title: v10 contributor research (working brief)
unlisted: true
---

# Contributor research for the v10 release post

Working brief for the v10 blog post. This file lives under `website/blog/_drafts/` so Docusaurus does not publish it. It covers contributors only. The feature narrative for v10 still needs its own pass.

**Window:** pull requests merged from 29 September 2024 through 29 September 2026, across the public repositories in the [webdriverio](https://github.com/webdriverio) organization.

**Method:** every merged pull request in that window, attributed to the GitHub author. Counts below add the VS Code extension (`vscode-webdriverio`, 52 merged PRs) which sat just outside the first org-wide page. Direct commits on `brain`, `webdriverio-agent-skills`, `setup-workshop-mobile-automation-with-appium`, and the boilerplate repos were checked separately; the people who made them already appear through other pull requests. Reviews, issue comments, and Crowdin translations that never became a GitHub commit are outside this count.

**Scale:**

| | |
| --- | ---: |
| Public repositories surveyed | 41 |
| Merged pull requests | 3,765 |
| Human contributors | 191 |
| Merged pull requests by those people | 1,725 |
| Dependabot pull requests | 1,988 |
| `github-actions` automation pull requests | 51 |

One pull request was opened by `copilot-swe-agent` (an ESLint indent fix). It is omitted from the roll call.

The Area column in the roll call is the repository where most of that person's pull requests landed. Several of the people worth naming in the post work across more than one repository; their sections below say so.

## What the agent theme asks contributors to have built

The v10 docs already describe the product this way: most tests are written together with a coding agent, and that agent needs current documentation, a way to drive the app, and a run it can debug. See `website/docs/AIAgents.md`. The two-year contribution record maps onto those jobs, plus the automation core the agent is driving.

| Job the agent has | Where the work lives | Who carried it |
| --- | --- | --- |
| Read current v10 docs, as Markdown or over MCP | Website, `llms.txt`, machine-readable API pages, docs MCP, `i18n` | Christian Bromann, David Burns, Rondley Gregório, the translation authors |
| Drive a browser, phone, or desktop app and keep the session between commands | `wdio session` in the core repo, [`mcp`](https://github.com/webdriverio/mcp), [`desktop-mobile`](https://github.com/webdriverio/desktop-mobile) | Christian Bromann, Vince Graics, goosewobbler, cloud-provider authors on MCP |
| Debug a failed run, including offline and in CI | [`devtools`](https://github.com/webdriverio/devtools) trace mode (`trace.zip` for replay and agent diffing) | Vishnu Vardhan, with tracing follow-ups from Vince Graics and Mrunal Chaudhari |
| Assert, see, and type what happened | `expect-webdriverio`, visual testing, CDDL → BiDi types, driver binaries | David Prevost, Wim Selles, Titus Fortner, and the matcher long tail |
| Run for real in CI, without a physical display | Xvfb, native headless Wayland / Weston, display server | goosewobbler |
| Keep the framework trustworthy while agents generate more tests | Core fixes across the monorepo, reporters, BrowserStack / Sauce / TestingBot / LambdaTest services | Mrunal Chaudhari, Erwin Heitzman, the cloud-service cohorts, and the 125-person core long tail |

`brain` (Christian Bromann) is the maintainer-side of the same theme: LangSmith agents that triage issues and label pull requests for the changelog. `webdriverio-agent-skills` (Mrunal Chaudhari) is the start of a skill catalog agents can install.

## Key contributors to name in the post

These are the people whose body of work, over these two years, is what makes "the test framework for agents" a concrete claim. Order follows the story above, within each group by volume.

### Direction, session, and the v10 cut

**Christian Bromann** ([christian-bromann](https://github.com/christian-bromann)) — 218 merged pull requests, 200 of them in the core repository. He is the author of the v10 platform work already on this branch: Node.js 22.19 as the floor, W3C-only sessions, JSON Wire Protocol removed, Appium 3 required, Mocha 12, Cucumber 13, Vitest 5 in the browser runner, strict `$` (throw when a selector matches more than one element), and `wdio session` for browsers, apps, agents, and docs, including the installable agent skill. On the same theme he landed machine-readable docs plumbing, the v10 website revamp, and the `brain` maintainer agents (issue triager and changelog labeler). In [`cddl`](https://github.com/webdriverio/cddl) he added Python, Swift, and Kotlin backends for WebDriver BiDi types. Of the 94 commits on `v10` that are not on `main` yet, 76 are his. The release post can treat him as the person who turned two years of protocol and agent work into a major version.

**David Prevost** ([dprevost-LMI](https://github.com/dprevost-LMI), GoTo) — 264 merged pull requests, the largest individual count in the org. The work is three layers agents sit on:

- **Assertions.** 130 pull requests in `expect-webdriverio`, including the line that accepts WebdriverIO v10, publishes types the way users compile them, and sends the real matcher name through `beforeAssertion` / `afterAssertion`.
- **BiDi types.** 49 pull requests in `cddl` (parser, `cddl2ts`, CBOR operators, the build). This is the generator behind WebdriverIO's typed WebDriver BiDi client.
- **Drivers.** 15 pull requests in the new [`driver`](https://github.com/webdriverio/driver) monorepo (`geckodriver`, `edgedriver`, `safaridriver`), the binaries a local agent session actually launches.

He also has 68 core pull requests (runner events when a reporter throws, custom-command reporting, Appium `terminateApp` options, protocol codegen). Eight of the v10-only commits are his. For the post: he made the typed protocol, the assertions, and the driver processes that an agent-written test actually executes.

**Plone Mraz** ([PloneMraz](https://github.com/PloneMraz)) — 8 core pull requests, and 3 of the v10-only commits. The v10 multiremote cleanup (`$$` returns a `MultiRemoteElementArray`, `select()` stabilized, legacy expect shims removed) and the concurrent driver-install lock are his. Small count, high overlap with the release branch.

### Let the agent drive the app

**Vince Graics** ([Winify](https://github.com/Winify)) — 49 merged pull requests: 32 in `mcp`, 10 in `devtools`, 7 in the docs. He built `@wdio/mcp` into the cross-platform server the v10 docs tell agents to install: browsers, Appium mobile, Electron, session logs, a browser-mocking tool, `query_docs` against `llms.txt`, and cloud sessions for Sauce Labs, BrowserStack, and TestMu / LambdaTest. He also wrote the February 2026 announcement post and the tracing-mode blog for DevTools. This is the contributor to quote when the post says an agent can open a browser or a phone through one server.

Other people extended that server, and they belong in the same paragraph:

| Person | GitHub | What they added to MCP |
| --- | --- | --- |
| Ned Thompson | [nthompson-bitwarden](https://github.com/nthompson-bitwarden) | Electron support, session-scoped API mocking |
| Arundoss | [Arundoss-digitalai](https://github.com/Arundoss-digitalai) | Digital.ai Testing cloud provider, mobile browser sessions |
| Jochen | [jochen-testingbot](https://github.com/jochen-testingbot) | TestingBot cloud provider (and `setAnnotation` on the TestingBot service) |
| ned | [nathom791](https://github.com/nathom791) | BiDi extension install / uninstall, browser type on the browser tool |
| Aaron Zhou | [Clarkkkk](https://github.com/Clarkkkk) | External WebDriver provider; also a Tauri window-rect fix in `desktop-mobile` |
| faiz | [fbmcipher](https://github.com/fbmcipher) | Attach to an existing WebDriver session |
| Ben Atkinson | [apuck](https://github.com/apuck) | `switch_frame` for iframes |
| Netzulo | [netzulo](https://github.com/netzulo) | Capability passthrough for browser and Appium session startup |
| Vansh Sukhija | [VanshSukhija](https://github.com/VanshSukhija) | Sauce Labs: keep user `sauce:options`, omit an empty tunnel name |

**goosewobbler** ([goosewobbler](https://github.com/goosewobbler)) — 302 merged pull requests. The GitHub profile has no public name; the core commits are authored as `goosewobbler`. 294 pull requests are in `desktop-mobile`: the services that test Electron, Tauri, Dioxus, React Native, and Electrobun apps. The 8 core pull requests are the other half of "an agent can run this in CI": `@wdio/xvfb`, native headless Wayland (Weston), and the v10 display-server documentation. Two of those commits are on the v10 branch (`feat: native headless Wayland (weston) support`). For the post: agents and headless CI get a real browser and a real desktop app because of this work.

**Taiki Abe** ([mato533](https://github.com/mato533)) — the GitHub profile name is empty. Core commits in this window use `taiki.abe.00@gmail.com`, which is the attribution to use unless he prefers the handle only. 39 merged pull requests: 27 in `vscode-webdriverio` (run tests from the Testing view, Windows execution, env vars loaded per worker, simpler startup) and 12 in core, including WebSocket options on the BiDi connection, DNS lookup instead of `dns.resolve`, and CLI config discovery. Value for the theme: the editor surface where a person and an agent share the same test run, and a BiDi connection that can be configured.

### Let the agent see what happened

**Vishnu Vardhan** ([vishnuv688](https://github.com/vishnuv688), BrowserStack) — 107 merged pull requests, 88 of them in `devtools`. That repository is the live dashboard and the portable `trace.zip` the readme describes for offline replay, CI, and AI-agent diffing. His range covers the Python Selenium adapter, hybrid-app webview capture, per-test trace slices, and the docs for trace mode. In core he fixed `switchFrame` into an iframe inside a shadow root, and delayed iframe contexts. This is the "debuggable test runs" half of the agent story, and it should be named next to MCP, because a trace is how the agent fixes the test it just wrote.

**Wim Selles** ([wswebcreation](https://github.com/wswebcreation)) — 119 merged pull requests. 64 are visual testing, including the v10 engine change from resemble.js to pixelmatch and ignore-option parity so existing `ignore*` settings still mean what users expect. 44 are core, and they are the mobile commands an agent uses to verify a native app: `deepLink`, `restartApp`, native swipe, richer Appium context methods, and `isDisplayed` for Windows and macOS apps. He also moved the native demo app toward Expo, updated the Appium boilerplate, and wrote the mobile workshop machine-setup script (`setup-workshop-mobile-automation-with-appium`). Value: agents can check a rendered screen on web and on device.

**David Burns** ([AutomatedTester](https://github.com/AutomatedTester), BrowserStack) — 5 core pull requests, all of them about making the docs extractable: machine-readable API command pages, a machine-readable surface for the site, and un-hiding flowcharts. The v10 agent docs depend on exactly this. Small count, direct hit on the theme. He also unblocked non-English doc builds after the flowchart component was removed.

### Keep the core trustworthy

**Mrunal Chaudhari** ([mccmrunal](https://github.com/mccmrunal)) — 106 merged pull requests, 97 in core. Reporters (JUnit detecting Cucumber under multiremote, Allure pending steps), dialog and context guards, log file names, capability overlap, and the expense-action JWT flow. Five `expect-webdriverio` fixes are user-facing matcher bugs (`toHaveText` ignore-case, `toHaveStyle` combining properties, `toBeRequestedWith` body matching, soft assertions in Cucumber). He also made the initial commit of `webdriverio-agent-skills`. Value: the failure modes an agent-written suite hits every day, and the first skill catalog.

**Erwin Heitzman** ([erwinheitzman](https://github.com/erwinheitzman)) — 17 merged pull requests plus the workshop update. TSC member. Element chaining when the element is missing, session-polyfill order, faster `waitforInterval` (500 ms → 100 ms), Chrome password-leak detection no longer blocking runs, and the matching `toBeDisplayed` / `toHaveHeight` / `toHaveWidth` work in `expect-webdriverio`. Value: the waits and visibility checks agents copy out of the docs behave.

**Sri Harsha** ([harsha509](https://github.com/harsha509)) — 14 pull requests. Extended BiDi type definitions, `newWindow` tab-or-window, browsing context kept current after `switchToWindow`, and LambdaTest config in the Appium boilerplate.

**Chanatan Charnkijtawarush** ([ccharnkij](https://github.com/ccharnkij)) — 10 pull requests. Shadow root cleanup, multiremote `addCommand` propagation, full mock response bodies, skip reporting for Mocha and Jasmine, and OCR `ocrClickOnText` browser context in visual testing.

**Nikolas Sapalidis** ([nikolas-sapa](https://github.com/nikolas-sapa)) — 7 core fixes that show up as flaky agent runs: stale-element errors preserved when refetch fails, custom locator strategies on multiremote, network throttling applied to service workers, source maps kept in workers, non-zero exit when a worker dies on a signal.

**Navin Chandra** ([navin772](https://github.com/navin772), LambdaTest) — 7 core pull requests. BiDi request headers, classic window switching, shadow-root preload guarded on partial-BiDi remotes, `attachToSession`.

**Kirill Gavrilov** ([gavvvr](https://github.com/gavvvr)) — 8 pull requests, mostly docs accuracy (`switchFrame` outside BiDi, `getHTML` return type, `wdio config` in an empty directory). Agents repeat the docs; wrong docs become wrong tests.

**Siarhei Kliushnikau** ([udarrr](https://github.com/udarrr)) — 6 pull requests. `--spec` / `--exclude` wildcards and suppressing runner `deleteSession`, plus exact driver-version matching in `selenium-standalone`.

**Luis Zurro** ([Nyaran](https://github.com/Nyaran)) — 9 pull requests. Sauce service log and TLS settings, Cucumber skip tags with complex regular expressions, and retry behavior when a response is HTML instead of JSON.

**Noritaka Kobayashi** ([noritaka1166](https://github.com/noritaka1166)) — 18 pull requests, 11 of them assertion-library cleanups, plus one in the VS Code extension.

**Martsin Lazouski** ([ML642](https://github.com/ML642)) — 15 core pull requests, including mock responses honoring `fetchResponse`.

**Swastik Baranwal** ([Delta456](https://github.com/Delta456), LambdaTest) — 15 pull requests. `.entries()` on `ChainablePromiseArray`, BrowserStack `platformVersion` types, Appium service filtering of `Debugger attached`, Chromedriver `NODE_OPTIONS` cleared so Electron can start.

### Cloud services agents will point at a device farm

MCP's cloud story is only useful if the underlying services are solid. Over these two years a BrowserStack group of 26 people landed 107 merged pull requests in the core service (accessibility scans, Percy, Test Reporting & Analytics, the BrowserStack CLI, credential errors, proxies, redaction). Vishnu Vardhan and David Burns are BrowserStack colleagues and are counted in their own sections above, because their patches are DevTools and docs.

People to name if the post has room, otherwise thank as the BrowserStack service group: Shubham Garg (18, accessibility platform support and targeted scans), Rounak Bhatia (11, console-log patch and Percy), Kamalpreet Kaur (8, multiremote session status and credential errors), Aakash Hotchandani (7, App Automate detection and proxy CA certificates), Sourav Kunda (7, performance instrumentation), Aditya Hirapara and Pritish Chugh (BrowserStack CLI), plus Bhargavi Vaidya, Yash Jain, Jainam Shah, Anish Kumar Sinha, Amaan Hakim, Tanmay, Pranay Varma, Vipin, Shivam Kumar, Mohamed Nishath, Minav Karia, Priyanka Gadhiya, Rahul Dandona, Akanksha Singh, Sindhu Pullapantula, Dhruvin Mehta, and Mihir Rawool.

LambdaTest's in-repo work in this window is Swastik Baranwal, Navin Chandra, and Sai Krishna (Appium server shutdown on `onComplete`). Sauce Labs appears as Titus Fortner on CDDL (below), Diego Molina on the config wizard, and Wim's long-running Sauce service maintenance. TestingBot appears as Jochen, above.

### Protocol types beyond the core repo

David Prevost and Christian Bromann did most of `cddl`. Three more people fixed the parser itself, which is what every generated BiDi client depends on:

- **Titus Fortner** ([titusfortner](https://github.com/titusfortner), Sauce Labs) — float literals stay floats (`0.0..1.0` distinct from `0..1`); quoted reserved words parse as strings.
- **Joseph Mearman** ([Mearman](https://github.com/Mearman)) — backslash escapes in strings; operators on array members no longer crash the parser.
- **Joe Grinstead** ([grinstead](https://github.com/grinstead)) — multiline leading comments.

**Mykola Mokhnach** ([mykola-mokhnach](https://github.com/mykola-mokhnach)), the Appium maintainer, has one pull request in this window: resolve an IP when the BiDi connection to the host cannot be established. Worth a name in a mobile sentence.

### Docs, translations, and examples

- **Rondley Gregório** ([Rondleysg](https://github.com/Rondleysg)) — 8 core pull requests, including the move of doc-comment parsing to `comment-parser` and BiDi dialogs limited to the active browsing context. He also stood up the Discord Stack Overflow bot.
- **Filype** ([fpereira1](https://github.com/fpereira1)) — 15 pull requests. Example recipes (clipboard, moving tests off Google), the aria-selector performance warning, guinea-pig cleanup.
- **Alex** ([todti](https://github.com/todti)) — Allure reporter brought up to Allure 3.
- **Jan Molak** ([jan-molak](https://github.com/jan-molak)) — Serenity/JS kept compatible with WebdriverIO 9, and create-wdio / CLI follow-ups.
- **Flavio Barbosa** ([flaviobdev](https://github.com/flaviobdev)) — Brazilian Portuguese docs.
- **HeeSeok Kim** ([HeeSeok-kim](https://github.com/HeeSeok-kim)) — Korean docs.
- **David Chau** ([chauhaidang](https://github.com/chauhaidang)) — Vietnamese locale.
- **Eric Saari** ([esaari](https://github.com/esaari)) — Arabic and Swedish frontmatter that was failing the docs build.

The `i18n` repository's translation pipeline is maintained by Christian Bromann and calls the Anthropic API to produce drafts. Language commits in that repo are mostly that pipeline plus the four people above. A thank-you for translations should name those four and describe the rest as the docs pipeline, so generated language updates are not presented as individual human translations.

### v10 branch, specifically

`v10` is 94 commits ahead of `main` (15 commits on `main` are not in `v10` yet). Authors of the v10-only commits:

| Commits on `v10` not in `main` | Author |
| ---: | --- |
| 76 | Christian Bromann |
| 8 | David Prevost |
| 3 | Plone Mraz |
| 2 | goosewobbler |
| 2 | devangpratap |
| 1 | Mrunal Chaudhari |
| 1 | Matteo Pietro Dazzi ([ilteoood](https://github.com/ilteoood)) — `@puppeteer/browsers` upgrade for a security advisory |
| 1 | Justas Monkev ([JustasMonkev](https://github.com/JustasMonkev)) — soft-assertion service included by the runner |

The release branch is a small group landing breaking changes. The agent-testing theme was built by the 191 people over the two years before that cut. The post should thank the two-year set, and point at this smaller set for the v10 diff itself.

## How to use this in the post

1. Open on the theme (test framework for agents), then introduce the four jobs: docs, drive, debug, assert. The table in the first section is the outline.
2. Name Christian Bromann, Vince Graics, Vishnu Vardhan, goosewobbler, David Prevost, and Wim Selles in the body. Each one maps to a job a reader can understand.
3. Give a sentence each to David Burns (docs agents can read), Mrunal Chaudhari (core reliability and the skill catalog), Taiki Abe (VS Code and BiDi sockets), and Erwin Heitzman (waits and visibility).
4. Thank the MCP cloud-provider authors and the BrowserStack service group as groups, with the individual names in the roll call.
5. Close with the full list of 191. Link the GitHub profile. The representative-work column below is source material, too detailed for the post itself.
6. Leave Dependabot, `github-actions`, and `copilot-swe-agent` out of the thank-you list. Mentioning that dependency updates are automated is enough if the post talks about maintenance load.

Affiliations above come from the company field on the public GitHub profile or from the repository the person was committing to (the BrowserStack service, the TestingBot service). goosewobbler has no public name on GitHub.

## Repositories in the window

Human pull requests are concentrated in a handful of repositories. The rest of the org is boilerplates, catalogs, and dependency traffic.

| Repository | Merged PRs | Human | What it is for the theme |
| --- | ---: | ---: | --- |
| webdriverio | 1,006 | 875 | Framework, `wdio session`, docs, cloud services |
| wdio-wait-for | 410 | 0 | Dependency updates only |
| visual-testing | 389 | 91 | Visual checks, pixelmatch in v10 |
| jasmine-boilerplate | 373 | 1 | Dependency updates; one TypeScript fix from David Prevost |
| expect-webdriverio | 363 | 160 | Assertion library, v10 types |
| desktop-mobile | 339 | 297 | Electron, Tauri, Dioxus, React Native, Electrobun |
| bx | 218 | 0 | Browser script runner. Dependency updates only in this window |
| devtools | 121 | 101 | Live debugger and `trace.zip` |
| mcp | 114 | 44 | MCP server for agents |
| cddl | 104 | 61 | BiDi schema parser and code generation |
| create-wdio (archived repo) | 62 | 3 | Scaffolder. The live package is now inside the monorepo |
| eslint | 56 | 2 | Shared ESLint config |
| expense-action | 53 | 12 | Project expense workflow |
| vscode-webdriverio | 52 | 28 | Editor test runner |
| example-recipes | 28 | 10 | Recipes agents and humans copy |
| i18n | 24 | 4 | Translation pipeline and locale additions |
| driver | 17 | 15 | geckodriver, edgedriver, safaridriver |
| appium-boilerplate | 9 | 7 | Native mobile examples |
| discord-bot | 7 | 1 | Stack Overflow questions posted to Discord |
| awesome-webdriverio | 5 | 3 | Community catalog |
| guinea-pig | 5 | 3 | Fixture site for e2e |
| native-demo-app | 4 | 4 | Expo demo app for Appium |
| selenium-standalone | 3 | 2 | Selenium launcher |
| workshop | 1 | 1 | Hands-on course |

No human commits on the default branch in this window: `query-selector-shadow-dom`, `webdriverio-schematics`, `recorder-extension`, `ionic-demo-app`, `chrome-recorder`, and `codemod`. `brain` and `webdriverio-agent-skills` have commits (Christian Bromann, Mrunal Chaudhari) and no merged pull requests in the search index. `cucumber-boilerplate` has one dependency commit from Christian Bromann on 30 September 2024.

## Every human contributor

191 people, 1,725 merged pull requests. Sorted by count. The representative line is one merged title from this window, preferring a feature or fix over a dependency bump.

| Merged PRs | Name | GitHub | Area | Representative work |
| ---: | --- | --- | --- | --- |
| 302 | — | [goosewobbler](https://github.com/goosewobbler) | Desktop and mobile app services | fix(wdio-xvfb): `autoXvfb` should disable xvfb completely |
| 264 | David Prevost | [dprevost-LMI](https://github.com/dprevost-LMI) | Assertions (expect-webdriverio) | fix(@wdio/runner): Continue emitting event on the runner even when a reporter throws an error |
| 218 | Christian Bromann | [christian-bromann](https://github.com/christian-bromann) | Core framework, docs, and tooling | fix(webdriverio): try/catch dns lookup |
| 119 | Wim Selles | [wswebcreation](https://github.com/wswebcreation) | Visual testing | fix: support windows/mac apps for isDisplayed |
| 107 | Vishnu Vardhan | [vishnuv688](https://github.com/vishnuv688) | DevTools traces and live debugging | [BUG-14514] - Switch frame to an iframe in a Shadow DOM |
| 106 | MRUNAL CHAUDHARI | [mccmrunal](https://github.com/mccmrunal) | Core framework, docs, and tooling | fix(wdio-junit-reporter): correctly detect Cucumber framework in mult… |
| 49 | Vince Graics | [Winify](https://github.com/Winify) | MCP server (agents driving browsers and apps) | fix: Resolve broken markdown link in blog post |
| 39 | — | [mato533](https://github.com/mato533) | VS Code extension | feat(webdriver): support WebSocket options at the BiDi connection |
| 25 | — | [alcpereira](https://github.com/alcpereira) | Visual testing | docs: update docker docs to use official puppeteer image |
| 18 | Noritaka Kobayashi | [noritaka1166](https://github.com/noritaka1166) | Assertions (expect-webdriverio) | refactor: remove unused import |
| 18 | Shubham Garg | [xxshubhamxx](https://github.com/xxshubhamxx) | BrowserStack cloud service | SDK-2064 A11y-Platform-Level-Support |
| 17 | Erwin Heitzman | [erwinheitzman](https://github.com/erwinheitzman) | Core framework, docs, and tooling | polish(webdriverio): remove function call before error |
| 15 | Swastik Baranwal | [Delta456](https://github.com/Delta456) | Core framework and LambdaTest integration | wdio: implement `.entries()` for `ChainablePromiseArray` |
| 15 | Filype | [fpereira1](https://github.com/fpereira1) | Example recipes | README update to use https |
| 15 | Martsin Lazouski | [ML642](https://github.com/ML642) | Core framework, docs, and tooling | fix(webdriverio): respect fetchResponse in mock responses |
| 14 | Sri Harsha | [harsha509](https://github.com/harsha509) | Core framework, docs, and tooling | fix broken link in docs. Fixes #14348 |
| 11 | Rounak Bhatia | [rounak610](https://github.com/rounak610) | BrowserStack cloud service | WDIO-V8 [fixes for consoleLog patch] |
| 10 | Chanatan Charnkijtawarush | [ccharnkij](https://github.com/ccharnkij) | Core framework, docs, and tooling | filter out duplicated nodes |
| 9 | Luis Zurro | [Nyaran](https://github.com/Nyaran) | Core framework, docs, and tooling | fix: Remove unused typings file on sauce service |
| 8 | Kirill Gavrilov | [gavvvr](https://github.com/gavvvr) | Core framework, docs, and tooling | docs: various documentation fixes |
| 8 | Kamalpreet Kaur | [kamal-kaur04](https://github.com/kamal-kaur04) | BrowserStack cloud service | 🐛 Bug Fix: TypeError: fetch failed |
| 8 | Plone Mraz | [PloneMraz](https://github.com/PloneMraz) | Core framework, docs, and tooling | fix(@wdio/utils): share a driver install between concurrent setups |
| 8 | Rondley Gregório | [Rondleysg](https://github.com/Rondleysg) | Core framework, docs, and tooling | fix: fix in docs formatter to accept new types |
| 8 | — | [sauravdas1997](https://github.com/sauravdas1997) | BrowserStack cloud service | Percy binary update |
| 7 | Sourav Kunda | [07souravkunda](https://github.com/07souravkunda) | BrowserStack cloud service | Add performance instrumentation v9 |
| 7 | Aakash Hotchandani | [AakashHotchandani](https://github.com/AakashHotchandani) | BrowserStack cloud service | Fix for isAndroid outside of test |
| 7 | Navin Chandra | [navin772](https://github.com/navin772) | Core framework and LambdaTest integration | fix(webdriverio): handle `closeWindow` for WDIO classic when no window is open |
| 7 | Nikolas Sapalidis | [nikolas-sapa](https://github.com/nikolas-sapa) | Core framework, docs, and tooling | fix(webdriverio): preserve original stale-element error when refetch fails (Fixes #15550) |
| 6 | — | [devangpratap](https://github.com/devangpratap) | Core framework, docs, and tooling | fix(docs): don't fail docs:check when events.webdriver.io is down |
| 6 | Siarhei Kliushnikau | [udarrr](https://github.com/udarrr) | Core framework, docs, and tooling | [WDIO9] added wildcards for cli |
| 5 | Aditya Hirapara | [AdityaHirapara](https://github.com/AdityaHirapara) | BrowserStack cloud service | [v8] Bug Fix: missing Platform version on BrowserStack Observability |
| 5 | David Burns | [AutomatedTester](https://github.com/AutomatedTester) | Core framework, docs, and tooling | fix(docs): unbreak non-English docs builds after flowchart component removal |
| 5 | — | [Badisi](https://github.com/Badisi) | Core framework, docs, and tooling | fix(#14368): desync puppeteer-core peer-dep version |
| 5 | Дамян Минков | [damencho](https://github.com/damencho) | Core framework, docs, and tooling | fix: Fixes isDisplayed to always use default params for checkVisibility. |
| 5 | Edgars Eglītis | [eglitise](https://github.com/eglitise) | Core framework, docs, and tooling | docs(@wdio/junit-reporter): update readme |
| 5 | Fabien CELLIER | [lacell75](https://github.com/lacell75) | Core framework, docs, and tooling | v8: fix(webdriverio): remove default params in actions |
| 5 | — | [lucasmariano003-wq](https://github.com/lucasmariano003-wq) | Core framework, docs, and tooling | fix(utils): include execution context in timeout errors |
| 4 | bhargavi vaidya | [Bhargavi-BS](https://github.com/Bhargavi-BS) | BrowserStack cloud service | Added support for running accessibility on Non-browserstack infrastructure [v8] |
| 4 | Dragos Campean | [dragosMC91](https://github.com/dragosMC91) | Core framework, docs, and tooling | Fix isClickable auto-scroll (#14288) |
| 4 | Fábio Correia | [fabioatcorreia](https://github.com/fabioatcorreia) | Visual testing | fix: android deepLink using package instead of packageName |
| 4 | Jan Molak | [jan-molak](https://github.com/jan-molak) | Core framework, docs, and tooling | fix(@wdio/cli): Serenity/JS supports WebdriverIO 9 |
| 4 | Jochen | [jochen-testingbot](https://github.com/jochen-testingbot) | Core framework, docs, and tooling | Add setAnnotation to TestingBot service |
| 4 | JustasM | [JustasMonkev](https://github.com/JustasMonkev) | Core framework, docs, and tooling | feat(wdio-runner): automatically include SoftAssertionService |
| 4 | Kauan Barbosa | [Kauanldsbarbosa](https://github.com/Kauanldsbarbosa) | Core framework, docs, and tooling | feat: adding check in normalizeDoc function to make sure readmeArr is of string type |
| 4 | Luke | [NaamuKim](https://github.com/NaamuKim) | Core framework, docs, and tooling | fix(attach-params): user options should override detectBackend |
| 4 | Avron Souto | [Norva-bugged](https://github.com/Norva-bugged) | Core framework, docs, and tooling | feat(cucumber): Backport Distinguishing Cucumber PENDING status to v8 |
| 4 | Alex | [todti](https://github.com/todti) | Core framework, docs, and tooling | Update wdio-allure-reporter for Allure 3 |
| 3 | Amaan Hakim | [amaanbs](https://github.com/amaanbs) | BrowserStack cloud service | Build Unification - WDIO Mocha, Cucumber, Jasmine - Browserstack Test Observability, Accessibility & Percy |
| 3 | Anish Kumar Sinha | [anish353](https://github.com/anish353) | BrowserStack cloud service | Passed testName to performScanCli and performA11yScan to forward it to AppA11y. |
| 3 | Fnine59 | [Fnine59](https://github.com/Fnine59) | Core framework, docs, and tooling | fix(wdio-utils): track dialog listener lifecycle |
| 3 | Jainam Shah | [jainam-bs](https://github.com/jainam-bs) | BrowserStack cloud service | Changes to send SDK instrumentation in capabilities v7 |
| 3 | — | [jbblanchet](https://github.com/jbblanchet) | Core framework, docs, and tooling | Smoke test cucumber snapshot |
| 3 | Dmitriy Mukhin | [mitya555](https://github.com/mitya555) | Core framework, docs, and tooling | fix(@wdio/browserstack-service): node fetch() failure over HTTPS_PROXY=<proxy_url> setup |
| 3 | YASH JAIN | [osho-20](https://github.com/osho-20) | BrowserStack cloud service | Redacted Data from logs |
| 3 | — | [P-Courteille](https://github.com/P-Courteille) | Visual testing | Issue 983 for main |
| 3 | Pranay Varma | [pranay-v29](https://github.com/pranay-v29) | BrowserStack cloud service | Exhaustive logging for better capability flow debug |
| 3 | — | [Tanmay-Bstack](https://github.com/Tanmay-Bstack) | BrowserStack cloud service |  Support added for change in product name:- Observability -> Test Reporting and Analytics v9 |
| 2 | Abdel | [abdel-ships-it](https://github.com/abdel-ships-it) | Assertions (expect-webdriverio) | refactor(typings): revert change #1888 |
| 2 | Akanksha singh | [akanksha1909](https://github.com/akanksha1909) | BrowserStack cloud service | v7: Fix Percy instrumentation |
| 2 | Alex Parish | [alexparish](https://github.com/alexparish) | Core framework, docs, and tooling | Remove unused cli-spinners dependency |
| 2 | — | [alphabetkrish](https://github.com/alphabetkrish) | Core framework, docs, and tooling | updated the latest version number |
| 2 | Amiya Pattanaik | [amiya-pattnaik](https://github.com/amiya-pattnaik) | Core framework, docs, and tooling | Update BoilerplateProjects.md |
| 2 | Arundoss | [Arundoss-digitalai](https://github.com/Arundoss-digitalai) | MCP server (agents driving browsers and apps) | fix(digitalai): support mobile browser sessions, fix doc parity gaps |
| 2 | Brian Birtles | [birtles](https://github.com/birtles) | Core framework, docs, and tooling | fix(webdriverio): escape scripts in addInitScript |
| 2 | Aaron_Zhou | [Clarkkkk](https://github.com/Clarkkkk) | MCP server (agents driving browsers and apps) | fix(tauri): use CSS pixels for embedded window rect |
| 2 | Rahul Dandona | [dandonarahul2002](https://github.com/dandonarahul2002) | BrowserStack cloud service | Jasmine session name marking bstack |
| 2 | — | [fetsorn](https://github.com/fetsorn) | Core framework, docs, and tooling | Fix typo in docs Appium.md |
| 2 | — | [harshit-browserstack](https://github.com/harshit-browserstack) | BrowserStack cloud service | fix(wdio-browserstack-service): ship a11y Browser type augmentations |
| 2 | Uros Ivanovic | [ivanovicu](https://github.com/ivanovicu) | Core framework, docs, and tooling | Fix/ getCSSProperty implicit wait on stale element |
| 2 | Jens Kuhr Hansen | [jenskuhrjorgensen](https://github.com/jenskuhrjorgensen) | Core framework, docs, and tooling | Fix moduleLoaderFlag |
| 2 | Kyle Brooks | [kbrooks](https://github.com/kbrooks) | Core framework, docs, and tooling | fix(browserstack-service): restore boolean product map types |
| 2 | Mauricio Lauffer | [mauriciolauffer](https://github.com/mauriciolauffer) | Core framework, docs, and tooling | docu: fix wdio/utils description |
| 2 | Joseph Mearman | [Mearman](https://github.com/Mearman) | CDDL / WebDriver BiDi types | fix: resolve backslash-escaped characters in string literals |
| 2 | Minav Karia | [minavkaria-bs](https://github.com/minavkaria-bs) | BrowserStack cloud service | V9 username accesskey redaction |
| 2 | ned | [nathom791](https://github.com/nathom791) | MCP server (agents driving browsers and apps) | feat:  bidi install/uninstall extension |
| 2 | Ricardo Barbosa | [nextlevelbeard](https://github.com/nextlevelbeard) | Core framework, docs, and tooling | fix(@wdio/utils): Unset geckodriver when stable is set as browserVersion |
| 2 | — | [nheiser](https://github.com/nheiser) | Core framework, docs, and tooling | Fix isElementDisplayed and isElementClickable on Perfecto Mobile Devices |
| 2 | Mohamed Nishath N | [nishath-bs](https://github.com/nishath-bs) | BrowserStack cloud service | Accessibility Support for Browserstack app automate sessions |
| 2 | Ned Thompson | [nthompson-bitwarden](https://github.com/nthompson-bitwarden) | MCP server (agents driving browsers and apps) | feat(electron): add session-scoped API mocking tools |
| 2 | Priyanka Gadhiya | [pri-gadhiya](https://github.com/pri-gadhiya) | BrowserStack cloud service | Added changes to skip tests for mocha framework for browserstack session |
| 2 | Pritish Chugh | [Pritishchugh22](https://github.com/Pritishchugh22) | BrowserStack cloud service | [v9] Implement BrowserStack CLI support in browserstack service |
| 2 | — | [rbronz](https://github.com/rbronz) | Core framework, docs, and tooling | fix(docs): resolving broken sauce connect proxy link |
| 2 | Romain Menke | [romainmenke](https://github.com/romainmenke) | Core framework, docs, and tooling | fix(webdriverio): write polyfill script as ES3 |
| 2 | Samuel Freiberg | [samuelfreiberg](https://github.com/samuelfreiberg) | Core framework, docs, and tooling | Fix Windows Automation on WebDriverIO V9 |
| 2 | Steve Hall | [sh41](https://github.com/sh41) | Core framework, docs, and tooling | tsConfigPath in wdio.conf |
| 2 | Shivam Kumar | [shivamku-BS](https://github.com/shivamku-BS) | BrowserStack cloud service | Fix/wdio reloadsession finishedmetadata |
| 2 | Simon Markowski | [smarkows](https://github.com/smarkows) | Core framework, docs, and tooling | fix(webdriver): #14622 added ability to proxy websocket connections |
| 2 | Titus Fortner | [titusfortner](https://github.com/titusfortner) | CDDL / WebDriver BiDi types | fix(cddl): preserve float literals so (0.0..1.0) is distinct from (0..1) |
| 2 | — | [uladhsi](https://github.com/uladhsi) | Core framework, docs, and tooling | feat: do not attach prefs when debuggerAddress is specified (v8) |
| 2 | Mykyta Chursin | [unickq](https://github.com/unickq) | Core framework, docs, and tooling | chore(@wdio/spec-reporter): file name print format |
| 2 | — | [vipin-bs](https://github.com/vipin-bs) | BrowserStack cloud service | V9 feature smartselection |
| 2 | Will Stone | [will-stone](https://github.com/will-stone) | Core framework, docs, and tooling | fix: unexpected token '?' on older browsers |
| 1 | Andrew Boyton | [aboyton](https://github.com/aboyton) | Example recipes | Fix the parent element example in the XPath section |
| 1 | Agnes Au | [Agnes-Au](https://github.com/Agnes-Au) | Core framework, docs, and tooling | fix(docs): correct typos and improve clarity in Best Practices guide |
| 1 | Ben Atkinson | [apuck](https://github.com/apuck) | MCP server (agents driving browsers and apps) | feat: add switch_frame tool for iframe navigation |
| 1 | Artem Sukhinin | [ArtMathArt](https://github.com/ArtMathArt) | Core framework, docs, and tooling | change gridProxyDetails request from GET to POST method |
| 1 | Aswin Chembath | [aswinchembath](https://github.com/aswinchembath) | Core framework, docs, and tooling | Update-addingreporter |
| 1 | — | [b-kirby](https://github.com/b-kirby) | Core framework, docs, and tooling | fix: update waitForExist function to maintain elementIds for shadow e… |
| 1 | — | [bgrozev](https://github.com/bgrozev) | Core framework, docs, and tooling | fix: Allow specFileRetries to be overriden in the beforeSession hook |
| 1 | -bimlote- | [bimlote](https://github.com/bimlote) | Core framework, docs, and tooling | docs: update service-options broken links |
| 1 | Boris Osipov | [BorisOsipov](https://github.com/BorisOsipov) | Core framework, docs, and tooling | fix(ci) group dependabot PRs by version type |
| 1 | Josh Patsey | [brickfungus](https://github.com/brickfungus) | Assertions (expect-webdriverio) | Make sure toBeElementsArrayOfSize doesn't delete passed in array |
| 1 | Michał Budziak | [budziam](https://github.com/budziam) | Core framework, docs, and tooling | Add support for Sauce Connect 5, drop support for Sauce Connect 4 |
| 1 | David Chau | [chauhaidang](https://github.com/chauhaidang) | Documentation translations | Add Vietnamese language to constants.ts |
| 1 | Craig Sirota | [csirota97](https://github.com/csirota97) | Core framework, docs, and tooling | Fix grammar of error message |
| 1 | Luca Müller | [cuvar](https://github.com/cuvar) | Core framework, docs, and tooling | fix(webdriverio): typo in keys description |
| 1 | Rayan Salhab | [cyphercodes](https://github.com/cyphercodes) | Core framework, docs, and tooling | fix(wdio-utils): use supported EdgeDriver CDN |
| 1 | — | [daksh-r](https://github.com/daksh-r) | Core framework, docs, and tooling | v7: Auto Enable Percy for Automate |
| 1 | Daniel Jacobs | [danielhjacobs](https://github.com/danielhjacobs) | Core framework, docs, and tooling | Allow transformation from classic tag name selector to BiDi |
| 1 | Dhruvin Mehta | [dhruvin-bs](https://github.com/dhruvin-bs) | BrowserStack cloud service | fix: failed test reporting on observability |
| 1 | Diego Molina | [diemol](https://github.com/diemol) | Core framework, docs, and tooling | Fixing typo during wdio config wizard |
| 1 | Erin | [dlowzzxx](https://github.com/dlowzzxx) | Core framework, docs, and tooling | fix(webdriverio): avoid blocked Firefox mock responses |
| 1 | Dory | [DoreyKiss](https://github.com/DoreyKiss) | Core framework, docs, and tooling | add browserstack camera-image-injection to wdio-types capabilities |
| 1 | Dmytro 🇺🇦 | [DQRI](https://github.com/DQRI) | Core framework, docs, and tooling | fix(@wdio/local-runner): added graceful exit on SIGINT |
| 1 | Dmitriy Dudkevich | [DudaGod](https://github.com/DudaGod) | Core framework, docs, and tooling | feat(webdriver): send headers when connect to bidi protocol |
| 1 | Adi Dziurdzikowski | [Dziurdzikowski](https://github.com/Dziurdzikowski) | Core framework, docs, and tooling | fix(webdriverio): Fix request mock with hostname only not working |
| 1 | Millan Kaul | [eaccmk](https://github.com/eaccmk) | Core framework, docs, and tooling | Fix Visual Testing URL path |
| 1 | Yevhen Laichenkov | [elaichenkov](https://github.com/elaichenkov) | Core framework, docs, and tooling | fix: add afterEach cleanup to context management E2E tests |
| 1 | Erkan Erol | [erkanerol](https://github.com/erkanerol) | Core framework, docs, and tooling | Add "appium:webviewAtomWaitTimeout" to AppiumXCUITestCapabilities |
| 1 | Eric Saari | [esaari](https://github.com/esaari) | Documentation translations | fix: Remove empty/null `description` properties for AR and SV |
| 1 | faiz | [fbmcipher](https://github.com/fbmcipher) | MCP server (agents driving browsers and apps) | feat: attach to existing WebDriver sessions |
| 1 | Flavio Barbosa | [flaviobdev](https://github.com/flaviobdev) | Core framework, docs, and tooling | update: translate doc to pt-br |
| 1 | Dmitrii | [formaceft-93](https://github.com/formaceft-93) | Core framework, docs, and tooling | Add title path |
| 1 | — | [franklincg](https://github.com/franklincg) | CDDL / WebDriver BiDi types | fix(cddl): parse ? occurrence as zero-or-one |
| 1 | Roman | [gameroman](https://github.com/gameroman) | Core framework, docs, and tooling | ci: run tests on Node 24 and 26 |
| 1 | Joe Grinstead | [grinstead](https://github.com/grinstead) | CDDL / WebDriver BiDi types | Handle multiline leading comments |
| 1 | Harish Kumar | [harry-harish](https://github.com/harry-harish) | Community catalog | Add tracelane to Services |
| 1 | HeeSeok-kim | [HeeSeok-kim](https://github.com/HeeSeok-kim) | Documentation translations | Add Korean language support to documentation |
| 1 | Haseeb Nazir | [iamhaseebn](https://github.com/iamhaseebn) | Core framework, docs, and tooling | fix(webdriverio): clear shadow roots when navigation starts |
| 1 | Ian Renauld | [ianrenauld](https://github.com/ianrenauld) | Core framework, docs, and tooling | docs: mention that Chrome DevTools protocol is not installed by default and what package is required |
| 1 | Ilia Choly | [icholy](https://github.com/icholy) | Core framework, docs, and tooling | docs: add page for waitForResponse mock method |
| 1 | Matteo Pietro Dazzi | [ilteoood](https://github.com/ilteoood) | Core framework, docs, and tooling | breaking(wdio-utils): upgrade @puppeteer/browsers to v3 (CVE-2026-19693) |
| 1 | Jack VanSickle | [jackvansickle1](https://github.com/jackvansickle1) | Core framework, docs, and tooling | feat(utils): support conditional worker service activation |
| 1 | Jason Cantfell | [jcantfell](https://github.com/jcantfell) | Core framework, docs, and tooling | Add Roku service to default services |
| 1 | Jesse Hines | [jesse-r-s-hines](https://github.com/jesse-r-s-hines) | Core framework, docs, and tooling | Add wdio-obsidian-service to docs and cli |
| 1 | Johannes | [johant87](https://github.com/johant87) | Assertions (expect-webdriverio) | fix: missing type in array to have text |
| 1 | jonathan terry | [jonyet](https://github.com/jonyet) | Core framework, docs, and tooling | updating constants and services lists with wdio-roku-service refs |
| 1 | Randolf J. | [jrandolf](https://github.com/jrandolf) | Core framework, docs, and tooling | fix(tauri): guarantee teardown on failed standalone startup and await embedded cleanup |
| 1 | Kaan Çelebi | [kaanisthatyou](https://github.com/kaanisthatyou) | Core framework, docs, and tooling | fix(@wdio/browser-runner): import custom Vite and Stencil config files via file URLs |
| 1 | Kitsios Konstantinos | [kitsiosk](https://github.com/kitsiosk) | Core framework, docs, and tooling | ci: skip test suite for pushes that change only markdown files |
| 1 | Krish Pavuluri | [krishtoautomate](https://github.com/krishtoautomate) | Core framework, docs, and tooling | docs: add RobotActions to the cloud services page |
| 1 | Roman Kuznetsov | [KuznetsovRoman](https://github.com/KuznetsovRoman) | Core framework, docs, and tooling | fix(wdio-utils): compose element command overrides |
| 1 | — | [la122](https://github.com/la122) | Core framework, docs, and tooling | Add undefined to getInstance as possible return type |
| 1 | Marcel | [lezram](https://github.com/lezram) | Core framework, docs, and tooling | fix(mocha-framework): report spec load error as failure in `after` hook |
| 1 | Lorenas | [lorenaskosinskas](https://github.com/lorenaskosinskas) | Core framework, docs, and tooling | fix(@wdio/local-runner): retry spec files when session creation fails |
| 1 | Luan Taraschi | [luantaraschi](https://github.com/luantaraschi) | Core framework, docs, and tooling | fix(@wdio/utils): keep an undefined element that passes filter |
| 1 | Raul Macarie | [macarie](https://github.com/macarie) | Core framework, docs, and tooling | fix(webdriverio): get absolute paths using native `path.resolve` |
| 1 | Marcel Veselka | [marcel-veselka](https://github.com/marcel-veselka) | Community catalog | Add wopee.wdio to Services |
| 1 | Cesar Montoya | [mcwanza](https://github.com/mcwanza) | Core framework, docs, and tooling | fix(allure-reporter): classify AssertionError by error name property |
| 1 | Marc Hassan | [mhassan1](https://github.com/mhassan1) | Core framework, docs, and tooling | fix(webdriverio): make name polyfill compatible with old browsers |
| 1 | Mihir Rawool | [MihirR-BS](https://github.com/MihirR-BS) | BrowserStack cloud service | [browserstack-service] Add Load Testing Service (LTS) support |
| 1 | Dimitar Mihaylov | [mitk0936](https://github.com/mitk0936) | Core framework, docs, and tooling | fix(@wdio/types): allow grouped specs in capability wdio:specs |
| 1 | Michael Naumov | [mnaoumov](https://github.com/mnaoumov) | Core framework, docs, and tooling | fix(webdriver): guard Object.keys call on stringified request body |
| 1 | Michael Scrivo | [mscrivo](https://github.com/mscrivo) | Core framework, docs, and tooling | fix: TypeScript 7 compatibility |
| 1 | Mykola Mokhnach | [mykola-mokhnach](https://github.com/mykola-mokhnach) | Core framework, docs, and tooling | fix: Try to resolve ip addresses if no BiDi connection to the host could be established |
| 1 | Taro.Nonoyama | [n2-freevas](https://github.com/n2-freevas) | Visual testing | fix: prevent false emulation detection inside iframe context |
| 1 | — | [nair-sumesh](https://github.com/nair-sumesh) | Core framework, docs, and tooling | fix(junit-reporter): improve error handling and skipped test reportin… |
| 1 | Netzulo | [netzulo](https://github.com/netzulo) | MCP server (agents driving browsers and apps) | Extend session startup tools with capability passthrough for browser and Appium/mobile flows#1 |
| 1 | Nikos Lytras | [nikoslytras](https://github.com/nikoslytras) | Core framework, docs, and tooling | fix(webdriver): handle large images on screenshot (fix for 14489 bug) |
| 1 | — | [omjadas](https://github.com/omjadas) | Core framework, docs, and tooling | fix(webdriver): pass all options to fetch |
| 1 | Payman Delshad | [paymand](https://github.com/paymand) | Core framework, docs, and tooling | fix(element): improve checkVisibility fallback handling in element.isDisplayed |
| 1 | Nathan Zhao | [phantomwolf](https://github.com/phantomwolf) | Core framework, docs, and tooling | fix(webdriverio): don't print error when swithcing to an existing window |
| 1 | Carlo Jeske | [plusgut](https://github.com/plusgut) | Visual testing | fix(disableBlinkingCursor): caret-color was not applied in shadowdom … |
| 1 | Pokdeep Sandhu | [pokdeep](https://github.com/pokdeep) | Core framework, docs, and tooling | fix(webdriver): invoke terminate on all unsuccessful websocket candidates |
| 1 | Regan Karlewicz | [regan-karlewicz](https://github.com/regan-karlewicz) | Core framework, docs, and tooling | chore: Update services.json to add TV Labs service |
| 1 | Mark | [remarkablemark](https://github.com/remarkablemark) | Selenium Standalone launcher | fix: replace `azureedge.net` with `microsoft.com` |
| 1 | ricardo larrahondo | [ricardorlg](https://github.com/ricardorlg) | Core framework, docs, and tooling | fix(webdriverio): add 'appium:options' when checking for native context |
| 1 | RITWICK RAJ MAKHAL | [ritwickrajmakhal](https://github.com/ritwickrajmakhal) | Core framework, docs, and tooling | fix: update React logo and alt text for accessibility |
| 1 | Rodrigo Rodriguez | [RodBuild](https://github.com/RodBuild) | Assertions (expect-webdriverio) | ToHaveStyle improvement |
| 1 | Sai Krishna | [saikrishna321](https://github.com/saikrishna321) | Core framework and LambdaTest integration | fix: Close appium server onComplete completly |
| 1 | — | [Sandi2212](https://github.com/Sandi2212) | Core framework, docs, and tooling | fix(docs): resolving broken github actions links |
| 1 | Changsu Seong | [scs0209](https://github.com/scs0209) | Core framework, docs, and tooling | chore(deps): update archiver to v8 |
| 1 | Liliyan Krumov | [segfaultincoming](https://github.com/segfaultincoming) | Assertions (expect-webdriverio) | Fix import of the softAssert library |
| 1 | Shrey Shekhar | [sh011](https://github.com/sh011) | Core framework, docs, and tooling | fix(webdriverio): fix AI assistant reset button overlap with scrollbar |
| 1 | Vladimir | [sheremet-va](https://github.com/sheremet-va) | Core framework, docs, and tooling | fix: avoid starting a timeout if the timer was resolved immediately |
| 1 | Shiv Jirwankar | [shiv-jirwankar](https://github.com/shiv-jirwankar) | Core framework, docs, and tooling | fix: typos on readme |
| 1 | Shixi Li | [shixi-li](https://github.com/shixi-li) | Core framework, docs, and tooling | fix: respect WEBDRIVER_CACHE_DIR during driver setup |
| 1 | Sindhu Pullapantula | [sindhupullapantula](https://github.com/sindhupullapantula) | BrowserStack cloud service | Add URLs to Browserstack WebDriverIO services |
| 1 | Simon Coen | [Siolto](https://github.com/Siolto) | Core framework, docs, and tooling | docs: add note about WebDriver Bidi support in browser.url command |
| 1 | JinHyuk Sung | [sjh9714](https://github.com/sjh9714) | Core framework, docs, and tooling | fix mock calls postData |
| 1 | Sven | [sventschui](https://github.com/sventschui) | Core framework, docs, and tooling | fix(@wdio/allure-reporter): Encode HTML entities |
| 1 | Syamphaneendra Kalluri | [syamphaneendra](https://github.com/syamphaneendra) | Core framework, docs, and tooling | Add WebdriverIO 9 Mobile Automation Boilerplate with Appium |
| 1 | Brad DerManouelian | [therealbrad](https://github.com/therealbrad) | Core framework, docs, and tooling | docs: add TestPlanIt Reporter to 3rd-party reporters list |
| 1 | Ulises Gascón | [UlisesGascon](https://github.com/UlisesGascon) | Core framework, docs, and tooling | docs: add security escalation policy |
| 1 | Vansh Sukhija | [VanshSukhija](https://github.com/VanshSukhija) | MCP server (agents driving browsers and apps) | fix(saucelabs): preserve user sauce:options and omit empty tunnelName |
| 1 | Vitor de Mello Freitas | [vitmf](https://github.com/vitmf) | Core framework, docs, and tooling | docs: improve browser.keys documentation |
| 1 | — | [vjuturu](https://github.com/vjuturu) | Core framework, docs, and tooling | updated spec reporter readme - sharable links value with valid sauce sharable link |
| 1 | Volodymyr Parlah | [vparlah](https://github.com/vparlah) | Core framework, docs, and tooling | fix: Mobile Swipe - percentage calculation issue |
| 1 | Will Brock | [WillBrock](https://github.com/WillBrock) | Core framework, docs, and tooling | Fix for doc block with ** |
| 1 | Yash Lunawat | [Yash121l](https://github.com/Yash121l) | Core framework, docs, and tooling | fix(webdriverio): allow URLPattern as browser.mock url |
| 1 | Shirsh Zibbu | [zhirzh](https://github.com/zhirzh) | Core framework, docs, and tooling | fix `wdio repl` when run with multiremote capabilities |
