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
