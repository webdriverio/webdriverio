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
