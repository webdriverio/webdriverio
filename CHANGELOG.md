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

## v8.33.1 (2024-03-09)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#12454](https://github.com/webdriverio/webdriverio/pull/12454) Fix CBT for hooks and Skipped tests for hook failures ([@sriteja777](https://github.com/sriteja777))

#### :nail_care: Polish
* `wdio-utils`
  * [#12439](https://github.com/webdriverio/webdriverio/pull/12439) enable edge for devTools env detector ([@lacell75](https://github.com/lacell75))

#### Committers: 2
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))


## v8.33.0 (2024-03-07)

#### :rocket: New Feature
* `wdio-browserstack-service`
  * [#12392](https://github.com/webdriverio/webdriverio/pull/12392) [browserstack-service] Add Funnel Data instrumentation [v8] ([@sriteja777](https://github.com/sriteja777))

#### :nail_care: Polish
* `webdriver`
  * [#12393](https://github.com/webdriverio/webdriverio/pull/12393) (webdriver): fix custom request error message override ([@erwinheitzman](https://github.com/erwinheitzman))
  * [#12435](https://github.com/webdriverio/webdriverio/pull/12435) (webdriver): improve error stack for failing bidi commands ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`, `webdriver`, `webdriverio`
  * [#12432](https://github.com/webdriverio/webdriverio/pull/12432) (feat): enable chromium protocol for edge ([@lacell75](https://github.com/lacell75))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))


## v8.32.4 (2024-03-03)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#12368](https://github.com/webdriverio/webdriverio/pull/12368) Browserstack observability reload session fix [v8] ([@sriteja777](https://github.com/sriteja777))

#### :nail_care: Polish
* `wdio-cli`, `wdio-config`
  * [#12372](https://github.com/webdriverio/webdriverio/pull/12372) (wdio-config): expand and simplify the --multi-run feature ([@erwinheitzman](https://github.com/erwinheitzman))
* `webdriverio`
  * [#12383](https://github.com/webdriverio/webdriverio/pull/12383) [v8] Add ability to click and moveTo outside the given element ([@jemishgopani](https://github.com/jemishgopani))
* `wdio-allure-reporter`
  * [#12378](https://github.com/webdriverio/webdriverio/pull/12378) (wdio-allure-reporter): CompoundError: Also print error message if present [v8] ([@torbenkohlmeier](https://github.com/torbenkohlmeier))
* `wdio-devtools-service`
  * [#12345](https://github.com/webdriverio/webdriverio/pull/12345) [V8] Add feature to specify os version for the emulated device ([@jemishgopani](https://github.com/jemishgopani))

#### :memo: Documentation
* `wdio-types`
  * [#12399](https://github.com/webdriverio/webdriverio/pull/12399) Add resigningEnabled capability to @wdio/types (#12397) [v8] ([@AlexRivero](https://github.com/AlexRivero))
* Other
  * [#12332](https://github.com/webdriverio/webdriverio/pull/12332) New font rendering features ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 6
- Alex Rivero Ferràs ([@AlexRivero](https://github.com/AlexRivero))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Jemish Gopani ([@jemishgopani](https://github.com/jemishgopani))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@torbenkohlmeier](https://github.com/torbenkohlmeier)


## v8.32.3 (2024-02-21)

#### :bug: Bug Fix
* `wdio-utils`
  * [#12327](https://github.com/webdriverio/webdriverio/pull/12327) fix(@wdio/utils): only apply baseUrl to Chromium based browser ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#12307](https://github.com/webdriverio/webdriverio/pull/12307) [V8] Updated props to optional for getText and getLocation commands ([@jemishgopani](https://github.com/jemishgopani))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jemish Gopani ([@jemishgopani](https://github.com/jemishgopani))


## v8.32.2 (2024-02-19)

#### :bug: Bug Fix
* `wdio-allure-reporter`, `wdio-browser-runner`, `wdio-browserstack-service`, `wdio-cli`, `wdio-types`, `wdio-utils`
  * [#12306](https://github.com/webdriverio/webdriverio/pull/12306) Updating capabilities for Lamdatest & Browserstack ([@tamil777selvan](https://github.com/tamil777selvan))
* `wdio-utils`
  * [#12305](https://github.com/webdriverio/webdriverio/pull/12305) Workaround for chromedriver domain name change ([@paymand](https://github.com/paymand))

#### Committers: 2
- Payman Delshad ([@paymand](https://github.com/paymand))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.32.1 (2024-02-16)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#12249](https://github.com/webdriverio/webdriverio/pull/12249) (@wdio/wdio-browserstack-service) fix: add filename in app upload formData ([@innovater21](https://github.com/innovater21))

#### Committers: 1
- Abhishek Jha ([@innovater21](https://github.com/innovater21))


## v8.32.0 (2024-02-14)

#### :boom: Breaking Change
* `wdio-protocols`
  * [#12209](https://github.com/webdriverio/webdriverio/pull/12209) feat: remove appium commands ([@wswebcreation](https://github.com/wswebcreation))

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#12210](https://github.com/webdriverio/webdriverio/pull/12210) fix: WDIO Cucumber Test Tags ([@sauravdas1997](https://github.com/sauravdas1997))
  * [#12204](https://github.com/webdriverio/webdriverio/pull/12204) Added null check on fetching capabilities ([@sriteja777](https://github.com/sriteja777))

#### :nail_care: Polish
* `wdio-cli`
  * [#12247](https://github.com/webdriverio/webdriverio/pull/12247) (@wdio/cli): replace base url question with visual testing support question in configurator wizard ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* Other
  * [#12207](https://github.com/webdriverio/webdriverio/pull/12207) update Frameworks.md and remove 's' from cucumber option 'names' to '… ([@rajivnw](https://github.com/rajivnw))
  * [#12228](https://github.com/webdriverio/webdriverio/pull/12228) chore: update default baseline for visual tests ([@wswebcreation](https://github.com/wswebcreation))
* `webdriverio`
  * [#12226](https://github.com/webdriverio/webdriverio/pull/12226) [Docs] moveTo docs updated ([@M-Hammad-Faisal](https://github.com/M-Hammad-Faisal))

#### :house: Internal
* [#12232](https://github.com/webdriverio/webdriverio/pull/12232) (internal): replace expense workflow with custom action ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Muhammad Hammad Faisal ([@M-Hammad-Faisal](https://github.com/M-Hammad-Faisal))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@rajivnw](https://github.com/rajivnw)
- [@sauravdas1997](https://github.com/sauravdas1997)


## v8.31.1 (2024-02-09)

#### :bug: Bug Fix
* `webdriverio`
  * [#12200](https://github.com/webdriverio/webdriverio/pull/12200) (webdriverio): don't fail getContext is not supported, e.g. using Tizen TV driver ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browser-runner`
  * [#12198](https://github.com/webdriverio/webdriverio/pull/12198) (@wdio/browser-runner): fix scope propagation for not found elements ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#12199](https://github.com/webdriverio/webdriverio/pull/12199) (@wdio/cli): ensure ts-node is installed if tsconfig.json is found ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cli`, `wdio-config`, `wdio-types`
  * [#11992](https://github.com/webdriverio/webdriverio/pull/11992) feat(wdio-prefix): introduce `wdio:{maxInstances,specs,exclude}` to WebdriverIO.Capabilities ([@vobu](https://github.com/vobu))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Volker Buzek ([@vobu](https://github.com/vobu))


## v8.31.0 (2024-02-07)

#### :nail_care: Polish
* `wdio-browser-runner`, `wdio-cli`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-runner`, `wdio-types`
  * [#12189](https://github.com/webdriverio/webdriverio/pull/12189) (@wdio/cli): allow to define path for snapshot file ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#12186](https://github.com/webdriverio/webdriverio/pull/12186) File Downloads Best Practices ([@M-Hammad-Faisal](https://github.com/M-Hammad-Faisal))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Muhammad Hammad Faisal ([@M-Hammad-Faisal](https://github.com/M-Hammad-Faisal))


## v8.30.0 (2024-02-06)

#### :rocket: New Feature
* `devtools`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#12147](https://github.com/webdriverio/webdriverio/pull/12147) (webdriverio): allow to define new capabilities when calling `reloadSession ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-runner`, `wdio-types`
  * [#12184](https://github.com/webdriverio/webdriverio/pull/12184) (@wdio/browser-runner): allow services and other hooks to register custom matcher ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-types`, `webdriver`
  * [#12146](https://github.com/webdriverio/webdriverio/pull/12146) (webdriver): have a more reliable way to shut down attached session driver ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#12148](https://github.com/webdriverio/webdriverio/pull/12148) feat: add native app compare docs ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v8.29.7 (2024-02-02)

#### :rocket: New Feature
* `wdio-cli`, `wdio-spec-reporter`
  * [#12092](https://github.com/webdriverio/webdriverio/pull/12092) (@wdio/spec-reporter): introduce `color` option to disable colors for spec reporter ([@M-Hammad-Faisal](https://github.com/M-Hammad-Faisal))

#### :bug: Bug Fix
* `wdio-protocols`
  * [#12141](https://github.com/webdriverio/webdriverio/pull/12141) fix upload file in selenium 4 ([@lacell75](https://github.com/lacell75))

#### :nail_care: Polish
* `wdio-browser-runner`, `webdriverio`
  * [#12145](https://github.com/webdriverio/webdriverio/pull/12145) (@wdio/browser-runner): document stencil component testing integration better ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))
- Muhammad Hammad Faisal ([@M-Hammad-Faisal](https://github.com/M-Hammad-Faisal))


## v8.29.5 (2024-02-01)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-runner`
  * [#12140](https://github.com/webdriverio/webdriverio/pull/12140) (@wdio/browser-runner): improved stencil test integration ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.29.4 (2024-01-31)

#### :bug: Bug Fix
* `wdio-appium-service`
  * [#12137](https://github.com/webdriverio/webdriverio/pull/12137) Fix Bug#12134 adding a step to clean the buffer after first log. ([@lararojasmr](https://github.com/lararojasmr))

#### Committers: 1
- Manuel Lara ([@lararojasmr](https://github.com/lararojasmr))


## v8.29.3 (2024-01-30)

#### :rocket: New Feature
* `wdio-config`
  * [#12077](https://github.com/webdriverio/webdriverio/pull/12077) Feat: Add free text search to '--exclude' param ([@tech-dm-klymenko](https://github.com/tech-dm-klymenko))

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#12129](https://github.com/webdriverio/webdriverio/pull/12129) Fix problem with tests which had been finished before the parent suite finished  ([@epszaw](https://github.com/epszaw))
* `wdio-appium-service`
  * [#12095](https://github.com/webdriverio/webdriverio/pull/12095) Bug #12094 - Fix _appiumStart method ([@lararojasmr](https://github.com/lararojasmr))
* `wdio-spec-reporter`
  * [#12044](https://github.com/webdriverio/webdriverio/pull/12044) Issue 11996: Not skip duplicate steps ([@perillai](https://github.com/perillai))

#### :nail_care: Polish
* `devtools`
  * [#12127](https://github.com/webdriverio/webdriverio/pull/12127) update ua-parser-js for ReDoS ([@smarkows](https://github.com/smarkows))

#### :memo: Documentation
* `webdriverio`
  * [#12131](https://github.com/webdriverio/webdriverio/pull/12131) Missing ' in $ example ([@Meeeee3443](https://github.com/Meeeee3443))
  * [#12124](https://github.com/webdriverio/webdriverio/pull/12124) (docs): partnership with BrowserStack ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 7
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dmytro Klymenko ([@tech-dm-klymenko](https://github.com/tech-dm-klymenko))
- Konstantin Epishev ([@epszaw](https://github.com/epszaw))
- Manuel Lara ([@lararojasmr](https://github.com/lararojasmr))
- Perillai ([@perillai](https://github.com/perillai))
- Simon Markowski ([@smarkows](https://github.com/smarkows))
- [@Meeeee3443](https://github.com/Meeeee3443)


## v8.29.2 (2024-01-26)

#### 🐛  Bug Fix
* `wdio-allure-reporter`
  * [#12047](https://github.com/webdriverio/webdriverio/pull/12047) in case of onTestRetry first has status unknown in allure report  ([@maksym-alavatskyi](https://github.com/maksym-alavatskyi))

#### :nail_care: Polish
* `wdio-browser-runner`, `wdio-runner`
  * [#12093](https://github.com/webdriverio/webdriverio/pull/12093) (@wdio/browser-runner): improved stencil test integration ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-allure-reporter`
  * [#12098](https://github.com/webdriverio/webdriverio/pull/12098) Update allure report links ([@epszaw](https://github.com/epszaw))
* Other
  * [#12036](https://github.com/webdriverio/webdriverio/pull/12036) blog post for "Enhanced Test Automation" book  ([@larryg01](https://github.com/larryg01))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Konstantin Epishev ([@epszaw](https://github.com/epszaw))
- LarryG ([@larryg01](https://github.com/larryg01))
- maksym-alavatskyi ([@maksym-alavatskyi](https://github.com/maksym-alavatskyi))


## v8.29.1 (2024-01-25)

#### :bug: Bug Fix
* `wdio-cli`
  * [#12089](https://github.com/webdriverio/webdriverio/pull/12089) (@wdio/cli): use proper package manager when asking if to install ([@christian-bromann](https://github.com/christian-bromann))
  * [#12088](https://github.com/webdriverio/webdriverio/pull/12088) (@wdio/cli): use -s for updating snapshots as -u is used to provide a username ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#12076](https://github.com/webdriverio/webdriverio/pull/12076) Added default name for tms link to be displayed in allure reports ([@AndreiSakalouski](https://github.com/AndreiSakalouski))

#### :memo: Documentation
* `devtools`, `wdio-types`
  * [#12072](https://github.com/webdriverio/webdriverio/pull/12072) chore(devtools): ([@gromanas](https://github.com/gromanas))
* Other
  * [#12080](https://github.com/webdriverio/webdriverio/pull/12080) (docs): add governance policies around using donation funds ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Andrei Sakalouski ([@AndreiSakalouski](https://github.com/AndreiSakalouski))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- George Romanas ([@gromanas](https://github.com/gromanas))


## v8.29.0 (2024-01-22)

#### :rocket: New Feature
* `wdio-browser-runner`, `wdio-cli`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-runner`, `wdio-types`
  * [#12058](https://github.com/webdriverio/webdriverio/pull/12058) (@wdio/cli): add support for snapshot testing ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.28.8 (2024-01-20)

#### :bug: Bug Fix
* `wdio-jasmine-framework`, `wdio-utils`
  * [#11957](https://github.com/webdriverio/webdriverio/pull/11957) Closes [#11684](https://github.com/webdriverio/webdriverio/issues/11684): Improve AfterTest() for Jasmine ([@tech-dm-klymenko](https://github.com/tech-dm-klymenko))

#### :memo: Documentation
* Other
  * [#12052](https://github.com/webdriverio/webdriverio/pull/12052) Update AUTHORS.md ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-cli`
  * [#12046](https://github.com/webdriverio/webdriverio/pull/12046) Add QUnit service ([@mauriciolauffer](https://github.com/mauriciolauffer))

#### Committers: 3
- Dmytro Klymenko ([@tech-dm-klymenko](https://github.com/tech-dm-klymenko))
- Mauricio Lauffer ([@mauriciolauffer](https://github.com/mauriciolauffer))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v8.28.6 (2024-01-18)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-runner`, `wdio-types`
  * [#12041](https://github.com/webdriverio/webdriverio/pull/12041) (@wdio/browser-runner): improve performance by less pulling ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.28.4 (2024-01-17)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#12034](https://github.com/webdriverio/webdriverio/pull/12034) [browserstack-service] Fix integrations data ([@sriteja777](https://github.com/sriteja777))

#### :nail_care: Polish
* `webdriverio`
  * [#12040](https://github.com/webdriverio/webdriverio/pull/12040) fix: not add pause for iOS keys ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 2
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v8.28.0 (2024-01-17)

#### :rocket: New Feature
* `wdio-browser-runner`, `wdio-cli`, `wdio-local-runner`, `wdio-runner`, `wdio-types`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#12005](https://github.com/webdriverio/webdriverio/pull/12005) (@wdio/browser-runner): move assertions to Node.js environment ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#11865](https://github.com/webdriverio/webdriverio/pull/11865) Wdio Percy Support v8 ([@amaanbs](https://github.com/amaanbs))

#### :bug: Bug Fix
* `wdio-logger`
  * [#11959](https://github.com/webdriverio/webdriverio/pull/11959) Closes [#11937](https://github.com/webdriverio/webdriverio/issues/11937):  Always print error message to terminal when integration package is not found ([@tech-dm-klymenko](https://github.com/tech-dm-klymenko))

#### :nail_care: Polish
* `wdio-types`
  * [#12030](https://github.com/webdriverio/webdriverio/pull/12030) addresses #12029 ([@ciekawy](https://github.com/ciekawy))
* `wdio-utils`
  * [#12002](https://github.com/webdriverio/webdriverio/pull/12002) wdio-utils: Fitler invalidateCache from stacktraces ([@WillBrock](https://github.com/WillBrock))
* `wdio-browserstack-service`
  * [#11997](https://github.com/webdriverio/webdriverio/pull/11997) [browserstack-service] Add platform version integration data for skipped tests ([@sriteja777](https://github.com/sriteja777))

#### :memo: Documentation
* [#12003](https://github.com/webdriverio/webdriverio/pull/12003) (docs): update electron docs ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 6
- Amaan Hakim ([@amaanbs](https://github.com/amaanbs))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dmytro Klymenko ([@tech-dm-klymenko](https://github.com/tech-dm-klymenko))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))
- Szymon Stasik ([@ciekawy](https://github.com/ciekawy))
- Will Brock ([@WillBrock](https://github.com/WillBrock))


## v8.27.2 (2024-01-11)

#### :rocket: New Feature
* `wdio-sauce-service`
  * [#11981](https://github.com/webdriverio/webdriverio/pull/11981) feat: Implement reporting of test runs to Sauce Labs Insights ([@tianfeng92](https://github.com/tianfeng92))

#### :bug: Bug Fix
* `webdriverio`
  * [#11990](https://github.com/webdriverio/webdriverio/pull/11990) Webdriverio: Fix regression in 11711 ([@WillBrock](https://github.com/WillBrock))

#### :nail_care: Polish
* `wdio-spec-reporter`, `wdio-types`, `webdriverio`
  * [#11982](https://github.com/webdriverio/webdriverio/pull/11982) Sauce us east 4 ([@nullp2ike](https://github.com/nullp2ike))

#### :memo: Documentation
* `wdio-cli`
  * [#11906](https://github.com/webdriverio/webdriverio/pull/11906) (docs): add documentation on visual testing ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-browser-runner`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-runner`
  * [#11966](https://github.com/webdriverio/webdriverio/pull/11966) (docs): add docs on custom matcher ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#11963](https://github.com/webdriverio/webdriverio/pull/11963) Update README.md ([@diwakar-s-maurya](https://github.com/diwakar-s-maurya))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Diwakar ([@diwakar-s-maurya](https://github.com/diwakar-s-maurya))
- Tian Feng ([@tianfeng92](https://github.com/tianfeng92))
- Will Brock ([@WillBrock](https://github.com/WillBrock))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@nullp2ike](https://github.com/nullp2ike)


## v8.27.1 (2023-12-28)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#11935](https://github.com/webdriverio/webdriverio/pull/11935) Add platform_version to test Obs integration data ([@07souravkunda](https://github.com/07souravkunda))
* `wdio-cucumber-framework`
  * [#11914](https://github.com/webdriverio/webdriverio/pull/11914) Fix update of cucumber pickle data for before/after hooks ([@07souravkunda](https://github.com/07souravkunda))
  * [#11916](https://github.com/webdriverio/webdriverio/pull/11916) Fixing cucumber steps with timeout param ([@tamil777selvan](https://github.com/tamil777selvan))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#11903](https://github.com/webdriverio/webdriverio/pull/11903) refactor: Hide exception logs for logs upload in test observability ([@sauravdas1997](https://github.com/sauravdas1997))

#### Committers: 4
- Saad Tazi ([@saadtazi](https://github.com/saadtazi))
- Sourav Kunda ([@07souravkunda](https://github.com/07souravkunda))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))
- [@sauravdas1997](https://github.com/sauravdas1997)


## v8.27.0 (2023-12-20)

#### :rocket: New Feature
* `wdio-cli`, `wdio-config`, `wdio-local-runner`, `wdio-types`
  * [#11871](https://github.com/webdriverio/webdriverio/pull/11871) Fix for #10853 - Show test logs in terminal grouped by Worker Instance ([@tech-dm-klymenko](https://github.com/tech-dm-klymenko))

#### :bug: Bug Fix
* `wdio-config`
  * [#11771](https://github.com/webdriverio/webdriverio/pull/11771) Fix filtering test specs by part of their name using CLI --spec arg ([@tech-dm-klymenko](https://github.com/tech-dm-klymenko))

#### :nail_care: Polish
* `webdriver`
  * [#11910](https://github.com/webdriverio/webdriverio/pull/11910) fix(webdriver): respect strictSSL setting for bidi connections ([@jlipps](https://github.com/jlipps))

#### Committers: 2
- Jonathan Lipps ([@jlipps](https://github.com/jlipps))
- [@tech-dm-klymenko](https://github.com/tech-dm-klymenko)


## v8.26.3 (2023-12-19)

#### :bug: Bug Fix
* `wdio-utils`
  * [#11835](https://github.com/webdriverio/webdriverio/pull/11835) fix for issue #11834 - fixing skip test for jasmine on beforeTest hook ([@HananArgov](https://github.com/HananArgov))

#### :memo: Documentation
* `wdio-types`
  * [#11901](https://github.com/webdriverio/webdriverio/pull/11901) Missing alerts capability for BrowserStack ([@thv92](https://github.com/thv92))

#### :house: Internal
* [#11877](https://github.com/webdriverio/webdriverio/pull/11877) (webdriverio): pin Node to 18.18 ([@jan-molak](https://github.com/jan-molak))

#### Committers: 3
- DOA ([@HananArgov](https://github.com/HananArgov))
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Thien Vo ([@thv92](https://github.com/thv92))


## v8.26.2 (2023-12-15)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#11876](https://github.com/webdriverio/webdriverio/pull/11876) (@wdio/browser-runner): fix mocking of CJS modules ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`, `wdio-webdriver-mock-service`, `webdriverio`
  * [#11874](https://github.com/webdriverio/webdriverio/pull/11874) (webdriverio): support async iterators for WebdriverIO.ElementArray ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-types`
  * [#11854](https://github.com/webdriverio/webdriverio/pull/11854) Added missing UIAutomator2 Capabilities ([@Vaahin](https://github.com/Vaahin))
  * [#11853](https://github.com/webdriverio/webdriverio/pull/11853) Missing browserstack network capabilities ([@Vaahin](https://github.com/Vaahin))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Thiru-Mohan ([@Vaahin](https://github.com/Vaahin))



## v8.26.0 (2023-12-10)

#### :bug: Bug Fix
* `webdriverio`
  * [#11833](https://github.com/webdriverio/webdriverio/pull/11833) (webdriverio): fix issue when using keys to trigger an alert ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 1
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))

## v8.26.0 (2023-12-08)

#### :rocket: New Feature
* `webdriverio`
  * [#11772](https://github.com/webdriverio/webdriverio/pull/11772) (webdriverio): add isStable, waitForStable commands ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 1
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))


## v8.25.0 (2023-12-08)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-local-runner`
  * [#11831](https://github.com/webdriverio/webdriverio/pull/11831) (@wdio/cli, @wdio/local-runner): fix issue with node 18.19 and up ([@erwinheitzman](https://github.com/erwinheitzman))

#### :memo: Documentation
* [#11828](https://github.com/webdriverio/webdriverio/pull/11828) docs: update autowait limitations example ([@rwaskiewicz](https://github.com/rwaskiewicz))
* [#11821](https://github.com/webdriverio/webdriverio/pull/11821) (docs): update Getting Started ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 2
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Ryan Waskiewicz ([@rwaskiewicz](https://github.com/rwaskiewicz))


## v8.24.15 (2023-12-07)

#### :bug: Bug Fix
* `wdio-cli`
  * [#11826](https://github.com/webdriverio/webdriverio/pull/11826) (@wdio/cli): do not throw if dotenv is not installed ([@erwinheitzman](https://github.com/erwinheitzman))

#### :memo: Documentation
* [#11824](https://github.com/webdriverio/webdriverio/pull/11824) docs(stencil,preact): update project names in cmp testing ([@rwaskiewicz](https://github.com/rwaskiewicz))

#### Committers: 2
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Ryan Waskiewicz ([@rwaskiewicz](https://github.com/rwaskiewicz))


## v8.24.14 (2023-12-06)

#### :bug: Bug Fix
* `wdio-jasmine-framework`
  * [#11820](https://github.com/webdriverio/webdriverio/pull/11820) (@wdio/jasmine-framework): attach asymmetric matchers to expect object ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.24.13 (2023-12-05)

#### :nail_care: Polish
* `wdio-cli`
  * [#11815](https://github.com/webdriverio/webdriverio/pull/11815) fix(stencil): update suite name ([@rwaskiewicz](https://github.com/rwaskiewicz))

#### Committers: 1
- Ryan Waskiewicz ([@rwaskiewicz](https://github.com/rwaskiewicz))


## v8.24.7 (2023-12-05)

#### :bug: Bug Fix
* `wdio-cli`
  * [#11764](https://github.com/webdriverio/webdriverio/pull/11764) (@wdio/cli): implement constistent and simple package manager detection ([@erwinheitzman](https://github.com/erwinheitzman))

#### :nail_care: Polish
* `wdio-utils`
  * [#11718](https://github.com/webdriverio/webdriverio/pull/11718) removed unused library ([@mikhail-g](https://github.com/mikhail-g))

#### Committers: 2
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Mykhailo Hariachyi ([@mikhail-g](https://github.com/mikhail-g))


## v8.24.6 (2023-11-30)

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#11756](https://github.com/webdriverio/webdriverio/pull/11756) chore: Fix build and test timeouts ([@sauravdas1997](https://github.com/sauravdas1997))

#### Committers: 1
- [@sauravdas1997](https://github.com/sauravdas1997)


## v8.24.5 (2023-11-29)

#### :bug: Bug Fix
* `wdio-utils`
  * [#11760](https://github.com/webdriverio/webdriverio/pull/11760) (@wdio/utils): detect sessions that have an app capability set as mobile session ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.24.4 (2023-11-29)

#### :bug: Bug Fix
* `webdriverio`
  * [#11755](https://github.com/webdriverio/webdriverio/pull/11755) (@webdriverio): add check of element size if subtree is hidden to isElementDisplayed ([@HannaTarasevich](https://github.com/HannaTarasevich))

#### :nail_care: Polish
* `wdio-appium-service`
  * [#11757](https://github.com/webdriverio/webdriverio/pull/11757) (@wdio/appium-service): make Appium start on a random port ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Hanna Tarasevich ([@HannaTarasevich](https://github.com/HannaTarasevich))


## v8.24.3 (2023-11-27)

#### :bug: Bug Fix
* `wdio-utils`
  * [#11752](https://github.com/webdriverio/webdriverio/pull/11752) (@wdio/utils): don't throw if returning null ([@HannaTarasevich](https://github.com/HannaTarasevich))

#### Committers: 1
- Hanna Tarasevich ([@HannaTarasevich](https://github.com/HannaTarasevich))


## v8.24.2 (2023-11-27)

#### :bug: Bug Fix
* `wdio-utils`
  * [#11727](https://github.com/webdriverio/webdriverio/pull/11727) (@wdio/utils): don't throw if returning a chai assertion ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-types`, `webdriver`
  * [#11726](https://github.com/webdriverio/webdriverio/pull/11726) (webdriver): no request retries for action commands ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.24.1 (2023-11-23)

#### :bug: Bug Fix
* `webdriverio`
  * [#11717](https://github.com/webdriverio/webdriverio/pull/11717) fix: avoid script `Array.from()` for older browsers ([@colinrotherham](https://github.com/colinrotherham))

#### Committers: 1
- Colin Rotherham ([@colinrotherham](https://github.com/colinrotherham))


## v8.24.0 (2023-11-23)

#### :rocket: New Feature
* `wdio-browser-runner`, `wdio-cli`, `wdio-config`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-reporter`, `wdio-runner`, `wdio-smoke-test-cjs-service`, `wdio-smoke-test-reporter`, `wdio-smoke-test-service`, `wdio-types`
  * [#11714](https://github.com/webdriverio/webdriverio/pull/11714) (@wdio/runner): support assertion hooks ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.23.5 (2023-11-22)

#### :bug: Bug Fix
* `webdriverio`
  * [#11712](https://github.com/webdriverio/webdriverio/pull/11712) fix: avoid script syntax to support IE11 again (#11711) ([@colinrotherham](https://github.com/colinrotherham))

#### Committers: 1
- Colin Rotherham ([@colinrotherham](https://github.com/colinrotherham))


## v8.23.4 (2023-11-21)

#### :bug: Bug Fix
* `webdriverio`
  * [#11707](https://github.com/webdriverio/webdriverio/pull/11707) (webdriverio): continue to use isElementDisplayed for mobile native tests ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.23.3 (2023-11-20)

#### :bug: Bug Fix
* `webdriverio`
  * [#11706](https://github.com/webdriverio/webdriverio/pull/11706) fix: guard check for ShadowRoot using `'ShadowRoot' in window` (#11705) ([@colinrotherham](https://github.com/colinrotherham))

#### Committers: 1
- Colin Rotherham ([@colinrotherham](https://github.com/colinrotherham))


## v8.23.2 (2023-11-20)

#### :bug: Bug Fix
* `wdio-webdriver-mock-service`, `webdriverio`
  * [#11681](https://github.com/webdriverio/webdriverio/pull/11681) (webdriverio): fix isDisplayed for Firefox, updated examples in docs ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-browserstack-service`
  * [#11680](https://github.com/webdriverio/webdriverio/pull/11680) Screenshot data format BrowserStack 🐛  ([@07souravkunda](https://github.com/07souravkunda))

#### :nail_care: Polish
* `webdriverio`
  * [#11679](https://github.com/webdriverio/webdriverio/pull/11679) deleted BidiHandler and browser commands  from Element type ([@udarrr](https://github.com/udarrr))

#### Committers: 3
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Siarhei Kliushnikau ([@udarrr](https://github.com/udarrr))
- Sourav Kunda ([@07souravkunda](https://github.com/07souravkunda))


## v8.23.1 (2023-11-17)

#### :bug: Bug Fix
* `wdio-cucumber-framework`, `wdio-utils`
  * [#11677](https://github.com/webdriverio/webdriverio/pull/11677) Wrap cucumber steps with timeouts. ([@tamil777selvan](https://github.com/tamil777selvan))
* `webdriver`
  * [#11676](https://github.com/webdriverio/webdriverio/pull/11676) (webdriver): set lower retry timeout ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#11674](https://github.com/webdriverio/webdriverio/pull/11674) Update Sharding Docs ([@WilliamFClarke](https://github.com/WilliamFClarke))

#### :house: Internal
* `wdio-browser-runner`, `wdio-cli`, `wdio-config`, `wdio-jasmine-framework`, `wdio-local-runner`, `wdio-mocha-framework`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-types`, `wdio-utils`, `webdriverio`
  * [#11672](https://github.com/webdriverio/webdriverio/pull/11672) (internal): fix usage of `intialise` wording in variables, comments and elsewhere ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))
- William Clarke ([@WilliamFClarke](https://github.com/WilliamFClarke))


## v8.23.0 (2023-11-14)

#### :eyeglasses: Spec Compliancy
* `wdio-cli`, `wdio-protocols`, `webdriver`, `webdriverio`
  * [#11633](https://github.com/webdriverio/webdriverio/pull/11633) (@wdio/protocols): update WebDriver Bidi primitives ([@christian-bromann](https://github.com/christian-bromann))

#### :rocket: New Feature
* `wdio-browser-runner`, `wdio-globals`, `wdio-jasmine-framework`, `wdio-runner`
  * [#11631](https://github.com/webdriverio/webdriverio/pull/11631) (@wdio/globals): support asymmetric matchers ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#11592](https://github.com/webdriverio/webdriverio/pull/11592) (webdriverio): support emulating Web APIs for `geolocation`, `colorScheme`, `userAgent` and `onLine` ([@christian-bromann](https://github.com/christian-bromann))
  * [#11570](https://github.com/webdriverio/webdriverio/pull/11570) Adding ability to get pseudo-elements css value via getCSSProperty #7709 ([@Pawel1894](https://github.com/Pawel1894))
* `wdio-protocols`, `webdriverio`
  * [#11548](https://github.com/webdriverio/webdriverio/pull/11548) (webdriverio): add throttleCPU and throttleNetwork commands ([@erwinheitzman](https://github.com/erwinheitzman))

#### :bug: Bug Fix
* `wdio-types`, `wdio-webdriver-mock-service`, `webdriver`
  * [#11667](https://github.com/webdriverio/webdriverio/pull/11667) (webdriver): retry on post requests ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#11644](https://github.com/webdriverio/webdriverio/pull/11644) added workaround scrollIntoView to center  to moveTo and click with a… ([@udarrr](https://github.com/udarrr))
  * [#11636](https://github.com/webdriverio/webdriverio/pull/11636) (webdriverio): remove type support for browser commands on element in… ([@christian-bromann](https://github.com/christian-bromann))
  * [#11586](https://github.com/webdriverio/webdriverio/pull/11586) (webdriverio): fix aria selector strategy ([@erwinheitzman](https://github.com/erwinheitzman))
  * [#11446](https://github.com/webdriverio/webdriverio/pull/11446) Make custom$ return Element object when an element is not found ([@nextlevelbeard](https://github.com/nextlevelbeard))
* `wdio-devtools-service`
  * [#11668](https://github.com/webdriverio/webdriverio/pull/11668) re-register devtools when switching windows ([@ccharnkij](https://github.com/ccharnkij))
* `wdio-browserstack-service`, `wdio-protocols`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#11639](https://github.com/webdriverio/webdriverio/pull/11639) (webdriver): improve WebDriver Bidi integration ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#11638](https://github.com/webdriverio/webdriverio/pull/11638) (allure-reporter): Align default exports with functions export ([@BorisOsipov](https://github.com/BorisOsipov))
* `wdio-jasmine-framework`
  * [#11635](https://github.com/webdriverio/webdriverio/pull/11635) (@wdio/jasmine-framework): typing support for Jasmine matchers ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cucumber-framework`
  * [#11628](https://github.com/webdriverio/webdriverio/pull/11628) Adding back cucumber before & after Hooks support ([@tamil777selvan](https://github.com/tamil777selvan))

#### :memo: Documentation
* `webdriverio`
  * [#11671](https://github.com/webdriverio/webdriverio/pull/11671) (webdriverio): expose WebdriverIO.ElementArray properly ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 8
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Paweł Pohl ([@Pawel1894](https://github.com/Pawel1894))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))
- Siarhei Kliushnikau ([@udarrr](https://github.com/udarrr))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.22.0 (2023-11-08)

#### :eyeglasses: Spec Compliancy
* `wdio-protocols`, `webdriver`
  * [#11584](https://github.com/webdriverio/webdriverio/pull/11584) (@wdio/protocols): deprecate JSONWireProtocol commands ([@christian-bromann](https://github.com/christian-bromann))

#### :rocket: New Feature
* `wdio-cli`, `wdio-json-reporter`
  * [#11623](https://github.com/webdriverio/webdriverio/pull/11623) (@wdio/json-reporter): add JSON reporter based of `wdio-json-reporter` ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#11580](https://github.com/webdriverio/webdriverio/pull/11580) WDIOService logs to file and upload to server ([@kamal-kaur04](https://github.com/kamal-kaur04))

#### :bug: Bug Fix
* `wdio-utils`
  * [#11625](https://github.com/webdriverio/webdriverio/pull/11625) fix jasmine afterTest hook ([@tamil777selvan](https://github.com/tamil777selvan))
* `wdio-cli`
  * [#11464](https://github.com/webdriverio/webdriverio/pull/11464) Fixes issue 9578  ([@KierenLWoods](https://github.com/KierenLWoods))
* `webdriverio`
  * [#11590](https://github.com/webdriverio/webdriverio/pull/11590) (webdriverio): remove type exports ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-runner`, `webdriverio`
  * [#11589](https://github.com/webdriverio/webdriverio/pull/11589) (webdriverio): keep testrunner options ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `webdriverio`
  * [#11591](https://github.com/webdriverio/webdriverio/pull/11591) (docs): add tested example snippet to custom selector strategy docs ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* `wdio-protocols`
  * [#11611](https://github.com/webdriverio/webdriverio/pull/11611) JSONWP deprecated methods ([@udarrr](https://github.com/udarrr))
* Other
  * [#11587](https://github.com/webdriverio/webdriverio/pull/11587) (scripts): migrate AWS SDK for JavaScript v2 APIs to v3 ([@trivikr](https://github.com/trivikr))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kamalpreet Kaur ([@kamal-kaur04](https://github.com/kamal-kaur04))
- Kieren Woods ([@KierenLWoods](https://github.com/KierenLWoods))
- Siarhei Kliushnikau ([@udarrr](https://github.com/udarrr))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))
- Trivikram Kamat ([@trivikr](https://github.com/trivikr))


## v8.21.0 (2023-11-02)

#### :boom: Breaking Change
* `webdriverio`
  * [#11529](https://github.com/webdriverio/webdriverio/pull/11529) changed moveTo to like it's been implemented in click ([@udarrr](https://github.com/udarrr))

#### :bug: Bug Fix
* `webdriverio`
  * [#11537](https://github.com/webdriverio/webdriverio/pull/11537) Fix name selector to allow other characters ([@aristotelos](https://github.com/aristotelos))
  * [#11496](https://github.com/webdriverio/webdriverio/pull/11496) (webdriverio): fix - scrollIntoView calls scroll action with a wrong … ([@qaflorent](https://github.com/qaflorent))
* `wdio-cli`
  * [#11541](https://github.com/webdriverio/webdriverio/pull/11541) (@wdio/cli): fix reporter output ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-allure-reporter`
  * [#11532](https://github.com/webdriverio/webdriverio/pull/11532) add testCaseId for allure testOps ([@AlexKorTutu](https://github.com/AlexKorTutu))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#11488](https://github.com/webdriverio/webdriverio/pull/11488) [browserstack-service] Add more CIs ([@samarsault](https://github.com/samarsault))
* `wdio-types`, `wdio-utils`
  * [#11509](https://github.com/webdriverio/webdriverio/pull/11509) (@wdio/utils): Add envDetector for browserstack ([@Pi-fe](https://github.com/Pi-fe))

#### :memo: Documentation
* [#11547](https://github.com/webdriverio/webdriverio/pull/11547) (docs): added tip to use translation files when using a11y selectors ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 7
- Alexander Korneev ([@AlexKorTutu](https://github.com/AlexKorTutu))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Pietro F. ([@Pi-fe](https://github.com/Pi-fe))
- Samarjeet ([@samarsault](https://github.com/samarsault))
- Siarhei Kliushnikau ([@udarrr](https://github.com/udarrr))
- [@aristotelos](https://github.com/aristotelos)
- [@qaflorent](https://github.com/qaflorent)


## v8.20.5 (2023-10-25)

#### :bug: Bug Fix
* [#11524](https://github.com/webdriverio/webdriverio/pull/11524) (@wdio/globals): fix type reference annotation ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.20.4 (2023-10-25)

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#11487](https://github.com/webdriverio/webdriverio/pull/11487) [v8] Support: Setting session status and name when using BrowserStack Automate TurboScale ([@nagpalkaran95](https://github.com/nagpalkaran95))
* `wdio-cli`, `wdio-protocols`
  * [#11523](https://github.com/webdriverio/webdriverio/pull/11523) (@wdio/cli): improve bootstrap ElectronJS project ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Karan Nagpal ([@nagpalkaran95](https://github.com/nagpalkaran95))


## v8.20.3 (2023-10-24)

#### :bug: Bug Fix
* `wdio-utils`
  * [#11492](https://github.com/webdriverio/webdriverio/pull/11492) (@wdio/utils): support chromium as browserName ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.20.0 (2023-10-20)

#### :bug: Bug Fix
* `wdio-cli`
  * [#11476](https://github.com/webdriverio/webdriverio/pull/11476) (@wdio/cli) replace `yarn-install` with a custom install that supports pnpm as well ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#11470](https://github.com/webdriverio/webdriverio/pull/11470) fix(types): Element and WebdriverIO.Element definitions do not match ([@Badisi](https://github.com/Badisi))

#### :house: Internal
* `devtools`, `eslint-plugin-wdio`, `wdio-allure-reporter`, `wdio-browser-runner`, `wdio-cli`, `wdio-config`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-globals`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-shared-store-service`, `wdio-smoke-test-cjs-service`, `wdio-types`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#11469](https://github.com/webdriverio/webdriverio/pull/11469) (@wdio/utils): separate between common and node utils ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@Badisi](https://github.com/Badisi)


## v8.19.0 (2023-10-17)

#### :rocket: New Feature
* `wdio-cli`, `wdio-config`, `wdio-types`, `wdio-utils`, `webdriverio`
  * [#11441](https://github.com/webdriverio/webdriverio/pull/11441) (@wdio/cli): Support for sharding ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `webdriverio`
  * [#11444](https://github.com/webdriverio/webdriverio/pull/11444) removing Element as not needed Closes [#11350](https://github.com/webdriverio/webdriverio/issues/11350) ([@bhanuagarwal73](https://github.com/bhanuagarwal73))
* `wdio-browser-runner`
  * [#11366](https://github.com/webdriverio/webdriverio/pull/11366) Properly resolve Mocha when using browser-runner ([@FrederikBolding](https://github.com/FrederikBolding))

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#11423](https://github.com/webdriverio/webdriverio/pull/11423) Remove deprecated flag due to lack of functionality in the current allure.step() API. ([@BorisOsipov](https://github.com/BorisOsipov))

#### :memo: Documentation
* [#11424](https://github.com/webdriverio/webdriverio/pull/11424) (docs): add tests on how to parameterize tests ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 5
- Bhanu Agarwal ([@bhanuagarwal73](https://github.com/bhanuagarwal73))
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Frederik Bolding ([@FrederikBolding](https://github.com/FrederikBolding))
- Paweł Pohl ([@Pawel1894](https://github.com/Pawel1894))


## v8.18.2 (2023-10-13)

#### :bug: Bug Fix
* `wdio-appium-service`, `wdio-config`, `wdio-utils`
  * [#11415](https://github.com/webdriverio/webdriverio/pull/11415) Skip startWebDriver for Appium Capabilities ([@tamil777selvan](https://github.com/tamil777selvan))
* `wdio-cli`
  * [#11416](https://github.com/webdriverio/webdriverio/pull/11416) (@wdio/cli): ensure that communoty packages get correctly typed ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.18.1 (2023-10-13)

#### :bug: Bug Fix
* `wdio-spec-reporter`
  * [#11413](https://github.com/webdriverio/webdriverio/pull/11413) (@wdio/spec-reporter): don't throw if multiremote instance name matches a capability like 'app' ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.18.0 (2023-10-12)

#### :rocket: New Feature
* `wdio-cli`
  * [#11368](https://github.com/webdriverio/webdriverio/pull/11368) WebdriverIO project generator for Serenity/JS ([@jan-molak](https://github.com/jan-molak))

#### :nail_care: Polish
* `wdio-cli`
  * [#11406](https://github.com/webdriverio/webdriverio/pull/11406) (@wdio/cli): Simplified Electron setup ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`
  * [#11403](https://github.com/webdriverio/webdriverio/pull/11403) (@wdio/utils): better transform function command arguments ([@christian-bromann](https://github.com/christian-bromann))
  * [#11397](https://github.com/webdriverio/webdriverio/pull/11397) changed order for preventing some errors ([@udarrr](https://github.com/udarrr))

#### :memo: Documentation
* `wdio-protocols`
  * [#11407](https://github.com/webdriverio/webdriverio/pull/11407) Updating appium protocols ([@tamil777selvan](https://github.com/tamil777selvan))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Siarhei Kliushnikau ([@udarrr](https://github.com/udarrr))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.17.0 (2023-10-09)

#### :rocket: New Feature
* `devtools`, `wdio-browserstack-service`, `wdio-cli`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-firefox-profile-service`, `wdio-runner`, `wdio-sauce-service`, `wdio-shared-store-service`, `wdio-spec-reporter`, `wdio-types`, `wdio-utils`, `webdriverio`
  * [#11367](https://github.com/webdriverio/webdriverio/pull/11367) (@wdio/types): allow to extend capability interface ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#11358](https://github.com/webdriverio/webdriverio/pull/11358) (webdriverio): Add case insensitive text match feature #4951 ([@AnthonyQuy](https://github.com/AnthonyQuy))

#### :nail_care: Polish
* `wdio-cli`
  * [#11362](https://github.com/webdriverio/webdriverio/pull/11362) CLI update for wdio-electron-service v5 ([@goosewobbler](https://github.com/goosewobbler))

#### Committers: 3
- Anthony  ([@AnthonyQuy](https://github.com/AnthonyQuy))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@goosewobbler](https://github.com/goosewobbler)


## v8.16.22 (2023-10-06)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#11356](https://github.com/webdriverio/webdriverio/pull/11356) Export dataTabels, world & status from cucumber ([@tamil777selvan](https://github.com/tamil777selvan))

#### :memo: Documentation
* [#11357](https://github.com/webdriverio/webdriverio/pull/11357) Fix typo in Browser Object Docs ([@klamping](https://github.com/klamping))

#### Committers: 2
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.21 (2023-10-04)

#### :rocket: New Feature
* `wdio-browserstack-service`, `wdio-cli`, `wdio-jasmine-framework`, `wdio-sauce-service`, `wdio-types`, `wdio-utils`
  * [#11148](https://github.com/webdriverio/webdriverio/pull/11148) Issue #11132 - adding hookName to beforeHook and afterHook ([@HananArgov](https://github.com/HananArgov))

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#11352](https://github.com/webdriverio/webdriverio/pull/11352) #11351 Allure step() not working in failures. ([@BorisOsipov](https://github.com/BorisOsipov))

#### Committers: 2
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- DOA ([@HananArgov](https://github.com/HananArgov))


## v8.16.20 (2023-10-04)

#### :bug: Bug Fix
* `wdio-appium-service`, `wdio-config`
  * [#11349](https://github.com/webdriverio/webdriverio/pull/11349) fix appium multiremote session connect ([@tamil777selvan](https://github.com/tamil777selvan))

#### Committers: 1
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.19 (2023-10-03)

#### :rocket: New Feature
* `wdio-devtools-service`
  * [#11059](https://github.com/webdriverio/webdriverio/pull/11059) devtools commands for multiremote ([@ccharnkij](https://github.com/ccharnkij))

#### :bug: Bug Fix
* `wdio-shared-store-service`
  * [#11341](https://github.com/webdriverio/webdriverio/pull/11341) (@wdio/shared-store-service): support multiremote ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#11269](https://github.com/webdriverio/webdriverio/pull/11269) [v8] [browserstack-service] Fix E2Bug exception on linux ([@sriteja777](https://github.com/sriteja777))
* `wdio-cli`
  * [#11344](https://github.com/webdriverio/webdriverio/pull/11344) Add coerce to framework cli args ([@tamil777selvan](https://github.com/tamil777selvan))

#### :nail_care: Polish
* `wdio-cli`
  * [#11342](https://github.com/webdriverio/webdriverio/pull/11342) (@wdio/cli): add @testing-library/webdriverio to plugin section in CLI wizard ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* Other
  * [#11340](https://github.com/webdriverio/webdriverio/pull/11340) (docs): better document bail option on WDIO config level ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#11345](https://github.com/webdriverio/webdriverio/pull/11345) Update $.ts ([@Thenlie](https://github.com/Thenlie))

#### Committers: 5
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Leithen ([@Thenlie](https://github.com/Thenlie))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.18 (2023-10-01)

#### :bug: Bug Fix
* `webdriverio`
  * [#11276](https://github.com/webdriverio/webdriverio/pull/11276) (webdriverio): fix - handle out of bounds error when retrieving element rect during scrollIntoView ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-local-runner`
  * [#11273](https://github.com/webdriverio/webdriverio/pull/11273) (@wdio/local-runner): fix ts-node related issue when using Node 20 ([@erwinheitzman](https://github.com/erwinheitzman))

#### :memo: Documentation
* [#11275](https://github.com/webdriverio/webdriverio/pull/11275) (docs): update Babel documentation with info for monorepos ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 1
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))


## v8.16.17 (2023-09-29)

#### :bug: Bug Fix
* `wdio-config`
  * [#11271](https://github.com/webdriverio/webdriverio/pull/11271) Fixes issue 10140 ([@KierenLWoods](https://github.com/KierenLWoods))

#### :nail_care: Polish
* `wdio-logger`, `wdio-utils`
  * [#11255](https://github.com/webdriverio/webdriverio/pull/11255) Updating driver download logs ([@tamil777selvan](https://github.com/tamil777selvan))

#### Committers: 2
- Kieren Woods ([@KierenLWoods](https://github.com/KierenLWoods))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.16 (2023-09-29)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#11260](https://github.com/webdriverio/webdriverio/pull/11260) fix: Respect user-provided Cucumber formatter options ([@nextlevelbeard](https://github.com/nextlevelbeard))
* `wdio-browserstack-service`
  * [#11257](https://github.com/webdriverio/webdriverio/pull/11257) Fix git exception when no remote ([@sriteja777](https://github.com/sriteja777))

#### :nail_care: Polish
* `webdriverio`
  * [#10974](https://github.com/webdriverio/webdriverio/pull/10974) fix: Deal with new W3C spec Error response ([@nextlevelbeard](https://github.com/nextlevelbeard))
* `wdio-shared-store-service`
  * [#11254](https://github.com/webdriverio/webdriverio/pull/11254) Throw err if getter's is used before server init ([@tamil777selvan](https://github.com/tamil777selvan))

#### :memo: Documentation
* `webdriverio`
  * [#11258](https://github.com/webdriverio/webdriverio/pull/11258) Update $.ts ([@josiasvfigueredo1985](https://github.com/josiasvfigueredo1985))
* `typescript`
  * [#11263](https://github.com/webdriverio/webdriverio/pull/11263) update TypeScript documentation for missing types ([@erwinheitzman](https://github.com/erwinheitzman))

#### :house: Internal
* [#11259](https://github.com/webdriverio/webdriverio/pull/11259) (website): convert website to ts ([@AnthonyQuy](https://github.com/AnthonyQuy))

#### Committers: 6
- Anthony  ([@AnthonyQuy](https://github.com/AnthonyQuy))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- JOSIAS VALENTIM DE FIGUEREDO ([@josiasvfigueredo1985](https://github.com/josiasvfigueredo1985))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.15 (2023-09-26)

#### :bug: Bug Fix
* `wdio-utils`
  * [#11248](https://github.com/webdriverio/webdriverio/pull/11248) (@wdio/utils): respect browserVersion when setting up Chrome or Firefox ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.16.14 (2023-09-26)

#### :bug: Bug Fix
* `wdio-utils`
  * [#11247](https://github.com/webdriverio/webdriverio/pull/11247) (@wdio/utils): improve Chrome version detection ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#11245](https://github.com/webdriverio/webdriverio/pull/11245) Screenshot is not attached to Allure report  ([@BorisOsipov](https://github.com/BorisOsipov))

#### Committers: 2
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.16.13 (2023-09-25)

#### :bug: Bug Fix
* `wdio-browserstack-service`
  * [#11146](https://github.com/webdriverio/webdriverio/pull/11146) fix: Stop BrowserStack service from console patching constructors ([@nextlevelbeard](https://github.com/nextlevelbeard))
  * [#11224](https://github.com/webdriverio/webdriverio/pull/11224) fix: script timeouts when passing include/exclude keys in options ([@kamal-kaur04](https://github.com/kamal-kaur04))

#### Committers: 2
- Kamalpreet Kaur ([@kamal-kaur04](https://github.com/kamal-kaur04))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))


## v8.16.12 (2023-09-22)

#### :bug: Bug Fix
* `webdriverio`
  * [#11206](https://github.com/webdriverio/webdriverio/pull/11206) (webdriverio): fix findStrategy for querying elements by classname and partial text ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-cucumber-framework`
  * [#11211](https://github.com/webdriverio/webdriverio/pull/11211) filter spec by loadSources cucumber interface ([@tamil777selvan](https://github.com/tamil777selvan))
* `wdio-cli`
  * [#11202](https://github.com/webdriverio/webdriverio/pull/11202) Support for running WebdriverIO TypeScript tests on Node 20. Closes [#10901](https://github.com/webdriverio/webdriverio/issues/10901) ([@jan-molak](https://github.com/jan-molak))

#### :nail_care: Polish
* `wdio-utils`
  * [#11207](https://github.com/webdriverio/webdriverio/pull/11207) (@wdio/utils): apply fix to the gecko and edge drivers ([@erwinheitzman](https://github.com/erwinheitzman))

#### :memo: Documentation
* `wdio-types`
  * [#11214](https://github.com/webdriverio/webdriverio/pull/11214) Add property logLevel in moon:options ([@sushantsoni5392](https://github.com/sushantsoni5392))
* Other
  * [#11203](https://github.com/webdriverio/webdriverio/pull/11203) (test): add docs on using `@vue/test-utils` ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Sushant Soni ([@sushantsoni5392](https://github.com/sushantsoni5392))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.11 (2023-09-18)

#### :bug: Bug Fix
* `wdio-utils`
  * [#11201](https://github.com/webdriverio/webdriverio/pull/11201) (@wdio/utils): better error message if function can't be found ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-config`
  * [#11177](https://github.com/webdriverio/webdriverio/pull/11177) (@wdio/config): don't run spec twice if absolute path is given ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-appium-service`
  * [#11179](https://github.com/webdriverio/webdriverio/pull/11179) (@wdio/appium-service): Delete error log on success executions ([@MadSandwich](https://github.com/MadSandwich))

#### Committers: 2
- Artsem Burlai ([@MadSandwich](https://github.com/MadSandwich))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.16.10 (2023-09-15)

#### :bug: Bug Fix
* `wdio-utils`
  * [#11175](https://github.com/webdriverio/webdriverio/pull/11175) (@wdio/utils): propagate driver logs to stdout ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-appium-service`
  * [#11176](https://github.com/webdriverio/webdriverio/pull/11176) (@wdio/appium-service): propagate error message on boot time ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.16.9 (2023-09-15)

#### :bug: Bug Fix
* `wdio-utils`
  * [#11172](https://github.com/webdriverio/webdriverio/pull/11172) handle timeout exceptions ([@tamil777selvan](https://github.com/tamil777selvan))
* `wdio-spec-reporter`
  * [#11168](https://github.com/webdriverio/webdriverio/pull/11168) enhance spec report by grouping retried test cases ([@tamil777selvan](https://github.com/tamil777selvan))

#### Committers: 1
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.8 (2023-09-14)

#### :memo: Documentation
* [#11167](https://github.com/webdriverio/webdriverio/pull/11167) Fix incorrect browser auto-setup doc ([@marcogrcr](https://github.com/marcogrcr))

#### Committers: 1
- Marco Gonzalez ([@marcogrcr](https://github.com/marcogrcr))


## v8.16.7 (2023-09-13)

#### :rocket: New Feature
* `wdio-browserstack-service`, `wdio-types`
  * [#11064](https://github.com/webdriverio/webdriverio/pull/11064) Browserstack Accessibility support with WebdriverIO 🚀  ([@kamal-kaur04](https://github.com/kamal-kaur04))

#### :bug: Bug Fix
* `wdio-cli`
  * [#11022](https://github.com/webdriverio/webdriverio/pull/11022) (@wdio/globals): fix type propagation ([@christian-bromann](https://github.com/christian-bromann))
  * [#11160](https://github.com/webdriverio/webdriverio/pull/11160) (@wdio/cli): fix gmail-service reference during project initialization ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-utils`
  * [#11158](https://github.com/webdriverio/webdriverio/pull/11158) mocha: skip test in custom hooks ([@tamil777selvan](https://github.com/tamil777selvan))
  * [#11153](https://github.com/webdriverio/webdriverio/pull/11153) (@wdio/utils): use --no-sandbox flag when detecting Chrome version ([@christian-bromann](https://github.com/christian-bromann))
  * [#11130](https://github.com/webdriverio/webdriverio/pull/11130) (@wdio/utils): don't setup a driver nor browser if using devtools protocol ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cucumber-framework`
  * [#11131](https://github.com/webdriverio/webdriverio/pull/11131) fix cucumber junit report ([@tamil777selvan](https://github.com/tamil777selvan))

#### :memo: Documentation
* `wdio-types`, `wdio-utils`, `webdriver`
  * [#11128](https://github.com/webdriverio/webdriverio/pull/11128) Improve automated webdriver setup documentation ([@marcogrcr](https://github.com/marcogrcr))
* Other
  * [#10642](https://github.com/webdriverio/webdriverio/pull/10642) New Crowdin updates ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* `wdio-sauce-service`
  * [#11155](https://github.com/webdriverio/webdriverio/pull/11155) (@wdio/sauce-service): bump saucelabs package ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Kamalpreet Kaur ([@kamal-kaur04](https://github.com/kamal-kaur04))
- Marco Gonzalez ([@marcogrcr](https://github.com/marcogrcr))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.6 (2023-09-09)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#11118](https://github.com/webdriverio/webdriverio/pull/11118) fix cucumber report issue - windows ([@tamil777selvan](https://github.com/tamil777selvan))
* `webdriverio`
  * [#11120](https://github.com/webdriverio/webdriverio/pull/11120) fix scrollIntoView ([@erwinheitzman](https://github.com/erwinheitzman))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#11098](https://github.com/webdriverio/webdriverio/pull/11098) [v8] Console logs and cucumber hooks support  ([@sriteja777](https://github.com/sriteja777))
* `wdio-cucumber-framework`
  * [#11116](https://github.com/webdriverio/webdriverio/pull/11116) Update Cucumber Dependency Version ([@tamil777selvan](https://github.com/tamil777selvan))

#### :memo: Documentation
* Other
  * [#11126](https://github.com/webdriverio/webdriverio/pull/11126) fix:docs capabilities ([@SivasubramanianV](https://github.com/SivasubramanianV))
* `webdriverio`
  * [#11122](https://github.com/webdriverio/webdriverio/pull/11122) (docs): more bidi examples ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Codemac ([@SivasubramanianV](https://github.com/SivasubramanianV))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Sriteja Sugoor ([@sriteja777](https://github.com/sriteja777))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.5 (2023-09-07)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#11111](https://github.com/webdriverio/webdriverio/pull/11111) (@wdio/browser-runner): support fetching wasm files ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cucumber-framework`
  * [#11078](https://github.com/webdriverio/webdriverio/pull/11078) @wdio/cucumber-framework: Add original coordinates when resetting Cucumber Support Library ([@nextlevelbeard](https://github.com/nextlevelbeard))

#### :memo: Documentation
* Other
  * [#11107](https://github.com/webdriverio/webdriverio/pull/11107) (doc): Enabling flowcharts ([@tamil777selvan](https://github.com/tamil777selvan))
  * [#11106](https://github.com/webdriverio/webdriverio/pull/11106) fix broken link in configuration Closes [#11104](https://github.com/webdriverio/webdriverio/issues/11104) ([@harsha509](https://github.com/harsha509))
  * [#11110](https://github.com/webdriverio/webdriverio/pull/11110) (docs): update best practices page, add page to translations ([@erwinheitzman](https://github.com/erwinheitzman))
  * [#11071](https://github.com/webdriverio/webdriverio/pull/11071) (docs): add best practices guide ([@erwinheitzman](https://github.com/erwinheitzman))
  * [#11102](https://github.com/webdriverio/webdriverio/pull/11102) (doc): migrate to eta from ejs ([@tamil777selvan](https://github.com/tamil777selvan))
* `webdriverio`
  * [#11005](https://github.com/webdriverio/webdriverio/pull/11005) (docs): saveScreenshot requires afterTest hook to be async ([@hashar](https://github.com/hashar))

#### Committers: 6
- Antoine Musso ([@hashar](https://github.com/hashar))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))
- Sri Harsha ([@harsha509](https://github.com/harsha509))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.4 (2023-09-05)

#### :bug: Bug Fix
* `webdriverio`
  * [#11100](https://github.com/webdriverio/webdriverio/pull/11100) (webdriverio): fix scrollIntoView if scroll position has changed ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cucumber-framework`
  * [#11099](https://github.com/webdriverio/webdriverio/pull/11099) (@wdio/cucumber-framework): disable parallel execution and warn user that this feature is not supported ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.16.3 (2023-09-03)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#11076](https://github.com/webdriverio/webdriverio/pull/11076) Parse scenario description to reports & doc update ([@tamil777selvan](https://github.com/tamil777selvan))

#### :memo: Documentation
* Other
  * [#11074](https://github.com/webdriverio/webdriverio/pull/11074) (docs): update debugger documentation ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-cli`, `wdio-types`
  * [#11075](https://github.com/webdriverio/webdriverio/pull/11075) (docs): fix typos ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 2
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.2 (2023-09-02)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#11068](https://github.com/webdriverio/webdriverio/pull/11068) (@wdio/browser-runner): allow to take screenshots and pdf when running component tests ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `webdriverio`
  * [#11073](https://github.com/webdriverio/webdriverio/pull/11073) (webdriverio): deprecate touchAction command ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.16.1 (2023-09-02)

#### :bug: Bug Fix
* `wdio-junit-reporter`
  * [#11063](https://github.com/webdriverio/webdriverio/pull/11063) fix spec name comparison - Closes [#11060](https://github.com/webdriverio/webdriverio/issues/11060) ([@lecousin](https://github.com/lecousin))

#### :nail_care: Polish
* `wdio-cucumber-framework`
  * [#11069](https://github.com/webdriverio/webdriverio/pull/11069) Add name, tag of hook to reporter & doc refactor ([@tamil777selvan](https://github.com/tamil777selvan))

#### Committers: 2
- Guillaume Le Cousin ([@lecousin](https://github.com/lecousin))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.16.0 (2023-09-01)

#### :rocket: New Feature
* `wdio-config`, `wdio-cucumber-framework`
  * [#11010](https://github.com/webdriverio/webdriverio/pull/11010) Adopt latest Cucumber API interface ([@tamil777selvan](https://github.com/tamil777selvan))

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#11065](https://github.com/webdriverio/webdriverio/pull/11065) fix(@wdio/cucumber-framework): fix Cucumber types ([@erwinheitzman](https://github.com/erwinheitzman))
* `wdio-cli`
  * [#11002](https://github.com/webdriverio/webdriverio/pull/11002) Fix tsnode options ([@erwinheitzman](https://github.com/erwinheitzman))

#### :nail_care: Polish
* `wdio-cucumber-framework`
  * [#11067](https://github.com/webdriverio/webdriverio/pull/11067) Adding support for cucumber profiles & update docs ([@tamil777selvan](https://github.com/tamil777selvan))
* `wdio-utils`
  * [#11057](https://github.com/webdriverio/webdriverio/pull/11057) fix(@wdio-utils): secure driver connections when using the built-in driv… ([@erwinheitzman](https://github.com/erwinheitzman))

#### :memo: Documentation
* Other
  * [#11066](https://github.com/webdriverio/webdriverio/pull/11066) adding headspin boilerplate ([@Muralijc](https://github.com/Muralijc))
* `webdriverio`
  * [#11061](https://github.com/webdriverio/webdriverio/pull/11061) Fix found typos ([@arturCwiklinsky](https://github.com/arturCwiklinsky))

#### Committers: 4
- Artur Ćwikliński ([@arturCwiklinsky](https://github.com/arturCwiklinsky))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Murali Jayaraman ([@Muralijc](https://github.com/Muralijc))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.15.10 (2023-08-29)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#11053](https://github.com/webdriverio/webdriverio/pull/11053) (@wdio/browser-runner): fix detection of mocked module ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-types`
  * [#11025](https://github.com/webdriverio/webdriverio/pull/11025) Update Capabilities.ts ([@yanhaijing](https://github.com/yanhaijing))

#### :memo: Documentation
* [#11047](https://github.com/webdriverio/webdriverio/pull/11047) fix footer wrapping ([@tamil777selvan](https://github.com/tamil777selvan))
* [#11049](https://github.com/webdriverio/webdriverio/pull/11049) fix JSONWP api description typo ([@arturCwiklinsky](https://github.com/arturCwiklinsky))

#### Committers: 4
- Artur Ćwikliński ([@arturCwiklinsky](https://github.com/arturCwiklinsky))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))
- 颜海镜 ([@yanhaijing](https://github.com/yanhaijing))


## v8.15.9 (2023-08-27)

#### :bug: Bug Fix
* `wdio-junit-reporter`
  * [#10977](https://github.com/webdriverio/webdriverio/pull/10977) Fix junit reporter test duplication issue for WDIO v8 ([@jemishgopani](https://github.com/jemishgopani))

#### :nail_care: Polish
* `wdio-browser-runner`, `wdio-utils`
  * [#10995](https://github.com/webdriverio/webdriverio/pull/10995) (@wdio/utils): support setup of Firefox browser through @puppeteer/browser ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#11017](https://github.com/webdriverio/webdriverio/pull/11017) docs: AI copilot implementation ([@nickscamara](https://github.com/nickscamara))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jemish Gopani ([@jemishgopani](https://github.com/jemishgopani))
- Nicolas ([@nickscamara](https://github.com/nickscamara))


## v8.15.8 (2023-08-25)

#### :bug: Bug Fix
* `wdio-utils`
  * [#11019](https://github.com/webdriverio/webdriverio/pull/11019) (@wdio/utils): ignore space before new line when detecting local Chrome version ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.15.7 (2023-08-25)

#### :bug: Bug Fix
* `wdio-types`, `wdio-utils`
  * [#11014](https://github.com/webdriverio/webdriverio/pull/11014) (@wdio/utils): respect custom binary paths in caps ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#11006](https://github.com/webdriverio/webdriverio/pull/11006) Update allure common utils to fix steps with exception behaviour ([@epszaw](https://github.com/epszaw))
* `wdio-runner`
  * [#10997](https://github.com/webdriverio/webdriverio/pull/10997) Update runner index.ts due to a logs.map error is not a function ([@carri747](https://github.com/carri747))

#### :nail_care: Polish
* `wdio-utils`
  * [#11015](https://github.com/webdriverio/webdriverio/pull/11015) (@wdio/utils): have driver manager time out when trying to connect to driver ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-appium-service`
  * [#10972](https://github.com/webdriverio/webdriverio/pull/10972)  deprecating array of args support in appium service ([@tamil777selvan](https://github.com/tamil777selvan))

#### :memo: Documentation
* [#10999](https://github.com/webdriverio/webdriverio/pull/10999) [📖 Docs]: Better document new driver options and `cacheDir` ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Konstantin Epishev ([@epszaw](https://github.com/epszaw))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))
- [@carri747](https://github.com/carri747)


## v8.15.6 (2023-08-22)

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-utils`
  * [#10971](https://github.com/webdriverio/webdriverio/pull/10971) (@wdio/utils): set edge binary path in caps ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-reporter`
  * [#10998](https://github.com/webdriverio/webdriverio/pull/10998) (@wdio/reporter): support CJS environments ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-config`, `wdio-mocha-framework`
  * [#10975](https://github.com/webdriverio/webdriverio/pull/10975) Adding esmDecorator & unloadFiles ([@tamil777selvan](https://github.com/tamil777selvan))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Tamil Selvan ([@tamil777selvan](https://github.com/tamil777selvan))


## v8.15.4 (2023-08-16)

#### :bug: Bug Fix
* `wdio-utils`
  * [#10959](https://github.com/webdriverio/webdriverio/pull/10959) (@wdio/utils): detect as remote session when user and key is defined ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.15.0 (2023-08-15)

#### :rocket: New Feature
* `wdio-appium-service`, `wdio-browserstack-service`, `wdio-cli`, `wdio-firefox-profile-service`, `wdio-runner`, `wdio-sauce-service`, `wdio-testingbot-service`, `wdio-types`
  * [#10803](https://github.com/webdriverio/webdriverio/pull/10803) add parallel multiremote capability ([@ccharnkij](https://github.com/ccharnkij))
* `wdio-browser-runner`, `wdio-cli`
  * [#10927](https://github.com/webdriverio/webdriverio/pull/10927) (@wdio/browser-runner): add StencilJS component testing support ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-browser-runner`, `wdio-cli`, `wdio-types`, `wdio-utils`, `webdriver`
  * [#10952](https://github.com/webdriverio/webdriverio/pull/10952) (webdriver): improvements to driver management ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Chanatan Charnkijtawarush ([@ccharnkij](https://github.com/ccharnkij))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.14.6 (2023-08-13)

#### :bug: Bug Fix
* `wdio-protocols`, `webdriver`, `webdriverio`
  * [#10923](https://github.com/webdriverio/webdriverio/pull/10923) (webdriverio): fix driver management when calling reloadSession ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#10913](https://github.com/webdriverio/webdriverio/pull/10913) (@wdio/cli): make install command detect config file better ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-jasmine-framework`
  * [#10864](https://github.com/webdriverio/webdriverio/pull/10864) (@wdio/jasmine-framework): switch to addMatchingHelperFiles ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-config`
  * [#10921](https://github.com/webdriverio/webdriverio/pull/10921) (@wdio/config): allow specifying a file name as spec parameter ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-selenium-standalone-service`, `wdio-shared-store-service`
  * [#10898](https://github.com/webdriverio/webdriverio/pull/10898) (bugfix): remove acceptInsecureCerts appearences ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#10914](https://github.com/webdriverio/webdriverio/pull/10914) [Bug]: Execution steps are missing in allure reports.  ([@BorisOsipov](https://github.com/BorisOsipov))
* `wdio-browser-runner`, `wdio-config`, `webdriver`
  * [#10902](https://github.com/webdriverio/webdriverio/pull/10902) (webdriver): find good known version when Chromedriver can't be installed with found `buildId` ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriver`
  * [#10906](https://github.com/webdriverio/webdriverio/pull/10906) Fix chrome browser name to lower case ([@HananArgov](https://github.com/HananArgov))
  * [#10922](https://github.com/webdriverio/webdriverio/pull/10922) Bump @geckodriver from 4.1.3 to 4.2.0 ([@nextlevelbeard](https://github.com/nextlevelbeard))
* `devtools`
  * [#10883](https://github.com/webdriverio/webdriverio/pull/10883) Update launcher.ts to handle defaultViewport ([@mighty98](https://github.com/mighty98))
* `wdio-cli`
  * [#10858](https://github.com/webdriverio/webdriverio/pull/10858) [💡 Feature]: Make WebdriverIO load `.env` environments ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#10889](https://github.com/webdriverio/webdriverio/pull/10889) Boilerplate project added to MD ([@krishnapollu](https://github.com/krishnapollu))

#### :house: Internal
* `wdio-selenium-standalone-service`
  * [#10905](https://github.com/webdriverio/webdriverio/pull/10905) (@wdio/selenium-standalone-service): good bye 👋 ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 6
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- DOA ([@HananArgov](https://github.com/HananArgov))
- KRISHNA S ([@krishnapollu](https://github.com/krishnapollu))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))
- [@mighty98](https://github.com/mighty98)


## v8.14.3 (2023-08-02)

#### :nail_care: Polish
* `webdriver`
  * [#10852](https://github.com/webdriverio/webdriverio/pull/10852) (webdriver): better identify driver logs through worker ids ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#10851](https://github.com/webdriverio/webdriverio/pull/10851) (@wdio/cli): improve configuration wizard ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.14.2 (2023-08-01)

#### :bug: Bug Fix
* `webdriverio`
  * [#10841](https://github.com/webdriverio/webdriverio/pull/10841) fix(webdriverio): updated devtools peer dependency to 8.14.0 ([@jan-molak](https://github.com/jan-molak))

#### :memo: Documentation
* [#10842](https://github.com/webdriverio/webdriverio/pull/10842) Mention 'beta' channel ([@mathiasbynens](https://github.com/mathiasbynens))

#### Committers: 2
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Mathias Bynens ([@mathiasbynens](https://github.com/mathiasbynens))


## v8.14.0 (2023-08-01)

#### :rocket: New Feature
* `wdio-browser-runner`, `wdio-cli`, `wdio-devtools-service`, `wdio-runner`, `wdio-selenium-standalone-service`, `wdio-types`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#10767](https://github.com/webdriverio/webdriverio/pull/10767) (webdriverio): manage browser drivers ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-cli`
  * [#10816](https://github.com/webdriverio/webdriverio/pull/10816) (@wdio/cli): corrected TypeScript loading ([@jan-molak](https://github.com/jan-molak))
* `wdio-browser-runner`
  * [#10815](https://github.com/webdriverio/webdriverio/pull/10815) Fix invalid unicode escape error on Windows ([@yishn](https://github.com/yishn))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Yichuan Shen ([@yishn](https://github.com/yishn))


## v8.13.14 (2023-07-28)

#### :bug: Bug Fix
* `wdio-cli`
  * [#10813](https://github.com/webdriverio/webdriverio/pull/10813) (@wdio/cli): only add nuxt service if it is a nuxt project ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.13.13 (2023-07-27)

#### :bug: Bug Fix
* `wdio-globals`
  * [#10804](https://github.com/webdriverio/webdriverio/pull/10804) (@wdio/globals): fix getPuppeteer() ([@jan-molak](https://github.com/jan-molak))

#### :nail_care: Polish
* `wdio-browser-runner`, `wdio-runner`, `wdio-utils`
  * [#10802](https://github.com/webdriverio/webdriverio/pull/10802) (@wdio/browser-runner): respect alias when it comes to mocking ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#10801](https://github.com/webdriverio/webdriverio/pull/10801) Update OrganizingTestSuites.md ([@bhanuagarwal73](https://github.com/bhanuagarwal73))
* [#10799](https://github.com/webdriverio/webdriverio/pull/10799) Update OrganizingTestSuites.md --> added exclude specific test with m… ([@bhanuagarwal73](https://github.com/bhanuagarwal73))

#### Committers: 3
- Bhanu Agarwal ([@bhanuagarwal73](https://github.com/bhanuagarwal73))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jan Molak ([@jan-molak](https://github.com/jan-molak))


## v8.13.12 (2023-07-24)

#### :bug: Bug Fix
* `webdriverio`
  * [#10798](https://github.com/webdriverio/webdriverio/pull/10798) (webdriverio): fix Action types ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.13.11 (2023-07-24)

#### :nail_care: Polish
* `wdio-browser-runner`
  * [#10793](https://github.com/webdriverio/webdriverio/pull/10793) (@wdio/browser-runner): support Nuxt alias and ensure plugin is loaded before WDIO related ones ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v8.13.10 (2023-07-24)

#### :memo: Documentation
* `wdio-cli`
  * [#10777](https://github.com/webdriverio/webdriverio/pull/10777) (@wdio/cli) add Nuxt service to wizard and docs ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#10776](https://github.com/webdriverio/webdriverio/pull/10776) Update mock.ts ([@diwakar-jha3110](https://github.com/diwakar-jha3110))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Diwakar Kumar Jha ([@diwakar-jha3110](https://github.com/diwakar-jha3110))


## v8.13.9 (2023-07-22)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#10775](https://github.com/webdriverio/webdriverio/pull/10775) (@wdio/browser-runner): improve Nuxt optimization process ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cucumber-framework`
  * [#10772](https://github.com/webdriverio/webdriverio/pull/10772) Dev/issue 7735 ([@hammzj](https://github.com/hammzj))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Zachary Hamm ([@hammzj](https://github.com/hammzj))


## v8.13.7 (2023-07-22)

#### :nail_care: Polish
* `wdio-browser-runner`
  * [#10773](https://github.com/webdriverio/webdriverio/pull/10773) (@wdio/browser-runner): support Nuxt auto-import ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#10771](https://github.com/webdriverio/webdriverio/pull/10771) (docs): add a sponsors page ([@christian-bromann](https://github.com/christian-bromann))
* [#10768](https://github.com/webdriverio/webdriverio/pull/10768) Fix WhyWebDriverIO.md typos ([@AsyncBanana](https://github.com/AsyncBanana))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jacob Jackson ([@AsyncBanana](https://github.com/AsyncBanana))


## v8.13.6 (2023-07-18)

#### :bug: Bug Fix
* `wdio-browser-runner`
  * [#10764](https://github.com/webdriverio/webdriverio/pull/10764) (@wdio/browser-runner): be more strict about transforming files ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


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
