# Changelog

> **Tags:**
> - :boom:       [Breaking Change]
> - :eyeglasses: [Spec Compliancy]
> - :rocket:     [New Feature]
> - :bug:        [Bug Fix]
> - :memo:       [Documentation]
> - :house:      [Internal]
> - :nail_care:  [Polish]

_Note: Gaps between patch versions are faulty, broken or test releases._

See [CHANGELOG - v4](https://github.com/webdriverio-boneyard/v4/blob/master/CHANGELOG.md).

See [CHANGELOG - v5](https://github.com/webdriverio/webdriverio/blob/v5/CHANGELOG.md).

See [CHANGELOG - v6](https://github.com/webdriverio/webdriverio/blob/v6/CHANGELOG.md)

See [CHANGELOG - v7](https://github.com/webdriverio/webdriverio/blob/v7/CHANGELOG.md)

See [CHANGELOG - v8](https://github.com/webdriverio/webdriverio/blob/v8/CHANGELOG.md)

---

## v9.2.4 (2024-10-28)

#### :bug: Bug Fix
* `webdriverio`
  * [#13814](https://github.com/webdriverio/webdriverio/pull/13814) fix(webdriverio): enhance protocol stub to allow context initialization ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.2.2 (2024-10-28)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-cli`, `wdio-config`, `wdio-local-runner`, `wdio-spec-reporter`, `webdriver`, `webdriverio`
  * [#13781](https://github.com/webdriverio/webdriverio/pull/13781) fix(webdriverio): improve switchFrame behavior ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#13805](https://github.com/webdriverio/webdriverio/pull/13805) fix(webdriver): allow WebdriverIO to handle alerts ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browser-runner`, `webdriver`
  * [#13782](https://github.com/webdriverio/webdriverio/pull/13782) fix(@wdio/browser-runner): publish Mocha assets as part of package ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#13798](https://github.com/webdriverio/webdriverio/pull/13798) fix(webdriverio): Misfound elements when using WebDriver BiDi ([@nextlevelbeard](https://github.com/nextlevelbeard))
  * [#13800](https://github.com/webdriverio/webdriverio/pull/13800) reorder shadowroot removal ([@ccharnkij](https://github.com/ccharnkij))
  * [#13772](https://github.com/webdriverio/webdriverio/pull/13772) fix(webdriverio): ensure BiDi browsingContext is updated after switchToWindow ([@harsha509](https://github.com/harsha509))
  * [#13760](https://github.com/webdriverio/webdriverio/pull/13760) Prevent switchWindow from switching on invalid window requested ([@gavvvr](https://github.com/gavvvr))
* `wdio-browserstack-service`
  * [#13773](https://github.com/webdriverio/webdriverio/pull/13773) 🐛 Bug Fix: TypeError: fetch failed ([@kamal-kaur04](https://github.com/kamal-kaur04))
* `wdio-types`, `webdriverio`
  * [#13777](https://github.com/webdriverio/webdriverio/pull/13777) fix(webdriverio): wait for request information to come in ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#13768](https://github.com/webdriverio/webdriverio/pull/13768) Fix moduleLoaderFlag ([@jenskuhrjorgensen](https://github.com/jenskuhrjorgensen))

#### :nail_care: Polish
* `wdio-appium-service`
  * [#13804](https://github.com/webdriverio/webdriverio/pull/13804) chore(@wdio/appium-service): log to stdout if no log path is set ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-protocols`
  * [#13806](https://github.com/webdriverio/webdriverio/pull/13806) feat(wdio-protocols): extend BiDi type definitions ([@harsha509](https://github.com/harsha509))
* `webdriverio`
  * [#13793](https://github.com/webdriverio/webdriverio/pull/13793) feat: enhance newWindow function to support 'tab' or 'window' types ([@harsha509](https://github.com/harsha509))

#### :memo: Documentation
* `webdriverio`
  * [#13802](https://github.com/webdriverio/webdriverio/pull/13802) fix(webdriverio): typo in keys description ([@cuvar](https://github.com/cuvar))
  * [#13794](https://github.com/webdriverio/webdriverio/pull/13794) docs(browser.mock): remove outdated parameter comment ([@Delta456](https://github.com/Delta456))
* Other
  * [#13795](https://github.com/webdriverio/webdriverio/pull/13795) rename `attachSession` to `attachToSession` ([@navin772](https://github.com/navin772))
  * [#13797](https://github.com/webdriverio/webdriverio/pull/13797) docs(BACKERS.md): fix LambdaTest logo link ([@Delta456](https://github.com/Delta456))
  * [#13758](https://github.com/webdriverio/webdriverio/pull/13758) docs: Updated examples guide to mention PNPM for setup instead of NPM ([@gavvvr](https://github.com/gavvvr))
  * [#13761](https://github.com/webdriverio/webdriverio/pull/13761) docs: correct links to flowcharts ([@gavvvr](https://github.com/gavvvr))

#### :house: Internal
* [#13792](https://github.com/webdriverio/webdriverio/pull/13792) add missing test:e2e script to package.json ([@harsha509](https://github.com/harsha509))

#### Committers: 11
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jens Kuhr Jørgensen ([@jenskuhrjorgensen](https://github.com/jenskuhrjorgensen))
- Kamalpreet Kaur ([@kamal-kaur04](https://github.com/kamal-kaur04))
- Kirill Gavrilov ([@gavvvr](https://github.com/gavvvr))
- Luca Müller ([@cuvar](https://github.com/cuvar))
- Navin Chandra ([@navin772](https://github.com/navin772))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))
- Sri Harsha ([@harsha509](https://github.com/harsha509))
- Swastik Baranwal ([@Delta456](https://github.com/Delta456))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.2.0 (2024-10-12)

#### :house: Internal
* `wdio-runner`
  * [#13756](https://github.com/webdriverio/webdriverio/pull/13756) Remove unused gaze dependency ([@alexparish](https://github.com/alexparish))

#### Committers: 2
- Alex Parish ([@alexparish](https://github.com/alexparish))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.1.6 (2024-10-10)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#13754](https://github.com/webdriverio/webdriverio/pull/13754) fix(@wdio/browser-runner): use expect v30 beta ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.1.5 (2024-10-10)

#### :bug: Bug Fix
* `webdriver`, `webdriverio`
  * [#13753](https://github.com/webdriverio/webdriverio/pull/13753) fix(webdriverio): selector engine improvements ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.1.4 (2024-10-09)

#### :bug: Bug Fix
* `webdriverio`
  * [#13751](https://github.com/webdriverio/webdriverio/pull/13751) fix(webdriverio): make name polyfill compatible with old browsers ([@mhassan1](https://github.com/mhassan1))

#### Committers: 2
- Marc Hassan ([@mhassan1](https://github.com/mhassan1))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.1.3 (2024-10-08)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-logger`, `webdriverio`
  * [#13746](https://github.com/webdriverio/webdriverio/pull/13746) fix(webdriverio): make command more compatible with v8 behavior ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#13731](https://github.com/webdriverio/webdriverio/pull/13731) fix(webdriverio): mark mock as being called even without overwrites ([@christian-bromann](https://github.com/christian-bromann))
  * [#13695](https://github.com/webdriverio/webdriverio/pull/13695) fix(webdriverio): apply script polyfills also for classic sessions ([@christian-bromann](https://github.com/christian-bromann))
  * [#13730](https://github.com/webdriverio/webdriverio/pull/13730) fix(webdriverio): remove default params in actions ([@lacell75](https://github.com/lacell75))
  * [#13694](https://github.com/webdriverio/webdriverio/pull/13694) Allow transformation from classic tag name selector to BiDi ([@danielhjacobs](https://github.com/danielhjacobs))
* `wdio-sauce-service`, `wdio-spec-reporter`
  * [#13701](https://github.com/webdriverio/webdriverio/pull/13701) fix(@wdio/sauce-service): fix setting annotations ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#13744](https://github.com/webdriverio/webdriverio/pull/13744) chore(webdriverio): provide a better error message if no debuggerAddress is available ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#13736](https://github.com/webdriverio/webdriverio/pull/13736) chore(webdriver): add exponential backoff to request retries ([@romainmenke](https://github.com/romainmenke))

#### :house: Internal
* `wdio-browser-runner`
  * [#13720](https://github.com/webdriverio/webdriverio/pull/13720) chore(deps): bump the minor-deps-updates-main group with 4 updates ([@dependabot[bot]](https://github.com/apps/dependabot))
* Other
  * [#13717](https://github.com/webdriverio/webdriverio/pull/13717) fix(ci) group dependabot PRs by version type ([@BorisOsipov](https://github.com/BorisOsipov))

#### Committers: 5
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Daniel Jacobs ([@danielhjacobs](https://github.com/danielhjacobs))
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))
- Romain Menke ([@romainmenke](https://github.com/romainmenke))


## v9.1.2 (2024-09-28)

#### :bug: Bug Fix
* `webdriverio`
  * [#13669](https://github.com/webdriverio/webdriverio/pull/13669) fix(webdriverio): fix execute command when passing in a string ([@christian-bromann](https://github.com/christian-bromann))
  * [#13668](https://github.com/webdriverio/webdriverio/pull/13668) fix(webdriverio): fix mock filtering ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`
  * [#13665](https://github.com/webdriverio/webdriverio/pull/13665) Reject promise if test is skipped via async method ([@sebastian-sauer](https://github.com/sebastian-sauer))

#### :nail_care: Polish
* `wdio-types`, `webdriver`
  * [#13667](https://github.com/webdriverio/webdriverio/pull/13667) chore(webdriver): refactor request/response error handling ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-sauce-service`, `wdio-spec-reporter`, `wdio-types`, `webdriverio`
  * [#13666](https://github.com/webdriverio/webdriverio/pull/13666) Removing APAC region ([@diemol](https://github.com/diemol))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Diego Molina ([@diemol](https://github.com/diemol))
- [@sebastian-sauer](https://github.com/sebastian-sauer)


## v9.1.1 (2024-09-26)

#### :bug: Bug Fix
* `webdriver`
  * [#13660](https://github.com/webdriverio/webdriverio/pull/13660) fix(webdriver): also retry on various error codes ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#13659](https://github.com/webdriverio/webdriverio/pull/13659) fix(webdriverio): better handle context switches ([@christian-bromann](https://github.com/christian-bromann))
  * [#13657](https://github.com/webdriverio/webdriverio/pull/13657) fix(webdriverio): recognise shadow tree after context reload ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-junit-reporter`
  * [#13650](https://github.com/webdriverio/webdriverio/pull/13650) [junit-reporter] compare files ignoring case on win32 ([@sebastian-sauer](https://github.com/sebastian-sauer))

#### :nail_care: Polish
* `wdio-local-runner`
  * [#13655](https://github.com/webdriverio/webdriverio/pull/13655) chore: improve log formatting for args ([@alcpereira](https://github.com/alcpereira))

#### :memo: Documentation
* [#13653](https://github.com/webdriverio/webdriverio/pull/13653) fix(build): website build issue on windows ([@amardeep2006](https://github.com/amardeep2006))

#### Committers: 4
- Amar Deep Singh ([@amardeep2006](https://github.com/amardeep2006))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@alcpereira](https://github.com/alcpereira)
- [@sebastian-sauer](https://github.com/sebastian-sauer)


## v9.1.0 (2024-09-24)

#### :rocket: New Feature
* `wdio-cucumber-framework`
  * [#13616](https://github.com/webdriverio/webdriverio/pull/13616) Add file to cucumber options ([@ccharnkij](https://github.com/ccharnkij))
* `wdio-junit-reporter`
  * [#13604](https://github.com/webdriverio/webdriverio/pull/13604) [junit-reporter]: Add function to add additional properties to testcases ([@sebastian-sauer](https://github.com/sebastian-sauer))
  * [#13526](https://github.com/webdriverio/webdriverio/pull/13526) [junit-reporter] Add option to include nodejs console log in junit report ([@sebastian-sauer](https://github.com/sebastian-sauer))

#### :bug: Bug Fix
* `wdio-webdriver-mock-service`, `webdriver`
  * [#13649](https://github.com/webdriverio/webdriverio/pull/13649) fix(webdriver): restore request retries ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#13625](https://github.com/webdriverio/webdriverio/pull/13625) Refetches element on bidi context change ([@ccharnkij](https://github.com/ccharnkij))
  * [#13523](https://github.com/webdriverio/webdriverio/pull/13523) Fix  customElement wrapper for custom elements which don't define connectedCallback or disconnectedCallback ([@swendlandt](https://github.com/swendlandt))
  * [#13520](https://github.com/webdriverio/webdriverio/pull/13520) fix the second deepselector call ([@lacell75](https://github.com/lacell75))
* `wdio-cucumber-framework`
  * [#13564](https://github.com/webdriverio/webdriverio/pull/13564) fix(wdio-cucumber-framework): filter cucumberFeaturesWithLineNumbers ([@johnp](https://github.com/johnp))
* `wdio-browser-runner`
  * [#13605](https://github.com/webdriverio/webdriverio/pull/13605) fix(@wdio/cli): fix type for config when generating a project ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#13606](https://github.com/webdriverio/webdriverio/pull/13606) fix ci by removing unexpected ts-expect-error statements ([@sebastian-sauer](https://github.com/sebastian-sauer))
  * [#13603](https://github.com/webdriverio/webdriverio/pull/13603) fix(@wdio/cli): fix type for config when generating a project ([@christian-bromann](https://github.com/christian-bromann))
  * [#13566](https://github.com/webdriverio/webdriverio/pull/13566) fix(@wdio/cli): cucumber generated config spec path ([@alcpereira](https://github.com/alcpereira))
  * [#13568](https://github.com/webdriverio/webdriverio/pull/13568) fix(@wdio/cli): package manager detection improvements ([@alcpereira](https://github.com/alcpereira))
  * [#13557](https://github.com/webdriverio/webdriverio/pull/13557) fix(#11999): regression with Jasmine types ([@Badisi](https://github.com/Badisi))
* `wdio-types`
  * [#13567](https://github.com/webdriverio/webdriverio/pull/13567) fix(@wdio/types): make 'moz:debuggerAddress' a string or boolean ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-utils`, `webdriver`
  * [#13648](https://github.com/webdriverio/webdriverio/pull/13648) fix(@wdio/utils): disable Bidi for Appium sessions ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-appium-service`, `wdio-sauce-service`, `wdio-testingbot-service`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#13622](https://github.com/webdriverio/webdriverio/pull/13622) fix(webdriverio): don't send `desiredCapabilities` anymore when initializing a session ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-spec-reporter`, `wdio-types`, `webdriverio`
  * [#13612](https://github.com/webdriverio/webdriverio/pull/13612) Removing us-east-1 region ([@diemol](https://github.com/diemol))
* `wdio-junit-reporter`
  * [#13613](https://github.com/webdriverio/webdriverio/pull/13613) feat(@wdio/junit-reporter): provide CJS export ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#13571](https://github.com/webdriverio/webdriverio/pull/13571) v9: Auto Enable App Percy for App Automate ([@akanksha1909](https://github.com/akanksha1909))

#### :memo: Documentation
* [#13627](https://github.com/webdriverio/webdriverio/pull/13627) docs(integration): added selenium grid integration docs ([@amardeep2006](https://github.com/amardeep2006))
* [#13565](https://github.com/webdriverio/webdriverio/pull/13565) docs: fix bun create tab on gettingstarted ([@alcpereira](https://github.com/alcpereira))
* [#13549](https://github.com/webdriverio/webdriverio/pull/13549) docs: missing async in timeout docs ([@yusufcankaya](https://github.com/yusufcankaya))
* [#13527](https://github.com/webdriverio/webdriverio/pull/13527) docs(watch-mode): update running instructions ([@tech-dm-klymenko](https://github.com/tech-dm-klymenko))

#### Committers: 13
- Akanksha singh ([@akanksha1909](https://github.com/akanksha1909))
- Amar Deep Singh ([@amardeep2006](https://github.com/amardeep2006))
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Diego Molina ([@diemol](https://github.com/diemol))
- Dmytro Klymenko ([@tech-dm-klymenko](https://github.com/tech-dm-klymenko))
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))
- Johannes Pfrang ([@johnp](https://github.com/johnp))
- Yuka ([@yusufcankaya](https://github.com/yusufcankaya))
- [@Badisi](https://github.com/Badisi)
- [@alcpereira](https://github.com/alcpereira)
- [@sebastian-sauer](https://github.com/sebastian-sauer)
- [@swendlandt](https://github.com/swendlandt)


## v9.0.8 (2024-09-05)

#### :rocket: New Feature
* `wdio-protocols`, `webdriverio`
  * [#13481](https://github.com/webdriverio/webdriverio/pull/13481) feat(webdriverio): set cookies via Bidi if supported ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `webdriverio`
  * [#13470](https://github.com/webdriverio/webdriverio/pull/13470) fix(webdriverio): fix script execution ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#13478](https://github.com/webdriverio/webdriverio/pull/13478) fix(webdriverio): better detect manually created shadow roots ([@christian-bromann](https://github.com/christian-bromann))
* `eslint-plugin-wdio`, `wdio-allure-reporter`, `wdio-appium-service`, `wdio-browser-runner`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-config`, `wdio-cucumber-framework`, `wdio-dot-reporter`, `wdio-firefox-profile-service`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-lighthouse-service`, `wdio-local-runner`, `wdio-logger`, `wdio-mocha-framework`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-shared-store-service`, `wdio-smoke-test-cjs-service`, `wdio-smoke-test-reporter`, `wdio-smoke-test-service`, `wdio-spec-reporter`, `wdio-static-server-service`, `wdio-sumologic-reporter`, `wdio-testingbot-service`, `wdio-types`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#13482](https://github.com/webdriverio/webdriverio/pull/13482) fix(core): specify minimum node version to be 18.20.0 or higher ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browser-runner`
  * [#13489](https://github.com/webdriverio/webdriverio/pull/13489) fix(@wdio/browser-runner): support Firefox using Bidi ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#13437](https://github.com/webdriverio/webdriverio/pull/13437) Browserstack Turboscale Observability Integration ([@amaanbs](https://github.com/amaanbs))

#### :memo: Documentation
* `wdio-shared-store-service`
  * [#13514](https://github.com/webdriverio/webdriverio/pull/13514) Added information on typescript types for wdio-shared-store-service ([@sauterl](https://github.com/sauterl))
* Other
  * [#13486](https://github.com/webdriverio/webdriverio/pull/13486) Fix `addInitScript` example in v9 blog post ([@Mr0grog](https://github.com/Mr0grog))
  * [#13483](https://github.com/webdriverio/webdriverio/pull/13483) docs: small typo in BestPractices.md ([@alcpereira](https://github.com/alcpereira))
  * [#13466](https://github.com/webdriverio/webdriverio/pull/13466) Argos visual testing page ([@gregberge](https://github.com/gregberge))

#### Committers: 8
- Amaan Hakim ([@amaanbs](https://github.com/amaanbs))
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Greg Bergé ([@gregberge](https://github.com/gregberge))
- Loris Sauter ([@sauterl](https://github.com/sauterl))
- Rob Brackett ([@Mr0grog](https://github.com/Mr0grog))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@alcpereira](https://github.com/alcpereira)


## v9.0.7 (2024-08-21)

#### :bug: Bug Fix
* `wdio-spec-reporter`
  * [#13435](https://github.com/webdriverio/webdriverio/pull/13435) fix(@wdio/spec-reporter): recognise appPackage capability in spec reporter ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`, `webdriverio`
  * [#13434](https://github.com/webdriverio/webdriverio/pull/13434) fix(webdriverio): don't have commands rely on browser global ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.0.6 (2024-08-21)

#### :bug: Bug Fix
* `webdriver`
  * [#13431](https://github.com/webdriverio/webdriverio/pull/13431) fix(webdriver): lowercase browserName when checking whether to opt-in for bidi ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`, `webdriverio`
  * [#13430](https://github.com/webdriverio/webdriverio/pull/13430) fix(webdriverio): better approach to amend custom component prototype ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`
  * [#13426](https://github.com/webdriverio/webdriverio/pull/13426) fix(@wdio/cli): correctly detect chrome headless shell as chrome #13390 ([@BorisOsipov](https://github.com/BorisOsipov))

#### Committers: 2
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.0.5 (2024-08-20)

#### :bug: Bug Fix
* `eslint-plugin-wdio`, `wdio-browser-runner`, `wdio-cli`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-runner`
  * [#13422](https://github.com/webdriverio/webdriverio/pull/13422) fix(website): update expect-webdriverio to latest ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#13421](https://github.com/webdriverio/webdriverio/pull/13421) fix(@wdio/cli): preset type should be `null` ([@christian-bromann](https://github.com/christian-bromann))
  * [#13416](https://github.com/webdriverio/webdriverio/pull/13416) fix(webdriverio): issue generating sample project on V9  (#13413) ([@giuseppe-salvatore](https://github.com/giuseppe-salvatore))
* `wdio-utils`, `webdriver`
  * [#13417](https://github.com/webdriverio/webdriverio/pull/13417) fix(webdriver): better type check for webSocketUrl capability ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriver`
  * [#13423](https://github.com/webdriverio/webdriverio/pull/13423) polish(webdriver): throw better error message if 'incognito' is used as chrome arg ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#13424](https://github.com/webdriverio/webdriverio/pull/13424) fix(docs): remove docs around intercept assertions in jasmine ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Giuseppe Salvatore ([@giuseppe-salvatore](https://github.com/giuseppe-salvatore))


## v9.0.4 (2024-08-19)

#### :bug: Bug Fix
* `webdriverio`
  * [#13389](https://github.com/webdriverio/webdriverio/pull/13389) fix(webdriverio): execute command when using bidi ([@christian-bromann](https://github.com/christian-bromann))
  * [#13388](https://github.com/webdriverio/webdriverio/pull/13388) fix(webdriverio): update getHTML docs ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-reporter`, `wdio-webdriver-mock-service`
  * [#13219](https://github.com/webdriverio/webdriverio/pull/13219) fix(@wdio/reporter): transform scripts in TestStats (#13209) ([@johnp](https://github.com/johnp))

#### :house: Internal
* `wdio-browser-runner`, `wdio-cucumber-framework`, `wdio-mocha-framework`, `wdio-smoke-test-cjs-service`, `wdio-smoke-test-service`, `wdio-utils`, `webdriverio`
  * [#13385](https://github.com/webdriverio/webdriverio/pull/13385) fix(infra): retry type generation ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#13383](https://github.com/webdriverio/webdriverio/pull/13383) feat: pkg.pr.new ([@Aslemammad](https://github.com/Aslemammad))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Johannes Pfrang ([@johnp](https://github.com/johnp))
- Mohammad Bagher Abiyat ([@Aslemammad](https://github.com/Aslemammad))


## v9.0.3 (2024-08-16)

#### :bug: Bug Fix
* `wdio-cli`
  * [#13381](https://github.com/webdriverio/webdriverio/pull/13381) fix(@wdio/cli): fix path for copy templates ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.0.2 (2024-08-16)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#13374](https://github.com/webdriverio/webdriverio/pull/13374) fix(@wdio/browserstack-service): support v9 of WebdriverIO ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))


## v9.0.1 (2024-08-15)

#### :bug: Bug Fix
* `wdio-browser-runner`, `webdriverio`
  * [#13373](https://github.com/webdriverio/webdriverio/pull/13373) fix(webdriverio): don't allow to pass in empty array for startNodes ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.0.0 (2024-08-15)

#### :boom: Breaking Change
* `wdio-cli`, `wdio-devtools-service`, `wdio-lighthouse-service`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#12300](https://github.com/webdriverio/webdriverio/pull/12300) (@wdio/lighthouse-service): migrate over from devtools service ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`, `wdio-appium-service`, `wdio-browser-runner`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-config`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-firefox-profile-service`, `wdio-jasmine-framework`, `wdio-json-reporter`, `wdio-junit-reporter`, `wdio-local-runner`, `wdio-mocha-framework`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-shared-store-service`, `wdio-spec-reporter`, `wdio-testingbot-service`, `wdio-types`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#12987](https://github.com/webdriverio/webdriverio/pull/12987) breaking(*): better type definitions for capabilities ([@christian-bromann](https://github.com/christian-bromann))
  * [#11942](https://github.com/webdriverio/webdriverio/pull/11942) breaking(*): V9 migrate from got to fetch ([@tamil777selvan](https://github.com/tamil777selvan))
* `@wdio/protocols`
  * [#12006](https://github.com/webdriverio/webdriverio/pull/12006) breaking(@wdio/protocols): V9 Remove JSONWireProtocol ([@tamil777selvan](https://github.com/tamil777selvan))
* `webdriverio`
  * [#12490](https://github.com/webdriverio/webdriverio/pull/12490) allow getHTML to pierce through Shadow DOM ([@christian-bromann](https://github.com/christian-bromann))

#### :rocket: New Feature
* `webdriverio`
  * [#13258](https://github.com/webdriverio/webdriverio/pull/13258) feat(webdriverio): new command to set viewport ([@christian-bromann](https://github.com/christian-bromann))
  * [#13250](https://github.com/webdriverio/webdriverio/pull/13250) feat(webdriverio): make using preload script easier ([@christian-bromann](https://github.com/christian-bromann))
  * [#13252](https://github.com/webdriverio/webdriverio/pull/13252) feat(webdriverio): support fake timers ([@christian-bromann](https://github.com/christian-bromann))
  * [#13247](https://github.com/webdriverio/webdriverio/pull/13247) feat(webdriverio): dialog handler ([@christian-bromann](https://github.com/christian-bromann))
  * [#13371](https://github.com/webdriverio/webdriverio/pull/13371) feat(webdriverio): implement auto waiting for element to become interactable ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-types`, `webdriverio`
  * [#13222](https://github.com/webdriverio/webdriverio/pull/13222) feat(webdriverio): new features for url command ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browser-runner`
  * [#13212](https://github.com/webdriverio/webdriverio/pull/13212) feat(@wdio/browser-runner): allow to define custom hostname for component tests ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-lighthouse-service`, `wdio-types`, `wdio-utils`, `webdriver`
  * [#13210](https://github.com/webdriverio/webdriverio/pull/13210) feat(webdriver): automatically opt-into WebDriver Bidi ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-protocols`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#12720](https://github.com/webdriverio/webdriverio/pull/12720) feat(webdriverio): deep shadow root piercing ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-appium-service`
  * [#13151](https://github.com/webdriverio/webdriverio/pull/13151) In @wdio/appium-service, kill entire Appium process tree ([@samuelfreiberg](https://github.com/samuelfreiberg))
* `webdriver`
  * [#13150](https://github.com/webdriverio/webdriverio/pull/13150) fix(webdriver): better error response detection for Safari and FF ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriver`
  * [#13214](https://github.com/webdriverio/webdriverio/pull/13214) chore(webdriver): show stack trace for bidi errors ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-config`, `wdio-local-runner`, `wdio-runner`, `wdio-types`, `webdriverio`
  * [#12752](https://github.com/webdriverio/webdriverio/pull/12752) feat: replace `ts-node` with `tsx`, remove autoCompileOpts ([@goosewobbler](https://github.com/goosewobbler))

#### :house: Internal
* [#12779](https://github.com/webdriverio/webdriverio/pull/12779) fix: convert npm to pnpm in gitpod ([@sangcnguyen](https://github.com/sangcnguyen))
* migrate package manager from NPM to pnpm
* [#11493](https://github.com/webdriverio/webdriverio/pull/11942) breaking(*): V9 drop support for Node.js 16 ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Samuel Freiberg ([@samuelfreiberg](https://github.com/samuelfreiberg))
- [@goosewobbler](https://github.com/goosewobbler)
- [@tamil777selvan](https://github.com/tamil777selvan)
