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

## v9.20.0 (2025-09-27)

#### :rocket: New Feature
* `wdio-allure-reporter`
  * [#14719](https://github.com/webdriverio/webdriverio/pull/14719) Update wdio-allure-reporter for Allure 3 ([@todti](https://github.com/todti))

#### :bug: Bug Fix
* `webdriver`
  * [#14760](https://github.com/webdriverio/webdriverio/pull/14760) fix(webdriver): Fix no retrying requests when unexpected token on responses occurs (like on HTML responses) ([@Nyaran](https://github.com/Nyaran))
* `wdio-cucumber-framework`
  * [#14763](https://github.com/webdriverio/webdriverio/pull/14763) feat(cucumber): Fix skipping tests with skip tag using complex regular expressions ([@Nyaran](https://github.com/Nyaran))
* `wdio-allure-reporter`
  * [#14723](https://github.com/webdriverio/webdriverio/pull/14723) fix(@wdio/allure-reporter): Encode HTML entities ([@sventschui](https://github.com/sventschui))
* `webdriverio`
  * [#14714](https://github.com/webdriverio/webdriverio/pull/14714) fix(attach-params): user options should override detectBackend ([@NaamuKim](https://github.com/NaamuKim))
* `wdio-utils`
  * [#14750](https://github.com/webdriverio/webdriverio/pull/14750) feat(utils): Fix reduce function to use the initial value parameter ([@Nyaran](https://github.com/Nyaran))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#14783](https://github.com/webdriverio/webdriverio/pull/14783) Exhaustive logging for better capability flow debug ([@pranay-v29](https://github.com/pranay-v29))
  * [#14781](https://github.com/webdriverio/webdriverio/pull/14781) SDK-4104 Updated the build url format for azure pipelines ([@pranay-v29](https://github.com/pranay-v29))
* `wdio-cli`, `wdio-config`
  * [#14664](https://github.com/webdriverio/webdriverio/pull/14664) tsConfigPath in wdio.conf ([@sh41](https://github.com/sh41))
* `webdriverio`
  * [#14744](https://github.com/webdriverio/webdriverio/pull/14744) fix: polish waitForClickable ([@wswebcreation](https://github.com/wswebcreation))
  * [#14745](https://github.com/webdriverio/webdriverio/pull/14745) fix: polish isStable commands ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-browserstack-service`, `wdio-local-runner`
  * [#14734](https://github.com/webdriverio/webdriverio/pull/14734)  Support added for change in product name:- Observability -> Test Reporting and Analytics v9 ([@Tanmay-Bstack](https://github.com/Tanmay-Bstack))

#### :memo: Documentation
* Other
  * [#14786](https://github.com/webdriverio/webdriverio/pull/14786) Updated refs due to changes in the example-recipes repo ([@fpereira1](https://github.com/fpereira1))
  * [#14787](https://github.com/webdriverio/webdriverio/pull/14787) Update docs on selector to warn that aria/ selectors can be slow ([@fpereira1](https://github.com/fpereira1))
  * [#14776](https://github.com/webdriverio/webdriverio/pull/14776) corrected typo in the index page ([@alphabetkrish](https://github.com/alphabetkrish))
* `wdio-junit-reporter`
  * [#14735](https://github.com/webdriverio/webdriverio/pull/14735) docs(@wdio/junit-reporter): update readme ([@eglitise](https://github.com/eglitise))

#### :house: Internal
* [#14748](https://github.com/webdriverio/webdriverio/pull/14748) chore(.nvmrc) upgrade node version to fix continuous release ([@NaamuKim](https://github.com/NaamuKim))

#### Committers: 15
- Alex ([@todti](https://github.com/todti))
- David Prevost ([@dprevost-LMI](https://github.com/dprevost-LMI))
- Edgars Eglītis ([@eglitise](https://github.com/eglitise))
- Erkan Erol ([@erkanerol](https://github.com/erkanerol))
- Filype ([@fpereira1](https://github.com/fpereira1))
- Luis Zurro ([@Nyaran](https://github.com/Nyaran))
- Luke ([@NaamuKim](https://github.com/NaamuKim))
- Nathan Zhao ([@phantomwolf](https://github.com/phantomwolf))
- Pranay Varma ([@pranay-v29](https://github.com/pranay-v29))
- Steve Hall ([@sh41](https://github.com/sh41))
- Sven ([@sventschui](https://github.com/sventschui))
- Ulises Gascón ([@UlisesGascon](https://github.com/UlisesGascon))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@Tanmay-Bstack](https://github.com/Tanmay-Bstack)
- [@alphabetkrish](https://github.com/alphabetkrish)


## v9.19.2 (2025-08-24)

#### :bug: Bug Fix
* `wdio-junit-reporter`
  * [#14706](https://github.com/webdriverio/webdriverio/pull/14706) fix(junit-reporter): improve error handling and skipped test reportin… ([@nair-sumesh](https://github.com/nair-sumesh))
* `webdriverio`
  * [#14717](https://github.com/webdriverio/webdriverio/pull/14717) fix(webdriverio): escape scripts in addInitScript ([@birtles](https://github.com/birtles))
* `wdio-local-runner`, `wdio-types`, `wdio-xvfb`
  * [#14700](https://github.com/webdriverio/webdriverio/pull/14700) fix(wdio-xvfb): `autoXvfb` should disable xvfb completely ([@goosewobbler](https://github.com/goosewobbler))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#14704](https://github.com/webdriverio/webdriverio/pull/14704) Add chaining of multiple layers of overwritten command definitions ([@amaanbs](https://github.com/amaanbs))

#### Committers: 4
- Amaan Hakim ([@amaanbs](https://github.com/amaanbs))
- Brian Birtles ([@birtles](https://github.com/birtles))
- [@goosewobbler](https://github.com/goosewobbler)
- [@nair-sumesh](https://github.com/nair-sumesh)


## v9.19.1 (2025-08-12)

#### :nail_care: Polish
* `wdio-local-runner`, `wdio-types`, `wdio-xvfb`
  * [#14696](https://github.com/webdriverio/webdriverio/pull/14696) feat(wdio-xvfb): add `xvfbAutoInstall` option ([@goosewobbler](https://github.com/goosewobbler))

#### Committers: 1
- [@goosewobbler](https://github.com/goosewobbler)


## v9.19.0 (2025-08-11)

#### :rocket: New Feature
* `wdio-local-runner`, `wdio-types`, `wdio-xvfb`
  * [#14663](https://github.com/webdriverio/webdriverio/pull/14663) feat: @wdio/xvfb ([@goosewobbler](https://github.com/goosewobbler))
* `wdio-browserstack-service`
  * [#14680](https://github.com/webdriverio/webdriverio/pull/14680) Add ignore hooks support for v9 ([@xxshubhamxx](https://github.com/xxshubhamxx))

#### :bug: Bug Fix
* `webdriverio`
  * [#14694](https://github.com/webdriverio/webdriverio/pull/14694) fix(webdriverio): don't fail if last window is closed ([@christian-bromann](https://github.com/christian-bromann))
  * [#14683](https://github.com/webdriverio/webdriverio/pull/14683) fix: fix longpress on iOS Safari ([@wswebcreation](https://github.com/wswebcreation))
  * [#14589](https://github.com/webdriverio/webdriverio/pull/14589) [BUG-14514] - Switch frame to an iframe in a Shadow DOM ([@vishnuv688](https://github.com/vishnuv688))
  * [#14661](https://github.com/webdriverio/webdriverio/pull/14661) fix: simplify the getNativeContext check ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-cucumber-framework`
  * [#14672](https://github.com/webdriverio/webdriverio/pull/14672) feat(cucumber): Fix skipping tests with skip tag ([@Nyaran](https://github.com/Nyaran))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#14677](https://github.com/webdriverio/webdriverio/pull/14677) A11y targeted scans v9 ([@xxshubhamxx](https://github.com/xxshubhamxx))

#### :memo: Documentation
* [#14660](https://github.com/webdriverio/webdriverio/pull/14660) core: update visual docs with `@wdio/image-comparison-core` ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Luis Zurro ([@Nyaran](https://github.com/Nyaran))
- Shubham Garg ([@xxshubhamxx](https://github.com/xxshubhamxx))
- Vishnu Vardhan ([@vishnuv688](https://github.com/vishnuv688))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@goosewobbler](https://github.com/goosewobbler)


## v9.18.4 (2025-07-23)

#### :nail_care: Polish
* `webdriverio`
  * [#14659](https://github.com/webdriverio/webdriverio/pull/14659) polish(webdriverio): expose contentVisibilityAuto, opacityProperty and visibilityProperty to waitForDisplayed ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 1
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))


## v9.18.3 (2025-07-22)

#### :bug: Bug Fix
* `webdriverio`
  * [#14656](https://github.com/webdriverio/webdriverio/pull/14656) fix(webdriverio): fix element chaining if element is not found ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 1
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))


## v9.18.2 (2025-07-21)

#### :bug: Bug Fix
* `create-wdio`
  * [#14650](https://github.com/webdriverio/webdriverio/pull/14650) fix(create-wdio): better resolve template directory in test ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- [@mato533](https://github.com/mato533)


## v9.18.0 (2025-07-16)

#### :bug: Bug Fix
* `create-wdio`, `wdio-browserstack-service`, `wdio-cucumber-framework`, `wdio-json-reporter`, `wdio-logger`, `wdio-mocha-framework`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#14570](https://github.com/webdriverio/webdriverio/pull/14570) fix(security): address multiple security vulnerabilities across codebase ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#14642](https://github.com/webdriverio/webdriverio/pull/14642) fix: avoid starting a timeout if the timer was resolved immediately ([@sheremet-va](https://github.com/sheremet-va))
* `webdriver`, `webdriverio`
  * [#14640](https://github.com/webdriverio/webdriverio/pull/14640) fix(webdriverio): properly toggle DISABLE_WEBDRIVERIO_DEPRECATION_WARNINGS ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-utils`
  * [#14634](https://github.com/webdriverio/webdriverio/pull/14634) feat: do not attach prefs when debuggerAddress is specified ([@uladhsi](https://github.com/uladhsi))
* `wdio-cli`
  * [#14632](https://github.com/webdriverio/webdriverio/pull/14632) feat(wdio-cli): enhance job completion logging format ([@NaamuKim](https://github.com/NaamuKim))

#### :memo: Documentation
* `create-wdio`
  * [#14631](https://github.com/webdriverio/webdriverio/pull/14631) chore: Update services.json to add TV Labs service ([@regan-karlewicz](https://github.com/regan-karlewicz))

#### :house: Internal
* `wdio-browserstack-service`, `wdio-cli`, `wdio-lighthouse-service`, `wdio-reporter`, `wdio-static-server-service`, `wdio-sumologic-reporter`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#14641](https://github.com/webdriverio/webdriverio/pull/14641) chore(*): update major dependencies where possible ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#14633](https://github.com/webdriverio/webdriverio/pull/14633) ci: skip test suite for pushes that change only markdown files ([@kitsiosk](https://github.com/kitsiosk))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kitsios Konstantinos ([@kitsiosk](https://github.com/kitsiosk))
- Luke ([@NaamuKim](https://github.com/NaamuKim))
- Regan Karlewicz ([@regan-karlewicz](https://github.com/regan-karlewicz))
- Vladimir ([@sheremet-va](https://github.com/sheremet-va))
- [@uladhsi](https://github.com/uladhsi)


## v9.17.0 (2025-07-09)

#### :rocket: New Feature
* `create-wdio`, `wdio-cli`
  * [#14618](https://github.com/webdriverio/webdriverio/pull/14618) feat: integrate the `create-wdio` package ([@mato533](https://github.com/mato533))

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-cucumber-framework`, `wdio-globals`, `wdio-mocha-framework`, `wdio-utils`
  * [#14626](https://github.com/webdriverio/webdriverio/pull/14626) chore(linter) fixed linter warnings with --fix ([@smarkows](https://github.com/smarkows))
* `webdriver`
  * [#14625](https://github.com/webdriverio/webdriverio/pull/14625) fix(webdriver): #14622 added ability to proxy websocket connections ([@smarkows](https://github.com/smarkows))
  * [#14623](https://github.com/webdriverio/webdriverio/pull/14623) fix(webdriver): re-enable undici global dispatcher ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#14587](https://github.com/webdriverio/webdriverio/pull/14587) [BUG-14499] - Improved switchFrame for delayed iframe contexts ([@vishnuv688](https://github.com/vishnuv688))
* `wdio-allure-reporter`, `wdio-reporter`, `wdio-utils`, `webdriverio`
  * [#14581](https://github.com/webdriverio/webdriverio/pull/14581) fix: Emit browser custom command `beforeCommand` to fix broken reports ([@dprevost-LMI](https://github.com/dprevost-LMI))
* `wdio-local-runner`
  * [#14611](https://github.com/webdriverio/webdriverio/pull/14611) fix(@wdio/local-runner): added graceful exit on SIGINT ([@DQRI](https://github.com/DQRI))
* `wdio-browser-runner`, `wdio-cli`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-local-runner`, `wdio-runner`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#14592](https://github.com/webdriverio/webdriverio/pull/14592) fix(@wdio/jasmine-framework): become independant from expect-webdriverio ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-mocha-framework`
  * [#14506](https://github.com/webdriverio/webdriverio/pull/14506) fix(mocha-framework): report spec load error as failure in `after` hook ([@lezram](https://github.com/lezram))

#### :memo: Documentation
* Other
  * [#14615](https://github.com/webdriverio/webdriverio/pull/14615) fix(docs): correct typos and improve clarity in Best Practices guide ([@Agnes-Au](https://github.com/Agnes-Au))
  * [#14599](https://github.com/webdriverio/webdriverio/pull/14599) Update BoilerplateProjects.md ([@amiya-pattnaik](https://github.com/amiya-pattnaik))
* `wdio-browserstack-service`
  * [#14614](https://github.com/webdriverio/webdriverio/pull/14614) Add URLs to Browserstack WebDriverIO services ([@sindhupullapantula](https://github.com/sindhupullapantula))
* `webdriverio`
  * [#14612](https://github.com/webdriverio/webdriverio/pull/14612) docs: add note about WebDriver Bidi support in browser.url command ([@Siolto](https://github.com/Siolto))
* `wdio-cli`
  * [#14606](https://github.com/webdriverio/webdriverio/pull/14606) Add wdio-obsidian-service to docs and cli ([@jesse-r-s-hines](https://github.com/jesse-r-s-hines))

#### :house: Internal
* `wdio-browserstack-service`, `wdio-lighthouse-service`, `wdio-utils`
  * [#14607](https://github.com/webdriverio/webdriverio/pull/14607) chore: replace asset to with at import statement ([@mato533](https://github.com/mato533))
* Other
  * [#14593](https://github.com/webdriverio/webdriverio/pull/14593) internal(security): update security policy with threat model ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 12
- Agnes Au ([@Agnes-Au](https://github.com/Agnes-Au))
- Amiya Pattanaik ([@amiya-pattnaik](https://github.com/amiya-pattnaik))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- David Prevost ([@dprevost-LMI](https://github.com/dprevost-LMI))
- Dmytro 🇺🇦 ([@DQRI](https://github.com/DQRI))
- Jesse Hines ([@jesse-r-s-hines](https://github.com/jesse-r-s-hines))
- Marcel ([@lezram](https://github.com/lezram))
- Simon Coen ([@Siolto](https://github.com/Siolto))
- Simon Markowski ([@smarkows](https://github.com/smarkows))
- Sindhu Pullapantula ([@sindhupullapantula](https://github.com/sindhupullapantula))
- Vishnu Vardhan ([@vishnuv688](https://github.com/vishnuv688))
- [@mato533](https://github.com/mato533)


## v9.16.0 (2025-06-23)

#### :eyeglasses: Spec Compliancy
* [#14534](https://github.com/webdriverio/webdriverio/pull/14534) fix(infra) have not present required generate optional argument ([@dprevost-LMI](https://github.com/dprevost-LMI))

#### :rocket: New Feature
* `wdio-config`, `wdio-runner`, `wdio-types`
  * [#14546](https://github.com/webdriverio/webdriverio/pull/14546) feat(wdio-runner): automatically include SoftAssertionService ([@JustasMonkev](https://github.com/JustasMonkev))

#### :bug: Bug Fix
* `wdio-config`
  * [#14236](https://github.com/webdriverio/webdriverio/pull/14236) fix: Combines exclude and wdio:exclude. ([@damencho](https://github.com/damencho))
* `wdio-utils`
  * [#14572](https://github.com/webdriverio/webdriverio/pull/14572) Fix for isAndroid outside of test ([@AakashHotchandani](https://github.com/AakashHotchandani))
  * [#14565](https://github.com/webdriverio/webdriverio/pull/14565) fix(wdio-utils):fix to support windows path string  ([@mato533](https://github.com/mato533))
  * [#14531](https://github.com/webdriverio/webdriverio/pull/14531) fix(webdriverio): detect Samsung devices as Android in BrowserStack ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#14557](https://github.com/webdriverio/webdriverio/pull/14557) fix for accessibility build error [wdio-browsertstack-service] ([@rounak610](https://github.com/rounak610))
* `webdriverio`
  * [#14549](https://github.com/webdriverio/webdriverio/pull/14549) fix(types): Fix `overwriteCommand` inconsistent typing ([@dprevost-LMI](https://github.com/dprevost-LMI))
* `wdio-local-runner`
  * [#14511](https://github.com/webdriverio/webdriverio/pull/14511) refactor(wdio-local-runner): replace async-exit-hook with exit-hook ([@harsha509](https://github.com/harsha509))
* `wdio-protocols`
  * [#14522](https://github.com/webdriverio/webdriverio/pull/14522) fix(@wdio/protocols): Have `options` of appium terminateApp command optional  ([@dprevost-LMI](https://github.com/dprevost-LMI))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#14538](https://github.com/webdriverio/webdriverio/pull/14538) Added support for running accessibility on Non-browserstack infrastructure ([@Bhargavi-BS](https://github.com/Bhargavi-BS))

#### :memo: Documentation
* Other
  * [#14578](https://github.com/webdriverio/webdriverio/pull/14578) fix: Updates exclude docs. ([@damencho](https://github.com/damencho))
  * [#14547](https://github.com/webdriverio/webdriverio/pull/14547) fix(docs) Masking doc glitches + update Appium required version following PR merge ([@dprevost-LMI](https://github.com/dprevost-LMI))
* `wdio-appium-service`, `wdio-cli`, `wdio-protocols`, `wdio-types`, `webdriverio`
  * [#14523](https://github.com/webdriverio/webdriverio/pull/14523) fix(docs): update various Appium-related links ([@eglitise](https://github.com/eglitise))

#### :house: Internal
* [#14569](https://github.com/webdriverio/webdriverio/pull/14569) fix(ci): hardening security of GH actions ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 10
- Aakash Hotchandani ([@AakashHotchandani](https://github.com/AakashHotchandani))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- David Prevost ([@dprevost-LMI](https://github.com/dprevost-LMI))
- Edgars Eglītis ([@eglitise](https://github.com/eglitise))
- JustasM ([@JustasMonkev](https://github.com/JustasMonkev))
- Rounak Bhatia ([@rounak610](https://github.com/rounak610))
- Sri Harsha ([@harsha509](https://github.com/harsha509))
- [@Bhargavi-BS](https://github.com/Bhargavi-BS)
- [@mato533](https://github.com/mato533)
- Дамян Минков ([@damencho](https://github.com/damencho))


## v9.15.0 (2025-05-30)

#### :rocket: New Feature
* `wdio-logger`, `wdio-runner`, `wdio-types`, `webdriver`, `webdriverio`
  * [#13938](https://github.com/webdriverio/webdriverio/pull/13938) feat(runner+browserstack): Mask sensitive data for Reporters (and more) ([@dprevost-LMI](https://github.com/dprevost-LMI))
* `wdio-protocols`
  * [#14507](https://github.com/webdriverio/webdriverio/pull/14507) feat(protocol): extend Appium protocol ([@eglitise](https://github.com/eglitise))
  * [#14462](https://github.com/webdriverio/webdriverio/pull/14462) feat(protocol): add Chromium log commands to Appium protocol ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `webdriverio`
  * [#14496](https://github.com/webdriverio/webdriverio/pull/14496) fix(webdriverio): write polyfill script as ES3 ([@romainmenke](https://github.com/romainmenke))
  * [#14465](https://github.com/webdriverio/webdriverio/pull/14465) fix(webdriverio): improve typing for execute and executeAsync ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#14491](https://github.com/webdriverio/webdriverio/pull/14491) fix(webdriver): handle large images on screenshot (fix for 14489 bug) ([@nikoslytras](https://github.com/nikoslytras))

#### :nail_care: Polish
* `webdriver`
  * [#14493](https://github.com/webdriverio/webdriverio/pull/14493) Cache the wd request dispatcher ([@dragosMC91](https://github.com/dragosMC91))

#### :memo: Documentation
* `webdriverio`
  * [#14488](https://github.com/webdriverio/webdriverio/pull/14488) docs: improve browser.keys documentation ([@vitmf](https://github.com/vitmf))

#### Committers: 7
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- David Prevost ([@dprevost-LMI](https://github.com/dprevost-LMI))
- Dragos Campean ([@dragosMC91](https://github.com/dragosMC91))
- Edgars Eglītis ([@eglitise](https://github.com/eglitise))
- Nikos Lytras ([@nikoslytras](https://github.com/nikoslytras))
- Romain Menke ([@romainmenke](https://github.com/romainmenke))
- Vitor de Mello Freitas ([@vitmf](https://github.com/vitmf))


## v9.14.0 (2025-05-15)

#### :rocket: New Feature
* `wdio-protocols`, `webdriver`, `webdriverio`
  * [#14478](https://github.com/webdriverio/webdriverio/pull/14478) feat(protocol): WebDriver Bidi Protocol update ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-spec-reporter`
  * [#14472](https://github.com/webdriverio/webdriverio/pull/14472) chore(@wdio/spec-reporter): file name print format ([@unickq](https://github.com/unickq))

#### :nail_care: Polish
* `wdio-types`
  * [#14474](https://github.com/webdriverio/webdriverio/pull/14474) add browserstack camera-image-injection to wdio-types capabilities ([@DoreyKiss](https://github.com/DoreyKiss))
* `wdio-browserstack-service`
  * [#14466](https://github.com/webdriverio/webdriverio/pull/14466) Added changes to skip tests for mocha framework for browserstack session ([@pri-gadhiya](https://github.com/pri-gadhiya))

#### :house: Internal
* `wdio-types`
  * [#14481](https://github.com/webdriverio/webdriverio/pull/14481) feat: adding check in normalizeDoc function to make sure readmeArr is of string type ([@Kauanldsbarbosa](https://github.com/Kauanldsbarbosa))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dory ([@DoreyKiss](https://github.com/DoreyKiss))
- Kauan Barbosa ([@Kauanldsbarbosa](https://github.com/Kauanldsbarbosa))
- Mykyta Chursin ([@unickq](https://github.com/unickq))
- Priyanka Gadhiya ([@pri-gadhiya](https://github.com/pri-gadhiya))


## v9.13.0 (2025-05-12)

#### :eyeglasses: Spec Compliancy
* `wdio-protocols`
  * [#14431](https://github.com/webdriverio/webdriverio/pull/14431) change gridProxyDetails request from GET to POST method ([@ArtMathArt](https://github.com/ArtMathArt))

#### :bug: Bug Fix
* `webdriver`
  * [#14463](https://github.com/webdriverio/webdriverio/pull/14463) fix(webdriver): stop cloning request so `await response.json()` can abort properly ([@dprevost-LMI](https://github.com/dprevost-LMI))
  * [#14437](https://github.com/webdriverio/webdriverio/pull/14437) Fix avoid misleading BiDi connection failure message ([@Rondleysg](https://github.com/Rondleysg))
* `webdriverio`
  * [#14449](https://github.com/webdriverio/webdriverio/pull/14449) fix(bidi-dialog): only dismiss dialogs in active browsing context ([@Rondleysg](https://github.com/Rondleysg))
  * [#14448](https://github.com/webdriverio/webdriverio/pull/14448) fix(bidi-dialog): only accept dialogs in active browsing context ([@Rondleysg](https://github.com/Rondleysg))
* `wdio-utils`
  * [#14427](https://github.com/webdriverio/webdriverio/pull/14427) fix: disable Chrome's password manager leak detection as it can block test execution ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-junit-reporter`
  * [#14422](https://github.com/webdriverio/webdriverio/pull/14422) Add suite and test field of skipped test to xml report ([@ccharnkij](https://github.com/ccharnkij))

#### :nail_care: Polish
* `wdio-allure-reporter`, `wdio-concise-reporter`, `wdio-reporter`, `wdio-spec-reporter`
  * [#14454](https://github.com/webdriverio/webdriverio/pull/14454) feat(reporter): add browserName function and use where required ([@Delta456](https://github.com/Delta456))
* `wdio-browserstack-service`
  * [#14438](https://github.com/webdriverio/webdriverio/pull/14438) Auto enable accessibility [v9] ([@rounak610](https://github.com/rounak610))

#### :memo: Documentation
* Other
  * [#14467](https://github.com/webdriverio/webdriverio/pull/14467) Update method-options.md ([@wswebcreation](https://github.com/wswebcreation))
  * [#14451](https://github.com/webdriverio/webdriverio/pull/14451) Update BoilerplateProjects.md ([@amiya-pattnaik](https://github.com/amiya-pattnaik))
  * [#14452](https://github.com/webdriverio/webdriverio/pull/14452) Fix: button alignment, update Twitter icon to X,. feat: add version dropdown ([@Kauanldsbarbosa](https://github.com/Kauanldsbarbosa))
  * [#14442](https://github.com/webdriverio/webdriverio/pull/14442) feature: contributor components in the index ([@Kauanldsbarbosa](https://github.com/Kauanldsbarbosa))
* `wdio-types`
  * [#14435](https://github.com/webdriverio/webdriverio/pull/14435) docs: fix typo ([@fetsorn](https://github.com/fetsorn))
* `webdriverio`
  * [#14424](https://github.com/webdriverio/webdriverio/pull/14424) chore: update mobile docs ([@wswebcreation](https://github.com/wswebcreation))

#### :house: Internal
* [#14464](https://github.com/webdriverio/webdriverio/pull/14464) chore: reenable headless/test.e2e.ts tests ([@dprevost-LMI](https://github.com/dprevost-LMI))

#### Committers: 12
- Amiya Pattanaik ([@amiya-pattnaik](https://github.com/amiya-pattnaik))
- Artem Sukhinin ([@ArtMathArt](https://github.com/ArtMathArt))
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- David Prevost ([@dprevost-LMI](https://github.com/dprevost-LMI))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Kauan Barbosa ([@Kauanldsbarbosa](https://github.com/Kauanldsbarbosa))
- Rondley Gregório ([@Rondleysg](https://github.com/Rondleysg))
- Rounak Bhatia ([@rounak610](https://github.com/rounak610))
- Swastik Baranwal ([@Delta456](https://github.com/Delta456))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@fetsorn](https://github.com/fetsorn)


## v9.12.7 (2025-04-21)

#### :bug: Bug Fix
* `webdriverio`
  * [#14413](https://github.com/webdriverio/webdriverio/pull/14413) Returns full body for mock response ([@ccharnkij](https://github.com/ccharnkij))

#### Committers: 2
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.12.6 (2025-04-17)

#### :rocket: New Feature
* `webdriver`
  * [14350](https://github.com/webdriverio/webdriverio/pull/14350) feat: introduce defineConfig function to create a typed configuration object ([@erwinheitzman](https://github.com/erwinheitzman))

#### :bug: Bug Fix
* `wdio-utils`
  * [#14417](https://github.com/webdriverio/webdriverio/pull/14417) Fix Windows Automation on WebDriverIO V9 ([@samuelfreiberg](https://github.com/samuelfreiberg))
  * [#14412](https://github.com/webdriverio/webdriverio/pull/14412) Address skipping tests for mocha and jasmine in aftertest ([@ccharnkij](https://github.com/ccharnkij))

#### :nail_care: Polish
* `webdriverio`
  * [#14398](https://github.com/webdriverio/webdriverio/pull/14398) catching error from addPreloadScript ([@ccharnkij](https://github.com/ccharnkij))
* `wdio-browserstack-service`
  * [#14410](https://github.com/webdriverio/webdriverio/pull/14410) fix(@wdio/browserstack-service): node fetch() failure over HTTPS_PROXY=<proxy_url> setup ([@mitya555](https://github.com/mitya555))
* `@wdio/config`
  * [14351](https://github.com/webdriverio/webdriverio/pull/14351) polish(@wdio/config): decrease waitforInterval from 500 to 100 to improve execution speed ([@erwinheitzman](https://github.com/erwinheitzman)) 

#### Committers: 4
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Dmitriy Mukhin ([@mitya555](https://github.com/mitya555))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Samuel Freiberg ([@samuelfreiberg](https://github.com/samuelfreiberg))


## v9.12.5 (2025-04-11)

#### :eyeglasses: Spec Compliancy
* `wdio-protocols`
  * [#14379](https://github.com/webdriverio/webdriverio/pull/14379) feat(@wdio/protocols): Add "options" parameter to "terminateApp" command ([@Nyaran](https://github.com/Nyaran))

#### :bug: Bug Fix
* `webdriverio`
  * [#14406](https://github.com/webdriverio/webdriverio/pull/14406) fix(interception): Return raw non-binary responses without metadata wrapper ([@Norva-bugged](https://github.com/Norva-bugged))
  * [#14401](https://github.com/webdriverio/webdriverio/pull/14401) fix(#14368): desync puppeteer-core peer-dep version ([@Badisi](https://github.com/Badisi))
  * [#14402](https://github.com/webdriverio/webdriverio/pull/14402) fix: unexpected token '?' on older browsers ([@will-stone](https://github.com/will-stone))
  * [#14403](https://github.com/webdriverio/webdriverio/pull/14403) fix(element): improve checkVisibility fallback handling in element.isDisplayed ([@paymand](https://github.com/paymand))
* `webdriver`
  * [#14391](https://github.com/webdriverio/webdriverio/pull/14391) fix(webdriver): undici fetch() failure with HTTPS_PROXY=<proxy_url> setup ([@mitya555](https://github.com/mitya555))
* `wdio-browserstack-service`
  * [#14393](https://github.com/webdriverio/webdriverio/pull/14393) fix: Failed hook reporting on observability ([@sauravdas1997](https://github.com/sauravdas1997))

#### :nail_care: Polish
* `wdio-utils`
  * [#14392](https://github.com/webdriverio/webdriverio/pull/14392) fix(utils): fix not to judged as screenshot the arg of switch* ([@mato533](https://github.com/mato533))
* `wdio-browserstack-service`
  * [#14383](https://github.com/webdriverio/webdriverio/pull/14383) chore: ignore error handling for command wrapping ([@sauravdas1997](https://github.com/sauravdas1997))

#### :memo: Documentation
* `webdriverio`
  * [#14387](https://github.com/webdriverio/webdriverio/pull/14387) docs: fixing deprecated tag display and returns ([@Rondleysg](https://github.com/Rondleysg))

#### Committers: 10
- Avron Souto ([@Norva-bugged](https://github.com/Norva-bugged))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dmitriy Mukhin ([@mitya555](https://github.com/mitya555))
- Luis ([@Nyaran](https://github.com/Nyaran))
- Payman Delshad ([@paymand](https://github.com/paymand))
- Rondley Gregório ([@Rondleysg](https://github.com/Rondleysg))
- Will Stone ([@will-stone](https://github.com/will-stone))
- [@Badisi](https://github.com/Badisi)
- [@mato533](https://github.com/mato533)
- [@sauravdas1997](https://github.com/sauravdas1997)


## v9.12.4 (2025-04-05)

#### :bug: Bug Fix
* `webdriver`
  * [#14376](https://github.com/webdriverio/webdriverio/pull/14376) fix(webdriver): add timeout-related configurable options to ProxyAgent ([@mitya555](https://github.com/mitya555))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#14373](https://github.com/webdriverio/webdriverio/pull/14373) refactor: Avoid making extra calls for eTag ([@sauravdas1997](https://github.com/sauravdas1997))

#### :memo: Documentation
* `webdriverio`
  * [#14369](https://github.com/webdriverio/webdriverio/pull/14369) Migrate documentation parsing to comment-parser ([@Rondleysg](https://github.com/Rondleysg))
* Other
  * [#14366](https://github.com/webdriverio/webdriverio/pull/14366) [docs]: fix reference links ([@navin772](https://github.com/navin772))

#### :house: Internal
* `webdriverio`
  * [#14361](https://github.com/webdriverio/webdriverio/pull/14361) fix(webdriverio): fix order of execution in session polyfill ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 5
- Dmitriy Mukhin ([@mitya555](https://github.com/mitya555))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Navin Chandra ([@navin772](https://github.com/navin772))
- Rondley Gregório ([@Rondleysg](https://github.com/Rondleysg))
- [@sauravdas1997](https://github.com/sauravdas1997)


## v9.12.3 (2025-04-03)

#### :bug: Bug Fix
* `webdriverio`
  * [#14360](https://github.com/webdriverio/webdriverio/pull/14360) fix(interception): Properly handle binary response data in WebDriverInterception ([@Norva-bugged](https://github.com/Norva-bugged))
  * [#14338](https://github.com/webdriverio/webdriverio/pull/14338) fix: Fixes isDisplayed to always use default params for checkVisibility. ([@damencho](https://github.com/damencho))
* Other
  * [#14341](https://github.com/webdriverio/webdriverio/pull/14341) SDK-2064 A11y-Platform-Level-Support ([@xxshubhamxx](https://github.com/xxshubhamxx))

#### :memo: Documentation
* [#14357](https://github.com/webdriverio/webdriverio/pull/14357) fix(docs): resolving broken sumologic reporter link ([@rbronz](https://github.com/rbronz))
* [#14353](https://github.com/webdriverio/webdriverio/pull/14353) fix broken link in docs. Closes [#14348](https://github.com/webdriverio/webdriverio/issues/14348) ([@harsha509](https://github.com/harsha509))

#### :house: Internal
* `wdio-allure-reporter`, `wdio-browser-runner`, `wdio-browserstack-service`, `wdio-cli`, `wdio-config`, `wdio-cucumber-framework`, `wdio-firefox-profile-service`, `wdio-jasmine-framework`, `wdio-lighthouse-service`, `wdio-mocha-framework`, `wdio-protocols`, `wdio-runner`, `wdio-types`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#14363](https://github.com/webdriverio/webdriverio/pull/14363) chore: bump @wdio/eslint and format ([@alcpereira](https://github.com/alcpereira))

#### Committers: 8
- Avron Souto ([@Norva-bugged](https://github.com/Norva-bugged))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Shubham Garg ([@xxshubhamxx](https://github.com/xxshubhamxx))
- Sri Harsha ([@harsha509](https://github.com/harsha509))
- [@alcpereira](https://github.com/alcpereira)
- [@fetsorn](https://github.com/fetsorn)
- [@rbronz](https://github.com/rbronz)
- Дамян Минков ([@damencho](https://github.com/damencho))


## v9.12.2 (2025-03-27)

#### :rocket: New Feature
* `webdriver`
  * [#14304](https://github.com/webdriverio/webdriverio/pull/14304) feat(webdriver): support WebSocket options at the BiDi connection ([@mato533](https://github.com/mato533))

#### :bug: Bug Fix
* `webdriver`
  * [#14336](https://github.com/webdriverio/webdriverio/pull/14336) fix(webdriverio): try/catch dns lookup ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#14321](https://github.com/webdriverio/webdriverio/pull/14321) fix: android deepLink using package instead of packageName ([@fabioatcorreia](https://github.com/fabioatcorreia))
* `wdio-utils`
  * [#14311](https://github.com/webdriverio/webdriverio/pull/14311) Reduce wait port retry interval ([@dragosMC91](https://github.com/dragosMC91))
* `wdio-browserstack-service`
  * [#14280](https://github.com/webdriverio/webdriverio/pull/14280) Bug Fix: missing Platform version on BrowserStack Observability ([@AdityaHirapara](https://github.com/AdityaHirapara))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#14332](https://github.com/webdriverio/webdriverio/pull/14332) SDK-2064 A11y-Platform-Level-Support ([@xxshubhamxx](https://github.com/xxshubhamxx))
  * [#14312](https://github.com/webdriverio/webdriverio/pull/14312) Percy binary update ([@sauravdas1997](https://github.com/sauravdas1997))

#### :memo: Documentation
* Other
  * [#14335](https://github.com/webdriverio/webdriverio/pull/14335) fix: fix in docs formatter to accept new types ([@Rondleysg](https://github.com/Rondleysg))
  * [#14329](https://github.com/webdriverio/webdriverio/pull/14329) fix(docs): resolving broken sauce connect proxy link ([@rbronz](https://github.com/rbronz))
  * [#14318](https://github.com/webdriverio/webdriverio/pull/14318) docs: boilerplate project added to MD ([@Rondleysg](https://github.com/Rondleysg))
  * [#14320](https://github.com/webdriverio/webdriverio/pull/14320) docs: update docker docs to use official puppeteer image ([@alcpereira](https://github.com/alcpereira))
  * [#14308](https://github.com/webdriverio/webdriverio/pull/14308) fix(docs): resolving broken github actions links ([@Sandi2212](https://github.com/Sandi2212))
* `wdio-cli`, `wdio-protocols`, `wdio-sauce-service`, `wdio-spec-reporter`, `wdio-types`
  * [#14327](https://github.com/webdriverio/webdriverio/pull/14327) docs: fix all references to Sauce Labs docs ([@Rondleysg](https://github.com/Rondleysg))
* `wdio-spec-reporter`
  * [#14306](https://github.com/webdriverio/webdriverio/pull/14306) updated spec reporter readme - sharable links value with valid sauce sharable link ([@vjuturu](https://github.com/vjuturu))

#### Committers: 13
- Aditya Hirapara ([@AdityaHirapara](https://github.com/AdityaHirapara))
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dragos Campean ([@dragosMC91](https://github.com/dragosMC91))
- Fábio Correia ([@fabioatcorreia](https://github.com/fabioatcorreia))
- Rondley Gregório ([@Rondleysg](https://github.com/Rondleysg))
- Shubham Garg ([@xxshubhamxx](https://github.com/xxshubhamxx))
- [@Sandi2212](https://github.com/Sandi2212)
- [@alcpereira](https://github.com/alcpereira)
- [@mato533](https://github.com/mato533)
- [@rbronz](https://github.com/rbronz)
- [@sauravdas1997](https://github.com/sauravdas1997)
- [@vjuturu](https://github.com/vjuturu)


## v9.12.1 (2025-03-20)

#### :bug: Bug Fix
* `webdriverio`
  * [#14288](https://github.com/webdriverio/webdriverio/pull/14288) Fix isClickable auto-scroll ([@dragosMC91](https://github.com/dragosMC91))
  * [#14296](https://github.com/webdriverio/webdriverio/pull/14296) Allow switchWindow with no current window ([@ccharnkij](https://github.com/ccharnkij))
  * [#14298](https://github.com/webdriverio/webdriverio/pull/14298) fix(webdriverio): update listener registration logic of SessionManager ([@mato533](https://github.com/mato533))
  * [#14270](https://github.com/webdriverio/webdriverio/pull/14270) fix(webdriverio): wait for element to exist before executing on it ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`, `webdriver`, `webdriverio`
  * [#14287](https://github.com/webdriverio/webdriverio/pull/14287) fix: support windows/mac apps for isDisplayed ([@wswebcreation](https://github.com/wswebcreation))

#### :nail_care: Polish
* `wdio-cli`
  * [#14294](https://github.com/webdriverio/webdriverio/pull/14294) Add Roku service to default services ([@jcantfell](https://github.com/jcantfell))
  * [#14279](https://github.com/webdriverio/webdriverio/pull/14279) chore(cli): remove unnecessary definition of the variables ([@mato533](https://github.com/mato533))
* `webdriver`
  * [#14278](https://github.com/webdriverio/webdriverio/pull/14278) fix(webdriver): update the registration logic for  abort listener ([@mato533](https://github.com/mato533))
  * [#14274](https://github.com/webdriverio/webdriverio/pull/14274) chore(webdriver): fix typo ([@Delta456](https://github.com/Delta456))
* `wdio-browser-runner`, `webdriver`
  * [#14259](https://github.com/webdriverio/webdriverio/pull/14259) fix: Try to resolve ip addresses if no BiDi connection to the host could be established ([@mykola-mokhnach](https://github.com/mykola-mokhnach))

#### :memo: Documentation
* [#14277](https://github.com/webdriverio/webdriverio/pull/14277) docs: update service-options broken links ([@bimlote](https://github.com/bimlote))
* [#14269](https://github.com/webdriverio/webdriverio/pull/14269) docs: add compareoptions object for visual test docs ([@alcpereira](https://github.com/alcpereira))

#### :house: Internal
* `webdriver`
  * [#14272](https://github.com/webdriverio/webdriverio/pull/14272) chore(webdriver): add unit tests for DNS patch ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 11
- -bimlote- ([@bimlote](https://github.com/bimlote))
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dragos Campean ([@dragosMC91](https://github.com/dragosMC91))
- Jason Cantfell ([@jcantfell](https://github.com/jcantfell))
- Mykola Mokhnach ([@mykola-mokhnach](https://github.com/mykola-mokhnach))
- Swastik Baranwal ([@Delta456](https://github.com/Delta456))
- Volodymyr Parlah ([@vparlah](https://github.com/vparlah))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@alcpereira](https://github.com/alcpereira)
- [@mato533](https://github.com/mato533)


## v9.12.0 (2025-03-11)

#### :rocket: New Feature
* `webdriverio`
  * [#14267](https://github.com/webdriverio/webdriverio/pull/14267) feat(webdriverio): allow more options for screenshot taking with Bidi ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#14268](https://github.com/webdriverio/webdriverio/pull/14268) fix(webdriverio): fail implicitly when trying to use Puppeteer with the browser runner ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* Other
  * [#14266](https://github.com/webdriverio/webdriverio/pull/14266) docs: fix waitforfontsloaded position in docs ([@alcpereira](https://github.com/alcpereira))
* `webdriverio`
  * [#14263](https://github.com/webdriverio/webdriverio/pull/14263) docs: mention that Chrome DevTools protocol is not installed by default and what package is required ([@ianrenauld](https://github.com/ianrenauld))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Ian Renauld ([@ianrenauld](https://github.com/ianrenauld))
- [@alcpereira](https://github.com/alcpereira)


## v9.11.0 (2025-03-05)

#### :rocket: New Feature
* `wdio-cucumber-framework`, `wdio-reporter`, `wdio-spec-reporter`
  * [#14234](https://github.com/webdriverio/webdriverio/pull/14234) feat(cucumber): Distinguish Cucumber PENDING status in reporters ([@Norva-bugged](https://github.com/Norva-bugged))

#### :bug: Bug Fix
* `webdriver`, `webdriverio`
  * [#14246](https://github.com/webdriverio/webdriverio/pull/14246) fix(webdriver): abort all operation when session closes ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browser-runner`
  * [#14250](https://github.com/webdriverio/webdriverio/pull/14250) fix(@wdio/browser-runner): fix resolve of Mocha dependencies ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-config`
  * [#14243](https://github.com/webdriverio/webdriverio/pull/14243) [WDIO9] added wildcards for cli ([@udarrr](https://github.com/udarrr))
  * [#14244](https://github.com/webdriverio/webdriverio/pull/14244) fix(cli): bring back support for glob pattern in filesToWatch ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#14229](https://github.com/webdriverio/webdriverio/pull/14229) fix(cli): properly check and find the config file ([@mato533](https://github.com/mato533))

#### :nail_care: Polish
* `wdio-utils`
  * [#14245](https://github.com/webdriverio/webdriverio/pull/14245) fix(@wdio/utils): better detect functions in parameter ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#14242](https://github.com/webdriverio/webdriverio/pull/14242) fix(webdriverio): don't continue failing context request ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#14251](https://github.com/webdriverio/webdriverio/pull/14251) docs: improve typescript example with webdriverio namespace ([@alcpereira](https://github.com/alcpereira))

#### :house: Internal
* [#14215](https://github.com/webdriverio/webdriverio/pull/14215) fix(webdriverio): fix failing e2e tests due to language and timezone differences ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 6
- Avron Souto ([@Norva-bugged](https://github.com/Norva-bugged))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Siarhei Kliushnikau ([@udarrr](https://github.com/udarrr))
- [@alcpereira](https://github.com/alcpereira)
- [@mato533](https://github.com/mato533)


## v9.10.1 (2025-02-25)

#### :bug: Bug Fix
* `wdio-junit-reporter`, `wdio-reporter`, `wdio-runner`, `wdio-spec-reporter`, `wdio-types`, `webdriver`
  * [#14223](https://github.com/webdriverio/webdriverio/pull/14223) fix(@wdio/reporter): propagate failing session creation to report ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browser-runner`, `wdio-cli`, `wdio-config`, `wdio-runner`, `wdio-utils`, `webdriverio`
  * [#14219](https://github.com/webdriverio/webdriverio/pull/14219) polish: performance improvements and some general code improvements ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))


## v9.10.0 (2025-02-22)

#### :rocket: New Feature
* `webdriverio`
  * [#14212](https://github.com/webdriverio/webdriverio/pull/14212) feat: add deepLink command ([@wswebcreation](https://github.com/wswebcreation))
  * [#14202](https://github.com/webdriverio/webdriverio/pull/14202) feat: add restartApp ([@wswebcreation](https://github.com/wswebcreation))

#### :bug: Bug Fix
* `wdio-sauce-service`
  * [#14205](https://github.com/webdriverio/webdriverio/pull/14205) Fix logFile case for sauce service ([@Nyaran](https://github.com/Nyaran))

#### :nail_care: Polish
* `webdriverio`
  * [#14213](https://github.com/webdriverio/webdriverio/pull/14213) fix(webdriverio): wait for option to become available before clicking ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sauce-service`
  * [#14209](https://github.com/webdriverio/webdriverio/pull/14209) fix: Remove unused typings file on sauce service ([@Nyaran](https://github.com/Nyaran))
  * [#14207](https://github.com/webdriverio/webdriverio/pull/14207) Remove default values for `tlsPassthroughDomains` on sauce service ([@Nyaran](https://github.com/Nyaran))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Luis ([@Nyaran](https://github.com/Nyaran))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.9.3 (2025-02-18)

#### :bug: Bug Fix
* `webdriverio`
  * [#14197](https://github.com/webdriverio/webdriverio/pull/14197) fix(webdriverio): listen on browsingContext.fragmentNavigated ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#14163](https://github.com/webdriverio/webdriverio/pull/14163) WDIO-V9 [fixes for consoleLog patch] ([@rounak610](https://github.com/rounak610))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Rounak Bhatia ([@rounak610](https://github.com/rounak610))


## v9.9.2 (2025-02-18)

#### :bug: Bug Fix
* `webdriverio`
  * [#14196](https://github.com/webdriverio/webdriverio/pull/14196) fix(webdriverio): find the right request when loading hash urls ([@christian-bromann](https://github.com/christian-bromann))
  * [#14191](https://github.com/webdriverio/webdriverio/pull/14191) fix: 14084 - displayed method broken after context switching ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-cli`
  * [#14195](https://github.com/webdriverio/webdriverio/pull/14195) fix(cli): properly find ts as default config file ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-cli`
  * [#14194](https://github.com/webdriverio/webdriverio/pull/14194) Update-addingreporter ([@aswinchembath](https://github.com/aswinchembath))

#### Committers: 3
- Aswin Chembath ([@aswinchembath](https://github.com/aswinchembath))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.9.1 (2025-02-14)

#### :bug: Bug Fix
* `webdriverio`
  * [#14190](https://github.com/webdriverio/webdriverio/pull/14190) fix(webdriverio): fallback to classic navigate on concurrent request issues ([@christian-bromann](https://github.com/christian-bromann))
  * [#14183](https://github.com/webdriverio/webdriverio/pull/14183) fix(webdriverio): fix initializing session manager after attaching to new session ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-webdriver-mock-service`, `webdriverio`
  * [#14184](https://github.com/webdriverio/webdriverio/pull/14184) fix(webdriverio): populate new elementId after waitForExist call ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `eslint-plugin-wdio`
  * [#14188](https://github.com/webdriverio/webdriverio/pull/14188) feat(eslint): Add support for multiple browser instances in eslint rules ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browser-runner`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-runner`
  * [#14185](https://github.com/webdriverio/webdriverio/pull/14185) Smoke test cucumber snapshot ([@jbblanchet](https://github.com/jbblanchet))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@jbblanchet](https://github.com/jbblanchet)


## v9.8.0 (2025-02-06)

#### :bug: Bug Fix
* `webdriverio`
  * [#14158](https://github.com/webdriverio/webdriverio/pull/14158) fix(webdriverio): only manage context navigation for desktop ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-sauce-service`, `wdio-spec-reporter`
  * [#14130](https://github.com/webdriverio/webdriverio/pull/14130) Add support for Sauce Connect 5, drop support for Sauce Connect 4 ([@budziam](https://github.com/budziam))
* `wdio-cli`
  * [#14154](https://github.com/webdriverio/webdriverio/pull/14154) for in changed to for of for execArgv ([@udarrr](https://github.com/udarrr))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Michał Budziak ([@budziam](https://github.com/budziam))
- Siarhei Kliushnikau ([@udarrr](https://github.com/udarrr))


## v9.7.3 (2025-02-05)

#### :bug: Bug Fix
* `webdriverio`
  * [#14153](https://github.com/webdriverio/webdriverio/pull/14153) fix(webdriverio): properly run and test switch to frame by function ([@christian-bromann](https://github.com/christian-bromann))
  * [#14128](https://github.com/webdriverio/webdriverio/pull/14128) fix(webdriverio): reset context on navigation events ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cli`
  * [#14132](https://github.com/webdriverio/webdriverio/pull/14132) Copy capability before onWorkerStart is called ([@mato533](https://github.com/mato533))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@mato533](https://github.com/mato533)


## v9.7.2 (2025-01-29)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#14054](https://github.com/webdriverio/webdriverio/pull/14054) fix: Handle paths for accessibility ([@sauravdas1997](https://github.com/sauravdas1997))
  * [#14122](https://github.com/webdriverio/webdriverio/pull/14122) fixes in packages/wdio-browserstack-service to support wdio-v9 ([@rounak610](https://github.com/rounak610))

#### :nail_care: Polish
* `wdio-utils`, `webdriverio`
  * [#14024](https://github.com/webdriverio/webdriverio/pull/14024) wdio: implement `.entries()` for `ChainablePromiseArray` ([@Delta456](https://github.com/Delta456))

#### :memo: Documentation
* [#14121](https://github.com/webdriverio/webdriverio/pull/14121) chore: update visual docs ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 4
- Rounak Bhatia ([@rounak610](https://github.com/rounak610))
- Swastik Baranwal ([@Delta456](https://github.com/Delta456))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@sauravdas1997](https://github.com/sauravdas1997)


## v9.7.1 (2025-01-25)

#### :bug: Bug Fix
* `webdriverio`
  * [#14113](https://github.com/webdriverio/webdriverio/pull/14113) fix(webdriverio): fix isDisplayed call if element is non existant ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-cli`
  * [#14111](https://github.com/webdriverio/webdriverio/pull/14111) updating constants and services lists with wdio-roku-service refs ([@jonyet](https://github.com/jonyet))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- jonathan terry ([@jonyet](https://github.com/jonyet))


## v9.7.0 (2025-01-24)

#### :bug: Bug Fix
* `webdriverio`
  * [#14110](https://github.com/webdriverio/webdriverio/pull/14110) fix(webdriverio): have the cjs export use the Node environment ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-protocols`, `webdriverio`
  * [#14060](https://github.com/webdriverio/webdriverio/pull/14060) feat: enrich Appium context methods ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.6.4 (2025-01-24)

#### :nail_care: Polish
* `wdio-utils`
  * [#14106](https://github.com/webdriverio/webdriverio/pull/14106) chore(@wdio/utils): allow to set spawnOpts for Chromedriver as well ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.6.3 (2025-01-23)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#14104](https://github.com/webdriverio/webdriverio/pull/14104) fix(@wdio/browser-runner): export mocha source map ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.6.2 (2025-01-23)

#### :bug: Bug Fix
* `wdio-webdriver-mock-service`, `webdriverio`
  * [#14103](https://github.com/webdriverio/webdriverio/pull/14103) fix(webdriverio): double check elements that have a display: contents ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-types`, `webdriverio`
  * [#14101](https://github.com/webdriverio/webdriverio/pull/14101) fix(webdriverio): enable arbitrary automation protocol packages ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-mocha-framework`, `wdio-runner`
  * [#14102](https://github.com/webdriverio/webdriverio/pull/14102) fix(@wdio/runner): make sure there is at least one reporter initiated ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `webdriver`
  * [#14100](https://github.com/webdriverio/webdriverio/pull/14100) fix: typos on readme ([@shiv-jirwankar](https://github.com/shiv-jirwankar))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Shiv Jirwankar ([@shiv-jirwankar](https://github.com/shiv-jirwankar))


## v9.6.1 (2025-01-23)

#### :bug: Bug Fix
* `webdriverio`
  * [#14097](https://github.com/webdriverio/webdriverio/pull/14097) fix(webdriverio): remove obsolete export ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kirill Gavrilov ([@gavvvr](https://github.com/gavvvr))


## v9.6.0 (2025-01-21)

#### :rocket: New Feature
* `wdio-browserstack-service`
  * [#14069](https://github.com/webdriverio/webdriverio/pull/14069) Accessibility Support for Browserstack app automate sessions ([@nishath-bs](https://github.com/nishath-bs))
* `webdriver`, `webdriverio`
  * [#14075](https://github.com/webdriverio/webdriverio/pull/14075) feat(webdriverio): use checkVisibility for display checks ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `webdriverio`
  * [#14070](https://github.com/webdriverio/webdriverio/pull/14070) fix(webdriverio): properly switch context using switchToParentFrame() ([@christian-bromann](https://github.com/christian-bromann))
  * [#14079](https://github.com/webdriverio/webdriverio/pull/14079) fix(webdriverio): allow it to visit chrome pages ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`, `webdriverio`
  * [#14085](https://github.com/webdriverio/webdriverio/pull/14085) fix(webdriverio): don't initialize session manager for stub ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#14080](https://github.com/webdriverio/webdriverio/pull/14080) fix(webdriverio): make WebdriverIO load-able in browser environments ([@christian-bromann](https://github.com/christian-bromann))
  * [#14050](https://github.com/webdriverio/webdriverio/pull/14050) fix(webdriverio): handle `closeWindow` for WDIO classic when no window is open ([@navin772](https://github.com/navin772))

#### :memo: Documentation
* Other
  * [#14092](https://github.com/webdriverio/webdriverio/pull/14092) docs(website): fix multiremote link ([@alcpereira](https://github.com/alcpereira))
* `eslint-plugin-wdio`
  * [#14087](https://github.com/webdriverio/webdriverio/pull/14087) docs(eslint-plugin-wdio): fix typo in readme ([@alcpereira](https://github.com/alcpereira))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mohamed Nishath N ([@nishath-bs](https://github.com/nishath-bs))
- Navin Chandra ([@navin772](https://github.com/navin772))
- [@alcpereira](https://github.com/alcpereira)


## v9.5.7 (2025-01-12)

#### :bug: Bug Fix
* `webdriverio`
  * [#14063](https://github.com/webdriverio/webdriverio/pull/14063) fix(webdriverio): further polyfill improvements ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.5.6 (2025-01-12)

#### :bug: Bug Fix
* `webdriverio`
  * [#14061](https://github.com/webdriverio/webdriverio/pull/14061) fix(webdriverio): register polyfill on all windows ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.5.5 (2025-01-10)

#### :bug: Bug Fix
* `wdio-cli`
  * [#14058](https://github.com/webdriverio/webdriverio/pull/14058) fix(@wdio/cli): initialize launcher also within watcher ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.5.4 (2025-01-10)

#### :bug: Bug Fix
* `webdriverio`
  * [#14056](https://github.com/webdriverio/webdriverio/pull/14056) fix(webdriverio): resolve target element in d&d command ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriver`
  * [#14049](https://github.com/webdriverio/webdriverio/pull/14049) chore(webdriver): remove dependency to Node.js in webdriver package ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.5.3 (2025-01-09)

#### :bug: Bug Fix
* `webdriver`, `webdriverio`
  * [#13906](https://github.com/webdriverio/webdriverio/pull/13906) fix(webdriverio): consolidate session manager ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.5.2 (2025-01-09)

#### :bug: Bug Fix
* `webdriverio`
  * [#14025](https://github.com/webdriverio/webdriverio/pull/14025) fix(webdriverio): better handle window switching in webdriver classic ([@navin772](https://github.com/navin772))
  * [#14037](https://github.com/webdriverio/webdriverio/pull/14037) fix(webdriverio): define getProperty return type as 'unknown' ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-testingbot-service`
  * [#14033](https://github.com/webdriverio/webdriverio/pull/14033) Add setAnnotation to TestingBot service ([@jochen-testingbot](https://github.com/jochen-testingbot))
* `wdio-appium-service`
  * [#14032](https://github.com/webdriverio/webdriverio/pull/14032) fix(@wdio/appium-service): start Appium server with multiremote capabilities ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#14040](https://github.com/webdriverio/webdriverio/pull/14040) docs: document how to retrive browser logs ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* [#14026](https://github.com/webdriverio/webdriverio/pull/14026) update pnpm-lock.yaml ([@navin772](https://github.com/navin772))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jochen ([@jochen-testingbot](https://github.com/jochen-testingbot))
- Navin Chandra ([@navin772](https://github.com/navin772))


## v9.5.1 (2025-01-03)

#### :bug: Bug Fix
* `webdriverio`
  * [#14023](https://github.com/webdriverio/webdriverio/pull/14023) fix: direction and scrollableElement error ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-appium-service`
  * [#13913](https://github.com/webdriverio/webdriverio/pull/13913) chore(appium-service): filter out `Debugger attached` as errorMessage ([@Delta456](https://github.com/Delta456))

#### :nail_care: Polish
* `wdio-appium-service`
  * [#14022](https://github.com/webdriverio/webdriverio/pull/14022) fix: Close appium server onComplete completly ([@saikrishna321](https://github.com/saikrishna321))
* `webdriver`
  * [#14020](https://github.com/webdriverio/webdriverio/pull/14020) fix(webdriver): allow BiDiCore to send declared headers ([@navin772](https://github.com/navin772))

#### Committers: 4
- Navin Chandra ([@navin772](https://github.com/navin772))
- Sai Krishna ([@saikrishna321](https://github.com/saikrishna321))
- Swastik Baranwal ([@Delta456](https://github.com/Delta456))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.5.0 (2024-12-30)

#### :rocket: New Feature
* `webdriverio`
  * [#14014](https://github.com/webdriverio/webdriverio/pull/14014) feat: add native mobile swipe ([@wswebcreation](https://github.com/wswebcreation))
  * [#14012](https://github.com/webdriverio/webdriverio/pull/14012) Add mobile tap command ([@wswebcreation](https://github.com/wswebcreation))

#### :bug: Bug Fix
* `webdriverio`
  * [#14018](https://github.com/webdriverio/webdriverio/pull/14018) fix(webdriverio): support resolve references from internalId ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sauce-service`
  * [#14013](https://github.com/webdriverio/webdriverio/pull/14013) fix(@wdio/sauce-service): set unique values for noSslBumpDomains ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-jasmine-framework`, `wdio-types`
  * [#14001](https://github.com/webdriverio/webdriverio/pull/14001) fix(@wdio/cli): adjust default value for specFileRetriesDeferred ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`
  * [#14000](https://github.com/webdriverio/webdriverio/pull/14000) fix(@wdio/utils): detect Appium if 'appium:options' is used ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-types`, `wdio-utils`, `webdriverio`
  * [#14010](https://github.com/webdriverio/webdriverio/pull/14010) Update Appium detection ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.4.5 (2024-12-19)

#### :nail_care: Polish
* `webdriverio`
  * [#13995](https://github.com/webdriverio/webdriverio/pull/13995) fix: Fixes an error message. ([@damencho](https://github.com/damencho))

#### Committers: 1
- Дамян Минков ([@damencho](https://github.com/damencho))


## v9.4.4 (2024-12-19)

#### :nail_care: Polish
* `wdio-testingbot-service`
  * [#13991](https://github.com/webdriverio/webdriverio/pull/13991) @wdio/testingbot-service: Update TestingBot Tunnel typings: add noCache and noBump ([@jochen-testingbot](https://github.com/jochen-testingbot))

#### :house: Internal
* `eslint-plugin-wdio`, `wdio-allure-reporter`, `wdio-appium-service`, `wdio-browser-runner`, `wdio-browserstack-service`, `wdio-cli`, `wdio-config`, `wdio-cucumber-framework`, `wdio-firefox-profile-service`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-json-reporter`, `wdio-junit-reporter`, `wdio-lighthouse-service`, `wdio-local-runner`, `wdio-logger`, `wdio-mocha-framework`, `wdio-protocols`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-shared-store-service`, `wdio-smoke-test-cjs-service`, `wdio-smoke-test-service`, `wdio-spec-reporter`, `wdio-static-server-service`, `wdio-sumologic-reporter`, `wdio-testingbot-service`, `wdio-types`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#13867](https://github.com/webdriverio/webdriverio/pull/13867) chore: upgrade to Eslint v9 ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jochen ([@jochen-testingbot](https://github.com/jochen-testingbot))


## v9.4.3 (2024-12-17)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-config`, `wdio-local-runner`, `webdriver`
  * [#13962](https://github.com/webdriverio/webdriverio/pull/13962) fix(@wdio/cli): propagate node-options to worker env ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`, `webdriver`
  * [#13978](https://github.com/webdriverio/webdriverio/pull/13978) fix(webdriver): enable Bidi commands for Appium sessions ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-types`
  * [#13988](https://github.com/webdriverio/webdriverio/pull/13988) wdio-types: add `platformVersion` field for BrowserStackCapabilities ([@Delta456](https://github.com/Delta456))

#### :nail_care: Polish
* `wdio-utils`
  * [#13983](https://github.com/webdriverio/webdriverio/pull/13983) fix(@wdio/utils): Unset geckodriver when stable is set as browserVersion ([@nextlevelbeard](https://github.com/nextlevelbeard))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))
- Swastik Baranwal ([@Delta456](https://github.com/Delta456))
- [@alphabetkrish](https://github.com/alphabetkrish)


## v9.4.2 (2024-12-12)

#### :bug: Bug Fix
* `wdio-cli`
  * [#13963](https://github.com/webdriverio/webdriverio/pull/13963) Remove unused cli-spinners dependency ([@alexparish](https://github.com/alexparish))
  * [#13944](https://github.com/webdriverio/webdriverio/pull/13944) fix(@wdio/cli): use require to import json file ([@christian-bromann](https://github.com/christian-bromann))
  * [#13932](https://github.com/webdriverio/webdriverio/pull/13932) fix(@wdio/cli): ensure onComplete hooks is executed ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`, `webdriverio`
  * [#13960](https://github.com/webdriverio/webdriverio/pull/13960) fix(webdriverio): support opening file urls ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`
  * [#13949](https://github.com/webdriverio/webdriverio/pull/13949) fix(@wdio/utils): properly detect Appium browser sessions ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-runner`
  * [#13958](https://github.com/webdriverio/webdriverio/pull/13958) fix(@wdio/runner): Continue emitting event on the runner even when a reporter throws an error ([@dprevost-LMI](https://github.com/dprevost-LMI))
* `webdriverio`
  * [#13941](https://github.com/webdriverio/webdriverio/pull/13941) fix(webdriverio): add 'appium:options' when checking for native context ([@ricardorlg](https://github.com/ricardorlg))
* `wdio-allure-reporter`, `webdriver`
  * [#13922](https://github.com/webdriverio/webdriverio/pull/13922) fix: Catch requests failure to trigger the `result` and `onAfterCommand` event ([@dprevost-LMI](https://github.com/dprevost-LMI))

#### :nail_care: Polish
* `wdio-cli`
  * [#13970](https://github.com/webdriverio/webdriverio/pull/13970) fix(@wdio/cli): Serenity/JS supports WebdriverIO 9 ([@jan-molak](https://github.com/jan-molak))
* `wdio-utils`, `webdriverio`
  * [#13950](https://github.com/webdriverio/webdriverio/pull/13950) fix(webdriverio): don't fail if getContext is not supported ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`, `wdio-types`
  * [#13951](https://github.com/webdriverio/webdriverio/pull/13951) Changes to send SDK instrumentation in capabilities  v9 ([@jainam-bs](https://github.com/jainam-bs))

#### :memo: Documentation
* [#13965](https://github.com/webdriverio/webdriverio/pull/13965) Update Emulation.md - device emulation ([@jochen-testingbot](https://github.com/jochen-testingbot))

#### Committers: 7
- Alex Parish ([@alexparish](https://github.com/alexparish))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- David Prevost ([@dprevost-LMI](https://github.com/dprevost-LMI))
- Jainam Shah ([@jainam-bs](https://github.com/jainam-bs))
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Jochen ([@jochen-testingbot](https://github.com/jochen-testingbot))
- ricardo larrahondo ([@ricardorlg](https://github.com/ricardorlg))


## v9.4.1 (2024-11-27)

#### :bug: Bug Fix
* `webdriverio`
  * [#13925](https://github.com/webdriverio/webdriverio/pull/13925) fix(webdriverio): support types for sync iteration ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.4.0 (2024-11-26)

#### :rocket: New Feature
* `webdriverio`
  * [#13914](https://github.com/webdriverio/webdriverio/pull/13914) feat: add pinch and zoom ([@wswebcreation](https://github.com/wswebcreation))

#### :bug: Bug Fix
* `webdriver`
  * [#13852](https://github.com/webdriverio/webdriverio/pull/13852) fix(webdriver): use undici for requests in Node.js ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#13916](https://github.com/webdriverio/webdriverio/pull/13916) feat: Add dragAndDrop for Mobile ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.3.1 (2024-11-22)

#### :rocket: New Feature
* `webdriver`, `webdriverio`
  * [#13905](https://github.com/webdriverio/webdriverio/pull/13905) feat: add two new mobile flags ([@wswebcreation](https://github.com/wswebcreation))

#### :nail_care: Polish
* `wdio-cucumber-framework`
  * [#13910](https://github.com/webdriverio/webdriverio/pull/13910) chore(@wdio/cucumber-framework): better re-export all Cucumber primitives ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#13904](https://github.com/webdriverio/webdriverio/pull/13904) propagate addCommand to children for multiremote ([@ccharnkij](https://github.com/ccharnkij))

#### Committers: 3
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.3.0 (2024-11-20)

#### :rocket: New Feature
* `webdriverio`
  * [#13895](https://github.com/webdriverio/webdriverio/pull/13895) Add an element `longPress` command ([@wswebcreation](https://github.com/wswebcreation))

#### :bug: Bug Fix
* `webdriver`
  * [#13838](https://github.com/webdriverio/webdriverio/pull/13838) fix(webdriverio): reconnect to bidi on reloadSession ([@christian-bromann](https://github.com/christian-bromann))
  * [#13896](https://github.com/webdriverio/webdriverio/pull/13896) fix(webdriver): make isBidi flag dependent on whether WebdriverIO can connect to the websocket url ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#13892](https://github.com/webdriverio/webdriverio/pull/13892) fix(webdriverio): better handle context when closing windows ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#13902](https://github.com/webdriverio/webdriverio/pull/13902) fix(@wdio/cli): fix typing when creating cucumber projects ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#13888](https://github.com/webdriverio/webdriverio/pull/13888) feat: add longpress logic ([@wswebcreation](https://github.com/wswebcreation))
  * [#13883](https://github.com/webdriverio/webdriverio/pull/13883) polish(webdriverio): improve error stack of waitUntil command ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#13903](https://github.com/webdriverio/webdriverio/pull/13903) chore(docs): add info setting up maxInstances and specs in docs ([@harsha509](https://github.com/harsha509))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Sri Harsha ([@harsha509](https://github.com/harsha509))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.2.15 (2024-11-14)

#### :nail_care: Polish
* `wdio-runner`
  * [#13878](https://github.com/webdriverio/webdriverio/pull/13878) fix(@wdio/runner): Respect excludes in capabilities in multiremote case. ([@damencho](https://github.com/damencho))

#### Committers: 1
- Дамян Минков ([@damencho](https://github.com/damencho))


## v9.2.14 (2024-11-14)

#### :rocket: New Feature
* `webdriverio`
  * [#13870](https://github.com/webdriverio/webdriverio/pull/13870) feat: enhance scrollIntoView to support native mobile ([@wswebcreation](https://github.com/wswebcreation))

#### :nail_care: Polish
* `wdio-cucumber-framework`, `wdio-reporter`, `wdio-spec-reporter`
  * [#13880](https://github.com/webdriverio/webdriverio/pull/13880) polish(@wdio/reporter): better display retried scenarios ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.2.12 (2024-11-11)

#### :bug: Bug Fix
* `webdriverio`
  * [#13874](https://github.com/webdriverio/webdriverio/pull/13874) fix(webdriverio): include documentElement when looking up elements without scope ([@christian-bromann](https://github.com/christian-bromann))
  * [#13869](https://github.com/webdriverio/webdriverio/pull/13869) fix(webdriverio): null check for switchFrame ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-sauce-service`
  * [#13872](https://github.com/webdriverio/webdriverio/pull/13872) fix(@wdio/sauce-service): don't rely on vulnerable ip package ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.2.11 (2024-11-07)

#### :bug: Bug Fix
* `webdriverio`
  * [#13863](https://github.com/webdriverio/webdriverio/pull/13863) fix(webdriverio): properly handle unresolved element on `switchFrame` input in non-BIDI scenario ([@gavvvr](https://github.com/gavvvr))
  * [#13857](https://github.com/webdriverio/webdriverio/pull/13857) fix(webdriverio): switchWindow supports exact window handle match ([@jan-molak](https://github.com/jan-molak))
* `wdio-browserstack-service`
  * [#13858](https://github.com/webdriverio/webdriverio/pull/13858) fix: stacktrace for testobservability ([@07souravkunda](https://github.com/07souravkunda))
  * [#13833](https://github.com/webdriverio/webdriverio/pull/13833) Build Unification - WDIO Mocha, Cucumber, Jasmine - Browserstack Test Observability, Accessibility & Percy ([@amaanbs](https://github.com/amaanbs))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#13864](https://github.com/webdriverio/webdriverio/pull/13864) Show complete error ([@07souravkunda](https://github.com/07souravkunda))

#### :memo: Documentation
* `eslint-plugin-wdio`
  * [#13866](https://github.com/webdriverio/webdriverio/pull/13866) docs(eslint-plugin-wdio): add example to use Eslint v9 ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#13865](https://github.com/webdriverio/webdriverio/pull/13865) docs: various documentation fixes ([@gavvvr](https://github.com/gavvvr))

#### Committers: 6
- Amaan Hakim ([@amaanbs](https://github.com/amaanbs))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Kirill Gavrilov ([@gavvvr](https://github.com/gavvvr))
- Sourav Kunda ([@07souravkunda](https://github.com/07souravkunda))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v9.2.10 (2024-11-05)

#### :bug: Bug Fix
* `wdio-cli`
  * [#13850](https://github.com/webdriverio/webdriverio/pull/13850) fix(@wdio/cli): improve detection when no capabilities are provided ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cli`
  * [#13854](https://github.com/webdriverio/webdriverio/pull/13854) fix(@wdio/cli): improve passing framework parameters ([@christian-bromann](https://github.com/christian-bromann))
  * [#13844](https://github.com/webdriverio/webdriverio/pull/13844) Fixing typo during wdio config wizard ([@diemol](https://github.com/diemol))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Diego Molina ([@diemol](https://github.com/diemol))


## v9.2.9 (2024-11-01)

#### :bug: Bug Fix
* `wdio-appium-service`
  * [#13843](https://github.com/webdriverio/webdriverio/pull/13843) fix(@wdio/appium-service): don't transform chromedriver_autodownload arg ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v9.2.8 (2024-11-01)

#### :bug: Bug Fix
* `webdriverio`
  * [#13837](https://github.com/webdriverio/webdriverio/pull/13837) fix(webdriverio): reset frame context if refresh command is called ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`
  * [#13796](https://github.com/webdriverio/webdriverio/pull/13796) feat(chromedriver): set NODE_OPTIONS empty to allow electron to work ([@Delta456](https://github.com/Delta456))

#### :nail_care: Polish
* `wdio-spec-reporter`
  * [#13842](https://github.com/webdriverio/webdriverio/pull/13842) chore(@wdio/spec-reporter): use base name of app path in prefix ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Swastik Baranwal ([@Delta456](https://github.com/Delta456))


## v9.2.5 (2024-10-29)

#### :bug: Bug Fix
* `webdriverio`
  * [#13827](https://github.com/webdriverio/webdriverio/pull/13827) fix(webdriverio): disable context manager for mobile ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#13825](https://github.com/webdriverio/webdriverio/pull/13825) Fix moduleLoaderFlag ([@jenskuhrjorgensen](https://github.com/jenskuhrjorgensen))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jens Kuhr Jørgensen ([@jenskuhrjorgensen](https://github.com/jenskuhrjorgensen))


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
