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
