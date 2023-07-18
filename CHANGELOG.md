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

---

## v8.13.5 (2023-07-18)

#### :bug: Bug Fix
* `wdio-cli`
  * [#10762](https://github.com/webdriverio/webdriverio/pull/10762) (@wdio/cli): fix component test templates ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.13.4 (2023-07-18)

#### :nail_care: Polish
* `wdio-browser-runner`
  * [#10753](https://github.com/webdriverio/webdriverio/pull/10753) (@wdio/browser-runner): more import optimizations ([@christian-bromann](https://github.com/christian-bromann))
  * [#10758](https://github.com/webdriverio/webdriverio/pull/10758) (@wdio/browser-runner): show loading animation ([@christian-bromann](https://github.com/christian-bromann))
  * [#10757](https://github.com/webdriverio/webdriverio/pull/10757) (@wdio/browser-runner): automatically open in devtools when in watch mode ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `webdriverio`
  * [#10755](https://github.com/webdriverio/webdriverio/pull/10755) Update action.ts example ([@MotorMike](https://github.com/MotorMike))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mike Nicholls ([@MotorMike](https://github.com/MotorMike))


## v8.13.3 (2023-07-17)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#10752](https://github.com/webdriverio/webdriverio/pull/10752) (@wdio/browser-runner): ignore null error ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.13.2 (2023-07-17)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-concise-reporter`
  * [#10733](https://github.com/webdriverio/webdriverio/pull/10733) (@wdio/browser-runner): elevate errors happening during test setup ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#10732](https://github.com/webdriverio/webdriverio/pull/10732) doc: Update WhyWebdriverIO.md ([@Naedri](https://github.com/Naedri))

#### Committers: 2
- Adrien JALLAIS ([@Naedri](https://github.com/Naedri))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.13.1 (2023-07-15)

#### :bug: Bug Fix
* `webdriver`
  * [#10731](https://github.com/webdriverio/webdriverio/pull/10731) (webdriver): re-export command ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.13.0 (2023-07-14)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-cli`, `wdio-local-runner`, `wdio-runner`, `webdriver`
  * [#10728](https://github.com/webdriverio/webdriverio/pull/10728) (@wdio/browser-runner): Further improvements to mocking in browser ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.12.3 (2023-07-14)

#### :bug: Bug Fix
* `wdio-jasmine-framework`
  * [#10727](https://github.com/webdriverio/webdriverio/pull/10727) (@wdio/jasmine-framework): fix matcher ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#10675](https://github.com/webdriverio/webdriverio/pull/10675) Allure report is missing steps, links data when the afterEach() hook is present is the suite #10185 ([@BorisOsipov](https://github.com/BorisOsipov))

#### Committers: 2
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.12.1 (2023-07-10)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#10693](https://github.com/webdriverio/webdriverio/pull/10693) (@wdio/cucumber-framework): count error if hook fails ([@christian-bromann](https://github.com/christian-bromann))
  * [#10690](https://github.com/webdriverio/webdriverio/pull/10690) Filtering spec files with use of cucumber compile ([@tamil777selvan](https://github.com/tamil777selvan))
* `wdio-spec-reporter`
  * [#9914](https://github.com/webdriverio/webdriverio/pull/9914) (@wdio/spec-reporter): propagate root suite hook errors ([@christian-bromann](https://github.com/christian-bromann))
  * [#10691](https://github.com/webdriverio/webdriverio/pull/10691) (@wdio/spec-reporter): recognise bundleId if existing ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-mocha-framework`, `wdio-reporter`, `wdio-utils`
  * [#10692](https://github.com/webdriverio/webdriverio/pull/10692) (@wdio/mocha-framework): propagate mocha hook/spec function body to reporter ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.12.0 (2023-07-09)

#### :rocket: New Feature
* `wdio-appium-service`, `wdio-cli`
  * [#10689](https://github.com/webdriverio/webdriverio/pull/10689) (@wdio/cli): improved setup wizard based on testing purpose ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-cli`
  * [#10607](https://github.com/webdriverio/webdriverio/pull/10607) (@wdio/cli): fix CJS interface ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#10688](https://github.com/webdriverio/webdriverio/pull/10688) (docs): add docs on testing vscode extensions ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.11.4 (2023-07-07)

#### :nail_care: Polish
* `wdio-cli`
  * [#10687](https://github.com/webdriverio/webdriverio/pull/10687) (@wdio/cli): support loading of config files with mjs or mts extension ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.11.3 (2023-07-07)

#### :bug: Bug Fix
* `wdio-jasmine-framework`
  * [#10686](https://github.com/webdriverio/webdriverio/pull/10686) (@wdio/jasmine-framework): support `addMatcher` ([@christian-bromann](https://github.com/christian-bromann))
  * [#10685](https://github.com/webdriverio/webdriverio/pull/10685) (@wdio/jasmine-framework): support sync negative matchers ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-junit-reporter`
  * [#10684](https://github.com/webdriverio/webdriverio/pull/10684) (@wdio/junit-reporter): fix issue with junit reporter not working on windows ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#10475](https://github.com/webdriverio/webdriverio/pull/10475) @wdio/allure-reporter cucumber step reporter adds blank steps before and after each scenario bug fixing ([@JordiSAGE](https://github.com/JordiSAGE))
* `devtools`
  * [#10578](https://github.com/webdriverio/webdriverio/pull/10578) fix: Webdriverio v7 screenshot issue/behaviour change webdriverio#9226 ([@franck-jude](https://github.com/franck-jude))
* `wdio-cucumber-framework`
  * [#10567](https://github.com/webdriverio/webdriverio/pull/10567) @wdio/cucumber-framework: Enables ability to set a default language for feature files ([@lukefitz1](https://github.com/lukefitz1))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#10601](https://github.com/webdriverio/webdriverio/pull/10601) [browserstack-service] added beforeAll and afterAll hook mappings for WDIO mocha and jasmine ([@sriteja777](https://github.com/sriteja777))
* `webdriver`
  * [#10584](https://github.com/webdriverio/webdriverio/pull/10584) Fix typos and remove duplicate 'to' in WebDriver error message ([@Kazaz-Or](https://github.com/Kazaz-Or))

#### :memo: Documentation
* Other
  * [#10676](https://github.com/webdriverio/webdriverio/pull/10676) Updating the Boilerplate name ([@larryg01](https://github.com/larryg01))
* `wdio-devtools-service`
  * [#10677](https://github.com/webdriverio/webdriverio/pull/10677) Update documentation for cdp network events ([@nils-hoyer](https://github.com/nils-hoyer))

#### Committers: 8
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jordi Lagunas ([@JordiSAGE](https://github.com/JordiSAGE))
- LarryG ([@larryg01](https://github.com/larryg01))
- Or Kazaz ([@Kazaz-Or](https://github.com/Kazaz-Or))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))
- [@franck-jude](https://github.com/franck-jude)
- [@lukefitz1](https://github.com/lukefitz1)
- [@nils-hoyer](https://github.com/nils-hoyer)


## v8.11.2 (2023-06-12)

#### :bug: Bug Fix
* `wdio-spec-reporter`
  * [#10537](https://github.com/webdriverio/webdriverio/pull/10537) (spec-reporter): skip logging when title is empty ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#10535](https://github.com/webdriverio/webdriverio/pull/10535) waitUntil, if given should return custom error message when condition returns always false ([@rashiq231](https://github.com/rashiq231))
* `wdio-browser-runner`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-runner`
  * [#10533](https://github.com/webdriverio/webdriverio/pull/10533) (jasmine): Bring back Jasmine assertions ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@rashiq231](https://github.com/rashiq231)


## v8.11.0 (2023-06-08)

#### :rocket: New Feature
* `wdio-logger`, `wdio-protocols`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#10447](https://github.com/webdriverio/webdriverio/pull/10447) Type Safe Bidi Protocol ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#10523](https://github.com/webdriverio/webdriverio/pull/10523) fix: Update Babel.md to fix broken links ([@Dksoni81291](https://github.com/Dksoni81291))
* [#10517](https://github.com/webdriverio/webdriverio/pull/10517) Webdriverio 8 test framework with cross browser testing ([@syamphaneendra](https://github.com/syamphaneendra))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dhrumil Soni ([@Dksoni81291](https://github.com/Dksoni81291))
- Syamphaneendra Kalluri ([@syamphaneendra](https://github.com/syamphaneendra))


## v8.10.7 (2023-06-03)

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#10452](https://github.com/webdriverio/webdriverio/pull/10452) Allure reporter add environment variables in config ([@m4hdyar](https://github.com/m4hdyar))

#### :nail_care: Polish
* `wdio-utils`, `webdriver`
  * [#10491](https://github.com/webdriverio/webdriverio/pull/10491) fix: tune isMobile for Appium situation ([@KazuCocoa](https://github.com/KazuCocoa))

#### :memo: Documentation
* [#10490](https://github.com/webdriverio/webdriverio/pull/10490) fix image preview ([@amrsa1](https://github.com/amrsa1))
* [#10486](https://github.com/webdriverio/webdriverio/pull/10486) Add new article: Guide for Cross Platform E2E Test For Native Mobile APP ([@amrsa1](https://github.com/amrsa1))

#### Committers: 3
- Amr Salem ([@amrsa1](https://github.com/amrsa1))
- Kazuaki Matsuo ([@KazuCocoa](https://github.com/KazuCocoa))
- Mahdyar ([@m4hdyar](https://github.com/m4hdyar))


## v8.10.6 (2023-06-01)

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#10477](https://github.com/webdriverio/webdriverio/pull/10477) @wdio/allure-reporter: Exporting the addTag method so it can be used ([@lukefitz1](https://github.com/lukefitz1))

#### :memo: Documentation
* `wdio-cli`
  * [#10454](https://github.com/webdriverio/webdriverio/pull/10454) added new service to services list is named 'wdio-robonut-service' ([@udarrr](https://github.com/udarrr))
* `webdriverio`
  * [#10446](https://github.com/webdriverio/webdriverio/pull/10446) update code links for browser->waitUntil ([@harsha509](https://github.com/harsha509))

#### Committers: 5
- Adam Christian ([@admc](https://github.com/admc))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Siarhei Kliushnikau ([@udarrr](https://github.com/udarrr))
- Sri Harsha ([@harsha509](https://github.com/harsha509))
- [@lukefitz1](https://github.com/lukefitz1)


## v8.10.5 (2023-05-22)

#### :bug: Bug Fix
* `webdriverio`
  * [#10413](https://github.com/webdriverio/webdriverio/pull/10413) fix: disable restored mocks ([@KuznetsovRoman](https://github.com/KuznetsovRoman))

#### :nail_care: Polish
* `wdio-spec-reporter`
  * [#10416](https://github.com/webdriverio/webdriverio/pull/10416) Spec repoter - add docstring to the final report ([@ductoan0295](https://github.com/ductoan0295))
* `wdio-browserstack-service`, `wdio-jasmine-framework`
  * [#10421](https://github.com/webdriverio/webdriverio/pull/10421) Support for Jasmine sessions for BrowserStack Test Observability (v8) ([@sriteja777](https://github.com/sriteja777))

#### :memo: Documentation
* [#10423](https://github.com/webdriverio/webdriverio/pull/10423) Corrected a typo ([@osandadeshan](https://github.com/osandadeshan))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Osanda Deshan Nimalarathna ([@osandadeshan](https://github.com/osandadeshan))
- Roman Kuznetsov ([@KuznetsovRoman](https://github.com/KuznetsovRoman))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))
- Toan ([@ductoan0295](https://github.com/ductoan0295))


## v8.10.4 (2023-05-19)

#### :bug: Bug Fix
* `devtools`, `wdio-browser-runner`
  * [#10417](https://github.com/webdriverio/webdriverio/pull/10417) (browser-runner): avoid responses on map requests ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#10415](https://github.com/webdriverio/webdriverio/pull/10415) fix: set sessionName in case of browser.reloadSession ([@Ankit098](https://github.com/Ankit098))

#### Committers: 2
- Ankit Singh ([@Ankit098](https://github.com/Ankit098))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.10.3 (2023-05-12)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#10368](https://github.com/webdriverio/webdriverio/pull/10368) wdio-cucumber-framework: Don't attempt to filter empty specs ([@nextlevelbeard](https://github.com/nextlevelbeard))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))


## v8.10.2 (2023-05-10)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#10330](https://github.com/webdriverio/webdriverio/pull/10330) @wdio/cucumber-framework: Filter specs /w Cucumber Tag Expression before spawning workers ([@nextlevelbeard](https://github.com/nextlevelbeard))

#### :memo: Documentation
* `wdio-appium-service`, `wdio-protocols`, `wdio-types`, `webdriverio`
  * [#10359](https://github.com/webdriverio/webdriverio/pull/10359) Fix Appium Doc Links ([@noahgregory-avanade](https://github.com/noahgregory-avanade))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))
- [@noahgregory-avanade](https://github.com/noahgregory-avanade)


## v8.10.1 (2023-05-09)

#### :bug: Bug Fix
* `wdio-sauce-service`
  * [#10355](https://github.com/webdriverio/webdriverio/pull/10355) sauce-service: only upload relevant logs for instance ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cucumber-framework`
  * [#10327](https://github.com/webdriverio/webdriverio/pull/10327) (fix) wdio-cucumber-framework: fix error after #10134 ([@egerix](https://github.com/egerix))

#### :nail_care: Polish
* `devtools`
  * [#10329](https://github.com/webdriverio/webdriverio/pull/10329) devtools: Honor acceptInsecureCerts and ignoreHTTPSErrors settings ([@nextlevelbeard](https://github.com/nextlevelbeard))

#### :memo: Documentation
* [#10324](https://github.com/webdriverio/webdriverio/pull/10324) Update Browser.md ([@ilich-garcia27](https://github.com/ilich-garcia27))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Egor Ivanov ([@egerix](https://github.com/egerix))
- Ilich García ([@ilich-garcia27](https://github.com/ilich-garcia27))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))


## v8.10.0 (2023-05-04)

#### :bug: Bug Fix
* `devtools`, `wdio-allure-reporter`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-reporter`, `wdio-spec-reporter`, `wdio-types`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#10317](https://github.com/webdriverio/webdriverio/pull/10317) Valid W3C Appium caps only ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#10297](https://github.com/webdriverio/webdriverio/pull/10297) Check for hostname before setting isMac to true ([@therealbrad](https://github.com/therealbrad))

#### Committers: 2
- Brad DerManouelian ([@therealbrad](https://github.com/therealbrad))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.9.0 (2023-05-02)

#### :rocket: New Feature
* `wdio-cli`
  * [#10288](https://github.com/webdriverio/webdriverio/pull/10288) (feat): Enable mobile set-up through appium-installer ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))


## v8.8.8 (2023-04-27)

#### :bug: Bug Fix
* `webdriverio`
  * [#10282](https://github.com/webdriverio/webdriverio/pull/10282) Fix scrollIntoView for element out of the viewport ([@lacell75](https://github.com/lacell75))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#10258](https://github.com/webdriverio/webdriverio/pull/10258) [browserstack-service] Sending skipped test details for beforeEach, beforeAll and afterEach hooks in mocha ([@sriteja777](https://github.com/sriteja777))

#### Committers: 2
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))


## v8.8.7 (2023-04-26)

#### :memo: Documentation
* `wdio-selenium-standalone-service`
  * [#9969](https://github.com/webdriverio/webdriverio/pull/9969) chore(docs): use -- for selenium args in Selenium Standalone Service ([@manuelfidalgo](https://github.com/manuelfidalgo))
* `wdio-types`
  * [#10236](https://github.com/webdriverio/webdriverio/pull/10236) networkLogsOptions & interactiveDebugging ([@boutchersj](https://github.com/boutchersj))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Manuel Fidalgo Sicilia ([@manuelfidalgo](https://github.com/manuelfidalgo))
- Steven Boutcher ([@boutchersj](https://github.com/boutchersj))


## v8.8.6 (2023-04-20)

#### :nail_care: Polish
* `webdriverio`
  * [#10224](https://github.com/webdriverio/webdriverio/pull/10224) Fix ScrollIntoView - correct position for the focus ([@lacell75](https://github.com/lacell75))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))


## v8.8.5 (2023-04-18)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#10221](https://github.com/webdriverio/webdriverio/pull/10221) browser-runner: support global fixture through set up scripts ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.8.4 (2023-04-17)

#### :bug: Bug Fix
* `wdio-runner`, `wdio-spec-reporter`
  * [#10216](https://github.com/webdriverio/webdriverio/pull/10216) browser-runner: support nesting suites ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browser-runner`
  * [#10215](https://github.com/webdriverio/webdriverio/pull/10215) browser-runner: allow tdd UI ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#10199](https://github.com/webdriverio/webdriverio/pull/10199) Update to correct exports for CJS ([@DirkoOdendaal](https://github.com/DirkoOdendaal))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dirko Odendaal ([@DirkoOdendaal](https://github.com/DirkoOdendaal))


## v8.8.3 (2023-04-14)

#### :bug: Bug Fix
* `wdio-cli`
  * [#10188](https://github.com/webdriverio/webdriverio/pull/10188) feat: export cjs interface for wdio-cli ([@DirkoOdendaal](https://github.com/DirkoOdendaal))
* `wdio-browserstack-service`
  * [#10186](https://github.com/webdriverio/webdriverio/pull/10186) OBS 807 Fix Filepath V8 ([@amaanbs](https://github.com/amaanbs))

#### Committers: 2
- Amaan Hakim ([@amaanbs](https://github.com/amaanbs))
- Dirko Odendaal ([@DirkoOdendaal](https://github.com/DirkoOdendaal))


## v8.8.2 (2023-04-12)

#### :bug: Bug Fix
* `devtools`, `webdriver`
  * [#10167](https://github.com/webdriverio/webdriverio/pull/10167) fix(logs): WDIO_LOG_LEVEL ([@KuznetsovRoman](https://github.com/KuznetsovRoman))
* `wdio-allure-reporter`
  * [#10176](https://github.com/webdriverio/webdriverio/pull/10176) #9993 Properly set allure history id ([@BorisOsipov](https://github.com/BorisOsipov))

#### :memo: Documentation
* [#10172](https://github.com/webdriverio/webdriverio/pull/10172) [📖 Docs]: Add docs on testing Chrome and Firefox Extensions ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Roman Kuznetsov ([@KuznetsovRoman](https://github.com/KuznetsovRoman))


## v8.8.1 (2023-04-12)

#### :bug: Bug Fix
* `wdio-cli`
  * [#10171](https://github.com/webdriverio/webdriverio/pull/10171) added path.absolute check ([@praveendvd](https://github.com/praveendvd))

#### :memo: Documentation
* [#10129](https://github.com/webdriverio/webdriverio/pull/10129) docs(mock): 'matches' -> 'calls' property ([@KuznetsovRoman](https://github.com/KuznetsovRoman))

#### Committers: 2
- Roman Kuznetsov ([@KuznetsovRoman](https://github.com/KuznetsovRoman))
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v8.8.0 (2023-04-10)

#### :rocket: New Feature
* `wdio-cucumber-framework`
  * [#10134](https://github.com/webdriverio/webdriverio/pull/10134) (feature) wdio-cucumber-framework: support `@skip` annotation without `()` for skip tests ([@egerix](https://github.com/egerix))
* `webdriverio`
  * [#10137](https://github.com/webdriverio/webdriverio/pull/10137) feat(mock): emit 'request', 'overwrite', 'fail', 'match', 'continue' events ([@KuznetsovRoman](https://github.com/KuznetsovRoman))

#### :bug: Bug Fix
* `wdio-config`
  * [#10132](https://github.com/webdriverio/webdriverio/pull/10132) Alphabetically sort specs file ([@dilpreetj](https://github.com/dilpreetj))
* `webdriverio`
  * [#10130](https://github.com/webdriverio/webdriverio/pull/10130) Partial content selector improvements ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-types`
  * [#10126](https://github.com/webdriverio/webdriverio/pull/10126) Add more TestingbotCapabilities types ([@testingbot](https://github.com/testingbot))

#### :memo: Documentation
* `wdio-local-runner`
  * [#10128](https://github.com/webdriverio/webdriverio/pull/10128) docs: fix localhost links ([@KuznetsovRoman](https://github.com/KuznetsovRoman))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dilpreet Johal ([@dilpreetj](https://github.com/dilpreetj))
- Egor Ivanov ([@egerix](https://github.com/egerix))
- Roman Kuznetsov ([@KuznetsovRoman](https://github.com/KuznetsovRoman))
- TestingBot ([@testingbot](https://github.com/testingbot))


## v8.7.0 (2023-04-05)

#### :rocket: New Feature
* `wdio-shared-store-service`
  * [#10029](https://github.com/webdriverio/webdriverio/pull/10029) shared store resource pool #10010 ([@pedrorfernandes](https://github.com/pedrorfernandes))

#### :bug: Bug Fix
* `wdio-cli`
  * [#10047](https://github.com/webdriverio/webdriverio/pull/10047) [🐛 Bug]: Selecting Lit as framework when selecting browser runner does not create example files for Lit ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#10053](https://github.com/webdriverio/webdriverio/pull/10053) Added histroy and testcaseid ([@praveendvd](https://github.com/praveendvd))
* `webdriverio`
  * [#10091](https://github.com/webdriverio/webdriverio/pull/10091) Fix ScrollIntoView - DeltaX and DeltaY should be rounded ([@niklasschaeffer](https://github.com/niklasschaeffer))

#### :nail_care: Polish
* `wdio-shared-store-service`
  * [#10121](https://github.com/webdriverio/webdriverio/pull/10121) Have better internal API for shared store ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#10013](https://github.com/webdriverio/webdriverio/pull/10013) Support for Jasmine sessions for BrowserStack Test Observability ([@nagpalkaran95](https://github.com/nagpalkaran95))
  * [#10037](https://github.com/webdriverio/webdriverio/pull/10037) added observability and session check in browserstack service ([@sriteja777](https://github.com/sriteja777))
* `wdio-types`
  * [#10081](https://github.com/webdriverio/webdriverio/pull/10081) Expand type of otherApps capability  ([@gjhughes](https://github.com/gjhughes))

#### :memo: Documentation
* [#10113](https://github.com/webdriverio/webdriverio/pull/10113) Docs -  Added Test Observability as a reporter ([@sourav-kundu](https://github.com/sourav-kundu))
* [#10116](https://github.com/webdriverio/webdriverio/pull/10116) fix(footer): openjs-fondation logo ([@AugustinMauroy](https://github.com/AugustinMauroy))
* [#10086](https://github.com/webdriverio/webdriverio/pull/10086) Include Volta for managing Node versions ([@degrammer](https://github.com/degrammer))

#### Committers: 10
- Augustin Mauroy ([@AugustinMauroy](https://github.com/AugustinMauroy))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Gavin Hughes ([@gjhughes](https://github.com/gjhughes))
- Karan Nagpal ([@nagpalkaran95](https://github.com/nagpalkaran95))
- Niklas Schäffer ([@niklasschaeffer](https://github.com/niklasschaeffer))
- Pedro Fernandes ([@pedrorfernandes](https://github.com/pedrorfernandes))
- Ruben Restrepo ([@degrammer](https://github.com/degrammer))
- Sourav Kundu ([@sourav-kundu](https://github.com/sourav-kundu))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v8.6.9 (2023-03-27)

#### :bug: Bug Fix
* `webdriverio`
  * [#10045](https://github.com/webdriverio/webdriverio/pull/10045) Fix handling existence checks for shadow elements ([@christian-bromann](https://github.com/christian-bromann))
  * [#10046](https://github.com/webdriverio/webdriverio/pull/10046) Allow selectors to further search for elements by text and tag name ([@RahulARanger](https://github.com/RahulARanger))

#### :nail_care: Polish
* `devtools`
  * [#10068](https://github.com/webdriverio/webdriverio/pull/10068) devtools: Attempt to rerun command before waiting for a page load (that might timeout) ([@nextlevelbeard](https://github.com/nextlevelbeard))
* `wdio-browser-runner`
  * [#10048](https://github.com/webdriverio/webdriverio/pull/10048) [🐛 Bug]: browser runner - `alert` or `confirm` stales execution of runner ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))
- Sai Hanuma Rahul ([@RahulARanger](https://github.com/RahulARanger))


## v8.6.8 (2023-03-24)

#### :bug: Bug Fix
* `wdio-junit-reporter`
  * [#10035](https://github.com/webdriverio/webdriverio/pull/10035) Handle `file://` in specs of junit reporter - Closes [#9352](https://github.com/webdriverio/webdriverio/issues/9352) ([@nextlevelbeard](https://github.com/nextlevelbeard))

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#10032](https://github.com/webdriverio/webdriverio/pull/10032) Add missing information and fix allure global result for cucumber tests ([@lacell75](https://github.com/lacell75))

#### :memo: Documentation
* [#10041](https://github.com/webdriverio/webdriverio/pull/10041) [Docs] Fixes to Lit component testing page ([@augustjk](https://github.com/augustjk))

#### Committers: 3
- Augustine Kim ([@augustjk](https://github.com/augustjk))
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))


## v8.6.7 (2023-03-20)

#### :bug: Bug Fix
* `webdriverio`
  * [#10021](https://github.com/webdriverio/webdriverio/pull/10021) webdriverio: Add missing specFileRetries* to WDIO_DEFAULTS ([@WillBrock](https://github.com/WillBrock))

#### Committers: 1
- Will Brock ([@WillBrock](https://github.com/WillBrock))


## v8.6.6 (2023-03-20)

#### :bug: Bug Fix
* `webdriverio`
  * [#9874](https://github.com/webdriverio/webdriverio/pull/9874) fix(commands): successive scrollIntoView ([@OBe95](https://github.com/OBe95))

#### :house: Internal
* `wdio-allure-reporter`, `wdio-appium-service`, `wdio-browser-runner`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-dot-reporter`, `wdio-firefox-profile-service`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-local-runner`, `wdio-logger`, `wdio-mocha-framework`, `wdio-protocols`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-shared-store-service`, `wdio-smoke-test-reporter`, `wdio-smoke-test-service`, `wdio-spec-reporter`, `wdio-static-server-service`, `wdio-sumologic-reporter`, `wdio-testingbot-service`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#9973](https://github.com/webdriverio/webdriverio/pull/9973) feat: export package.json ([@itsjwala](https://github.com/itsjwala))

#### Committers: 2
- Jigar wala ([@itsjwala](https://github.com/itsjwala))
- Othmane BENTALEB ([@OBe95](https://github.com/OBe95))


## v8.6.3 (2023-03-18)

#### :bug: Bug Fix
* `webdriverio`
  * [#9992](https://github.com/webdriverio/webdriverio/pull/9992) Improve selector for finding elements by tag and content ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cli`
  * [#9967](https://github.com/webdriverio/webdriverio/pull/9967) [💡 Feature]: Improve onboarding experience for browser tests ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#9991](https://github.com/webdriverio/webdriverio/pull/9991) chore(): updating webdriverio/klassijs-boilerplate ([@larryg01](https://github.com/larryg01))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- LarryG ([@larryg01](https://github.com/larryg01))


## v8.6.2 (2023-03-15)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-runner`
  * [#9985](https://github.com/webdriverio/webdriverio/pull/9985) Improve stability of component tests for Safari ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.6.1 (2023-03-15)

#### :nail_care: Polish
* `wdio-browser-runner`, `wdio-cli`, `wdio-local-runner`, `wdio-runner`
  * [#9968](https://github.com/webdriverio/webdriverio/pull/9968) Watch mode improvements for browser runner ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.6.0 (2023-03-13)

#### :rocket: New Feature
* `wdio-cli`, `wdio-config`
  * [#9947](https://github.com/webdriverio/webdriverio/pull/9947) wdio-config: Add multi-run cli flag ([@WillBrock](https://github.com/WillBrock))

#### Committers: 1
- Will Brock ([@WillBrock](https://github.com/WillBrock))


## v8.5.9 (2023-03-10)

#### :nail_care: Polish
* `devtools`
  * [#9927](https://github.com/webdriverio/webdriverio/pull/9927) [🐛 Bug]: Improve typing for `switchToFrame` command ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.5.8 (2023-03-09)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#9917](https://github.com/webdriverio/webdriverio/pull/9917) check for mocha in hook ([@nurdtechie98](https://github.com/nurdtechie98))

#### :memo: Documentation
* [#9915](https://github.com/webdriverio/webdriverio/pull/9915) chore(docs): fix broken anchor link pointing to localhost in runner doc ([@olivier-martin-sf](https://github.com/olivier-martin-sf))

#### Committers: 2
- Chirag Shetty ([@nurdtechie98](https://github.com/nurdtechie98))
- Olivier Martin ([@olivier-martin-sf](https://github.com/olivier-martin-sf))


## v8.5.7 (2023-03-08)

#### :eyeglasses: Spec Compliancy
* `wdio-browser-runner`, `wdio-protocols`, `webdriverio`
  * [#9911](https://github.com/webdriverio/webdriverio/pull/9911) [💡 Feature]: Replace `shadowFnFactory` with WebDriver shadow command ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-cli`
  * [#9771](https://github.com/webdriverio/webdriverio/pull/9771) #9539 Support various configurations of CJS/ESM with(out) TS ([@Jmcosel](https://github.com/Jmcosel))

#### :memo: Documentation
* `webdriverio`
  * [#9910](https://github.com/webdriverio/webdriverio/pull/9910) [💡 Feature]: Make `ChainablePromiseArray` and `ElementArray` iterable ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jeremy Elwood ([@Jmcosel](https://github.com/Jmcosel))


## v8.5.6 (2023-03-06)

#### :nail_care: Polish
* `wdio-browser-runner`
  * [#9882](https://github.com/webdriverio/webdriverio/pull/9882) [💡 Feature]: Put Mocha setup into a web component ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browser-runner`, `wdio-protocols`, `wdio-runner`, `wdio-utils`, `webdriverio`
  * [#9884](https://github.com/webdriverio/webdriverio/pull/9884) [💡 Feature]: Receive spec and cid properties from browser session ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.5.5 (2023-03-03)

#### :bug: Bug Fix
* `wdio-config`
  * [#9879](https://github.com/webdriverio/webdriverio/pull/9879) fix: duplicated suite ([@vladkosinov](https://github.com/vladkosinov))
* `webdriverio`
  * [#9883](https://github.com/webdriverio/webdriverio/pull/9883) Aria selector improvements ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Vlad Kosinov ([@vladkosinov](https://github.com/vladkosinov))


## v8.5.4 (2023-03-02)

#### :nail_care: Polish
* `wdio-browser-runner`, `wdio-runner`
  * [#9878](https://github.com/webdriverio/webdriverio/pull/9878) Ignore path for browser tests ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browser-runner`
  * [#9880](https://github.com/webdriverio/webdriverio/pull/9880) Allow preset and ViteConfig at the same time ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.5.3 (2023-03-01)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#9872](https://github.com/webdriverio/webdriverio/pull/9872) Improve mocking of namespaced dependencies ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.5.2 (2023-03-01)

#### :nail_care: Polish
* `wdio-browser-runner`
  * [#9867](https://github.com/webdriverio/webdriverio/pull/9867) Ignore file extension of mocked files ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.5.1 (2023-03-01)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#9864](https://github.com/webdriverio/webdriverio/pull/9864) Make `__mocks__` dir optional ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-config`
  * [#9865](https://github.com/webdriverio/webdriverio/pull/9865) Fix glob issue ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-browser-runner`, `wdio-runner`
  * [#9739](https://github.com/webdriverio/webdriverio/pull/9739) Transform CJS deps to ESM through Vite ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.5.0 (2023-02-28)

#### :rocket: New Feature
* `wdio-allure-reporter`
  * [#9704](https://github.com/webdriverio/webdriverio/pull/9704) Allure2 ([@epszaw](https://github.com/epszaw))

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#9853](https://github.com/webdriverio/webdriverio/pull/9853) Fixes for module mocking ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#9857](https://github.com/webdriverio/webdriverio/pull/9857) Cope with missing command ([@tjoris](https://github.com/tjoris))

#### :memo: Documentation
* [#9851](https://github.com/webdriverio/webdriverio/pull/9851) Blog post: "Our Approach to Interactive and Tested Documentation" ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Konstantin Epishev ([@epszaw](https://github.com/epszaw))
- [@tjoris](https://github.com/tjoris)


## v8.4.0 (2023-02-27)

#### :rocket: New Feature
* `wdio-browser-runner`, `wdio-runner`, `webdriverio`
  * [#9821](https://github.com/webdriverio/webdriverio/pull/9821) Component Testing: Support mocking of modules and external dependencies ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`, `wdio-types`
  * [#9806](https://github.com/webdriverio/webdriverio/pull/9806) [Browserstack-service] Support for BuildIdentifier and Fix for LocalIdentifier not adding in BrowserStack Capabilities ([@kamal-kaur04](https://github.com/kamal-kaur04))

#### :memo: Documentation
* Other
  * [#9848](https://github.com/webdriverio/webdriverio/pull/9848) fix capabilities link in component testing docs ([@dannyfink](https://github.com/dannyfink))
* `wdio-browserstack-service`
  * [#9817](https://github.com/webdriverio/webdriverio/pull/9817) Updated Readme - added testObservability docs ([@sourav-kundu](https://github.com/sourav-kundu))

#### :house: Internal
* [#9823](https://github.com/webdriverio/webdriverio/pull/9823) Adds a dev container to help get started with GitHub Codespaces ([@samruddhikhandale](https://github.com/samruddhikhandale))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kamalpreet Kaur ([@kamal-kaur04](https://github.com/kamal-kaur04))
- Samruddhi Khandale ([@samruddhikhandale](https://github.com/samruddhikhandale))
- Sourav Kundu ([@sourav-kundu](https://github.com/sourav-kundu))
- [@dannyfink](https://github.com/dannyfink)


## v8.3.11 (2023-02-24)

#### :memo: Documentation
* `wdio-protocols`, `webdriverio`
  * [#9808](https://github.com/webdriverio/webdriverio/pull/9808) Reference command examples from recipe repo and allow user to interact with them ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.3.10 (2023-02-19)

#### :bug: Bug Fix
* `webdriverio`
  * [#9775](https://github.com/webdriverio/webdriverio/pull/9775) Have same exports for webdriverio cjs and esm module ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-cli`
  * [#9776](https://github.com/webdriverio/webdriverio/pull/9776) RIP Gitter, welcome to the Matrix ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.3.9 (2023-02-15)

#### :nail_care: Polish
* `webdriverio`
  * [#9768](https://github.com/webdriverio/webdriverio/pull/9768) Don't have users extend `ChainablePromiseElement` ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.3.8 (2023-02-14)

#### :bug: Bug Fix
* `webdriverio`
  * [#9767](https://github.com/webdriverio/webdriverio/pull/9767) Have the return type of waitUntil be the return type of the condition ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-sauce-service`
  * [#9743](https://github.com/webdriverio/webdriverio/pull/9743) [sauce-service] Add RDC update job support ([@wswebcreation](https://github.com/wswebcreation))

#### :house: Internal
* `devtools`, `wdio-browser-runner`, `wdio-sauce-service`, `webdriver`, `webdriverio`
  * [#9736](https://github.com/webdriverio/webdriverio/pull/9736) build: change module from NodeNext to ESNext, module resolution from Node16 to Node ([@SCG82](https://github.com/SCG82))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@SCG82](https://github.com/SCG82)


## v8.3.6 (2023-02-09)

#### :nail_care: Polish
* `wdio-browser-runner`
  * [#9735](https://github.com/webdriverio/webdriverio/pull/9735) Transform CJS deps to ESM through Vite ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.3.5 (2023-02-08)

#### :bug: Bug Fix
* `wdio-protocols`
  * [#9731](https://github.com/webdriverio/webdriverio/pull/9731) extend webdriverbidi command to protocolCommands ([@harsha509](https://github.com/harsha509))

#### :nail_care: Polish
* `wdio-browser-runner`, `webdriverio`
  * [#9733](https://github.com/webdriverio/webdriverio/pull/9733) Use 'modern-node-polyfills' to polyfill node modules ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#9721](https://github.com/webdriverio/webdriverio/pull/9721) Use available Cucumber tag `feature` for Allure label instead of Feature name ([@valfirst](https://github.com/valfirst))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Sri Harsha ([@harsha509](https://github.com/harsha509))
- Valery Yatsynovich ([@valfirst](https://github.com/valfirst))


## v8.3.3 (2023-02-04)

#### :rocket: New Feature
* `wdio-browser-runner`
  * [#9706](https://github.com/webdriverio/webdriverio/pull/9706) Provide mock primitives from `@vitest/spy` ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.3.1 (2023-01-28)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-cli`, `wdio-config`, `wdio-runner`
  * [#9677](https://github.com/webdriverio/webdriverio/pull/9677) [🐛 Bug]: Properly merge coverage reports within `@wdio/runner` ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.3.0 (2023-01-28)

#### :rocket: New Feature
* `wdio-browser-runner`, `wdio-cli`, `wdio-local-runner`, `wdio-runner`, `wdio-types`
  * [#9676](https://github.com/webdriverio/webdriverio/pull/9676) Support test coverage reporting and assertion for browser runner ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.2.5 (2023-01-27)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-cli`, `wdio-runner`, `webdriverio`
  * [#9673](https://github.com/webdriverio/webdriverio/pull/9673) Various browser runner improvements ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Pedro Bravo ([@pmlbravo](https://github.com/pmlbravo))


## v8.2.4 (2023-01-25)

#### :bug: Bug Fix
* `wdio-cli`
  * [#9670](https://github.com/webdriverio/webdriverio/pull/9670) Install Jasmine types if user picks Jasmine and TypeScript ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browser-runner`, `wdio-cli`, `wdio-runner`, `webdriverio`
  * [#9667](https://github.com/webdriverio/webdriverio/pull/9667) Fixes to browser runner ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.2.3 (2023-01-23)

#### :bug: Bug Fix
* `wdio-config`, `wdio-mocha-framework`, `wdio-runner`
  * [#9663](https://github.com/webdriverio/webdriverio/pull/9663) Support Mocha Root Hook Plugins ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-utils`
  * [#9664](https://github.com/webdriverio/webdriverio/pull/9664) Improve wdio logging on browser/element objects ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.2.2 (2023-01-23)

#### :memo: Documentation
* [#9638](https://github.com/webdriverio/webdriverio/pull/9638) docs: fix the name of the Stack Overflow tag ([@andrii-bodnar](https://github.com/andrii-bodnar))

#### Committers: 3
- Andrii Bodnar ([@andrii-bodnar](https://github.com/andrii-bodnar))
- Hagai Shatz ([@bh-shatz](https://github.com/bh-shatz))
- [@IgorSasovets](https://github.com/IgorSasovets)


## v8.2.1 (2023-01-20)

#### :bug: Bug Fix
* `wdio-shared-store-service`
  * [#9641](https://github.com/webdriverio/webdriverio/pull/9641) Implement CJS export for shared-store service ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#9640](https://github.com/webdriverio/webdriverio/pull/9640) Export browser and element type primitives in webdriverio package ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.2.0 (2023-01-20)

#### :rocket: New Feature
* `wdio-allure-reporter`
  * [#9630](https://github.com/webdriverio/webdriverio/pull/9630) Map Cucumber tags with special names to Allure links ([@valfirst](https://github.com/valfirst))

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#9621](https://github.com/webdriverio/webdriverio/pull/9621) Bug fix: TypeError: Cannot read properties of undefined (reading 'uuid') ([@nagpalkaran95](https://github.com/nagpalkaran95))
* `wdio-devtools-service`
  * [#9588](https://github.com/webdriverio/webdriverio/pull/9588) fix devtools-service browser.cdp events (#9348 #9545) ([@pedrorfernandes](https://github.com/pedrorfernandes))
* `wdio-cli`
  * [#9615](https://github.com/webdriverio/webdriverio/pull/9615) Remove 'module: ESNext' from config wizard's tsconfig.json template ([@Jmcosel](https://github.com/Jmcosel))
* `wdio-junit-reporter`, `wdio-utils`
  * [#9586](https://github.com/webdriverio/webdriverio/pull/9586) @wdio/junit-reporter: remove validator dependency ([@SCG82](https://github.com/SCG82))
* `webdriverio`
  * [#9496](https://github.com/webdriverio/webdriverio/pull/9496) fix workaround for Safari 12.0.3 ([@kyryloonufriiev](https://github.com/kyryloonufriiev))

#### :nail_care: Polish
* `wdio-cli`
  * [#9477](https://github.com/webdriverio/webdriverio/pull/9477) Make Browserstack service default when browserstack is selected in env ([@agarneha1331](https://github.com/agarneha1331))

#### :memo: Documentation
* [#9587](https://github.com/webdriverio/webdriverio/pull/9587) Update BoilerplateProjects.md ([@amiya-pattnaik](https://github.com/amiya-pattnaik))

#### :house: Internal
* Other
  * [#9632](https://github.com/webdriverio/webdriverio/pull/9632) CI: Bump chromedriver from `107` to `109` ([@valfirst](https://github.com/valfirst))
  * [#9631](https://github.com/webdriverio/webdriverio/pull/9631) CI: Update reference of GH Action retrying steps due to ownership transfer ([@valfirst](https://github.com/valfirst))
  * [#9590](https://github.com/webdriverio/webdriverio/pull/9590) pre-commit: don't run eslint if no files to lint ([@SCG82](https://github.com/SCG82))
* `devtools`, `wdio-browser-runner`, `wdio-browserstack-service`, `wdio-crossbrowsertesting-service`, `wdio-devtools-service`, `wdio-globals`, `wdio-protocols`, `wdio-runner`, `wdio-sauce-service`, `wdio-shared-store-service`, `wdio-testingbot-service`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#9256](https://github.com/webdriverio/webdriverio/pull/9256) Refactor type generation after killing sync mode ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 9
- Amiya Pattanaik ([@amiya-pattnaik](https://github.com/amiya-pattnaik))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jeremy Elwood ([@Jmcosel](https://github.com/Jmcosel))
- Karan Nagpal ([@nagpalkaran95](https://github.com/nagpalkaran95))
- Kyrylo ([@kyryloonufriiev](https://github.com/kyryloonufriiev))
- Neha Agarwal ([@agarneha1331](https://github.com/agarneha1331))
- Pedro Fernandes ([@pedrorfernandes](https://github.com/pedrorfernandes))
- Valery Yatsynovich ([@valfirst](https://github.com/valfirst))
- [@SCG82](https://github.com/SCG82)


## v8.1.3 (2023-01-07)

#### :bug: Bug Fix
* `devtools`
  * [#9544](https://github.com/webdriverio/webdriverio/pull/9544) Better transform unicode keys to Puppeteer key map ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#9535](https://github.com/webdriverio/webdriverio/pull/9535) Update wdio-browserstack-service logging for http status codes ([@amaanbs](https://github.com/amaanbs))

#### :house: Internal
* [#9532](https://github.com/webdriverio/webdriverio/pull/9532) remove expect-webdriverio from root dependencies ([@SCG82](https://github.com/SCG82))

#### Committers: 3
- Amaan Hakim ([@amaanbs](https://github.com/amaanbs))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@SCG82](https://github.com/SCG82)


## v8.1.2 (2023-01-03)

#### :bug: Bug Fix
* `wdio-reporter`
  * [#9525](https://github.com/webdriverio/webdriverio/pull/9525) Fix creation of reporter output directories if they don't exist. ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-types`, `webdriver`
  * [#9522](https://github.com/webdriverio/webdriverio/pull/9522) Fix request retries by using `got` retry feature ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cli`
  * [#9530](https://github.com/webdriverio/webdriverio/pull/9530) Don't fail wizard if npm pkg set scripts.wdio fails ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* `wdio-appium-service`, `wdio-browserstack-service`, `wdio-crossbrowsertesting-service`, `wdio-devtools-service`, `wdio-jasmine-framework`, `wdio-sauce-service`, `wdio-shared-store-service`, `wdio-testingbot-service`, `wdio-webdriver-mock-service`
  * [#9527](https://github.com/webdriverio/webdriverio/pull/9527) fix webdriverio version; fs/promises imports ([@SCG82](https://github.com/SCG82))
* `webdriverio`
  * [#9523](https://github.com/webdriverio/webdriverio/pull/9523) fix @types ([@SCG82](https://github.com/SCG82))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@SCG82](https://github.com/SCG82)


## v8.1.1 (2023-01-02)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#9512](https://github.com/webdriverio/webdriverio/pull/9512) browserstack-service: fix reporter ([@SCG82](https://github.com/SCG82))

#### Committers: 1
- [@SCG82](https://github.com/SCG82)


## v8.1.0 (2023-01-02)

#### :rocket: New Feature
* `wdio-browserstack-service`
  * [#9430](https://github.com/webdriverio/webdriverio/pull/9430) Update wdio-browserstack-service for insights ([@nagpalkaran95](https://github.com/nagpalkaran95))

#### :nail_care: Polish
* `webdriverio`
  * [#9482](https://github.com/webdriverio/webdriverio/pull/9482) webdriverio: cast bound function to original type ([@SCG82](https://github.com/SCG82))

#### :house: Internal
* `devtools`, `wdio-allure-reporter`, `wdio-appium-service`, `wdio-browser-runner`, `wdio-browserstack-service`, `wdio-cli`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-firefox-profile-service`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-local-runner`, `wdio-logger`, `wdio-mocha-framework`, `wdio-protocols`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-shared-store-service`, `wdio-smoke-test-service`, `wdio-spec-reporter`, `wdio-static-server-service`, `wdio-sumologic-reporter`, `wdio-testingbot-service`, `wdio-types`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#9480](https://github.com/webdriverio/webdriverio/pull/9480) Node16 compatibility ([@SCG82](https://github.com/SCG82))
* Other
  * [#9493](https://github.com/webdriverio/webdriverio/pull/9493) pre-commit: only lint staged files ([@SCG82](https://github.com/SCG82))
  * [#9483](https://github.com/webdriverio/webdriverio/pull/9483) typings setup: use native node.js fs utilities ([@SCG82](https://github.com/SCG82))
  * [#9484](https://github.com/webdriverio/webdriverio/pull/9484) update lint-staged filter to check for js, ts, mjs, cjs, mts, cts ([@SCG82](https://github.com/SCG82))
* `devtools`, `wdio-allure-reporter`, `wdio-browser-runner`, `wdio-browserstack-service`, `wdio-cli`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-local-runner`, `wdio-mocha-framework`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-smoke-test-cjs-service`, `wdio-smoke-test-service`, `wdio-static-server-service`, `wdio-sumologic-reporter`, `webdriver`, `webdriverio`
  * [#9489](https://github.com/webdriverio/webdriverio/pull/9489) add missing @types/node dependencies ([@SCG82](https://github.com/SCG82))

#### Committers: 2
- Karan Nagpal ([@nagpalkaran95](https://github.com/nagpalkaran95))
- [@SCG82](https://github.com/SCG82)


## v8.0.15 (2022-12-28)

#### :house: Internal
* Other
  * [#9476](https://github.com/webdriverio/webdriverio/pull/9476) ci: install package devDependencies ([@SCG82](https://github.com/SCG82))
* `wdio-cli`
  * [#9394](https://github.com/webdriverio/webdriverio/pull/9394) @wdio/cli: refactor ([@SCG82](https://github.com/SCG82))
* `devtools`, `wdio-protocols`, `webdriver`, `webdriverio`
  * [#9474](https://github.com/webdriverio/webdriverio/pull/9474) Add extension to type imports for nodenext module resolution ([@kyryloonufriiev](https://github.com/kyryloonufriiev))

#### Committers: 2
- Kyrylo ([@kyryloonufriiev](https://github.com/kyryloonufriiev))
- [@SCG82](https://github.com/SCG82)


## v8.0.14 (2022-12-28)

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#9472](https://github.com/webdriverio/webdriverio/pull/9472) Create CJS export for Allure Reporter ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#9435](https://github.com/webdriverio/webdriverio/pull/9435) Have fallback for `scrollIntoView` if actions command fails ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#9437](https://github.com/webdriverio/webdriverio/pull/9437) update: mark session as failed if no specs ran ([@Ankit098](https://github.com/Ankit098))
* `wdio-types`
  * [#9441](https://github.com/webdriverio/webdriverio/pull/9441) Add missing noProxy typing for Capabilities ProxyObject ([@taina0407](https://github.com/taina0407))
* `wdio-cucumber-framework`
  * [#9438](https://github.com/webdriverio/webdriverio/pull/9438) @wdio/cucumber-framework: add missing Promise.all in registerRequired… ([@SCG82](https://github.com/SCG82))

#### :memo: Documentation
* [#9448](https://github.com/webdriverio/webdriverio/pull/9448) docs: Fix a few typos ([@timgates42](https://github.com/timgates42))
* [#9403](https://github.com/webdriverio/webdriverio/pull/9403) fix: updated wdio execution command in proxy setup ([@vjuturu](https://github.com/vjuturu))

#### :house: Internal
* `wdio-types`
  * [#9444](https://github.com/webdriverio/webdriverio/pull/9444) @wdio/types: node16 module resolution compatibility ([@SCG82](https://github.com/SCG82))
* `devtools`, `eslint-plugin-wdio`, `wdio-allure-reporter`, `wdio-appium-service`, `wdio-browser-runner`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-local-runner`, `wdio-logger`, `wdio-mocha-framework`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-shared-store-service`, `wdio-spec-reporter`, `wdio-sumologic-reporter`, `wdio-testingbot-service`, `wdio-types`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#9445](https://github.com/webdriverio/webdriverio/pull/9445) Adding new EsLint rules ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#9429](https://github.com/webdriverio/webdriverio/pull/9429) Update reference link to eslint governance file ([@Relequestual](https://github.com/Relequestual))

#### Committers: 7
- Ankit Singh ([@Ankit098](https://github.com/Ankit098))
- Ben Hutton ([@Relequestual](https://github.com/Relequestual))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Tim Gates ([@timgates42](https://github.com/timgates42))
- Vampire ([@taina0407](https://github.com/taina0407))
- [@SCG82](https://github.com/SCG82)
- [@vjuturu](https://github.com/vjuturu)


## v8.0.13 (2022-12-14)

#### :bug: Bug Fix
* `wdio-cli`
  * [#9399](https://github.com/webdriverio/webdriverio/pull/9399) Kill worker process if parent shuts down ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-local-runner`
  * [#9398](https://github.com/webdriverio/webdriverio/pull/9398) Fix watch mode by better resolving worker readiness ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`
  * [#9397](https://github.com/webdriverio/webdriverio/pull/9397) Fix async iterators ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#9392](https://github.com/webdriverio/webdriverio/pull/9392) Add docs for Accessibility Testing ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.0.12 (2022-12-12)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-local-runner`
  * [#9369](https://github.com/webdriverio/webdriverio/pull/9369) Wait for worker to be ready to receive events ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#9368](https://github.com/webdriverio/webdriverio/pull/9368) Fix fetching shadow elements ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.0.10 (2022-12-11)

#### :rocket: New Feature
* `devtools`, `wdio-devtools-service`, `webdriverio`
  * [#9354](https://github.com/webdriverio/webdriverio/pull/9354) feat: ability to send headers when connect to browser using puppeteer ([@DudaGod](https://github.com/DudaGod))

#### :bug: Bug Fix
* `wdio-utils`
  * [#9365](https://github.com/webdriverio/webdriverio/pull/9365) Explicitly fail if service initialisation fails ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-appium-service`, `wdio-cli`
  * [#9364](https://github.com/webdriverio/webdriverio/pull/9364) Fix launching Appium in service ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#9366](https://github.com/webdriverio/webdriverio/pull/9366) Improve key actions ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-types`
  * [#9353](https://github.com/webdriverio/webdriverio/pull/9353) Adding capability support for LambdaTest ([@Shahnawaz-LambdaTest](https://github.com/Shahnawaz-LambdaTest))

#### :memo: Documentation
* `webdriverio`
  * [#9349](https://github.com/webdriverio/webdriverio/pull/9349) [📖 Docs]: Better Document `Key` import ([@christian-bromann](https://github.com/christian-bromann))
  * [#9350](https://github.com/webdriverio/webdriverio/pull/9350) minor correction in Example ([@sankalpguptasymphony](https://github.com/sankalpguptasymphony))
* Other
  * [#9359](https://github.com/webdriverio/webdriverio/pull/9359) Switch to new Algolia bucket ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dmitriy Dudkevich ([@DudaGod](https://github.com/DudaGod))
- [@Shahnawaz-LambdaTest](https://github.com/Shahnawaz-LambdaTest)
- [@sankalpguptasymphony](https://github.com/sankalpguptasymphony)


## v8.0.9 (2022-12-07)

#### :bug: Bug Fix
* `webdriverio`
  * [#9344](https://github.com/webdriverio/webdriverio/pull/9344) webdriverio: use v7 scrollIntoView implementation for mobile ([@SCG82](https://github.com/SCG82))

#### :memo: Documentation
* `wdio-cli`
  * [#9347](https://github.com/webdriverio/webdriverio/pull/9347) Add Vitaq service to the v8 documentation ([@RossVertizan](https://github.com/RossVertizan))

#### Committers: 2
- Ross Addinall ([@RossVertizan](https://github.com/RossVertizan))
- [@SCG82](https://github.com/SCG82)


## v8.0.8 (2022-12-07)

#### :bug: Bug Fix
* `wdio-cli`
  * [#9342](https://github.com/webdriverio/webdriverio/pull/9342) Improve path handling for Windows ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-selenium-standalone-service`
  * [#9339](https://github.com/webdriverio/webdriverio/pull/9339) Fix SeleniumStandalone import (#9338) ([@Diazole](https://github.com/Diazole))

#### :nail_care: Polish
* `wdio-types`
  * [#9340](https://github.com/webdriverio/webdriverio/pull/9340) @wdio/types: fix return type of hooks ([@SCG82](https://github.com/SCG82))

#### :house: Internal
* `wdio-cli`, `wdio-local-runner`
  * [#9341](https://github.com/webdriverio/webdriverio/pull/9341) @wdio/cli: fix typo - finisedCommand ([@SCG82](https://github.com/SCG82))
* Other
  * [#9336](https://github.com/webdriverio/webdriverio/pull/9336) Modified globalSetup.ts to make reason and origin of throwBetterErrorMessage more clear ([@RossVertizan](https://github.com/RossVertizan))
* `wdio-cli`
  * [#9335](https://github.com/webdriverio/webdriverio/pull/9335) Modified wdio-cli -> utils.test.ts -> getProjectRoot to handle alternate names of clone directory ([@RossVertizan](https://github.com/RossVertizan))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Ross Addinall ([@RossVertizan](https://github.com/RossVertizan))
- [@Diazole](https://github.com/Diazole)
- [@SCG82](https://github.com/SCG82)


## v8.0.7 (2022-12-06)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-browserstack-service`, `wdio-cli`, `wdio-types`, `webdriverio`
  * [#9328](https://github.com/webdriverio/webdriverio/pull/9328) Firefox DevTools connection improvements ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#9327](https://github.com/webdriverio/webdriverio/pull/9327) Fixed npm pkg set call for Windows - Closes [#9289](https://github.com/webdriverio/webdriverio/issues/9289) ([@christian-bromann](https://github.com/christian-bromann))
* `eslint-plugin-wdio`
  * [#9325](https://github.com/webdriverio/webdriverio/pull/9325) eslint-plugin-wdio: add cjs build ([@SCG82](https://github.com/SCG82))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@SCG82](https://github.com/SCG82)


## v8.0.6 (2022-12-05)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-local-runner`, `wdio-runner`, `wdio-sauce-service`
  * [#9300](https://github.com/webdriverio/webdriverio/pull/9300) Make browser runner work with cloud vendor ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* `wdio-types`
  * [#9297](https://github.com/webdriverio/webdriverio/pull/9297) @wdio/types: add tsconfigs to .npmignore ([@SCG82](https://github.com/SCG82))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@SCG82](https://github.com/SCG82)


## v8.0.5 (2022-12-05)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-globals`, `wdio-runner`
  * [#9293](https://github.com/webdriverio/webdriverio/pull/9293) @wdio/globals: use declare var ([@SCG82](https://github.com/SCG82))

#### :nail_care: Polish
* `wdio-cli`, `wdio-runner`
  * [#9295](https://github.com/webdriverio/webdriverio/pull/9295) DevX improvements for component testing ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@SCG82](https://github.com/SCG82)


## v8.0.4 (2022-12-02)

#### :house: Internal
* `wdio-browser-runner`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-runner`
  * [#9292](https://github.com/webdriverio/webdriverio/pull/9292) expect-webdriverio: update packages to use 4.0.1 ([@SCG82](https://github.com/SCG82))

#### Committers: 1
- [@SCG82](https://github.com/SCG82)


## v8.0.3 (2022-12-02)

#### :bug: Bug Fix
* `wdio-runner`
  * [#9283](https://github.com/webdriverio/webdriverio/pull/9283) [🐛 Bug]: grouping specs results in only a single test report ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-browser-runner`, `wdio-local-runner`, `wdio-runner`
  * [#9284](https://github.com/webdriverio/webdriverio/pull/9284) [🐛 Bug]: Don't fetch for browser events if `debug` command is called ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.0.2 (2022-12-02)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#9282](https://github.com/webdriverio/webdriverio/pull/9282) @wdio/browserstack-service: update peer dependencies for v8 ([@SCG82](https://github.com/SCG82))

#### :nail_care: Polish
* `wdio-utils`, `webdriver`
  * [#9261](https://github.com/webdriverio/webdriverio/pull/9261) draft: fix attach bug at #9260 ([@CNLHC](https://github.com/CNLHC))

#### Committers: 2
- LiuHanCheng ([@CNLHC](https://github.com/CNLHC))
- [@SCG82](https://github.com/SCG82)


## v8.0.0 (2022-12-01)

#### :boom: Breaking Change
* Drop Node.js v12, v13 and v14 Support
* Transition code base from CommonJS to ESM
  * This should not affect WebdriverIO users as you can use the testrunner, as well as `webdriver`, `devtools` and `webdriverio` NPM packages in a CJS environment
  * We still mark this as breaking as we can't gurantee that all (untested) functionality will behave the same due to all rewrites done to the code base
* Removal of `@wdio/sync` which we deprecated in v7
* WebdriverIO types are now accessible through `@wdio/globals/types` instead of `webdriverio/async`
* Removal of `browser.config`
  * Please use `browser.options` instead
  * This will stop support assigning custom properties to the `wdio.conf.js` which we disadvise you to do, instead either assign it as part of a custom capability, e.g. `custom:options` (note the `:` in it, read more on custom capabilities in the [WebDriver spec](https://w3c.github.io/webdriver/#capabilities)) or via [`@wdio/shared-store-service](https://webdriver.io/docs/shared-store-service)
* discontinued support for [`tsconfig-paths`](https://www.npmjs.com/package/tsconfig-paths)

#### :rocket: New Feature
* New [runner plugin](https://webdriver.io/docs/runner) called `@wdio/browser-runner` allows you to run unit and component tests in the browser
* Access WebdriverIO primitives through the new [`@wdio/globals`](https://www.npmjs.com/package/@wdio/globals) package
* New [Action API](https://webdriver.io/docs/api/browser/action)

#### :house: Internal
* Update required Node.js version for development to `v18.12.1`
* Migrate unit tests from Jest to Vitest

#### :nail_care: Polish
* Improvements on configuration wizard and `create-wdio`
  * It now detects whether your projects uses ESM or CJS and creates example files accordingly
  * It now finds the project root and sets up the project relative to it
  * Adds support for browser runner selection

#### :memo: Documentation
* Little design tweaks to the hero section on the main page
* Added new section for component testing
* Added new API section for browser, element, mock objects, modules and environment variables
