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

---

## v6.9.1 (2020-11-20)

#### :bug: Bug Fix
* `webdriverio`
  * [#6127](https://github.com/webdriverio/webdriverio/pull/6127) Switch window query strings ([@christon88](https://github.com/christon88))

#### :nail_care: Polish
* `wdio-sync`, `webdriverio`
  * [#6133](https://github.com/webdriverio/webdriverio/pull/6133) Add Options to Save PDF ([@NickR23](https://github.com/NickR23))

#### Committers: 3
- Christian Onsager ([@christon88](https://github.com/christon88))
- Kazuaki Matsuo ([@KazuCocoa](https://github.com/KazuCocoa))
- Nick Richardson ([@NickR23](https://github.com/NickR23))


## v6.9.0 (2020-11-18)

#### :rocket: New Feature
* `wdio-sync`, `webdriver`, `webdriverio`
  * [#6126](https://github.com/webdriverio/webdriverio/pull/6126) Save pdf ([@NickR23](https://github.com/NickR23))

#### :bug: Bug Fix
* `webdriver`
  * [#6125](https://github.com/webdriverio/webdriverio/pull/6125) Change debuggerAddress to optional ([@christon88](https://github.com/christon88))

#### :house: Internal
* `devtools`, `wdio-config`, `wdio-sync`, `webdriver`, `webdriverio`
  * [#6123](https://github.com/webdriverio/webdriverio/pull/6123) Rewrite utils.ts and constants.ts of wdio-config in typescript ([@abdatta](https://github.com/abdatta))

#### Committers: 3
- Abhishek Datta ([@abdatta](https://github.com/abdatta))
- Christian Onsager ([@christon88](https://github.com/christon88))
- Nick Richardson ([@NickR23](https://github.com/NickR23))


## v6.8.1 (2020-11-17)

#### :bug: Bug Fix
* `webdriverio`
  * [#6066](https://github.com/webdriverio/webdriverio/pull/6066) Closes [#6057](https://github.com/webdriverio/webdriverio/issues/6057) ([@vmelikyan](https://github.com/vmelikyan))
* `wdio-allure-reporter`, `wdio-reporter`
  * [#6076](https://github.com/webdriverio/webdriverio/pull/6076) Another take on bug #4953 ([@oversizedhat](https://github.com/oversizedhat))

#### :nail_care: Polish
* `wdio-runner`
  * [#6122](https://github.com/webdriverio/webdriverio/pull/6122) Execute beforeSession hook before everything is initiated ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `webdriverio`
  * [#6117](https://github.com/webdriverio/webdriverio/pull/6117) Update examples with outdated waitForVisible method  ([@cben](https://github.com/cben))

#### Committers: 5
- Beni Cherniavsky-Paskin ([@cben](https://github.com/cben))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Vahan Melikyan ([@vmelikyan](https://github.com/vmelikyan))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)
- [@oversizedhat](https://github.com/oversizedhat)


## v6.8.0 (2020-11-16)

#### :rocket: New Feature
* `wdio-protocols`
  * [#6102](https://github.com/webdriverio/webdriverio/pull/6102) feat: enable new printPage command via webdriver protocol binding ([@zachlysobey](https://github.com/zachlysobey))

#### :bug: Bug Fix
* `wdio-repl`, `wdio-utils`, `webdriver`
  * [#6111](https://github.com/webdriverio/webdriverio/pull/6111) Fix environment detection ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-mocha-framework`
  * [#6108](https://github.com/webdriverio/webdriverio/pull/6108) fix(5973): fix for mocha before all hook incorrectly taking the first… ([@sarathps93](https://github.com/sarathps93))
* `wdio-appium-service`, `wdio-config`, `wdio-selenium-standalone-service`, `wdio-sync`, `webdriverio`
  * [#6107](https://github.com/webdriverio/webdriverio/pull/6107) Fix Selenium-Standalone service overriding capabilities  ([@hieuxlu](https://github.com/hieuxlu))

#### :memo: Documentation
* [#6104](https://github.com/webdriverio/webdriverio/pull/6104) Update Selectors.md ([@wswebcreation](https://github.com/wswebcreation))

#### :house: Internal
* `devtools`, `wdio-config`, `wdio-logger`, `wdio-protocols`, `webdriver`
  * [#5824](https://github.com/webdriverio/webdriverio/pull/5824) Tracking doc: rewrite `devtools` package into TypeScript ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#6089](https://github.com/webdriverio/webdriverio/pull/6089) website: adjust landing page mobile view ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 8
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Hieu Do ([@hieuxlu](https://github.com/hieuxlu))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Sarath ([@sarathps93](https://github.com/sarathps93))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- Zachary Lysobey ([@zachlysobey](https://github.com/zachlysobey))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)
- dominik feininger ([@dominikfeininger](https://github.com/dominikfeininger))


## v6.7.4 (2020-11-09)

#### :memo: Documentation
* `wdio-cli`
  * [#6078](https://github.com/webdriverio/webdriverio/pull/6078) feat(ui5-service): add UI5 support to wdio ([@dominikfeininger](https://github.com/dominikfeininger))

#### Committers: 1
- dominik feininger ([@dominikfeininger](https://github.com/dominikfeininger))


## v6.7.3 (2020-11-08)

#### :bug: Bug Fix
* `wdio-logger`, `webdriver`
  * [#6073](https://github.com/webdriverio/webdriverio/pull/6073) Closes [#6068](https://github.com/webdriverio/webdriverio/issues/6068) ([@RedMickey](https://github.com/RedMickey))

#### :nail_care: Polish
* `wdio-sync`, `webdriverio`
  * [#6067](https://github.com/webdriverio/webdriverio/pull/6067) Better typing for callback arguments in browser.execute ([@abdatta](https://github.com/abdatta))
* `wdio-sauce-service`
  * [#5961](https://github.com/webdriverio/webdriverio/pull/5961) retry if SC fails to start ([@enriquegh](https://github.com/enriquegh))

#### :house: Internal
* `wdio-applitools-service`, `wdio-selenium-standalone-service`, `wdio-shared-store-service`, `wdio-sync`, `wdio-testingbot-service`, `webdriver`, `webdriverio`
  * [#6032](https://github.com/webdriverio/webdriverio/pull/6032) Tracking doc: rewrite `@wdio/testingbot-service` package into TypeScript ([@hieuxlu](https://github.com/hieuxlu))

#### Committers: 4
- Abhishek Datta ([@abdatta](https://github.com/abdatta))
- Enrique Gonzalez ([@enriquegh](https://github.com/enriquegh))
- Hieu Do ([@hieuxlu](https://github.com/hieuxlu))
- [@RedMickey](https://github.com/RedMickey)


## v6.7.2 (2020-11-02)

#### :bug: Bug Fix
* `wdio-sauce-service`
  * [#6065](https://github.com/webdriverio/webdriverio/pull/6065) fix: Sauce EmuSim can't work with sauce:options for Sauce Connect ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-sync`, `webdriverio`
  * [#6062](https://github.com/webdriverio/webdriverio/pull/6062) browser.mock use utf8 by default ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-allure-reporter`
  * [#6061](https://github.com/webdriverio/webdriverio/pull/6061) allure-reporter: fix mime type ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 3
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.7.1 (2020-10-30)

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#6049](https://github.com/webdriverio/webdriverio/pull/6049) Do not disable webdriver steps reporting when using cucumber step reporter ([@gambrose](https://github.com/gambrose))

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#6052](https://github.com/webdriverio/webdriverio/pull/6052) Add support for element screenshots to Allure reporter ([@gambrose](https://github.com/gambrose))
* `wdio-cli`
  * [#6034](https://github.com/webdriverio/webdriverio/pull/6034) @wdio/cli should log the entire stack trace if available ([@Photonios](https://github.com/Photonios))

#### :memo: Documentation
* Other
  * [#6050](https://github.com/webdriverio/webdriverio/pull/6050) Separate between protocol, webdriverio and testrunner options ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#6037](https://github.com/webdriverio/webdriverio/pull/6037) Update docs for change #6030 ([@dagoud](https://github.com/dagoud))
  * [#5921](https://github.com/webdriverio/webdriverio/pull/5921) Issue: Fix broken links on blog entries and doc page ([@pjcalvo](https://github.com/pjcalvo))

#### :house: Internal
* `wdio-local-runner`, `wdio-repl`, `wdio-sync`, `webdriverio`
  * [#5839](https://github.com/webdriverio/webdriverio/pull/5839) Tracking doc: rewrite `@wdio/local-runner` package into TypeScript ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-repl`, `wdio-sync`, `webdriver`, `webdriverio`
  * [#5992](https://github.com/webdriverio/webdriverio/pull/5992) Rewrite WebdriverIO browser API commands ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#6036](https://github.com/webdriverio/webdriverio/pull/6036) Add Jest coverage config for ts files and note on git symlinks config on Windows ([@hieuxlu](https://github.com/hieuxlu))
* `webdriverio`
  * [#6023](https://github.com/webdriverio/webdriverio/pull/6023) Webdriverio refactor some lower hanging fruits in webdriverio to TS ([@Fabianopb](https://github.com/Fabianopb))

#### Committers: 8
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Fabiano Brito ([@Fabianopb](https://github.com/Fabianopb))
- Graham Ambrose ([@gambrose](https://github.com/gambrose))
- Hieu Do ([@hieuxlu](https://github.com/hieuxlu))
- Pablillo Calvo ([@pjcalvo](https://github.com/pjcalvo))
- Swen Kooij ([@Photonios](https://github.com/Photonios))
- [@dagoud](https://github.com/dagoud)
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.7.0 (2020-10-26)

#### :rocket: New Feature
* `wdio-sync`, `webdriverio`
  * [#6030](https://github.com/webdriverio/webdriverio/pull/6030) Implement methods to navigate through the DOM easier #4019 ([@dagoud](https://github.com/dagoud))

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#6031](https://github.com/webdriverio/webdriverio/pull/6031) Enable multiremote screenshot capturing for wdio-allure-reporter ([@hieuxlu](https://github.com/hieuxlu))
  * [#6020](https://github.com/webdriverio/webdriverio/pull/6020) allure-reporter: attach screenshot to 'all' hooks on failure ([@mgrybyk](https://github.com/mgrybyk))
* `webdriverio`
  * [#5923](https://github.com/webdriverio/webdriverio/pull/5923) fix appium image locator ([@AlmogH](https://github.com/AlmogH))
* `devtools`
  * [#6019](https://github.com/webdriverio/webdriverio/pull/6019) devtools: fix infinite loop on timeout ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* `wdio-sauce-service`
  * [#6027](https://github.com/webdriverio/webdriverio/pull/6027) Clarify Sauce Connect usage ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-allure-reporter`
  * [#6022](https://github.com/webdriverio/webdriverio/pull/6022) allure-reporter: mime type types ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* `wdio-applitools-service`
  * [#5981](https://github.com/webdriverio/webdriverio/pull/5981) Tracking doc: rewrite `@wdio/applitools-service` package into TypeScript ([@mciastek](https://github.com/mciastek))
* `wdio-reporter`
  * [#6026](https://github.com/webdriverio/webdriverio/pull/6026) Minor cleanups after @wdio/reporter migration ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-webdriver-mock-service`
  * [#5968](https://github.com/webdriverio/webdriverio/pull/5968) Tracking doc: rewrite `@wdio/webdriver-mock-service` package into TypeScript ([@suniljaiswal01](https://github.com/suniljaiswal01))
* `webdriverio`
  * [#6021](https://github.com/webdriverio/webdriverio/pull/6021) Refactor webdriverio utils interception devtools to TS ([@Fabianopb](https://github.com/Fabianopb))
* `wdio-reporter`, `wdio-smoke-test-reporter`
  * [#5909](https://github.com/webdriverio/webdriverio/pull/5909) Rewrite `@wdio/reporter` package into TypeScript ([@ablok](https://github.com/ablok))
* `wdio-static-server-service`
  * [#5922](https://github.com/webdriverio/webdriverio/pull/5922) Tracking doc: rewrite `@wdio/static-server-service` package into TypeScript ([@suniljaiswal01](https://github.com/suniljaiswal01))
* `wdio-sync`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#5851](https://github.com/webdriverio/webdriverio/pull/5851) Tracking doc: rewrite `@wdio/utils` package into TypeScript ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`, `webdriverio`
  * [#5999](https://github.com/webdriverio/webdriverio/pull/5999) Refactor utils interception webdriver to typescript ([@Fabianopb](https://github.com/Fabianopb))

#### Committers: 10
- Almog ([@AlmogH](https://github.com/AlmogH))
- Arjan Blok ([@ablok](https://github.com/ablok))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Fabiano Brito ([@Fabianopb](https://github.com/Fabianopb))
- Hieu Do ([@hieuxlu](https://github.com/hieuxlu))
- Mirek Ciastek ([@mciastek](https://github.com/mciastek))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Sunil Jaiswal ([@suniljaiswal01](https://github.com/suniljaiswal01))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@dagoud](https://github.com/dagoud)


## v6.6.8 (2020-10-20)

#### :rocket: New Feature
* `wdio-spec-reporter`
  * [#6005](https://github.com/webdriverio/webdriverio/pull/6005) Spec Reporter - custom symbols for report ([@unickq](https://github.com/unickq))

#### :house: Internal
* [#6013](https://github.com/webdriverio/webdriverio/pull/6013) Changed workflow setup for docs ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 2
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Nick ([@unickq](https://github.com/unickq))


## v6.6.7 (2020-10-20)

#### :rocket: New Feature
* `wdio-sync`, `webdriverio`
  * [#6006](https://github.com/webdriverio/webdriverio/pull/6006) webdriverio: mock respond in request stage ([@mgrybyk](https://github.com/mgrybyk))

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#6000](https://github.com/webdriverio/webdriverio/pull/6000) Add proper multi-remote session support for Browserstack service ([@hieuxlu](https://github.com/hieuxlu))
* `wdio-mocha-framework`, `wdio-sauce-service`
  * [#5997](https://github.com/webdriverio/webdriverio/pull/5997) Properly report Sauce job for Mocha retries ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Hieu Do ([@hieuxlu](https://github.com/hieuxlu))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.6.6 (2020-10-15)

#### :bug: Bug Fix
* `wdio-devtools-service`
  * [#5993](https://github.com/webdriverio/webdriverio/pull/5993) fix for issue #5723 ([@HananArgov](https://github.com/HananArgov))
* `wdio-cucumber-framework`, `wdio-jasmine-framework`, `wdio-mocha-framework`
  * [#5988](https://github.com/webdriverio/webdriverio/pull/5988) init expect-webdriverio before framework run ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* `wdio-sauce-service`
  * [#5987](https://github.com/webdriverio/webdriverio/pull/5987) Fix spelling error from simple to simply ([@nadvolod](https://github.com/nadvolod))

#### :house: Internal
* `webdriverio`
  * [#5994](https://github.com/webdriverio/webdriverio/pull/5994) webdriverio: update resq ([@mgrybyk](https://github.com/mgrybyk))
  * [#5957](https://github.com/webdriverio/webdriverio/pull/5957) Refactor webdriverio utils interception index to TS ([@Fabianopb](https://github.com/Fabianopb))
* `wdio-dot-reporter`, `wdio-reporter`
  * [#5962](https://github.com/webdriverio/webdriverio/pull/5962) Tracking doc: rewrite `@wdio/dot-reporter` package into TypeScript ([@suniljaiswal01](https://github.com/suniljaiswal01))

#### Committers: 5
- DOA ([@HananArgov](https://github.com/HananArgov))
- Fabiano Brito ([@Fabianopb](https://github.com/Fabianopb))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Sunil Jaiswal ([@suniljaiswal01](https://github.com/suniljaiswal01))
- [@nadvolod](https://github.com/nadvolod)


## v6.6.5 (2020-10-13)

#### :bug: Bug Fix
* `wdio-selenium-standalone-service`
  * [#5985](https://github.com/webdriverio/webdriverio/pull/5985) Move @types/fs-extra to dependency section ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v6.6.4 (2020-10-13)

#### :bug: Bug Fix
* `wdio-devtools-service`, `wdio-sync`
  * [#5984](https://github.com/webdriverio/webdriverio/pull/5984) Fix devtools-service ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cucumber-framework`
  * [#5982](https://github.com/webdriverio/webdriverio/pull/5982) cucumber framework: warn if scenario outline name is missing ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* `wdio-selenium-standalone-service`, `webdriverio`
  * [#5913](https://github.com/webdriverio/webdriverio/pull/5913) Tracking doc: rewrite `@wdio/selenium-standalone-service` package into TypeScriptTs selenium standlone service ([@suniljaiswal01](https://github.com/suniljaiswal01))
* Other
  * [#5975](https://github.com/webdriverio/webdriverio/pull/5975) Dispatch event to trigger docs release ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Sunil Jaiswal ([@suniljaiswal01](https://github.com/suniljaiswal01))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.6.3 (2020-10-12)

#### :bug: Bug Fix
* `wdio-appium-service`, `wdio-browserstack-service`, `wdio-config`, `wdio-sauce-service`, `wdio-selenium-standalone-service`
  * [#5960](https://github.com/webdriverio/webdriverio/pull/5960) Fix multi remote capabilities for mixed backends ([@hieuxlu](https://github.com/hieuxlu))
* `webdriver`
  * [#5967](https://github.com/webdriverio/webdriverio/pull/5967) fix request header of webdirver io ([@link89](https://github.com/link89))

#### :memo: Documentation
* Other
  * [#5971](https://github.com/webdriverio/webdriverio/pull/5971) Correct wrong example for `watch` in `CONTRIBUTING.md` ([@martinfrancois](https://github.com/martinfrancois))
* `webdriverio`
  * [#5963](https://github.com/webdriverio/webdriverio/pull/5963) waitForExist/waitForDisplayed: adjust examples ([@wiese](https://github.com/wiese))

#### :house: Internal
* `devtools`, `wdio-allure-reporter`, `wdio-appium-service`, `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-cli`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-spec-reporter`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#5965](https://github.com/webdriverio/webdriverio/pull/5965) Fixes unit tests in windows ([@logesr](https://github.com/logesr))

#### Committers: 5
- François Martin ([@martinfrancois](https://github.com/martinfrancois))
- Hieu Do ([@hieuxlu](https://github.com/hieuxlu))
- Loges R ([@logesr](https://github.com/logesr))
- [@link89](https://github.com/link89)
- [@wiese](https://github.com/wiese)


## v6.6.2 (2020-10-08)

#### :memo: Documentation
* `wdio-selenium-standalone-service`, `webdriver`
  * [#5956](https://github.com/webdriverio/webdriverio/pull/5956) Edge types and selenium-standalone docs ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* `wdio-cli`, `wdio-lambda-runner`
  * [#5953](https://github.com/webdriverio/webdriverio/pull/5953) Remove existence of lambda runner ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v6.6.1 (2020-10-08)

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#5941](https://github.com/webdriverio/webdriverio/pull/5941) Fix to display device name when run on BrowserStack ([@shawnlobo96](https://github.com/shawnlobo96))

#### :memo: Documentation
* Other
  * [#5954](https://github.com/webdriverio/webdriverio/pull/5954) Fixing a few typos on homepage ([@jeremykao](https://github.com/jeremykao))
* `devtools`
  * [#5943](https://github.com/webdriverio/webdriverio/pull/5943) Suppress warning when running tests in Edge and update docs ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* `devtools`, `wdio-shared-store-service`
  * [#5947](https://github.com/webdriverio/webdriverio/pull/5947) Move WebdriverIO pipeline to GitHub Action ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-smoke-test-reporter`
  * [#5949](https://github.com/webdriverio/webdriverio/pull/5949) Tracking doc: rewrite `wdio-smoke-test-reporter` package into TypeScript ([@suniljaiswal01](https://github.com/suniljaiswal01))
* `wdio-smoke-test-service`
  * [#5948](https://github.com/webdriverio/webdriverio/pull/5948) Tracking doc: rewrite `wdio-smoke-test-service` package into TypeScript ([@suniljaiswal01](https://github.com/suniljaiswal01))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jeremy Kao ([@jeremykao](https://github.com/jeremykao))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Shawn Lobo ([@shawnlobo96](https://github.com/shawnlobo96))
- Sunil Jaiswal ([@suniljaiswal01](https://github.com/suniljaiswal01))


## v6.6.0 (2020-10-06)

#### :rocket: New Feature
* `wdio-sync`, `webdriverio`
  * [#5928](https://github.com/webdriverio/webdriverio/pull/5928) Added possibility to disable automatic strings to unicode translation ([@IgorSasovets](https://github.com/IgorSasovets))
  * [#5905](https://github.com/webdriverio/webdriverio/pull/5905) browser mock comparator functions ([@mgrybyk](https://github.com/mgrybyk))

#### :bug: Bug Fix
* `webdriverio`
  * [#5930](https://github.com/webdriverio/webdriverio/pull/5930) Fix server mocking issues ([@mgrybyk](https://github.com/mgrybyk))
  * [#5903](https://github.com/webdriverio/webdriverio/pull/5903) Fix double click ([@mgrybyk](https://github.com/mgrybyk))
* `devtools`
  * [#5917](https://github.com/webdriverio/webdriverio/pull/5917) Speedup Firefox Nightly startup on MacOS with devtools protocol ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-devtools-service`
  * [#5925](https://github.com/webdriverio/webdriverio/pull/5925) devtools-service: upgrade lighthouse ([@mgrybyk](https://github.com/mgrybyk))
  * [#5914](https://github.com/webdriverio/webdriverio/pull/5914) Using corrected profile name.  ([@joventuraz](https://github.com/joventuraz))
  * [#5886](https://github.com/webdriverio/webdriverio/pull/5886) fix devtools tracing for click transitions ([@SrinivasanTarget](https://github.com/SrinivasanTarget))

#### :nail_care: Polish
* `wdio-sync`, `webdriverio`
  * [#5937](https://github.com/webdriverio/webdriverio/pull/5937) Fix addValue and setValue  ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-mocha-framework`
  * [#5910](https://github.com/webdriverio/webdriverio/pull/5910) Propagate error when loading suite ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-mocha-framework`, `wdio-reporter`
  * [#5873](https://github.com/webdriverio/webdriverio/pull/5873) Adds mocha test retry hook to reporter ([@RimantasDob](https://github.com/RimantasDob))
* `devtools`
  * [#5879](https://github.com/webdriverio/webdriverio/pull/5879) Disable password manager prompt by default in devtools ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* Other
  * [#5919](https://github.com/webdriverio/webdriverio/pull/5919) Improve documentation around WDIO options/configs ([@jrouly](https://github.com/jrouly))
  * [#5926](https://github.com/webdriverio/webdriverio/pull/5926) Fix intercept example ([@mgrybyk](https://github.com/mgrybyk))
  * [#5918](https://github.com/webdriverio/webdriverio/pull/5918) Add firefox nightly and chrome links to contributing doc ([@joventuraz](https://github.com/joventuraz))
  * [#5902](https://github.com/webdriverio/webdriverio/pull/5902) Update PageObjects.md ([@PetrKnedlik](https://github.com/PetrKnedlik))
  * [#5892](https://github.com/webdriverio/webdriverio/pull/5892) Update Mocha boilerplate to wdio v6 ([@WarleyGabriel](https://github.com/WarleyGabriel))
* `webdriverio`
  * [#5891](https://github.com/webdriverio/webdriverio/pull/5891) Add documentation to overwrite and add commands ([@AutomationReddy](https://github.com/AutomationReddy))

#### :house: Internal
* `devtools`, `wdio-cli`, `wdio-config`, `wdio-logger`, `wdio-protocols`, `wdio-repl`, `wdio-runner`, `wdio-shared-store-service`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#5853](https://github.com/webdriverio/webdriverio/pull/5853) Tracking doc: rewrite `webdriver` package into TypeScript ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-shared-store-service`
  * [#5927](https://github.com/webdriverio/webdriverio/pull/5927) Tracking doc: rewrite `@wdio/shared-store-service` package into TypeScript ([@mgrybyk](https://github.com/mgrybyk))
* `devtools`, `eslint-plugin-wdio`, `wdio-allure-reporter`, `wdio-appium-service`, `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-dot-reporter`, `wdio-firefox-profile-service`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-lambda-runner`, `wdio-local-runner`, `wdio-logger`, `wdio-mocha-framework`, `wdio-protocols`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-shared-store-service`, `wdio-smoke-test-reporter`, `wdio-smoke-test-service`, `wdio-spec-reporter`, `wdio-static-server-service`, `wdio-sumologic-reporter`, `wdio-sync`, `wdio-testingbot-service`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#5804](https://github.com/webdriverio/webdriverio/pull/5804) Get rid of Babel and rewrite @wdio/repl ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 11
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jose Ventura ([@joventuraz](https://github.com/joventuraz))
- Michel Rouly ([@jrouly](https://github.com/jrouly))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Petr Knedlík ([@PetrKnedlik](https://github.com/PetrKnedlik))
- Rimantas Dobrovolskis ([@RimantasDob](https://github.com/RimantasDob))
- Srinivasan Sekar ([@SrinivasanTarget](https://github.com/SrinivasanTarget))
- Vinod Reddy ([@AutomationReddy](https://github.com/AutomationReddy))
- Warley Gabriel ([@WarleyGabriel](https://github.com/WarleyGabriel))
- [@IgorSasovets](https://github.com/IgorSasovets)
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.5.2 (2020-09-18)

#### :bug: Bug Fix
* `webdriverio`
  * [#5872](https://github.com/webdriverio/webdriverio/pull/5872) Assign w3c identifier to element scope after element re-found ([@L0tso](https://github.com/L0tso))
* `wdio-allure-reporter`
  * [#5870](https://github.com/webdriverio/webdriverio/pull/5870) Fixes the issue On V6, for android tests, where the incorrect deviceName is displayed in allure reports ([@jags14385](https://github.com/jags14385))
* `wdio-devtools-service`
  * [#5858](https://github.com/webdriverio/webdriverio/pull/5858) Fix unbound commands in devtools-service ([@mattmohan](https://github.com/mattmohan))

#### :memo: Documentation
* [#5871](https://github.com/webdriverio/webdriverio/pull/5871) Added Bamboo Documentation ([@AutomationReddy](https://github.com/AutomationReddy))
* [#5868](https://github.com/webdriverio/webdriverio/pull/5868) Add docs on how to deploy and run our docs page ([@christian-bromann](https://github.com/christian-bromann))
* [#5857](https://github.com/webdriverio/webdriverio/pull/5857) Prepend hash only for h1 in 3rd party docs ([@mgrybyk](https://github.com/mgrybyk))
* [#5856](https://github.com/webdriverio/webdriverio/pull/5856) Update BoilerplateProjects.md ([@amiya-pattnaik](https://github.com/amiya-pattnaik))

#### Committers: 8
- Amiya Pattanaik ([@amiya-pattnaik](https://github.com/amiya-pattnaik))
- Bohdan Belenok ([@L0tso](https://github.com/L0tso))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jags ([@jags14385](https://github.com/jags14385))
- Matthew Mohan ([@mattmohan](https://github.com/mattmohan))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Vinod Reddy ([@AutomationReddy](https://github.com/AutomationReddy))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.5.1 (2020-09-14)

#### :bug: Bug Fix
* `wdio-junit-reporter`
  * [#5812](https://github.com/webdriverio/webdriverio/pull/5812) Fix missing mocha test hooks in a junit report ([@vgrigoruk](https://github.com/vgrigoruk))
* Other
  * [#5823](https://github.com/webdriverio/webdriverio/pull/5823) scripts: ensure api doc dir ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 2
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Vitalii Grygoruk ([@vgrigoruk](https://github.com/vgrigoruk))


## v6.5.0 (2020-09-14)

#### :rocket: New Feature
* `wdio-shared-store-service`, `wdio-sync`, `webdriverio`
  * [#5821](https://github.com/webdriverio/webdriverio/pull/5821) Filter postData, responseHeaders, statusCode ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`, `wdio-sync`, `wdio-utils`, `webdriverio`
  * [#5819](https://github.com/webdriverio/webdriverio/pull/5819) Add optional delay between spec file retry attempts ([@mgrybyk](https://github.com/mgrybyk))

#### :bug: Bug Fix
* `devtools`
  * [#5803](https://github.com/webdriverio/webdriverio/pull/5803) adding dialog handler to switchwindow so that we can handle alerts ([@ParmaJonEman](https://github.com/ParmaJonEman))
* `webdriverio`
  * [#5820](https://github.com/webdriverio/webdriverio/pull/5820) Fix network mock headers filter ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-jasmine-framework`
  * [#5790](https://github.com/webdriverio/webdriverio/pull/5790) log warning if jasmine tests have no root describe ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#5818](https://github.com/webdriverio/webdriverio/pull/5818) generate expect-webdriverio api doc ([@mgrybyk](https://github.com/mgrybyk))
* [#5814](https://github.com/webdriverio/webdriverio/pull/5814) Update BoilerplateProjects.md ([@amiya-pattnaik](https://github.com/amiya-pattnaik))

#### Committers: 4
- Amiya Pattanaik ([@amiya-pattnaik](https://github.com/amiya-pattnaik))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@ParmaJonEman](https://github.com/ParmaJonEman)


## v6.4.7 (2020-09-10)

#### :bug: Bug Fix
* `wdio-mocha-framework`
  * [#5809](https://github.com/webdriverio/webdriverio/pull/5809) Support ESM specs with Mocha ([@diachedelic](https://github.com/diachedelic))
* `wdio-sauce-service`
  * [#5805](https://github.com/webdriverio/webdriverio/pull/5805) Fix Unified Platform and Sauce Connect bug ([@wswebcreation](https://github.com/wswebcreation))
* `webdriverio`
  * [#5806](https://github.com/webdriverio/webdriverio/pull/5806) Check array input parameter using Array.isArray ([@zabil](https://github.com/zabil))

#### :memo: Documentation
* Other
  * [#5808](https://github.com/webdriverio/webdriverio/pull/5808) Update cucumber boilerplate to webdriverio v6 ([@WarleyGabriel](https://github.com/WarleyGabriel))
  * [#5774](https://github.com/webdriverio/webdriverio/pull/5774) Add names of mentors will to give 1:1 help to "help" page ([@klamping](https://github.com/klamping))
  * [#5800](https://github.com/webdriverio/webdriverio/pull/5800) Fixed broken links for browser.call page ([@pjcalvo](https://github.com/pjcalvo))
* `wdio-sync`, `webdriverio`
  * [#5799](https://github.com/webdriverio/webdriverio/pull/5799) addCommand and overwriteCommand types ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* Other
  * [#5794](https://github.com/webdriverio/webdriverio/pull/5794) Add script to push release tag ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`, `wdio-allure-reporter`, `wdio-appium-service`, `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-dot-reporter`, `wdio-firefox-profile-service`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-lambda-runner`, `wdio-local-runner`, `wdio-logger`, `wdio-mocha-framework`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-shared-store-service`, `wdio-smoke-test-reporter`, `wdio-smoke-test-service`, `wdio-spec-reporter`, `wdio-static-server-service`, `wdio-sumologic-reporter`, `wdio-sync`, `wdio-testingbot-service`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#5446](https://github.com/webdriverio/webdriverio/pull/5446) 5424 setup typescript (Work in progress, do not merge) ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 9
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Pablillo Calvo ([@pjcalvo](https://github.com/pjcalvo))
- Warley Gabriel ([@WarleyGabriel](https://github.com/WarleyGabriel))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- Zabil Cheriya Maliackal ([@zabil](https://github.com/zabil))
- [@diachedelic](https://github.com/diachedelic)


## v6.4.6 (2020-09-03)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#5771](https://github.com/webdriverio/webdriverio/pull/5771) Closes [#5647](https://github.com/webdriverio/webdriverio/issues/5647) : add other check for app capability in browserstack-service ([@Virtim](https://github.com/Virtim))

#### :nail_care: Polish
* `webdriverio`
  * [#5783](https://github.com/webdriverio/webdriverio/pull/5783) [#5541] dragAndDrop to sleep for given duration in JsonWireProtocol ([@mathew-jithin](https://github.com/mathew-jithin))

#### :memo: Documentation
* `wdio-devtools-service`
  * [#5792](https://github.com/webdriverio/webdriverio/pull/5792) Fix wdio-devtools-service README ([@vgrigoruk](https://github.com/vgrigoruk))
* `webdriverio`
  * [#5787](https://github.com/webdriverio/webdriverio/pull/5787) [DOCUMENTATION] Nested shadow roots plugin ([@Georgegriff](https://github.com/Georgegriff))

#### Committers: 5
- George Griffiths ([@Georgegriff](https://github.com/Georgegriff))
- Jithin Mathew ([@mathew-jithin](https://github.com/mathew-jithin))
- Tim Vir ([@Virtim](https://github.com/Virtim))
- Vitalii Grygoruk ([@vgrigoruk](https://github.com/vgrigoruk))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.4.5 (2020-08-31)

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#5769](https://github.com/webdriverio/webdriverio/pull/5769) Use proper Chrome version in headless mode ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-config`, `wdio-sauce-service`
  * [#5772](https://github.com/webdriverio/webdriverio/pull/5772) Add new Sauce Labs Unified Platform endpoint ([@wswebcreation](https://github.com/wswebcreation))

#### :memo: Documentation
* Other
  * [#5773](https://github.com/webdriverio/webdriverio/pull/5773) Update typescript guide ([@mgrybyk](https://github.com/mgrybyk))
  * [#5659](https://github.com/webdriverio/webdriverio/pull/5659) docs: Don't have types being linked to their own pages ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#5777](https://github.com/webdriverio/webdriverio/pull/5777) Minor updates to dragAndDrop command docs ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v6.4.4 (2020-08-28)

#### :bug: Bug Fix
* `devtools`
  * [#5768](https://github.com/webdriverio/webdriverio/pull/5768) Invalidate stalled elements in ElementStore ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 1
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v6.4.3 (2020-08-27)

#### :nail_care: Polish
* `wdio-devtools-service`
  * [#5760](https://github.com/webdriverio/webdriverio/pull/5760)  Propagate CDP events to the browser event listener ([@L0tso](https://github.com/L0tso))

#### :memo: Documentation
* `wdio-cucumber-framework`
  * [#5764](https://github.com/webdriverio/webdriverio/pull/5764) Update documentation for tagExpression usage ([@osmolyar](https://github.com/osmolyar))

#### :house: Internal
* [#5761](https://github.com/webdriverio/webdriverio/pull/5761) Add section on reporting and include OpenJS Foundation excalation path ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Bohdan Belenok ([@L0tso](https://github.com/L0tso))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Olga ([@osmolyar](https://github.com/osmolyar))


## v6.4.2 (2020-08-25)

#### :nail_care: Polish
* `wdio-sauce-service`
  * [#5750](https://github.com/webdriverio/webdriverio/pull/5750) @wdio/sauce-service Job Names are not sliced when using Jasmine #5728 ([@joshskumar](https://github.com/joshskumar))

#### :memo: Documentation
* `wdio-devtools-service`
  * [#5753](https://github.com/webdriverio/webdriverio/pull/5753) Document setting download paths with browser.cdp() ([@vipulgupta2048](https://github.com/vipulgupta2048))
* `wdio-cli`
  * [#5740](https://github.com/webdriverio/webdriverio/pull/5740) Add wdio-rerun-service entries to Webdriver.IO ([@mikesalvia](https://github.com/mikesalvia))
* `webdriver`
  * [#5733](https://github.com/webdriverio/webdriverio/pull/5733) Make type definition for createWindow more precise ([@lukyth](https://github.com/lukyth))
* Other
  * [#5653](https://github.com/webdriverio/webdriverio/pull/5653) Update expect.md ([@marseam](https://github.com/marseam))

#### Committers: 6
- Kanitkorn Sujautra ([@lukyth](https://github.com/lukyth))
- Martin McGee ([@marseam](https://github.com/marseam))
- Mike Salvia ([@mikesalvia](https://github.com/mikesalvia))
- Vipul Gupta ([@vipulgupta2048](https://github.com/vipulgupta2048))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)
- [@joshskumar](https://github.com/joshskumar)


## v6.4.1 (2020-08-24)

#### :bug: Bug Fix
* `wdio-cli`
  * [#5712](https://github.com/webdriverio/webdriverio/pull/5712) fix(cli): backslash replacement on win32 ([@rendmath](https://github.com/rendmath))
* `webdriverio`
  * [#5705](https://github.com/webdriverio/webdriverio/pull/5705) Fix prototypes for items in getElements array. ([@L0tso](https://github.com/L0tso))
* `wdio-shared-store-service`
  * [#5702](https://github.com/webdriverio/webdriverio/pull/5702) Fix data argument must be string in shared-store-service ([@stevoland](https://github.com/stevoland))

#### :nail_care: Polish
* `devtools`
  * [#5710](https://github.com/webdriverio/webdriverio/pull/5710) devtools: Fix `ignoreDefaultArgs` capability option ([@koggdal](https://github.com/koggdal))

#### :memo: Documentation
* Other
  * [#5708](https://github.com/webdriverio/webdriverio/pull/5708) docs: folder structure for typescript docs ([@rendmath](https://github.com/rendmath))
  * [#5709](https://github.com/webdriverio/webdriverio/pull/5709) docs: add import for typed configuration ([@rendmath](https://github.com/rendmath))
  * [#5707](https://github.com/webdriverio/webdriverio/pull/5707) docs: add extension to required ts conf path ([@rendmath](https://github.com/rendmath))
  * [#5704](https://github.com/webdriverio/webdriverio/pull/5704) docs: typescript package dependency requirement ([@rendmath](https://github.com/rendmath))
* `wdio-devtools-service`
  * [#5722](https://github.com/webdriverio/webdriverio/pull/5722) Fix typo in README.md ([@iboshkov](https://github.com/iboshkov))
* `webdriver`
  * [#5698](https://github.com/webdriverio/webdriverio/pull/5698) TypeDefination fix for selenoid options ([@suniljaiswal01](https://github.com/suniljaiswal01))

#### Committers: 7
- Bohdan Belenok ([@L0tso](https://github.com/L0tso))
- Ilija Boshkov ([@iboshkov](https://github.com/iboshkov))
- Johannes Koggdal ([@koggdal](https://github.com/koggdal))
- Mathieu Renda ([@rendmath](https://github.com/rendmath))
- Stephen J. Collings ([@stevoland](https://github.com/stevoland))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)
- [@suniljaiswal01](https://github.com/suniljaiswal01)


## v6.4.0 (2020-08-06)

#### :bug: Bug Fix
* [#5688](https://github.com/webdriverio/webdriverio/pull/5688) repaired mocha/multiremote example ([@cjatkinson](https://github.com/cjatkinson))

#### :nail_care: Polish
* `wdio-sync`, `webdriverio`
  * [#5689](https://github.com/webdriverio/webdriverio/pull/5689) Add type definition for filesToWatch ([@seanpoulter](https://github.com/seanpoulter))
* `wdio-cli`
  * [#5686](https://github.com/webdriverio/webdriverio/pull/5686) Added LambdaTest environment variables for wdio/cli while generating … ([@kanhaiya15](https://github.com/kanhaiya15))
* `devtools`, `wdio-cli`, `wdio-devtools-service`, `wdio-junit-reporter`, `wdio-sync`, `wdio-utils`, `webdriverio`
  * [#5677](https://github.com/webdriverio/webdriverio/pull/5677) Improve Puppeteer integration ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `webdriverio`
  * [#5638](https://github.com/webdriverio/webdriverio/pull/5638) Update browser.throttle documentation ([@klamping](https://github.com/klamping))
* `wdio-appium-service`
  * [#5690](https://github.com/webdriverio/webdriverio/pull/5690) Updated ReadMe ([@abhidp](https://github.com/abhidp))

#### Committers: 7
- Abhi D ([@abhidp](https://github.com/abhidp))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Christopher Atkinson ([@cjatkinson](https://github.com/cjatkinson))
- Kanhaiya Lal Singh ([@kanhaiya15](https://github.com/kanhaiya15))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Sean Poulter ([@seanpoulter](https://github.com/seanpoulter))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.3.7 (2020-08-03)

#### :memo: Documentation
* [#5678](https://github.com/webdriverio/webdriverio/pull/5678) Update Expect API Docs to add two matchers ([@klamping](https://github.com/klamping))
* [#5674](https://github.com/webdriverio/webdriverio/pull/5674) docs: add docs for github action integration ([@ilamparithiNatarajan](https://github.com/ilamparithiNatarajan))

#### Committers: 3
- Ilamparithi Natarajan ([@ilamparithiNatarajan](https://github.com/ilamparithiNatarajan))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Srinivasan Sekar ([@SrinivasanTarget](https://github.com/SrinivasanTarget))


## v6.3.6 (2020-07-29)

#### :bug: Bug Fix
* `wdio-cli`
  * [#5671](https://github.com/webdriverio/webdriverio/pull/5671) Fix issue with auto-genarated tests for Cucumber ([@pjcalvo](https://github.com/pjcalvo))

#### :nail_care: Polish
* `wdio-devtools-service`
  * [#5667](https://github.com/webdriverio/webdriverio/pull/5667) Calculate performance score based on new weightage and metrics ([@SrinivasanTarget](https://github.com/SrinivasanTarget))

#### Committers: 3
- Pablillo Calvo ([@pjcalvo](https://github.com/pjcalvo))
- Srinivasan Sekar ([@SrinivasanTarget](https://github.com/SrinivasanTarget))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.3.5 (2020-07-24)

#### :bug: Bug Fix
* `wdio-devtools-service`, `webdriver`
  * [#5651](https://github.com/webdriverio/webdriverio/pull/5651) Fix re-attach devtools service if `reloadSession` was called ([@HananArgov](https://github.com/HananArgov))
* `webdriverio`
  * [#5649](https://github.com/webdriverio/webdriverio/pull/5649) Add TypeScript types for SevereServiceError ([@AdamTReineke](https://github.com/AdamTReineke))

#### :nail_care: Polish
* `wdio-devtools-service`
  * [#5646](https://github.com/webdriverio/webdriverio/pull/5646) Upgrade lighthouse and add new metrics ([@SrinivasanTarget](https://github.com/SrinivasanTarget))

#### :memo: Documentation
* [#5654](https://github.com/webdriverio/webdriverio/pull/5654) Fix version 4 doc links ([@Jazzepi](https://github.com/Jazzepi))

#### Committers: 4
- Adam Reineke ([@AdamTReineke](https://github.com/AdamTReineke))
- DOA ([@HananArgov](https://github.com/HananArgov))
- Michael Pinnegar ([@Jazzepi](https://github.com/Jazzepi))
- Srinivasan Sekar ([@SrinivasanTarget](https://github.com/SrinivasanTarget))


## v6.3.4 (2020-07-21)

#### :bug: Bug Fix
* `wdio-junit-reporter`
  * [#5641](https://github.com/webdriverio/webdriverio/pull/5641) Wdio JUnit Reporter - Closes [#5637](https://github.com/webdriverio/webdriverio/issues/5637) ([@unickq](https://github.com/unickq))
  * [#5637](https://github.com/webdriverio/webdriverio/pull/5637) Fix 5589 ([@jonesh66](https://github.com/jonesh66))

#### :memo: Documentation
* `devtools`
  * [#5635](https://github.com/webdriverio/webdriverio/pull/5635) Update devtools package.json homepage url ([@klamping](https://github.com/klamping))

#### :house: Internal
* [#5639](https://github.com/webdriverio/webdriverio/pull/5639) [Security] Bump codecov from 3.7.0 to 3.7.1 ([@dependabot-preview[bot]](https://github.com/apps/dependabot-preview))

#### Committers: 4
- Jonesh Sharma ([@jonesh66](https://github.com/jonesh66))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Nick ([@unickq](https://github.com/unickq))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.3.3 (2020-07-17)

#### :rocket: New Feature
* `webdriverio`
  * [#5633](https://github.com/webdriverio/webdriverio/pull/5633) Appium find by image support ([@jayandran-Sampath](https://github.com/jayandran-Sampath))

#### :bug: Bug Fix
* `wdio-sync`, `webdriverio`
  * [#5632](https://github.com/webdriverio/webdriverio/pull/5632) Add `calls` property to mock typings. ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Nick ([@unickq](https://github.com/unickq))
- [@jayandran-Sampath](https://github.com/jayandran-Sampath)


## v6.3.2 (2020-07-17)

#### :rocket: New Feature
* `wdio-junit-reporter`
  * [#5628](https://github.com/webdriverio/webdriverio/pull/5628) Add file attribute to testcase output ([@hollandben](https://github.com/hollandben))

#### Committers: 1
- Ben Holland ([@hollandben](https://github.com/hollandben))


## v6.3.1 (2020-07-16)

#### :bug: Bug Fix
* `wdio-sauce-service`
  * [#5627](https://github.com/webdriverio/webdriverio/pull/5627) Fix dependency of @wdio/sauce-service on @wdio/utils ([@lfdebrux](https://github.com/lfdebrux))

#### Committers: 1
- Laurence de Bruxelles ([@lfdebrux](https://github.com/lfdebrux))


## v6.3.0 (2020-07-16)

#### :rocket: New Feature
* `devtools`, `wdio-cli`, `wdio-local-runner`, `wdio-protocols`, `wdio-sync`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#5477](https://github.com/webdriverio/webdriverio/pull/5477) Implement Network Primitives ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-devtools-service`
  * [#5566](https://github.com/webdriverio/webdriverio/pull/5566) fix return type of getPuppeteer in typescript definitions ([@SrinivasanTarget](https://github.com/SrinivasanTarget))
* `wdio-cli`
  * [#5612](https://github.com/webdriverio/webdriverio/pull/5612) Move `pageobject` folders outside specs and steps folder... ([@pjcalvo](https://github.com/pjcalvo))
  * [#5618](https://github.com/webdriverio/webdriverio/pull/5618) Remove extra space introduced by prior PR https://github.com/webdriverio/webdriverio/pull/5483 ([@osmolyar](https://github.com/osmolyar))
* `wdio-sauce-service`, `wdio-utils`
  * [#5610](https://github.com/webdriverio/webdriverio/pull/5610) Fix issue #5585 ([@lfdebrux](https://github.com/lfdebrux))
* `wdio-sauce-service`
  * [#5617](https://github.com/webdriverio/webdriverio/pull/5617) feat: update Sauce Unified Platform (RDC on Sauce) with the JS-executor ([@wswebcreation](https://github.com/wswebcreation))

#### :memo: Documentation
* `webdriverio`
  * [#5623](https://github.com/webdriverio/webdriverio/pull/5623) Update $.js documentation ([@GibbsB](https://github.com/GibbsB))

#### :house: Internal
* `devtools`, `wdio-devtools-service`
  * [#5619](https://github.com/webdriverio/webdriverio/pull/5619) chore: Bump puppeteer core 5.1.0 ([@mohanraj-r](https://github.com/mohanraj-r))

#### Committers: 9
- Brandon Gibbons ([@GibbsB](https://github.com/GibbsB))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Laurence de Bruxelles ([@lfdebrux](https://github.com/lfdebrux))
- Mohan Raj Rajamanickam ([@mohanraj-r](https://github.com/mohanraj-r))
- Olga ([@osmolyar](https://github.com/osmolyar))
- Pablillo Calvo ([@pjcalvo](https://github.com/pjcalvo))
- Srinivasan Sekar ([@SrinivasanTarget](https://github.com/SrinivasanTarget))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.2.0 (2020-07-13)

#### :rocket: New Feature
* `wdio-cli`, `wdio-utils`
  * [#5590](https://github.com/webdriverio/webdriverio/pull/5590) Implement autogeneration of test files ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `webdriverio`
  * [#5599](https://github.com/webdriverio/webdriverio/pull/5599) Have `remote` and `multiremote` return a promise ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-mocha-framework`
  * [#5592](https://github.com/webdriverio/webdriverio/pull/5592) webdriverio-mocha: add ui type mocha ts in mochaOpts ([@cjatkinson](https://github.com/cjatkinson))

#### :memo: Documentation
* `wdio-sync`, `webdriverio`
  * [#5598](https://github.com/webdriverio/webdriverio/pull/5598) doc: fix incorrect links in docs ([@mohanraj-r](https://github.com/mohanraj-r))
* `wdio-applitools-service`
  * [#5583](https://github.com/webdriverio/webdriverio/pull/5583) Update docs for Applitools ([@ojkelly-vha](https://github.com/ojkelly-vha))

#### :house: Internal
* [#5593](https://github.com/webdriverio/webdriverio/pull/5593) Better define the "Contributor" path ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Christopher Atkinson ([@cjatkinson](https://github.com/cjatkinson))
- Mohan Raj Rajamanickam ([@mohanraj-r](https://github.com/mohanraj-r))
- [@ojkelly-vha](https://github.com/ojkelly-vha)


## v6.1.25 (2020-07-07)

#### :bug: Bug Fix
* `webdriverio`
  * [#5572](https://github.com/webdriverio/webdriverio/pull/5572) Closes [#5568](https://github.com/webdriverio/webdriverio/issues/5568) ([@JumiDeluxe](https://github.com/JumiDeluxe))

#### :nail_care: Polish
* `wdio-junit-reporter`
  * [#5540](https://github.com/webdriverio/webdriverio/pull/5540) Better package names for Cucumber Junit reports ([@mikesalvia](https://github.com/mikesalvia))
* `wdio-cli`
  * [#5570](https://github.com/webdriverio/webdriverio/pull/5570) Added Novus Visual Regression Service ([@Jnegrier](https://github.com/Jnegrier))

#### :memo: Documentation
* `devtools`, `wdio-protocols`
  * [#5573](https://github.com/webdriverio/webdriverio/pull/5573) Added Documentation to devtools command ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#5574](https://github.com/webdriverio/webdriverio/pull/5574) Add workshop video to contribute page ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Juan Negrier ([@Jnegrier](https://github.com/Jnegrier))
- Mike Salvia ([@mikesalvia](https://github.com/mikesalvia))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)
- jwm00 ([@JumiDeluxe](https://github.com/JumiDeluxe))


## v6.1.24 (2020-07-02)

#### :rocket: New Feature
* `wdio-cli`, `webdriverio`
  * [#5565](https://github.com/webdriverio/webdriverio/pull/5565) Enable Ability to Stop Execution when Error Occurs in Service Hook ([@emilyrohrbough](https://github.com/emilyrohrbough))

#### :memo: Documentation
* `wdio-devtools-service`
  * [#5564](https://github.com/webdriverio/webdriverio/pull/5564) Add missing typescript typings for getPuppeteer command ([@SrinivasanTarget](https://github.com/SrinivasanTarget))

#### Committers: 2
- Emily Rohrbough  ([@emilyrohrbough](https://github.com/emilyrohrbough))
- Srinivasan Sekar ([@SrinivasanTarget](https://github.com/SrinivasanTarget))


## v6.1.23 (2020-07-01)

#### :bug: Bug Fix
* `devtools`, `wdio-allure-reporter`
  * [#5543](https://github.com/webdriverio/webdriverio/pull/5543) Better support for Allure reporter using DevTools protocol ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-reporter`
  * [#5544](https://github.com/webdriverio/webdriverio/pull/5544) Fix command reporting in reporters ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-devtools-service`
  * [#5526](https://github.com/webdriverio/webdriverio/pull/5526) fixing wrong variable call in error of devtools' cdp ([@HananArgov](https://github.com/HananArgov))

#### :memo: Documentation
* Other
  * [#5562](https://github.com/webdriverio/webdriverio/pull/5562) Add blog post for open office hours ([@christian-bromann](https://github.com/christian-bromann))
  * [#5549](https://github.com/webdriverio/webdriverio/pull/5549) docs: Add "Migrating from Chai" section ([@caweidmann](https://github.com/caweidmann))
* `wdio-jasmine-framework`
  * [#5547](https://github.com/webdriverio/webdriverio/pull/5547) #5538: Added types for missing grep and invertGrep ([@sethuster](https://github.com/sethuster))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Cornelius ([@caweidmann](https://github.com/caweidmann))
- DOA ([@HananArgov](https://github.com/HananArgov))
- Seth Urban ([@sethuster](https://github.com/sethuster))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.1.22 (2020-06-25)

#### :bug: Bug Fix
* `wdio-devtools-service`
  * [#5536](https://github.com/webdriverio/webdriverio/pull/5536) DevTools Service: Accept 'chromium' as the browserName  ([@pjcalvo](https://github.com/pjcalvo))

#### :nail_care: Polish
* `devtools`
  * [#5528](https://github.com/webdriverio/webdriverio/pull/5528) Check for nightly channel to handle devtools ([@mathew-jithin](https://github.com/mathew-jithin))
* `wdio-cli`, `wdio-cucumber-framework`
  * [#5483](https://github.com/webdriverio/webdriverio/pull/5483) Add context to before/after scenario hooks issue 5394 ([@osmolyar](https://github.com/osmolyar))

#### Committers: 3
- Jithin Mathew ([@mathew-jithin](https://github.com/mathew-jithin))
- Olga ([@osmolyar](https://github.com/osmolyar))
- Pablillo Calvo ([@pjcalvo](https://github.com/pjcalvo))


## v6.1.21 (2020-06-24)

#### :bug: Bug Fix
* `wdio-devtools-service`
  * [#5539](https://github.com/webdriverio/webdriverio/pull/5539) Closes [#5535](https://github.com/webdriverio/webdriverio/issues/5535) ([@SrinivasanTarget](https://github.com/SrinivasanTarget))

#### :memo: Documentation
* [#5525](https://github.com/webdriverio/webdriverio/pull/5525) Update BoilerplateProjects.md ([@Arjun-Ar91](https://github.com/Arjun-Ar91))
* [#5515](https://github.com/webdriverio/webdriverio/pull/5515) Update Debugging and TypeScript documentation ([@pako88](https://github.com/pako88))

#### :house: Internal
* [#5527](https://github.com/webdriverio/webdriverio/pull/5527) Issue# 5521 - unskipped mocha test re-ran it several times ([@sethuster](https://github.com/sethuster))

#### Committers: 5
- Arjun ([@Arjun-Ar91](https://github.com/Arjun-Ar91))
- Pascal König ([@pako88](https://github.com/pako88))
- Seth Urban ([@sethuster](https://github.com/sethuster))
- Srinivasan Sekar ([@SrinivasanTarget](https://github.com/SrinivasanTarget))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.1.18 (2020-06-15)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#5485](https://github.com/webdriverio/webdriverio/pull/5485) Fix DocString support in cucumber framework ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* [#5487](https://github.com/webdriverio/webdriverio/pull/5487) Update GettingStarted.md; remove unneeded line of code ([@klamping](https://github.com/klamping))

#### Committers: 3
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.1.17 (2020-06-08)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#5448](https://github.com/webdriverio/webdriverio/pull/5448) Fix data table variable values in Cucumber scenario outlines ([@mgrybyk](https://github.com/mgrybyk))
* `webdriverio`
  * [#5462](https://github.com/webdriverio/webdriverio/pull/5462) Allow to have 0 x and y values for dragAndDrop ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#5463](https://github.com/webdriverio/webdriverio/pull/5463) Fix depcrecated usage of rejectUnauthorized ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`
  * [#5464](https://github.com/webdriverio/webdriverio/pull/5464) Don't think XPath selector is a base64 screenshot ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v6.1.16 (2020-06-02)

#### :nail_care: Polish
* `webdriverio`
  * [#5442](https://github.com/webdriverio/webdriverio/pull/5442) Add support for Android viewtag selector ([@ricmatsui](https://github.com/ricmatsui))

#### Committers: 2
- Ricardo Matsui ([@ricmatsui](https://github.com/ricmatsui))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.1.15 (2020-05-28)

#### :bug: Bug Fix
* `wdio-cli`
  * [#5443](https://github.com/webdriverio/webdriverio/pull/5443) Couldn't find plugin "" runner ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-browserstack-service`
  * [#5440](https://github.com/webdriverio/webdriverio/pull/5440) adding missing await for printSessionURL for onReload in browserstack service ([@mathew-jithin](https://github.com/mathew-jithin))

#### Committers: 2
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Jithin Mathew ([@mathew-jithin](https://github.com/mathew-jithin))


## v6.1.14 (2020-05-27)

#### :bug: Bug Fix
* `wdio-jasmine-framework`, `wdio-mocha-framework`, `wdio-reporter`
  * [#5435](https://github.com/webdriverio/webdriverio/pull/5435) Improve Mocha timeout message ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-appium-service`, `wdio-cli`, `wdio-crossbrowsertesting-service`, `wdio-firefox-profile-service`, `wdio-static-server-service`, `wdio-sync`, `wdio-testingbot-service`, `webdriverio`
  * [#5437](https://github.com/webdriverio/webdriverio/pull/5437) Add typing definition for last missing service options ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#5431](https://github.com/webdriverio/webdriverio/pull/5431) Promote that WebdriverIO supports modern web frameworks ([@christian-bromann](https://github.com/christian-bromann))
  * [#5432](https://github.com/webdriverio/webdriverio/pull/5432) Added Cucumber-Appium Boilerplate ([@Arjun-Ar91](https://github.com/Arjun-Ar91))

#### Committers: 3
- Arjun ([@Arjun-Ar91](https://github.com/Arjun-Ar91))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.1.13 (2020-05-23)

#### :nail_care: Polish
* `wdio-sauce-service`
  * [#5417](https://github.com/webdriverio/webdriverio/pull/5417) Update Sauce Labs package and remove sauce-connect-launcher ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-cucumber-framework`
  * [#5422](https://github.com/webdriverio/webdriverio/pull/5422) update cucumber version in readme ([@tejasv02](https://github.com/tejasv02))
* Other
  * [#5421](https://github.com/webdriverio/webdriverio/pull/5421) Added subrountine shapes where applicable ([@jdavis61](https://github.com/jdavis61))
  * [#5420](https://github.com/webdriverio/webdriverio/pull/5420) add new boilerplate project ([@pako88](https://github.com/pako88))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- James Davis ([@jdavis61](https://github.com/jdavis61))
- Pascal König ([@pako88](https://github.com/pako88))
- Tejasvi Manmatha ([@tejasv02](https://github.com/tejasv02))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.1.12 (2020-05-17)

#### :nail_care: Polish
* `wdio-spec-reporter`
  * [#5390](https://github.com/webdriverio/webdriverio/pull/5390) Fix browser version in spec reporter ([@unickq](https://github.com/unickq))

#### :memo: Documentation
* Other
  * [#5403](https://github.com/webdriverio/webdriverio/pull/5403) Docs: Update TypeScript.md ([@osmolyar](https://github.com/osmolyar))
  * [#5402](https://github.com/webdriverio/webdriverio/pull/5402) Fix class syntax in CustomServices.md ([@pmdartus](https://github.com/pmdartus))
  * [#5397](https://github.com/webdriverio/webdriverio/pull/5397) Update typescript configuration for jasmine ([@woolter](https://github.com/woolter))
  * [#5393](https://github.com/webdriverio/webdriverio/pull/5393) Adding boilerplate Project for wdio-V6 perfecto ([@tamil777selvan](https://github.com/tamil777selvan))
* `wdio-allure-reporter`
  * [#5391](https://github.com/webdriverio/webdriverio/pull/5391) Update README.md of wdio-allure-reporter ([@goatsy](https://github.com/goatsy))

#### Committers: 7
- Nick ([@unickq](https://github.com/unickq))
- Olga ([@osmolyar](https://github.com/osmolyar))
- Pierre-Marie Dartus ([@pmdartus](https://github.com/pmdartus))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))
- Walter Hector Lijo ([@woolter](https://github.com/woolter))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)
- [@goatsy](https://github.com/goatsy)


## v6.1.11 (2020-05-11)

#### :eyeglasses: Spec Compliancy
* `wdio-protocols`
  * [#5377](https://github.com/webdriverio/webdriverio/pull/5377) wdio-protocolse: add api for appium image comparison features  (#5372) ([@sanlengjingvv](https://github.com/sanlengjingvv))

#### Committers: 1
- [@sanlengjingvv](https://github.com/sanlengjingvv)


## v6.1.10 (2020-05-08)

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#5271](https://github.com/webdriverio/webdriverio/pull/5271) Rework Browserstack service, improve Cucumber integration ([@nextlevelbeard](https://github.com/nextlevelbeard))

#### :memo: Documentation
* `wdio-devtools-service`
  * [#5375](https://github.com/webdriverio/webdriverio/pull/5375) Add docs to Tidelift subscription ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))


## v6.1.9 (2020-05-06)

#### :bug: Bug Fix
* `devtools`
  * [#5350](https://github.com/webdriverio/webdriverio/pull/5350) devtools package: fix switchToFrame function ([@takeya0x86](https://github.com/takeya0x86))
  * [#5369](https://github.com/webdriverio/webdriverio/pull/5369) devtools: fix import of devices ([@erwinheitzman](https://github.com/erwinheitzman))

#### :memo: Documentation
* `wdio-reporter`
  * [#5365](https://github.com/webdriverio/webdriverio/pull/5365) Fix types of reporters runner hooks ([@pako88](https://github.com/pako88))

#### Committers: 3
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Pascal König ([@pako88](https://github.com/pako88))
- Takeshi Kishi ([@takeya0x86](https://github.com/takeya0x86))


## v6.1.8 (2020-05-05)

#### :nail_care: Polish
* `wdio-devtools-service`
  * [#5361](https://github.com/webdriverio/webdriverio/pull/5361) Add types for devtools service ([@pako88](https://github.com/pako88))
* `devtools`, `wdio-sync`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#5351](https://github.com/webdriverio/webdriverio/pull/5351) Make `requestedCapabilities` better accessible ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`
  * [#5344](https://github.com/webdriverio/webdriverio/pull/5344) ignore defaultChromeFlags / PptrDefaultArgs tags ([@anemer](https://github.com/anemer))

#### :house: Internal
* Other
  * [#5360](https://github.com/webdriverio/webdriverio/pull/5360) Move docs deployment to GitHub workflow ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sync`
  * [#5354](https://github.com/webdriverio/webdriverio/pull/5354) Bump fibers from 4.0.3 to 5.0.0 ([@dependabot-preview[bot]](https://github.com/apps/dependabot-preview))

#### Committers: 4
- Al Nemer ([@anemer](https://github.com/anemer))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Pascal König ([@pako88](https://github.com/pako88))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.1.7 (2020-05-02)

#### :bug: Bug Fix
* `devtools`
  * [#5347](https://github.com/webdriverio/webdriverio/pull/5347) @devtools: Enable file uploads by changing input elements' value ([@nextlevelbeard](https://github.com/nextlevelbeard))
* Other
  * [#5337](https://github.com/webdriverio/webdriverio/pull/5337) Fix types for services ([@pako88](https://github.com/pako88))

#### :memo: Documentation
* `webdriverio`
  * [#5349](https://github.com/webdriverio/webdriverio/pull/5349) Add hint for modifiyng clicks ([@Stejnar](https://github.com/Stejnar))
* Other
  * [#5348](https://github.com/webdriverio/webdriverio/pull/5348) Update BoilerplateProjects.md ([@SimitTomar](https://github.com/SimitTomar))

#### Committers: 4
- Pascal König ([@pako88](https://github.com/pako88))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))
- [@SimitTomar](https://github.com/SimitTomar)
- [@Stejnar](https://github.com/Stejnar)


## v6.1.6 (2020-04-28)

#### :bug: Bug Fix
* `wdio-cucumber-framework`, `wdio-jasmine-framework`, `wdio-mocha-framework`, `wdio-runner`
  * [#5335](https://github.com/webdriverio/webdriverio/pull/5335) embed expect-webdriverio in framework adapters ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v6.1.5 (2020-04-28)

#### :memo: Documentation
* `wdio-runner`, `wdio-sync`, `webdriverio`
  * [#5334](https://github.com/webdriverio/webdriverio/pull/5334) Make WebdriverIO a browser AND mobile automation framework ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* `wdio-devtools-service`
  * [#5331](https://github.com/webdriverio/webdriverio/pull/5331) Bump puppeteer-core from 2.1.1 to 3.0.1 ([@dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
* `wdio-dot-reporter`, `wdio-lambda-runner`, `wdio-reporter`
  * [#5330](https://github.com/webdriverio/webdriverio/pull/5330) Bump tmp from 0.0.33 to 0.2.0 ([@dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
* `wdio-concise-reporter`, `wdio-spec-reporter`
  * [#5329](https://github.com/webdriverio/webdriverio/pull/5329) Bump pretty-ms from 6.0.1 to 7.0.0 ([@dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
* `webdriverio`
  * [#5328](https://github.com/webdriverio/webdriverio/pull/5328) Bump archiver from 3.1.1 to 4.0.1 ([@dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
* `wdio-junit-reporter`
  * [#5327](https://github.com/webdriverio/webdriverio/pull/5327) Bump junit-report-builder from 1.3.3 to 2.0.0 ([@dependabot-preview[bot]](https://github.com/apps/dependabot-preview))

#### Committers: 4
- Alan Christopher Thomas ([@alanchrt](https://github.com/alanchrt))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Miguel A. Alonso ([@migalons](https://github.com/migalons))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.1.4 (2020-04-25)

#### :bug: Bug Fix
* `wdio-browserstack-service`, `wdio-crossbrowsertesting-service`, `wdio-shared-store-service`, `wdio-sumologic-reporter`, `wdio-testingbot-service`, `webdriver`, `webdriverio`
  * [#5321](https://github.com/webdriverio/webdriverio/pull/5321) Update got across packages ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Bastien Caudan ([@bcaudan](https://github.com/bcaudan))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kevin Lamping ([@klamping](https://github.com/klamping))


## v6.1.2 (2020-04-22)

#### :eyeglasses: Spec Compliancy
* `wdio-protocols`
  * [#5308](https://github.com/webdriverio/webdriverio/pull/5308) Revert missed code from workaround ([@erwinheitzman](https://github.com/erwinheitzman))

#### :bug: Bug Fix
* `wdio-cli`, `wdio-config`, `wdio-junit-reporter`, `webdriver`, `webdriverio`
  * [#5306](https://github.com/webdriverio/webdriverio/pull/5306) Fix request timeout handling in `webdriver` package ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))


## v6.1.1 (2020-04-21)

#### :bug: Bug Fix
* `wdio-runner`
  * [#5305](https://github.com/webdriverio/webdriverio/pull/5305) Initiate `expect-webdriverio` after framework got initiated ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#5296](https://github.com/webdriverio/webdriverio/pull/5296) Closes [#5291](https://github.com/webdriverio/webdriverio/issues/5291)(@wdio/allure-reporter) - return status failed when an assertion failed with expect-webdriverio ([@lacell75](https://github.com/lacell75))

#### :nail_care: Polish
* `wdio-allure-reporter`, `wdio-cucumber-framework`
  * [#5304](https://github.com/webdriverio/webdriverio/pull/5304) Fix#5292 (@wdio/allure-reporter, @wdio/cucumber-framework) added description of cucumber scenario in reports ([@lacell75](https://github.com/lacell75))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.1.0 (2020-04-20)

#### :rocket: New Feature
* `wdio-sync`, `webdriverio`
  * [#5282](https://github.com/webdriverio/webdriverio/pull/5282) Allow relative drag&drop arguments ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cucumber-framework`
  * [#5255](https://github.com/webdriverio/webdriverio/pull/5255) fix(wdio-cucumber-framework): add cucumber 6 retries support and scenario ([@alfonso-presa](https://github.com/alfonso-presa))

#### :bug: Bug Fix
* `devtools`, `wdio-utils`
  * [#5280](https://github.com/webdriverio/webdriverio/pull/5280) Support mobile emulation capability in DevTools package ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`, `webdriverio`
  * [#5279](https://github.com/webdriverio/webdriverio/pull/5279) Script fixes for IE ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-appium-service`
  * [#5281](https://github.com/webdriverio/webdriverio/pull/5281) Appium service path assignment ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#5283](https://github.com/webdriverio/webdriverio/pull/5283) Closes [#5038](https://github.com/webdriverio/webdriverio/issues/5038) (@wdio-allure-reporter) strip out ASCII codes from expect-webdriverio ([@lacell75](https://github.com/lacell75))

#### :nail_care: Polish
* `wdio-sauce-service`
  * [#5277](https://github.com/webdriverio/webdriverio/pull/5277) sauce service: Add jobname in before ([@pako88](https://github.com/pako88))

#### :memo: Documentation
* [#5289](https://github.com/webdriverio/webdriverio/pull/5289) Fix link to 'sync vs asyc' doc ([@klamping](https://github.com/klamping))
* [#5287](https://github.com/webdriverio/webdriverio/pull/5287) Update proxy documentation to include global-agent setup ([@Stetchy](https://github.com/Stetchy))
* [#5286](https://github.com/webdriverio/webdriverio/pull/5286) Some minor fixes in webdriver 6 blogpost ([@edi9999](https://github.com/edi9999))

#### Committers: 7
- Alfonso Presa ([@alfonso-presa](https://github.com/alfonso-presa))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Edgar Hipp ([@edi9999](https://github.com/edi9999))
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Pascal König ([@pako88](https://github.com/pako88))
- Riain Condon ([@Stetchy](https://github.com/Stetchy))


## v6.0.18 (2020-04-17)

#### :memo: Documentation
* `wdio-sync`, `webdriver`, `webdriverio`
  * [#5273](https://github.com/webdriverio/webdriverio/pull/5273) Add missing type definitions ([@pako88](https://github.com/pako88))
* Other
  * [#5278](https://github.com/webdriverio/webdriverio/pull/5278) [Docs] Add missing ; before ( ([@dtinth](https://github.com/dtinth))
  * [#5274](https://github.com/webdriverio/webdriverio/pull/5274) Update docs for beforeHook and afterHook ([@vgrigoruk](https://github.com/vgrigoruk))

#### Committers: 3
- Pascal König ([@pako88](https://github.com/pako88))
- Thai Pangsakulyanont ([@dtinth](https://github.com/dtinth))
- Vitalii Grygoruk ([@vgrigoruk](https://github.com/vgrigoruk))


## v6.0.17 (2020-04-15)

#### :bug: Bug Fix
* `wdio-appium-service`
  * [#5268](https://github.com/webdriverio/webdriverio/pull/5268) Fix Appium service port assignment ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v6.0.16 (2020-04-14)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#5259](https://github.com/webdriverio/webdriverio/pull/5259) Add any non-passing Cucumber test result to failure count ([@esaari](https://github.com/esaari))
* `wdio-utils`
  * [#5260](https://github.com/webdriverio/webdriverio/pull/5260) fix(wdio-utils): add isBase64 function and remove 'is-base64' library  ([@tawfiknouri](https://github.com/tawfiknouri))

#### :nail_care: Polish
* `wdio-sauce-service`
  * [#5263](https://github.com/webdriverio/webdriverio/pull/5263) Add Sauce Connect support for EU ([@wswebcreation](https://github.com/wswebcreation))

#### :memo: Documentation
* `wdio-firefox-profile-service`
  * [#5261](https://github.com/webdriverio/webdriverio/pull/5261) Explain that using custom extensions requires Firefox Developer Edition ([@jan-molak](https://github.com/jan-molak))
* Other
  * [#5245](https://github.com/webdriverio/webdriverio/pull/5245) Fix legacy docs link to include file extension ([@nathanarritt](https://github.com/nathanarritt))

#### Committers: 6
- Eric Saari ([@esaari](https://github.com/esaari))
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Nathan Arritt ([@nathanarritt](https://github.com/nathanarritt))
- Tawfik Nouri ([@tawfiknouri](https://github.com/tawfiknouri))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.0.15 (2020-04-09)

#### :bug: Bug Fix
* `wdio-appium-service`, `wdio-selenium-standalone-service`
  * [#5238](https://github.com/webdriverio/webdriverio/pull/5238) Allow to customise connection in driver services ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#5237](https://github.com/webdriverio/webdriverio/pull/5237) Ensure that default connection is not overwritten ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-cli`, `wdio-cucumber-framework`, `wdio-jasmine-framework`, `wdio-mocha-framework`, `wdio-sync`, `webdriver`, `webdriverio`
  * [#5214](https://github.com/webdriverio/webdriverio/pull/5214) Framework options TypeScript improvements ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#5234](https://github.com/webdriverio/webdriverio/pull/5234) docs: clarify Mocha TypeScript setup ([@erickzhao](https://github.com/erickzhao))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erick Zhao ([@erickzhao](https://github.com/erickzhao))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.0.14 (2020-04-07)

#### :rocket: New Feature
* `wdio-sync`, `webdriverio`
  * [#5180](https://github.com/webdriverio/webdriverio/pull/5180) webdriverio: Add Espresso ViewMatcher strategy ([@ccharnkij](https://github.com/ccharnkij))

#### :bug: Bug Fix
* `wdio-cli`, `wdio-local-runner`, `webdriverio`
  * [#5215](https://github.com/webdriverio/webdriverio/pull/5215) Debugger output fix ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriver`
  * [#5219](https://github.com/webdriverio/webdriverio/pull/5219) Fix/better error logging ([@alfonso-presa](https://github.com/alfonso-presa))
* `wdio-cli`, `wdio-reporter`, `wdio-spec-reporter`
  * [#5218](https://github.com/webdriverio/webdriverio/pull/5218) Add support for feature description in reporters ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* Other
  * [#5226](https://github.com/webdriverio/webdriverio/pull/5226) Fix homepage documentation link ([@klamping](https://github.com/klamping))
  * [#5209](https://github.com/webdriverio/webdriverio/pull/5209) docs: Fix simple typo, specifc -> specific ([@timgates42](https://github.com/timgates42))
  * [#5205](https://github.com/webdriverio/webdriverio/pull/5205) chore(docs): update blogpost for Appium users ([@wswebcreation](https://github.com/wswebcreation))
* `webdriver`
  * [#5210](https://github.com/webdriverio/webdriverio/pull/5210) Add: Adding IE capabilities ([@Harsha509](https://github.com/Harsha509))

#### Committers: 9
- Alfonso Presa ([@alfonso-presa](https://github.com/alfonso-presa))
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Serhat Bolsu ([@serhatbolsu](https://github.com/serhatbolsu))
- Sri Harsha ([@Harsha509](https://github.com/Harsha509))
- Tim Gates ([@timgates42](https://github.com/timgates42))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.0.13 (2020-04-02)

#### :bug: Bug Fix
* `devtools`
  * [#5198](https://github.com/webdriverio/webdriverio/pull/5198) Closes [#5197](https://github.com/webdriverio/webdriverio/issues/5197) - Devtools' launcher should respect "binary" field from moz:firefoxOptions ([@Writhe](https://github.com/Writhe))
* `wdio-static-server-service`
  * [#5196](https://github.com/webdriverio/webdriverio/pull/5196) Correctly bind this when promisifying static server listen method ([@ctavan](https://github.com/ctavan))

#### :nail_care: Polish
* `wdio-utils`, `webdriver`
  * [#5202](https://github.com/webdriverio/webdriverio/pull/5202) Shorten screenshot base64 strings from logs ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`
  * [#5201](https://github.com/webdriverio/webdriverio/pull/5201) Refactor devtools launcher to streamline behavior ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sauce-service`
  * [#5200](https://github.com/webdriverio/webdriverio/pull/5200) W3C sauce metadata ([@DylanLacey](https://github.com/DylanLacey))

#### :memo: Documentation
* `webdriverio`
  * [#5204](https://github.com/webdriverio/webdriverio/pull/5204) Update dragAndDrop.js ([@hakubo](https://github.com/hakubo))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Christoph Tavan ([@ctavan](https://github.com/ctavan))
- Dylan Lacey ([@DylanLacey](https://github.com/DylanLacey))
- Filip Moroz ([@Writhe](https://github.com/Writhe))
- Jakub Olek ([@hakubo](https://github.com/hakubo))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.0.10 (2020-04-01)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#5188](https://github.com/webdriverio/webdriverio/pull/5188) [Browserstack Service] Forward to correct URL for App Automate, resolve warning about 'auth' Got function ([@esaari](https://github.com/esaari))
  * [#5187](https://github.com/webdriverio/webdriverio/pull/5187) Correctly bind browserstackLocal this-context ([@ctavan](https://github.com/ctavan))
* `webdriverio`
  * [#5194](https://github.com/webdriverio/webdriverio/pull/5194) fix(webdriverio): isDisplayed not working in Safari STP ([@alfonso-presa](https://github.com/alfonso-presa))
* `devtools`
  * [#5193](https://github.com/webdriverio/webdriverio/pull/5193) Recognise element origin in actions ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-crossbrowsertesting-service`, `wdio-testingbot-service`
  * [#5192](https://github.com/webdriverio/webdriverio/pull/5192) fix got auth in testingbot and crossbrowsertesting service ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-allure-reporter`
  * [#5191](https://github.com/webdriverio/webdriverio/pull/5191) Add addStep and endStep to Allure docs ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 5
- Alfonso Presa ([@alfonso-presa](https://github.com/alfonso-presa))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Christoph Tavan ([@ctavan](https://github.com/ctavan))
- Eric Saari ([@esaari](https://github.com/esaari))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.0.9 (2020-03-31)

#### :bug: Bug Fix
* `wdio-webdriver-mock-service`, `webdriverio`
  * [#5182](https://github.com/webdriverio/webdriverio/pull/5182) Fix `onReload` bug ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v6.0.6 (2020-03-30)

#### :bug: Bug Fix
* `devtools`, `wdio-crossbrowsertesting-service`, `wdio-sauce-service`, `wdio-testingbot-service`
  * [#5175](https://github.com/webdriverio/webdriverio/pull/5175) v6 release bug fixes ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-config`, `wdio-selenium-standalone-service`
  * [#5173](https://github.com/webdriverio/webdriverio/pull/5173) Set connection details in selenium-standalone properly ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#5168](https://github.com/webdriverio/webdriverio/pull/5168) Allow API descriptions ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.0.5 (2020-03-27)

#### :bug: Bug Fix
* `devtools`
  * [#5166](https://github.com/webdriverio/webdriverio/pull/5166) Fix usage of uuid package ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.0.4 (2020-03-27)

#### :bug: Bug Fix
* `wdio-browserstack-service`, `wdio-sumologic-reporter`, `wdio-testingbot-service`, `webdriver`
  * [#5160](https://github.com/webdriverio/webdriverio/pull/5160) Fix typings for got and its tests ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* `devtools`, `wdio-crossbrowsertesting-service`, `wdio-utils`
  * [#5159](https://github.com/webdriverio/webdriverio/pull/5159) Add dependency check to test pipeline ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v6.0.0 (2020-03-26)

#### :boom: Breaking Change
* `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-sync`, `webdriver`, `webdriverio`
  * [#5101](https://github.com/webdriverio/webdriverio/pull/5101) TypeScript improvements ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`, `wdio-appium-service`, `wdio-browserstack-service`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-firefox-profile-service`, `wdio-logger`, `wdio-selenium-standalone-service`, `wdio-static-server-service`, `wdio-testingbot-service`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriverio`
  * [#5007](https://github.com/webdriverio/webdriverio/pull/5007) Use "devtools" automation protocol as fallback ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#5027](https://github.com/webdriverio/webdriverio/pull/5027) webdriverio: update minimum nodejs version ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-cli`, `wdio-cucumber-framework`, `wdio-utils`
  * [#4937](https://github.com/webdriverio/webdriverio/pull/4937) Remove compatibility helpers for hook args ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sync`, `webdriverio`
  * [#4928](https://github.com/webdriverio/webdriverio/pull/4928) Replace args with options object in some methods ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-protocols`, `webdriver`
  * [#4944](https://github.com/webdriverio/webdriverio/pull/4944) webdriver.d.ts colliding type definitions for launchApp between Appium and Chromium ([@resolritter](https://github.com/resolritter))
* `wdio-appium-service`, `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-crossbrowsertesting-service`, `wdio-devtools-service`, `wdio-firefox-profile-service`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-shared-store-service`, `wdio-static-server-service`, `wdio-testingbot-service`, `wdio-utils`
  * [#4606](https://github.com/webdriverio/webdriverio/pull/4606) Remove ability to set service configs on root level ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-config`, `wdio-junit-reporter`, `webdriver`, `webdriverio`
  * [#4907](https://github.com/webdriverio/webdriverio/pull/4907) Set default WebDriver path to `/` ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-applitools-service`, `webdriverio`
  * [#4720](https://github.com/webdriverio/webdriverio/pull/4720) Remove WebdriverIOAsync namespace ([@mgrybyk](https://github.com/mgrybyk))
* `devtools`, `wdio-shared-store-service`, `wdio-sync`, `webdriver`, `webdriverio`
  * [#4740](https://github.com/webdriverio/webdriverio/pull/4740) Update minimal TypeScript version to 3.7.2 or higher ([@mgrybyk](https://github.com/mgrybyk))
* `devtools`, `eslint-plugin-wdio`, `wdio-allure-reporter`, `wdio-appium-service`, `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-dot-reporter`, `wdio-firefox-profile-service`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-lambda-runner`, `wdio-local-runner`, `wdio-logger`, `wdio-mocha-framework`, `wdio-protocols`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-shared-store-service`, `wdio-smoke-test-reporter`, `wdio-smoke-test-service`, `wdio-spec-reporter`, `wdio-static-server-service`, `wdio-sumologic-reporter`, `wdio-sync`, `wdio-testingbot-service`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#4542](https://github.com/webdriverio/webdriverio/pull/4542) Drop Node v8 Support ([@christian-bromann](https://github.com/christian-bromann))

#### :rocket: New Feature
* `wdio-allure-reporter`
  * [#5099](https://github.com/webdriverio/webdriverio/pull/5099) Allure: add issue and tms links patterns ([@BorisOsipov](https://github.com/BorisOsipov))
* `wdio-cucumber-framework`
  * [#5076](https://github.com/webdriverio/webdriverio/pull/5076) feature(cucumber-framework): add skip tags support ([@alfonso-presa](https://github.com/alfonso-presa))
* `devtools`, `webdriverio`
  * [#5039](https://github.com/webdriverio/webdriverio/pull/5039) Implement `performActions` for devtools automation protocol ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-protocols`, `webdriver`
  * [#5034](https://github.com/webdriverio/webdriverio/pull/5034) add new Appium commands ([@christian-bromann](https://github.com/christian-bromann))
* `eslint-plugin-wdio`, `wdio-runner`
  * [#4908](https://github.com/webdriverio/webdriverio/pull/4908) Embed `expect-webdriverio` as built in assertion API ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-config`, `wdio-local-runner`, `wdio-runner`, `wdio-smoke-test-service`, `wdio-sync`, `webdriver`, `webdriverio`
  * [#4926](https://github.com/webdriverio/webdriverio/pull/4926) Add onWorkerStart hook to launch service ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#4463](https://github.com/webdriverio/webdriverio/pull/4463) Retried specfiles are inserted at the start of the specs queue ([@bennieswart](https://github.com/bennieswart))
* `wdio-cli`, `wdio-config`, `wdio-junit-reporter`, `webdriver`
  * [#4906](https://github.com/webdriverio/webdriverio/pull/4906) Feature/read timeout ([@rsquires](https://github.com/rsquires))
* `wdio-sync`, `webdriverio`
  * [#4802](https://github.com/webdriverio/webdriverio/pull/4802) Proposal to add element equals command ([@mgrybyk](https://github.com/mgrybyk))

#### :bug: Bug Fix
* `wdio-protocols`
  * [#5109](https://github.com/webdriverio/webdriverio/pull/5109) update switchToFrame docs ([@kellyselden](https://github.com/kellyselden))
* `wdio-cli`, `wdio-config`, `wdio-spec-reporter`, `webdriverio`
  * [#5093](https://github.com/webdriverio/webdriverio/pull/5093) Propagate connection data to detect backend properly ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#5108](https://github.com/webdriverio/webdriverio/pull/5108) fix the edit button on protocol docs again ([@kellyselden](https://github.com/kellyselden))
* `wdio-browserstack-service`, `wdio-sauce-service`
  * [#5106](https://github.com/webdriverio/webdriverio/pull/5106) fix(browserstack, sauce): update test title ([@stezu](https://github.com/stezu))
* `webdriverio`
  * [#5100](https://github.com/webdriverio/webdriverio/pull/5100) checkUnicode should always return an array regardless of isDevTools ([@Photonios](https://github.com/Photonios))
* `wdio-appium-service`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-testingbot-service`, `webdriverio`
  * [#5032](https://github.com/webdriverio/webdriverio/pull/5032) Fix services modifying session options ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#5026](https://github.com/webdriverio/webdriverio/pull/5026) Fix cli answer validation ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-browserstack-service`
  * [#4967](https://github.com/webdriverio/webdriverio/pull/4967) wdio-browserstack-service: fix test session status ([@benmacs](https://github.com/benmacs))
* `webdriver`, `webdriverio`
  * [#4964](https://github.com/webdriverio/webdriverio/pull/4964) Better error messages for wrong path ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-config`, `wdio-runner`
  * [#4938](https://github.com/webdriverio/webdriverio/pull/4938) Fix sanitization of capabilities object (due to DEFAULT_CONFIGS now being a function) ([@mehibbs](https://github.com/mehibbs))
* `wdio-config`
  * [#4923](https://github.com/webdriverio/webdriverio/pull/4923) fix default configs being exported as a singleton ([@naorzr](https://github.com/naorzr))
* `webdriverio`
  * [#4918](https://github.com/webdriverio/webdriverio/pull/4918) Fix selection of h1 using tag name selector strategy ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-appium-service`
  * [#4915](https://github.com/webdriverio/webdriverio/pull/4915) fix: fix spawning Appium on Windows ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-config`
  * [#4897](https://github.com/webdriverio/webdriverio/pull/4897) Prefer custom properties if detecting backend ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cli`
  * [#5089](https://github.com/webdriverio/webdriverio/pull/5089) webdriverIO - Experitest Cli - Simplify the flow ([@ArielExperitest](https://github.com/ArielExperitest))
* `wdio-cli`, `wdio-config`, `wdio-runner`, `wdio-utils`
  * [#4626](https://github.com/webdriverio/webdriverio/pull/4626) Separate launcher from worker services ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#5016](https://github.com/webdriverio/webdriverio/pull/5016) wdio-cli: Add Experitest Cloud to configuration utility ([@ArielExperitest](https://github.com/ArielExperitest))
* `webdriverio`
  * [#5029](https://github.com/webdriverio/webdriverio/pull/5029) Remove appium bug workaround ([@erwinheitzman](https://github.com/erwinheitzman))
* `webdriver`
  * [#5001](https://github.com/webdriverio/webdriverio/pull/5001) Add check that path starts with "/" ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`
  * [#4993](https://github.com/webdriverio/webdriverio/pull/4993) Devtools: Make puppeteer-firefox optional in status.js ([@jordanjwatkins](https://github.com/jordanjwatkins))
* `wdio-utils`
  * [#4959](https://github.com/webdriverio/webdriverio/pull/4959) Support fully qualified paths to plugins ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#4940](https://github.com/webdriverio/webdriverio/pull/4940) Performance improvements on element creation ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`
  * [#4927](https://github.com/webdriverio/webdriverio/pull/4927) Remove ff dependency ([@pmerwin](https://github.com/pmerwin))
  * [#4924](https://github.com/webdriverio/webdriverio/pull/4924) Remove ff dependency ([@pmerwin](https://github.com/pmerwin))
* `wdio-junit-reporter`
  * [#4878](https://github.com/webdriverio/webdriverio/pull/4878) 💥🚀 Cucumber-style JUnit reports in @wdio/junit-reporter ([@mikesalvia](https://github.com/mikesalvia))
* `wdio-cli`
  * [#4911](https://github.com/webdriverio/webdriverio/pull/4911) wdio-cli: allow for custom path for WDIO config ([@baruchvlz](https://github.com/baruchvlz))

#### :memo: Documentation
* `wdio-cli`
  * [#5097](https://github.com/webdriverio/webdriverio/pull/5097) wdio-lambdatest-service: Updated docs for New service Lambdatest #5057 ([@kanhaiya15](https://github.com/kanhaiya15))
* `wdio-sync`, `webdriverio`
  * [#5064](https://github.com/webdriverio/webdriverio/pull/5064) Fix selector typing ([@Kignuf](https://github.com/Kignuf))
* Other
  * [#5084](https://github.com/webdriverio/webdriverio/pull/5084) Update GettingStarted.md ([@p2635](https://github.com/p2635))
* Other
  * [#5080](https://github.com/webdriverio/webdriverio/pull/5080) Fix docs for TS setup with Mocha ([@christian-bromann](https://github.com/christian-bromann))
  * [#5078](https://github.com/webdriverio/webdriverio/pull/5078) docs: add reference to boilerplate ([@dimadeveatii](https://github.com/dimadeveatii))
  * [#4929](https://github.com/webdriverio/webdriverio/pull/4929) Updating LTS docs ([@christian-bromann](https://github.com/christian-bromann))
  * [#5065](https://github.com/webdriverio/webdriverio/pull/5065) Fix typo on conf name ([@webOS101](https://github.com/webOS101))
  * [#5042](https://github.com/webdriverio/webdriverio/pull/5042) v6 release blog post ([@christian-bromann](https://github.com/christian-bromann))
  * [#5046](https://github.com/webdriverio/webdriverio/pull/5046) Fix documentation formatter ([@christian-bromann](https://github.com/christian-bromann))
  * [#5031](https://github.com/webdriverio/webdriverio/pull/5031) adds boilerplate with appium And cucumber on docs ([@Schveitzer](https://github.com/Schveitzer))
  * [#5025](https://github.com/webdriverio/webdriverio/pull/5025) Docs: Add link on how to update your fork ([@erwinheitzman](https://github.com/erwinheitzman))
  * [#5027](https://github.com/webdriverio/webdriverio/pull/5027) webdriverio: update minimum nodejs version ([@erwinheitzman](https://github.com/erwinheitzman))
  * [#4965](https://github.com/webdriverio/webdriverio/pull/4965) WebDriverIO V5, Cucumber, Perfecto project example ([@eyalyovelperfecto](https://github.com/eyalyovelperfecto))
  * [#4895](https://github.com/webdriverio/webdriverio/pull/4895) Add documentation around smoke tests ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#5067](https://github.com/webdriverio/webdriverio/pull/5067) browserstack-service: add typings ([@ablok](https://github.com/ablok))
* `webdriverio`
  * [#5045](https://github.com/webdriverio/webdriverio/pull/5045) Add Contributor Guide ([@christian-bromann](https://github.com/christian-bromann))
  * [#4977](https://github.com/webdriverio/webdriverio/pull/4977) webdriverio: Fix 'oject' typo in click command ([@IgorVodka](https://github.com/IgorVodka))
* `wdio-sync`, `webdriverio`
  * [#5037](https://github.com/webdriverio/webdriverio/pull/5037) Improve TypeScript generation ([@christian-bromann](https://github.com/christian-bromann))
  * [#5005](https://github.com/webdriverio/webdriverio/pull/5005) Add click options ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-protocols`
  * [#5004](https://github.com/webdriverio/webdriverio/pull/5004) Add example for touchPerform ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#4990](https://github.com/webdriverio/webdriverio/pull/4990) Fix for Chrome refs type (#4989) ([@lamkovod](https://github.com/lamkovod))
* `wdio-cli`
  * [#4976](https://github.com/webdriverio/webdriverio/pull/4976) Add intercept service to wdio ([@chmanie](https://github.com/chmanie))
* `wdio-reporter`, `wdio-runner`, `wdio-sync`, `webdriverio`
  * [#4960](https://github.com/webdriverio/webdriverio/pull/4960) Add docs for addLocatorStrategy ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sync`, `webdriver`, `webdriverio`
  * [#4948](https://github.com/webdriverio/webdriverio/pull/4948) Better document process how types are generated. ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#4939](https://github.com/webdriverio/webdriverio/pull/4939) Fix some wording issues in the selector docs ([@christian-bromann](https://github.com/christian-bromann))
  * [#4935](https://github.com/webdriverio/webdriverio/pull/4935) Add storybook-wdio boilerplate to document ([@davidnguyen179](https://github.com/davidnguyen179))
* `wdio-cli`
  * [#4920](https://github.com/webdriverio/webdriverio/pull/4920) Add markdown Reporter ([@carmenmitru](https://github.com/carmenmitru))
  * [#4910](https://github.com/webdriverio/webdriverio/pull/4910) Add  Slack Service to WDIO  ([@carmenmitru](https://github.com/carmenmitru))
* [#4898](https://github.com/webdriverio/webdriverio/pull/4898) Minor styling fixes for flowchart ([@christian-bromann](https://github.com/christian-bromann))
* [#4873](https://github.com/webdriverio/webdriverio/pull/4873) Added flowcharts ([@jdavis61](https://github.com/jdavis61))

#### :house: Internal
* `wdio-cucumber-framework`
  * [#5003](https://github.com/webdriverio/webdriverio/pull/5003) Update cucumber to v6 ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`, `wdio-crossbrowsertesting-service`, `wdio-protocols`, `wdio-sauce-service`, `wdio-shared-store-service`, `wdio-sumologic-reporter`, `wdio-testingbot-service`, `webdriver`, `webdriverio`
  * [#4708](https://github.com/webdriverio/webdriverio/pull/4708) Replace Request lib with Got ([@christian-bromann](https://github.com/christian-bromann))
* [#4888](https://github.com/webdriverio/webdriverio/pull/4888) Implement back-porting process for maintainers ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 35
- Alan Schveitzer ([@Schveitzer](https://github.com/Schveitzer))
- Alfonso Presa ([@alfonso-presa](https://github.com/alfonso-presa))
- Arjan Blok ([@ablok](https://github.com/ablok))
- Baruch Velez ([@baruchvlz](https://github.com/baruchvlz))
- Bennie Swart ([@bennieswart](https://github.com/bennieswart))
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Christian Maniewski ([@chmanie](https://github.com/chmanie))
- David Nguyen ([@davidnguyen179](https://github.com/davidnguyen179))
- Dumitru ([@dimadeveatii](https://github.com/dimadeveatii))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Igor Vodka ([@IgorVodka](https://github.com/IgorVodka))
- James Davis ([@jdavis61](https://github.com/jdavis61))
- Jannik Portz ([@janizde](https://github.com/janizde))
- João Paulo ([@resolritter](https://github.com/resolritter))
- John Ahigian ([@johnhiggs](https://github.com/johnhiggs))
- Jordan Watkins ([@jordanjwatkins](https://github.com/jordanjwatkins))
- Kanhaiya Lal Singh ([@kanhaiya15](https://github.com/kanhaiya15))
- Kelly Selden ([@kellyselden](https://github.com/kellyselden))
- Kevin Roulleau ([@Kignuf](https://github.com/Kignuf))
- Mike Salvia ([@mikesalvia](https://github.com/mikesalvia))
- Mitru Carmen ([@carmenmitru](https://github.com/carmenmitru))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Phil Merwin ([@pmerwin](https://github.com/pmerwin))
- Philip Wong ([@p2635](https://github.com/p2635))
- Ross Squires ([@rsquires](https://github.com/rsquires))
- Roy Sutton ([@webOS101](https://github.com/webOS101))
- Stephen Zuniga ([@stezu](https://github.com/stezu))
- Swen Kooij ([@Photonios](https://github.com/Photonios))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@ArielExperitest](https://github.com/ArielExperitest)
- [@benmacs](https://github.com/benmacs)
- [@eyalyovelperfecto](https://github.com/eyalyovelperfecto)
- [@lamkovod](https://github.com/lamkovod)
- [@mehibbs](https://github.com/mehibbs)
- [@naorzr](https://github.com/naorzr)
