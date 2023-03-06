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
