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

---

## v5.10.10 (2019-07-03)

#### :bug: Bug Fix
* `wdio-appium-service`
  * [#4136](https://github.com/webdriverio/webdriverio/pull/4136) Fix spawn declaration on Windows ([@piotr-cz](https://github.com/piotr-cz))

#### :memo: Documentation
* Other
  * [#4131](https://github.com/webdriverio/webdriverio/pull/4131) typings: add touchaction's ms type dsl. ([@aha-oretama](https://github.com/aha-oretama))
  * [#4130](https://github.com/webdriverio/webdriverio/pull/4130) Fixed text in 2019-04-03-react-selectors.md ([@Marketionist](https://github.com/Marketionist))
* `wdio-mocha-framework`
  * [#4127](https://github.com/webdriverio/webdriverio/pull/4127) wdio-mocha-framework: add mocha error in type DSL ([@aha-oretama](https://github.com/aha-oretama))

#### :house: Internal
* `wdio-allure-reporter`
  * [#4132](https://github.com/webdriverio/webdriverio/pull/4132) wdio-allure-reporter: allure attachment content can use Buffer type. ([@aha-oretama](https://github.com/aha-oretama))
* Other
  * [#4057](https://github.com/webdriverio/webdriverio/pull/4057) Add roadmap document ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dmytro Shpakovskyi ([@Marketionist](https://github.com/Marketionist))
- Piotr ([@piotr-cz](https://github.com/piotr-cz))
- aha-oretama ([@aha-oretama](https://github.com/aha-oretama))

## v5.10.9 (2019-06-25)

#### :bug: Bug Fix
* `webdriver`
  * [#4116](https://github.com/webdriverio/webdriverio/pull/4116) Fix bug where environment flags aren't attached to session ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## v5.10.8 (2019-06-25)

#### :bug: Bug Fix
* `wdio-appium-service`, `wdio-local-runner`, `webdriver`, `webdriverio`
  * [#4102](https://github.com/webdriverio/webdriverio/pull/4102) wdio-appium-service: fix args array, print startup failure message ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* Other
  * [#4114](https://github.com/webdriverio/webdriverio/pull/4114) types: fix hook array ([@mgrybyk](https://github.com/mgrybyk))
  * [#4108](https://github.com/webdriverio/webdriverio/pull/4108) typings: specs and exclude in capabilities is missing in type dsl. ([@aha-oretama](https://github.com/aha-oretama))
  * [#4111](https://github.com/webdriverio/webdriverio/pull/4111) typings: add Edge specific in type DSL. ([@aha-oretama](https://github.com/aha-oretama))
  * [#4107](https://github.com/webdriverio/webdriverio/pull/4107) typings: specFileRetries is missing in type dsl. ([@aha-oretama](https://github.com/aha-oretama))
* `webdriverio`
  * [#4099](https://github.com/webdriverio/webdriverio/pull/4099) Docs: waitUntil 'waitForTimeout' default value incorrect ([@klamping](https://github.com/klamping))

#### :house: Internal
* `wdio-browserstack-service`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-devtools-service`, `wdio-sauce-service`, `wdio-testingbot-service`, `webdriver`, `webdriverio`
  * [#4109](https://github.com/webdriverio/webdriverio/pull/4109) Update eslint in group default to the latest version 🚀 ([@greenkeeper[bot]](https://github.com/apps/greenkeeper))

#### Committers: 4
- Annemarie ([@AnnemarieD](https://github.com/AnnemarieD))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- aha-oretama ([@aha-oretama](https://github.com/aha-oretama))


## v5.10.7 (2019-06-18)

#### :bug: Bug Fix
* `wdio-appium-service`, `wdio-cli`, `webdriverio`
  * [#4089](https://github.com/webdriverio/webdriverio/pull/4089) update appium service ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 1
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.10.7 (2019-06-18)

#### :bug: Bug Fix
* `wdio-appium-service`, `wdio-cli`, `webdriverio`
  * [#4089](https://github.com/webdriverio/webdriverio/pull/4089) update appium service ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 1
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.10.6 (2019-06-18)

#### :bug: Bug Fix
* `wdio-devtools-service`
  * [#4043](https://github.com/webdriverio/webdriverio/pull/4043) Update lighthouse in group default to the latest version 🚀 ([@greenkeeper[bot]](https://github.com/apps/greenkeeper))

#### Committers: 0


## v5.10.5 (2019-06-17)

#### :bug: Bug Fix
* `webdriverio`
  * [#4095](https://github.com/webdriverio/webdriverio/pull/4095) webdriverio: fix doubleClick when using w3c ([@erwinheitzman](https://github.com/erwinheitzman))

#### :memo: Documentation
* Other
  * [#4092](https://github.com/webdriverio/webdriverio/pull/4092) Fixing broken link to Lerna homepage ([@vdua](https://github.com/vdua))
* `wdio-allure-reporter`
  * [#4094](https://github.com/webdriverio/webdriverio/pull/4094) Update readme for Allure reporter ([@shridharkalagi](https://github.com/shridharkalagi))

#### Committers: 3
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Shridhar Kalagi ([@shridharkalagi](https://github.com/shridharkalagi))
- Varun Dua ([@vdua](https://github.com/vdua))

## v5.10.4 (2019-06-12)

#### :bug: Bug Fix
* `webdriver`
  * [#4077](https://github.com/webdriverio/webdriverio/pull/4077) Update utils.js ([@akume](https://github.com/akume))

#### Committers: 1
- Da Rod ([@akume](https://github.com/akume))

## v5.10.3 (2019-06-11)

#### :bug: Bug Fix
* `wdio-cli`
  * [#4075](https://github.com/webdriverio/webdriverio/pull/4075) Fix Chromedriver install via config wizard ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## v5.10.2 (2019-06-10)

#### :bug: Bug Fix
* `wdio-crossbrowsertesting-service`
  * [#4071](https://github.com/webdriverio/webdriverio/pull/4071) Move cbt tunnels to dependency block ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## v5.10.1 (2019-06-10)

#### :bug: Bug Fix
* `webdriverio`
  * [#4064](https://github.com/webdriverio/webdriverio/pull/4064) webdriverio: change argument type for setValue and addValue commands  ([@CrispusDH](https://github.com/CrispusDH))
* `wdio-devtools-service`, `wdio-mocha-framework`
  * [#4056](https://github.com/webdriverio/webdriverio/pull/4056) wdio-mocha-framework: fix pending test test:end ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* `wdio-sync`, `webdriverio`
  * [#4062](https://github.com/webdriverio/webdriverio/pull/4062) Types fix for users with noImplicitAny set to true ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 2
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Oleksii ([@CrispusDH](https://github.com/CrispusDH))

## v5.10.0 (2019-06-06)

#### :rocket: New Feature
* `wdio-cli`, `wdio-crossbrowsertesting-service`
  * [#3959](https://github.com/webdriverio/webdriverio/pull/3959) Add CrossBrowserTesting Service ([@daphnemcrossbrowser](https://github.com/daphnemcrossbrowser))
* `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#4049](https://github.com/webdriverio/webdriverio/pull/4049) Overwrite native commands ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`
  * [#4010](https://github.com/webdriverio/webdriverio/pull/4010) introduce 'install' command to wdio-cli ([@baruchvlz](https://github.com/baruchvlz))

#### :memo: Documentation
* `wdio-sync`, `webdriver`, `webdriverio`
  * [#4050](https://github.com/webdriverio/webdriverio/pull/4050) Fix call, execute, executeAsync, remote, multiremote ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* [#4052](https://github.com/webdriverio/webdriverio/pull/4052) Rename CONDUCT.md to CODE_OF_CONDUCT.md ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 3
- Baruch Velez ([@baruchvlz](https://github.com/baruchvlz))
- Daphne Magsby ([@daphnemcrossbrowser](https://github.com/daphnemcrossbrowser))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.9.6 (2019-05-31)

#### :bug: Bug Fix
* `wdio-devtools-service`, `wdio-webdriver-mock-service`, `webdriverio`
  * [#4047](https://github.com/webdriverio/webdriverio/pull/4047) Wrap addCommand function with Fibers in multiremote mode ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`
  * [#4048](https://github.com/webdriverio/webdriverio/pull/4048) fix runOnCompleteHook to respect async functions ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 1
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.9.5 (2019-05-31)

#### :bug: Bug Fix
* `wdio-devtools-service`
  * [#4041](https://github.com/webdriverio/webdriverio/pull/4041) @wdio/devtools-service: updating puppeteer.connect arguments ([@smarkows](https://github.com/smarkows))
* `webdriverio`
  * [#4037](https://github.com/webdriverio/webdriverio/pull/4037) Fix build ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `webdriverio`
  * [#4034](https://github.com/webdriverio/webdriverio/pull/4034) Update executeAsync.js ([@DustinX](https://github.com/DustinX))
* Other
  * [#4031](https://github.com/webdriverio/webdriverio/pull/4031) Update retry documentation as per #4008 ([@mike-d-davydov](https://github.com/mike-d-davydov))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dustin ([@DustinX](https://github.com/DustinX))
- Mikhail Davydov ([@mike-d-davydov](https://github.com/mike-d-davydov))
- [@smarkows](https://github.com/smarkows)

## v5.9.4 (2019-05-28)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-local-runner`, `wdio-runner`, `webdriver`, `webdriverio`
  * [#3987](https://github.com/webdriverio/webdriverio/pull/3987) Fix browser session close in watch mode ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-cli`, `wdio-config`, `webdriverio`
  * [#4000](https://github.com/webdriverio/webdriverio/pull/4000) #3980 Support array of functions for onPrepare and onComplete hooks ([@naddison](https://github.com/naddison))
* `wdio-jasmine-framework`
  * [#4025](https://github.com/webdriverio/webdriverio/pull/4025) Implement issue#4024: jasmine-framework - introduce new jasmineOpts option: stopSpecOnExpectationFailure ([@mike-d-davydov](https://github.com/mike-d-davydov))

#### :memo: Documentation
* [#4020](https://github.com/webdriverio/webdriverio/pull/4020) scripts: generate 3rd party reporters and services ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 3
- Mikhail Davydov ([@mike-d-davydov](https://github.com/mike-d-davydov))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Nikolas Addison ([@naddison](https://github.com/naddison))

## v5.9.3 (2019-05-26)

#### :rocket: New Feature
* `wdio-devtools-service`, `wdio-testingbot-service`, `webdriverio`
  * [#3992](https://github.com/webdriverio/webdriverio/pull/3992) Updates to Performance Features ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-sauce-service`
  * [#4022](https://github.com/webdriverio/webdriverio/pull/4022) Fixed issue #4021 - Not able to run tests with Sauce Connect and W3C caps ([@yamkay](https://github.com/yamkay))

#### :memo: Documentation
* [#4006](https://github.com/webdriverio/webdriverio/pull/4006) Update CLI.md ([@ducle91](https://github.com/ducle91))

#### :house: Internal
* `wdio-appium-service`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-config`, `wdio-devtools-service`, `wdio-dot-reporter`, `wdio-junit-reporter`, `wdio-lambda-runner`, `wdio-logger`, `wdio-reporter`, `wdio-runner`, `wdio-selenium-standalone-service`, `wdio-spec-reporter`, `webdriver`, `webdriverio`
  * [#4013](https://github.com/webdriverio/webdriverio/pull/4013) Update dependencies to enable Greenkeeper 🌴 ([@greenkeeper[bot]](https://github.com/apps/greenkeeper))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Duc Le ([@ducle91](https://github.com/ducle91))
- Mohan Kumar Selvaraj ([@yamkay](https://github.com/yamkay))

## v5.9.2 (2019-05-24)

#### :bug: Bug Fix
* `wdio-sauce-service`
  * [#4002](https://github.com/webdriverio/webdriverio/pull/4002) avoid sauce:contexts calls being made for Sauce RDC tests ([@enriquegh](https://github.com/enriquegh))

#### :nail_care: Polish
* `wdio-mocha-framework`
  * [#4005](https://github.com/webdriverio/webdriverio/pull/4005) wdio-mocha-framework: remove @types from runtime dependencies ([@vgrigoruk](https://github.com/vgrigoruk))

#### :memo: Documentation
* `wdio-cli`, `wdio-selenium-standalone-service`
  * [#4014](https://github.com/webdriverio/webdriverio/pull/4014) Simplify getting started ([@mgrybyk](https://github.com/mgrybyk))
* Other
  * [#4017](https://github.com/webdriverio/webdriverio/pull/4017) Remove obsolete info about Object.create ([@BorisOsipov](https://github.com/BorisOsipov))
  * [#4007](https://github.com/webdriverio/webdriverio/pull/4007) Move `npm init -y` up in docs to avoid global installation ([@klamping](https://github.com/klamping))
* `wdio-sync`, `webdriverio`
  * [#4009](https://github.com/webdriverio/webdriverio/pull/4009) Typings: wrap waitUntil condition function return type with Promise ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 5
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Enrique Gonzalez ([@enriquegh](https://github.com/enriquegh))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Vitalii Grygoruk ([@vgrigoruk](https://github.com/vgrigoruk))

## v5.9.1 (2019-05-21)

#### :rocket: New Feature
* `wdio-config`
  * [#3995](https://github.com/webdriverio/webdriverio/pull/3995) wdio-config: include and exclude at capability level ([@ergbouncex](https://github.com/ergbouncex))
* `wdio-cli`, `wdio-runner`
  * [#3996](https://github.com/webdriverio/webdriverio/pull/3996) Print error message on test and "before/after all" hooks failure ([@mgrybyk](https://github.com/mgrybyk))

#### :bug: Bug Fix
* `wdio-junit-reporter`
  * [#3993](https://github.com/webdriverio/webdriverio/pull/3993) wdio-junit-reporter: include before and after all failures ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* [#3997](https://github.com/webdriverio/webdriverio/pull/3997) Docs: grammar changes to chaining selectors docs ([@klamping](https://github.com/klamping))

#### Committers: 3
- Evan Giordanella ([@ergbouncex](https://github.com/ergbouncex))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.9.0 (2019-05-20)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-local-runner`, `wdio-logger`
  * [#3950](https://github.com/webdriverio/webdriverio/pull/3950) new logger - initial version ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`, `wdio-runner`, `wdio-webdriver-mock-service`
  * [#3958](https://github.com/webdriverio/webdriverio/pull/3958) fix multiremote instances spawning ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* [#3990](https://github.com/webdriverio/webdriverio/pull/3990) Visual regression blog ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 2
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))

## v5.8.6 (2019-05-19)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3977](https://github.com/webdriverio/webdriverio/pull/3977) Fix queryAppState protocol ([@nextlevelbeard](https://github.com/nextlevelbeard))

#### :rocket: New Feature
* `webdriverio`
  * [#3986](https://github.com/webdriverio/webdriverio/pull/3986) feat: add React selectors to element commands ([@baruchvlz](https://github.com/baruchvlz))

#### :memo: Documentation
* [#3988](https://github.com/webdriverio/webdriverio/pull/3988) typings: add automationName desired capability ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 3
- Baruch Velez ([@baruchvlz](https://github.com/baruchvlz))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Ricardo Barbosa ([@nextlevelbeard](https://github.com/nextlevelbeard))

## v5.8.5 (2019-05-17)

#### :eyeglasses: Spec Compliancy
* `webdriver`, `webdriverio`
  * [#3979](https://github.com/webdriverio/webdriverio/pull/3979) Add getWindowSize command ([@mgrybyk](https://github.com/mgrybyk))

#### :bug: Bug Fix
* `webdriverio`
  * [#3983](https://github.com/webdriverio/webdriverio/pull/3983) Fix xpath selector start ([@mgrybyk](https://github.com/mgrybyk))
* `webdriver`
  * [#3978](https://github.com/webdriverio/webdriverio/pull/3978) Fix attach to session w3c handling ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 1
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.8.4 (2019-05-15)

#### :rocket: New Feature
* `webdriverio`
  * [#3964](https://github.com/webdriverio/webdriverio/pull/3964) webdriverio: Modify findStrategy.js to work with Youi.tv selectors. ([@richmond998999](https://github.com/richmond998999))

#### :bug: Bug Fix
* `wdio-selenium-standalone-service`
  * [#3970](https://github.com/webdriverio/webdriverio/pull/3970) wdio-selenium-standalone: fix watch mode ([@artur-michalak](https://github.com/artur-michalak))

#### :nail_care: Polish
* `wdio-testingbot-service`
  * [#3946](https://github.com/webdriverio/webdriverio/pull/3946) wdio-testingbot-service: split up code between Launcher and Service ([@testingbot](https://github.com/testingbot))
* `wdio-appium-service`
  * [#3947](https://github.com/webdriverio/webdriverio/pull/3947) wdio-appium-service: Better handling of exit code = 2 ([@MortenGregersen](https://github.com/MortenGregersen))

#### :memo: Documentation
* Other
  * [#3967](https://github.com/webdriverio/webdriverio/pull/3967) Update TypeScript.md file require ([@nekiscz](https://github.com/nekiscz))
  * [#3949](https://github.com/webdriverio/webdriverio/pull/3949) Fix 'specifiy' typo ([@klamping](https://github.com/klamping))
* `webdriverio`
  * [#3953](https://github.com/webdriverio/webdriverio/pull/3953) webdriverio: Update types for attach and remote methods ([@MunGell](https://github.com/MunGell))
  * [#3944](https://github.com/webdriverio/webdriverio/pull/3944) Documentation update for react$ and react$ ([@Raulster24](https://github.com/Raulster24))
  * [#3941](https://github.com/webdriverio/webdriverio/pull/3941) webdriverio: add attach method to TypeScript definitions file ([@MunGell](https://github.com/MunGell))

#### :house: Internal
* `wdio-jasmine-framework`
  * [#3968](https://github.com/webdriverio/webdriverio/pull/3968) Move `@types/jasmine` to devDependency ([@kfrancois](https://github.com/kfrancois))
* `wdio-cli`
  * [#3963](https://github.com/webdriverio/webdriverio/pull/3963) Add wdio-json-reporter to supported reporters ([@fijijavis](https://github.com/fijijavis))

#### Committers: 10
- David Nekovář ([@nekiscz](https://github.com/nekiscz))
- Jim Davis ([@fijijavis](https://github.com/fijijavis))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Koen François ([@kfrancois](https://github.com/kfrancois))
- Morten Bjerg Gregersen ([@MortenGregersen](https://github.com/MortenGregersen))
- Rahul Srivastava ([@Raulster24](https://github.com/Raulster24))
- Shmavon Gazanchyan ([@MunGell](https://github.com/MunGell))
- TestingBot ([@testingbot](https://github.com/testingbot))
- [@artur-michalak](https://github.com/artur-michalak)
- [@richmond998999](https://github.com/richmond998999)

## v5.8.3 (2019-05-07)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3936](https://github.com/webdriverio/webdriverio/pull/3936) Fix determining w3c for browserstack ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 1
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))

## v5.8.2 (2019-05-06)

#### :eyeglasses: Spec Compliancy
* `webdriverio`
  * [#3930](https://github.com/webdriverio/webdriverio/pull/3930) Fix/is displayed chrome ([@wswebcreation](https://github.com/wswebcreation))

#### :nail_care: Polish
* `webdriverio`
  * [#3922](https://github.com/webdriverio/webdriverio/pull/3922) webdriverio: throw INVALID_SELECTOR_ERROR in correct spot ([@kellyselden](https://github.com/kellyselden))

#### :memo: Documentation
* `webdriver`
  * [#3918](https://github.com/webdriverio/webdriverio/pull/3918) webdriver: Add return values for some commands ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 4
- Kelly Selden ([@kellyselden](https://github.com/kellyselden))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Tadashi Nemoto ([@tadashi0713](https://github.com/tadashi0713))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))

## v5.8.1 (2019-05-01)

#### :bug: Bug Fix
* `wdio-runner`, `wdio-utils`
  * [#3908](https://github.com/webdriverio/webdriverio/pull/3908) Propagate given capabilities to reporter ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-appium-service`, `wdio-cli`, `wdio-config`, `wdio-webdriver-mock-service`, `webdriver`
  * [#3907](https://github.com/webdriverio/webdriverio/pull/3907) Don't try to connect to localhost anymore ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-sauce-service`
  * [#3909](https://github.com/webdriverio/webdriverio/pull/3909) move cloud service documentation to the options page ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* `wdio-applitools-service`
  * [#3910](https://github.com/webdriverio/webdriverio/pull/3910) Replace own fork with Applitools package ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## v5.8.0 (2019-04-30)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3886](https://github.com/webdriverio/webdriverio/pull/3886) webdriver: fix appium protocols ([@mgrybyk](https://github.com/mgrybyk))

#### :rocket: New Feature
* `webdriverio`
  * [#3862](https://github.com/webdriverio/webdriverio/pull/3862) Fixes to react$ and react$ scripts ([@baruchvlz](https://github.com/baruchvlz))

#### :bug: Bug Fix
* `wdio-config`, `wdio-spec-reporter`
  * [#3876](https://github.com/webdriverio/webdriverio/pull/3876) Fix headless endpoint ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#3874](https://github.com/webdriverio/webdriverio/pull/3874) Don't fail element command in IE ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-logger`
  * [#3871](https://github.com/webdriverio/webdriverio/pull/3871) wdio-logger: fix setting log level for subloggers and docs ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-junit-reporter`, `wdio-runner`
  * [#3892](https://github.com/webdriverio/webdriverio/pull/3892) junit-reporter: fix log file names ([@naddison](https://github.com/naddison))
* `wdio-local-runner`
  * [#3882](https://github.com/webdriverio/webdriverio/pull/3882) wdio-local-runner: unpipe streams in the end ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`, `wdio-local-runner`, `wdio-logger`, `wdio-runner`
  * [#3872](https://github.com/webdriverio/webdriverio/pull/3872) apply wdioLogLevel before starting workers ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-runner`
  * [#3870](https://github.com/webdriverio/webdriverio/pull/3870) wdio-runner: catch getLogTypes error ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* [#3900](https://github.com/webdriverio/webdriverio/pull/3900) blog: add blog for react selector command ([@baruchvlz](https://github.com/baruchvlz))
* [#3885](https://github.com/webdriverio/webdriverio/pull/3885) Update JenkinsIntegration.md ([@YannVerr](https://github.com/YannVerr))

#### :house: Internal
* `wdio-sync`
  * [#3898](https://github.com/webdriverio/webdriverio/pull/3898) wdio-sync: bump fibers version to 4 ([@baruchvlz](https://github.com/baruchvlz))
* `wdio-appium-service`, `wdio-junit-reporter`, `wdio-local-runner`, `wdio-runner`, `wdio-selenium-standalone-service`
  * [#3891](https://github.com/webdriverio/webdriverio/pull/3891) Fix unit tests when contributing on Windows 10 ([@naddison](https://github.com/naddison))

#### Committers: 5
- Baruch Velez ([@baruchvlz](https://github.com/baruchvlz))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Nikolas Addison ([@naddison](https://github.com/naddison))
- Yann Verreault ([@YannVerr](https://github.com/YannVerr))

## 5.7.15 (2019-04-19)

#### :bug: Bug Fix
* `wdio-junit-reporter`
  * [#3868](https://github.com/webdriverio/webdriverio/pull/3868) wdio-junit-reporter: Fix nested and multiple describes ([@naddison](https://github.com/naddison))

#### Committers: 1
- Nikolas Addison ([@naddison](https://github.com/naddison))

## v5.7.15 (2019-04-19)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3861](https://github.com/webdriverio/webdriverio/pull/3861) Returned object type to switchToFram under webdriver protocol ([@Ad1B3nAr0ya](https://github.com/Ad1B3nAr0ya))

#### Committers: 1
- [@Ad1B3nAr0ya](https://github.com/Ad1B3nAr0ya)

## v5.7.14 (2019-04-16)

#### :bug: Bug Fix
* `webdriverio`
  * [#3850](https://github.com/webdriverio/webdriverio/pull/3850) Fix imports according to package dependencies. ([@blueimp](https://github.com/blueimp))

#### :memo: Documentation
* `webdriverio`
  * [#3858](https://github.com/webdriverio/webdriverio/pull/3858) fix path to image in debug API page ([@klamping](https://github.com/klamping))
* `webdriver`
  * [#3849](https://github.com/webdriverio/webdriverio/pull/3849) webdriver: Fix link for setTimeouts ([@WillBrock](https://github.com/WillBrock))

#### :house: Internal
* `wdio-mocha-framework`
  * [#3856](https://github.com/webdriverio/webdriverio/pull/3856) [@wdio/mocha-framework] Upgrade mocha min version to v6.1.0 to avoid security issue ([@tadashi0713](https://github.com/tadashi0713))

#### Committers: 4
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Sebastian Tschan ([@blueimp](https://github.com/blueimp))
- Tadashi Nemoto ([@tadashi0713](https://github.com/tadashi0713))
- Will Brock ([@WillBrock](https://github.com/WillBrock))

## v5.7.13 (2019-04-12)

#### :rocket: New Feature
* `wdio-cli`, `wdio-config`, `wdio-spec-reporter`
  * [#3845](https://github.com/webdriverio/webdriverio/pull/3845) better sauce headless support ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-devtools-service`
  * [#3841](https://github.com/webdriverio/webdriverio/pull/3841) wdio-devtools-service: adding debuggerAddress parameter ([@CrispusDH](https://github.com/CrispusDH))

#### :bug: Bug Fix
* `wdio-jasmine-framework`
  * [#3836](https://github.com/webdriverio/webdriverio/pull/3836) wdio-jasmine-framework: Fix xit logging code to the console ([@WillBrock](https://github.com/WillBrock))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#3833](https://github.com/webdriverio/webdriverio/pull/3833) wdio-browserstack-service: Add configuration to modify session url fo… ([@garethleonard](https://github.com/garethleonard))

#### :memo: Documentation
* [#3846](https://github.com/webdriverio/webdriverio/pull/3846) Boilerplate Page update ([@jonyet](https://github.com/jonyet))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Gareth Leonard ([@garethleonard](https://github.com/garethleonard))
- Oleksii ([@CrispusDH](https://github.com/CrispusDH))
- Will Brock ([@WillBrock](https://github.com/WillBrock))
- jonathan terry ([@jonyet](https://github.com/jonyet))

## 5.7.12 (2019-04-10)

#### :eyeglasses: Spec Compliancy
* `webdriver`, `webdriverio`
  * [#3832](https://github.com/webdriverio/webdriverio/pull/3832) Ensure ms edge runs on w3c on Sauce ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `webdriver`, `webdriverio`
  * [#3825](https://github.com/webdriverio/webdriverio/pull/3825) fix addCommand in multiremote ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-cli`
  * [#3828](https://github.com/webdriverio/webdriverio/pull/3828) wdio-cli: fix typo ([@carlos-gva](https://github.com/carlos-gva))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@carlos-gva](https://github.com/carlos-gva)

## 5.7.11 (2019-04-08)

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#3746](https://github.com/webdriverio/webdriverio/pull/3746) Issue 3416: Support multiple errors in the Allure-reporter ([@nicholasbailey](https://github.com/nicholasbailey))
  * [#3821](https://github.com/webdriverio/webdriverio/pull/3821) allure-reporter: fix allure endStep and startStep ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-junit-reporter`
  * [#3818](https://github.com/webdriverio/webdriverio/pull/3818) Allow junit-reporter to work when a runner has multiple spec files per runner ([@naddison](https://github.com/naddison))

#### :memo: Documentation
* [#3822](https://github.com/webdriverio/webdriverio/pull/3822) Add a couple features to boilerplate project ([@jpolley](https://github.com/jpolley))

#### Committers: 4
- Jeremy Polley ([@jpolley](https://github.com/jpolley))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Nicholas Bailey ([@nicholasbailey](https://github.com/nicholasbailey))
- Nikolas Addison ([@naddison](https://github.com/naddison))

## 5.7.10 (2019-04-04)

#### :nail_care: Polish
* `wdio-cli`
  * [#3817](https://github.com/webdriverio/webdriverio/pull/3817) wdio-cli: Print reporters after stdout ([@WillBrock](https://github.com/WillBrock))

#### Committers: 1
- Will Brock ([@WillBrock](https://github.com/WillBrock))

## 5.7.9 (2019-04-04)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3812](https://github.com/webdriverio/webdriverio/pull/3812) webdriver: add missed return types for jsonwp ([@CrispusDH](https://github.com/CrispusDH))
  * [#3811](https://github.com/webdriverio/webdriverio/pull/3811) webdriver: fix getAlertText typing for jsonwp ([@CrispusDH](https://github.com/CrispusDH))

#### :bug: Bug Fix
* `wdio-sync`
  * [#3816](https://github.com/webdriverio/webdriverio/pull/3816) Fix runFnInFiberContext to allow wrapped commands to run in try/catch ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-interface`, `wdio-local-runner`, `wdio-repl`
  * [#3638](https://github.com/webdriverio/webdriverio/pull/3638) Replace wdio-interface with logUpdate ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-spec-reporter`
  * [#3814](https://github.com/webdriverio/webdriverio/pull/3814) Display link to EU platform of Sauce ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-appium-service`
  * [#3804](https://github.com/webdriverio/webdriverio/pull/3804) wdio-appium-service: Wait for message from Appium instead of delay ([@MortenGregersen](https://github.com/MortenGregersen))
* `webdriver`
  * [#3792](https://github.com/webdriverio/webdriverio/pull/3792) fix connectionRetryCount default ([@kellyselden](https://github.com/kellyselden))
* `wdio-testingbot-service`
  * [#3793](https://github.com/webdriverio/webdriverio/pull/3793) wdio-testingbot-service: Update afterStep ([@testingbot](https://github.com/testingbot))

#### :memo: Documentation
* [#3801](https://github.com/webdriverio/webdriverio/pull/3801) Update CustomReporter.md ([@nikita-pankratov](https://github.com/nikita-pankratov))

#### :house: Internal
* Other
  * [#3053](https://github.com/webdriverio/webdriverio/pull/3053) Automatically deploy website if new version was released ([@christian-bromann](https://github.com/christian-bromann))
  * [#3788](https://github.com/webdriverio/webdriverio/pull/3788) Add pre-commit and pre-push hooks ([@dpgraham](https://github.com/dpgraham))
* `webdriverio`
  * [#3795](https://github.com/webdriverio/webdriverio/pull/3795) typings: validate jasmine ([@mgrybyk](https://github.com/mgrybyk))
  * [#3778](https://github.com/webdriverio/webdriverio/pull/3778) webdriverio: refactor find-strategy method ([@CrispusDH](https://github.com/CrispusDH))
* `wdio-cli`
  * [#3789](https://github.com/webdriverio/webdriverio/pull/3789) Update supported service and reporter list in CLI ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 8
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dan Graham ([@dpgraham](https://github.com/dpgraham))
- Kelly Selden ([@kellyselden](https://github.com/kellyselden))
- Morten Bjerg Gregersen ([@MortenGregersen](https://github.com/MortenGregersen))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Nikita Pankratov ([@nikita-pankratov](https://github.com/nikita-pankratov))
- Oleksii ([@CrispusDH](https://github.com/CrispusDH))
- TestingBot ([@testingbot](https://github.com/testingbot))

## 5.7.8 (2019-03-28)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3784](https://github.com/webdriverio/webdriverio/pull/3784) Fix parameter name of background app command ([@christian-bromann](https://github.com/christian-bromann))

#### :rocket: New Feature
* `webdriverio`
  * [#3762](https://github.com/webdriverio/webdriverio/pull/3762) Add Espresso DataMatcher strategy ([@dpgraham](https://github.com/dpgraham))

#### :nail_care: Polish
* `wdio-cli`
  * [#3781](https://github.com/webdriverio/webdriverio/pull/3781) Print reporters after/below stdout in final output ([@klamping](https://github.com/klamping))

#### :memo: Documentation
* `wdio-dot-reporter`
  * [#3779](https://github.com/webdriverio/webdriverio/pull/3779) Docs: Note regarding Dot reporter test failure output in v5 ([@DT455](https://github.com/DT455))
* `wdio-junit-reporter`
  * [#3785](https://github.com/webdriverio/webdriverio/pull/3785) Update documentation for junit-reporter to reflect v5 options ([@naddison](https://github.com/naddison))
* Other
  * [#3786](https://github.com/webdriverio/webdriverio/pull/3786) [docs] typo fix ([@Armanio](https://github.com/Armanio))
* `webdriverio`
  * [#3777](https://github.com/webdriverio/webdriverio/pull/3777) fix typing data for waitFor* ([@klamping](https://github.com/klamping))

#### :house: Internal
* Other
  * [#3782](https://github.com/webdriverio/webdriverio/pull/3782) validate typings ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-appium-service`
  * [#3717](https://github.com/webdriverio/webdriverio/pull/3717) Appium service ([@MortenGregersen](https://github.com/MortenGregersen))

#### Committers: 8
- Arman ([@Armanio](https://github.com/Armanio))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dan Graham ([@dpgraham](https://github.com/dpgraham))
- Dave Taylor ([@DT455](https://github.com/DT455))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Morten Gregersen ([@MortenGregersen](https://github.com/MortenGregersen))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Nikolas Addison ([@naddison](https://github.com/naddison))

## 5.7.7 (2019-03-26)

#### :bug: Bug Fix
* `wdio-sauce-service`
  * [#3773](https://github.com/webdriverio/webdriverio/pull/3773) Fix auth for RDC tests ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#3772](https://github.com/webdriverio/webdriverio/pull/3772) #3771 wdio-document:updated the set proxy documentation ([@harithah](https://github.com/harithah))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Haritha Hari ([@harithah](https://github.com/harithah))

## 5.7.6 (2019-03-25)

#### :bug: Bug Fix
* `wdio-testingbot-service`
  * [#3767](https://github.com/webdriverio/webdriverio/pull/3767) fix auth in testingbot service ([@christian-bromann](https://github.com/christian-bromann))
  * [#3764](https://github.com/webdriverio/webdriverio/pull/3764) Fix main script path of testingbot service ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-sauce-service`, `webdriverio`
  * [#3757](https://github.com/webdriverio/webdriverio/pull/3757) Use new "saucelabs" NPM package to speak to Sauce API ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`, `wdio-config`, `wdio-sauce-service`
  * [#3756](https://github.com/webdriverio/webdriverio/pull/3756) Fail test if sauce service is used but no credentials are provided ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sync`
  * [#3750](https://github.com/webdriverio/webdriverio/pull/3750) wdio-sync: Cleanup stacktraces ([@WillBrock](https://github.com/WillBrock))
* `wdio-runner`
  * [#3740](https://github.com/webdriverio/webdriverio/pull/3740) wdio-runner: Allow custom reporter options to be overridden ([@WillBrock](https://github.com/WillBrock))

#### :memo: Documentation
* `webdriverio`
  * [#3768](https://github.com/webdriverio/webdriverio/pull/3768) webdriverio: return promise-wrapped async elements from $/$ in async mode ([@richsilv](https://github.com/richsilv))
  * [#3752](https://github.com/webdriverio/webdriverio/pull/3752) webdriverio: Remove commas from param doc block ([@WillBrock](https://github.com/WillBrock))
* Other
  * [#3766](https://github.com/webdriverio/webdriverio/pull/3766) login.spec.js syntax error ([@majaklajic](https://github.com/majaklajic))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Richard Silverton ([@richsilv](https://github.com/richsilv))
- Will Brock ([@WillBrock](https://github.com/WillBrock))
- [@majaklajic](https://github.com/majaklajic)

## 5.7.5 (2019-03-20)

#### :eyeglasses: Spec Compliancy
* `webdriver`, `webdriverio`
  * [#3698](https://github.com/webdriverio/webdriverio/pull/3698) webdriverio: added setWindowOuterSize command ([@krgolovan](https://github.com/krgolovan))

#### :bug: Bug Fix
* `webdriverio`
  * [#3742](https://github.com/webdriverio/webdriverio/pull/3742) Fix invalid urls ([@christian-bromann](https://github.com/christian-bromann))
  * [#3739](https://github.com/webdriverio/webdriverio/pull/3739) 'name' find strategy should be used if isMobile is used even when w3c is used ([@CrispusDH](https://github.com/CrispusDH))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kirill ([@krgolovan](https://github.com/krgolovan))
- Oleksii ([@CrispusDH](https://github.com/CrispusDH))

## 5.7.4 (2019-03-19)

#### :memo: Documentation
* `webdriverio`
  * [#3735](https://github.com/webdriverio/webdriverio/pull/3735) Add notice about modifier keys ([@jume-dev](https://github.com/jume-dev))

#### Committers: 1
- Robert Kranz ([@jume-dev](https://github.com/jume-dev))

## 5.7.3 (2019-03-17)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3733](https://github.com/webdriverio/webdriverio/pull/3733) Fixing press key code type to number ([@Gilad-Shnoor](https://github.com/Gilad-Shnoor))

#### :nail_care: Polish
* `webdriverio`
  * [#3716](https://github.com/webdriverio/webdriverio/pull/3716) webdriverio: Allow selectByVisibleText to work with newlines ([@WillBrock](https://github.com/WillBrock))

#### :memo: Documentation
* [#3731](https://github.com/webdriverio/webdriverio/pull/3731) Typo fix ([@jume-dev](https://github.com/jume-dev))
* [#3730](https://github.com/webdriverio/webdriverio/pull/3730) Fixed typo ([@venkatshukla](https://github.com/venkatshukla))
* [#3723](https://github.com/webdriverio/webdriverio/pull/3723) docs: Update custom reporter example ([@WillBrock](https://github.com/WillBrock))
* [#3712](https://github.com/webdriverio/webdriverio/pull/3712) edits to mobile selectors section ([@marckassay](https://github.com/marckassay))

#### Committers: 5
- Marc Kassay ([@marckassay](https://github.com/marckassay))
- Robert Kranz ([@jume-dev](https://github.com/jume-dev))
- Will Brock ([@WillBrock](https://github.com/WillBrock))
- [@Gilad-Shnoor](https://github.com/Gilad-Shnoor)
- [@venkatshukla](https://github.com/venkatshukla)

## 5.7.2 (2019-03-10)

#### :bug: Bug Fix
* `webdriverio`
  * [#3701](https://github.com/webdriverio/webdriverio/pull/3701) webdriverio: fix isDisplayed ([@mgrybyk](https://github.com/mgrybyk))
  * [#3697](https://github.com/webdriverio/webdriverio/pull/3697) webdriverio: fix options in multiremote ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-config`
  * [#3705](https://github.com/webdriverio/webdriverio/pull/3705) Also clear protocol if not set ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-spec-reporter`
  * [#3702](https://github.com/webdriverio/webdriverio/pull/3702) Issue 3416: Allow the spec reporter to expose multiple errors if present ([@nicholasbailey](https://github.com/nicholasbailey))
* `wdio-applitools-service`
  * [#3696](https://github.com/webdriverio/webdriverio/pull/3696) [FEATURE] Add ability to set serverUrl ([@kevinmcdonnell](https://github.com/kevinmcdonnell))
* `wdio-cli`, `wdio-config`, `wdio-reporter`
  * [#3625](https://github.com/webdriverio/webdriverio/pull/3625) Create a `outputDir` logs folder if doesn't exist ([@nami-varthakavi](https://github.com/nami-varthakavi))
* `wdio-browserstack-service`
  * [#3691](https://github.com/webdriverio/webdriverio/pull/3691)  browserstack-service: Closes [#3648](https://github.com/webdriverio/webdriverio/issues/3648) modifying name and reason ([@OriTheMan](https://github.com/OriTheMan))

#### :memo: Documentation
* [#3695](https://github.com/webdriverio/webdriverio/pull/3695) Corrected config field for filtering cucumber scenarios by tag ([@tompahoward](https://github.com/tompahoward))

#### :house: Internal
* `webdriverio`
  * [#3710](https://github.com/webdriverio/webdriverio/pull/3710) webdriverio: fix linter errors (fix failing build) ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-allure-reporter`, `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-cli`, `wdio-config`, `wdio-devtools-service`, `wdio-firefox-profile-service`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-local-runner`, `wdio-mocha-framework`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-spec-reporter`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#3706](https://github.com/webdriverio/webdriverio/pull/3706) Enforce more eslint rules ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 7
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kevin McDonnell ([@kevinmcdonnell](https://github.com/kevinmcdonnell))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Nami Varthakavi ([@nami-varthakavi](https://github.com/nami-varthakavi))
- Nicholas Bailey ([@nicholasbailey](https://github.com/nicholasbailey))
- Ori Efrati ([@OriTheMan](https://github.com/OriTheMan))
- Tom Howard ([@tompahoward](https://github.com/tompahoward))

## 5.7.1 (2019-03-07)

#### :eyeglasses: Spec Compliancy
* `webdriverio`
  * [#3680](https://github.com/webdriverio/webdriverio/pull/3680) webdriverio: fix control key w3c compliancy ([@LukoyanovE](https://github.com/LukoyanovE))
  * [#3601](https://github.com/webdriverio/webdriverio/pull/3601) webdriverio: isDisplayed() change for browsers without the endpoint ([@abjerstedt](https://github.com/abjerstedt))
* `webdriver`
  * [#3678](https://github.com/webdriverio/webdriverio/pull/3678) Fixed typo signalStrength ([@khanhdodang](https://github.com/khanhdodang))

#### :bug: Bug Fix
* `wdio-firefox-profile-service`
  * [#3692](https://github.com/webdriverio/webdriverio/pull/3692) wdio-firefox-profile: legacy handling ([@abjerstedt](https://github.com/abjerstedt))
* `webdriver`
  * [#3690](https://github.com/webdriverio/webdriverio/pull/3690) webdriver: Fix error matcher for edge 15-17 ([@abjerstedt](https://github.com/abjerstedt))
* `wdio-webdriver-mock-service`, `webdriverio`
  * [#3681](https://github.com/webdriverio/webdriverio/pull/3681) webdriverio: middleware refactor ([@abjerstedt](https://github.com/abjerstedt))

#### :memo: Documentation
* `wdio-sync`, `webdriverio`
  * [#3688](https://github.com/webdriverio/webdriverio/pull/3688) update to absolute references to webdriver-io-core ([@FelixZilber](https://github.com/FelixZilber))

#### Committers: 4
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))
- Evgeniy Lukoyanov ([@LukoyanovE](https://github.com/LukoyanovE))
- FeL ([@FelixZilber](https://github.com/FelixZilber))
- Khanh Do ([@khanhdodang](https://github.com/khanhdodang))

## 5.7.0 (2019-03-05)

#### :rocket: New Feature
* `wdio-cli`, `wdio-local-runner`, `wdio-reporter`, `wdio-runner`
  * [#3381](https://github.com/webdriverio/webdriverio/pull/3381) Retries per specfile ([@bennieswart](https://github.com/bennieswart))
* `webdriver`, `webdriverio`
  * [#3677](https://github.com/webdriverio/webdriverio/pull/3677) Appium saveRecordingScreen ([@mgrybyk](https://github.com/mgrybyk))

#### :bug: Bug Fix
* `wdio-runner`, `wdio-smoke-test-reporter`, `webdriverio`
  * [#3679](https://github.com/webdriverio/webdriverio/pull/3679) Add smoke test for custom reporters ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-logger`
  * [#3675](https://github.com/webdriverio/webdriverio/pull/3675) wdio-logger: fix webdriver log colors ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-webdriver-mock-service`, `webdriverio`
  * [#3662](https://github.com/webdriverio/webdriverio/pull/3662) Fixing Refetch to handle slow rerenders ([@abjerstedt](https://github.com/abjerstedt))

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#3676](https://github.com/webdriverio/webdriverio/pull/3676) wdio-allure-reporter: start end step ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-reporter`
  * [#3672](https://github.com/webdriverio/webdriverio/pull/3672) Issue 3416: pass multiple errors through to test stats for reporting if available ([@nicholasbailey](https://github.com/nicholasbailey))
* `wdio-mocha-framework`, `webdriverio`
  * [#3674](https://github.com/webdriverio/webdriverio/pull/3674) mochaOpts.require after wrapping functions with Fibers ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* [#3647](https://github.com/webdriverio/webdriverio/pull/3647) Update governance model ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 5
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))
- Bennie Swart ([@bennieswart](https://github.com/bennieswart))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Nicholas Bailey ([@nicholasbailey](https://github.com/nicholasbailey))

## 5.6.6 (2019-03-04)

#### :bug: Bug Fix
* `webdriverio`
  * [#3664](https://github.com/webdriverio/webdriverio/pull/3664) Fix for #3663: utils.js/getElementRect fallback ([@flunderpero](https://github.com/flunderpero))

#### Committers: 1
- [@flunderpero](https://github.com/flunderpero)

## 5.6.5 (2019-03-04)

#### :rocket: New Feature
* `webdriver`
  * [#3661](https://github.com/webdriverio/webdriverio/pull/3661) webdriver: Add strictSSL option ([@martinfrancois](https://github.com/martinfrancois))

#### :nail_care: Polish
* `wdio-jasmine-framework`
  * [#3669](https://github.com/webdriverio/webdriverio/pull/3669) Issue 3416: pass all failed expectations through from wdio-jasmine-framework ([@nicholasbailey](https://github.com/nicholasbailey))

#### :memo: Documentation
* `webdriverio`
  * [#3660](https://github.com/webdriverio/webdriverio/pull/3660) Fix optional tagging ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#3659](https://github.com/webdriverio/webdriverio/pull/3659) Add type mobileEmulationEnabled ([@tadashi0713](https://github.com/tadashi0713))
  * [#3657](https://github.com/webdriverio/webdriverio/pull/3657) Some grammatical and spelling fixes ([@Marketionist](https://github.com/Marketionist))
  * [#3653](https://github.com/webdriverio/webdriverio/pull/3653) docs: Update 'watch' example in CONTRIBUTING.md ([@klamping](https://github.com/klamping))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dmytro Shpakovskyi ([@Marketionist](https://github.com/Marketionist))
- François Martin ([@martinfrancois](https://github.com/martinfrancois))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Nicholas Bailey ([@nicholasbailey](https://github.com/nicholasbailey))
- Tadashi Nemoto ([@tadashi0713](https://github.com/tadashi0713))

## 5.6.4 (2019-02-28)

#### :eyeglasses: Spec Compliancy
* `webdriver`, `webdriverio`
  * [#3650](https://github.com/webdriverio/webdriverio/pull/3650) Fix execute script undefined argument ([@LukoyanovE](https://github.com/LukoyanovE))

#### :rocket: New Feature
* `webdriver`
  * [#3651](https://github.com/webdriverio/webdriverio/pull/3651) Pass custom agent and headers in every request ([@mariocasciaro](https://github.com/mariocasciaro))

#### :bug: Bug Fix
* `wdio-sync`, `webdriver`, `webdriverio`
  * [#3643](https://github.com/webdriverio/webdriverio/pull/3643) TypeScript version in doc and package.json ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* `eslint-plugin-wdio`, `wdio-allure-reporter`, `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-config`, `wdio-devtools-service`, `wdio-dot-reporter`, `wdio-firefox-profile-service`, `wdio-interface`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-lambda-runner`, `wdio-local-runner`, `wdio-logger`, `wdio-mocha-framework`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-smoke-test-service`, `wdio-spec-reporter`, `wdio-sumologic-reporter`, `wdio-sync`, `wdio-testingbot-service`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#3640](https://github.com/webdriverio/webdriverio/pull/3640) webdriverio: update minimum required nodejs version ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 4
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Evgeniy Lukoyanov ([@LukoyanovE](https://github.com/LukoyanovE))
- Mario Casciaro ([@mariocasciaro](https://github.com/mariocasciaro))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## 5.6.3 (2019-02-27)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3630](https://github.com/webdriverio/webdriverio/pull/3630) webdriver: fix setNetworkConnection ([@mgrybyk](https://github.com/mgrybyk))
  * [#3615](https://github.com/webdriverio/webdriverio/pull/3615) Assume JsonWP if platform cap is given ([@christian-bromann](https://github.com/christian-bromann))

#### :rocket: New Feature
* `wdio-cli`, `wdio-config`, `wdio-devtools-service`, `wdio-logger`, `wdio-runner`, `wdio-utils`, `webdriver`
  * [#3467](https://github.com/webdriverio/webdriverio/pull/3467) set logLevel per logger and disable driver logger ([@mgrybyk](https://github.com/mgrybyk))

#### :bug: Bug Fix
* `webdriverio`
  * [#3610](https://github.com/webdriverio/webdriverio/pull/3610) webdriverio: workaround for Safari to moveTo, getLocation, dragAndDrop, getSize ([@mgrybyk](https://github.com/mgrybyk))
  * [#3606](https://github.com/webdriverio/webdriverio/pull/3606) webdriverio: fix appium getvalue ([@mgrybyk](https://github.com/mgrybyk))
  * [#3624](https://github.com/webdriverio/webdriverio/pull/3624) webdriverio: fix scrollIntoView ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-cli`, `wdio-config`, `wdio-devtools-service`, `wdio-jasmine-framework`, `wdio-lambda-runner`, `wdio-local-runner`, `wdio-mocha-framework`, `wdio-runner`, `wdio-sauce-service`, `wdio-sumologic-reporter`, `wdio-sync`, `wdio-utils`
  * [#3619](https://github.com/webdriverio/webdriverio/pull/3619) Rename logger component name to match NPM package name ([@baruchvlz](https://github.com/baruchvlz))
* `wdio-cli`
  * [#3598](https://github.com/webdriverio/webdriverio/pull/3598) Add check for caps, add tests ([@erwinheitzman](https://github.com/erwinheitzman))
* `webdriverio`
  * [#3612](https://github.com/webdriverio/webdriverio/pull/3612) Strip Element objects from execute and executeAsync arguments ([@baruchvlz](https://github.com/baruchvlz))

#### :memo: Documentation
* Other
  * [#3635](https://github.com/webdriverio/webdriverio/pull/3635) website: shadow dom blog post ([@jrobinson01](https://github.com/jrobinson01))
  * [#3636](https://github.com/webdriverio/webdriverio/pull/3636) Update code sample at Selectors.md ([@shinxi](https://github.com/shinxi))
  * [#3609](https://github.com/webdriverio/webdriverio/pull/3609) Add Docker setup boilerplate. ([@blueimp](https://github.com/blueimp))
  * [#3595](https://github.com/webdriverio/webdriverio/pull/3595) add return type void for Browser and Element commands ([@CrispusDH](https://github.com/CrispusDH))
* `wdio-selenium-standalone-service`
  * [#3633](https://github.com/webdriverio/webdriverio/pull/3633) selenium-standalone-service: Fix typings after new sync/async type split ([@ablok](https://github.com/ablok))
* `wdio-sauce-service`
  * [#3628](https://github.com/webdriverio/webdriverio/pull/3628) Update README.md with Sauce Labs region parameter ([@kimek](https://github.com/kimek))
* `webdriverio`
  * [#3618](https://github.com/webdriverio/webdriverio/pull/3618) typings: fix promise return type ([@mgrybyk](https://github.com/mgrybyk))
  * [#3622](https://github.com/webdriverio/webdriverio/pull/3622) webdriverio: 📝 Correct isDisplayedInViewport docs ([@leeandher](https://github.com/leeandher))

#### :house: Internal
* `wdio-allure-reporter`, `wdio-cli`, `wdio-runner`, `webdriverio`
  * [#3629](https://github.com/webdriverio/webdriverio/pull/3629) Increase test coverage ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 11
- Arjan Blok ([@ablok](https://github.com/ablok))
- Baruch Velez ([@baruchvlz](https://github.com/baruchvlz))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- John Robinson ([@jrobinson01](https://github.com/jrobinson01))
- Jonathan Xi ([@shinxi](https://github.com/shinxi))
- Kimek ([@kimek](https://github.com/kimek))
- Leander Rodrigues ([@leeandher](https://github.com/leeandher))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Oleksii ([@CrispusDH](https://github.com/CrispusDH))
- Sebastian Tschan ([@blueimp](https://github.com/blueimp))

## 5.6.2 (2019-02-22)

#### :bug: Bug Fix
* `webdriverio`
  * [#3603](https://github.com/webdriverio/webdriverio/pull/3603) scrollIntoView uses a arrow function which breaks in IE ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#3600](https://github.com/webdriverio/webdriverio/pull/3600) Closes [#3460](https://github.com/webdriverio/webdriverio/issues/3460) ([@mariocasciaro](https://github.com/mariocasciaro))

#### :memo: Documentation
* `wdio-cli`, `webdriver`
  * [#3599](https://github.com/webdriverio/webdriverio/pull/3599) Add missing logLevel ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Mario Casciaro ([@mariocasciaro](https://github.com/mariocasciaro))

## 5.6.1 (2019-02-22)

#### :bug: Bug Fix
* `webdriverio`
  * [#3597](https://github.com/webdriverio/webdriverio/pull/3597) webdriverio: IE11 support in fetchElementByJSFunction ([@jrobinson01](https://github.com/jrobinson01))

#### :nail_care: Polish
* `webdriverio`
  * [#3591](https://github.com/webdriverio/webdriverio/pull/3591) webdriverio: handle null returned by function selectors ([@jrobinson01](https://github.com/jrobinson01))

#### :memo: Documentation
* [#3594](https://github.com/webdriverio/webdriverio/pull/3594) webdriverio: remove redundant [T] -> T ([@CrispusDH](https://github.com/CrispusDH))

#### Committers: 2
- John Robinson ([@jrobinson01](https://github.com/jrobinson01))
- Oleksii ([@CrispusDH](https://github.com/CrispusDH))

## 5.6.0 (2019-02-21)

#### :nail_care: Polish
* `webdriverio`
  * [#3583](https://github.com/webdriverio/webdriverio/pull/3583) Adding outputDir to standalone ([@Gilad-WT](https://github.com/Gilad-WT))
  * [#3548](https://github.com/webdriverio/webdriverio/pull/3548) webdriverio: extend wait command prefixes ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* `wdio-sync`, `webdriverio`
  * [#3577](https://github.com/webdriverio/webdriverio/pull/3577) typescript promise commands ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* `wdio-repl`, `wdio-utils`
  * [#3590](https://github.com/webdriverio/webdriverio/pull/3590) Update package list in readme ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@Gilad-WT](https://github.com/Gilad-WT)

## 5.5.0 (2019-02-20)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3587](https://github.com/webdriverio/webdriverio/pull/3587) Make metrics param in assertPerformance not required ([@christian-bromann](https://github.com/christian-bromann))

#### :rocket: New Feature
* `webdriverio`
  * [#3586](https://github.com/webdriverio/webdriverio/pull/3586) webdriverio: shadow$ and shadow$ commands ([@jrobinson01](https://github.com/jrobinson01))

#### :bug: Bug Fix
* `wdio-reporter`
  * [#3578](https://github.com/webdriverio/webdriverio/pull/3578) Move reporter directory creation up ([@klamping](https://github.com/klamping))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- John Robinson ([@jrobinson01](https://github.com/jrobinson01))
- Kevin Lamping ([@klamping](https://github.com/klamping))

## 5.4.20 (2019-02-20)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3585](https://github.com/webdriverio/webdriverio/pull/3585) Fix parameter definition for assertPerformance command ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-cli`, `wdio-config`, `wdio-runner`, `wdio-smoke-test-service`, `wdio-utils`
  * [#3584](https://github.com/webdriverio/webdriverio/pull/3584) Move initialiseServices and initialisePlugin into utils package ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriver`
  * [#3581](https://github.com/webdriverio/webdriverio/pull/3581) Remove old logOutput option ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#3576](https://github.com/webdriverio/webdriverio/pull/3576) Update getting started doc ([@klamping](https://github.com/klamping))
* [#3575](https://github.com/webdriverio/webdriverio/pull/3575) webdriverio: merge Coockie interface in .tpl.d.ts ([@CrispusDH](https://github.com/CrispusDH))

#### :house: Internal
* `wdio-jasmine-framework`
  * [#3582](https://github.com/webdriverio/webdriverio/pull/3582) Bump Jasmine to 3.3.0 ([@tritethunder](https://github.com/tritethunder))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Oleksii ([@CrispusDH](https://github.com/CrispusDH))
- hassan ([@tritethunder](https://github.com/tritethunder))

## 5.4.19 (2019-02-19)

#### :nail_care: Polish
* `wdio-sync`
  * [#3565](https://github.com/webdriverio/webdriverio/pull/3565) show better stack trace for commands ([@mgrybyk](https://github.com/mgrybyk))
* `webdriverio`
  * [#3571](https://github.com/webdriverio/webdriverio/pull/3571) webdriverio: user friendly waitUntil messages ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* `webdriverio`
  * [#3573](https://github.com/webdriverio/webdriverio/pull/3573) Add waitForX 'reverse' examples to docs ([@klamping](https://github.com/klamping))

#### Committers: 2
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## 5.4.18 (2019-02-18)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3533](https://github.com/webdriverio/webdriverio/pull/3533) webdriver: Fix HTTP method for createWindow command ([@catalandavid](https://github.com/catalandavid))

#### :bug: Bug Fix
* `webdriver`
  * [#3559](https://github.com/webdriverio/webdriverio/pull/3559) webdriver: unhandled promise rejection ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `webdriverio`
  * [#3540](https://github.com/webdriverio/webdriverio/pull/3540) Fix selectByVisibleText when element has multiple textNodes ([@erwinheitzman](https://github.com/erwinheitzman))
  * [#3558](https://github.com/webdriverio/webdriverio/pull/3558) webdriverio: add ios predicate and class chain direct selectors ([@janvennemann](https://github.com/janvennemann))
* `wdio-allure-reporter`, `wdio-mocha-framework`
  * [#3536](https://github.com/webdriverio/webdriverio/pull/3536) wdio-allure-reporter: capture before each and all hooks ([@mgrybyk](https://github.com/mgrybyk))
* `webdriver`
  * [#3555](https://github.com/webdriverio/webdriverio/pull/3555) webdriver: Adding a standard header 'Content-Length' to the headers list ([@nami-varthakavi](https://github.com/nami-varthakavi))

#### :memo: Documentation
* Other
  * [#3566](https://github.com/webdriverio/webdriverio/pull/3566) webdriverio: remove redundant Generic from Element ([@CrispusDH](https://github.com/CrispusDH))
  * [#3564](https://github.com/webdriverio/webdriverio/pull/3564) docs: Update CustomService example ([@WillBrock](https://github.com/WillBrock))
  * [#3550](https://github.com/webdriverio/webdriverio/pull/3550) docs: Add npm link to contributing guide ([@WillBrock](https://github.com/WillBrock))
* `webdriverio`
  * [#3549](https://github.com/webdriverio/webdriverio/pull/3549) docs: Remove reference to wdio-screenshot that is not compatible with v5 ([@WillBrock](https://github.com/WillBrock))
* `webdriver`
  * [#3525](https://github.com/webdriverio/webdriverio/pull/3525) Streamline typings ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* `webdriver`, `webdriverio`
  * [#3560](https://github.com/webdriverio/webdriverio/pull/3560) Fix error due to empty wd response ([@yepninja](https://github.com/yepninja))
* `wdio-cli`, `wdio-config`, `wdio-junit-reporter`
  * [#3528](https://github.com/webdriverio/webdriverio/pull/3528) Remove obsolete config prop deprecationWarnings ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 9
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- David Catalan ([@catalandavid](https://github.com/catalandavid))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Jan Vennemann ([@janvennemann](https://github.com/janvennemann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Nami Varthakavi ([@nami-varthakavi](https://github.com/nami-varthakavi))
- Oleksii ([@CrispusDH](https://github.com/CrispusDH))
- Will Brock ([@WillBrock](https://github.com/WillBrock))
- Yevgeny Petukhov ([@yepninja](https://github.com/yepninja))



## 5.4.16 (2019-02-07)

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#3521](https://github.com/webdriverio/webdriverio/pull/3521) wdio-allure-reporter: fix test skip ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* [#3522](https://github.com/webdriverio/webdriverio/pull/3522) Highlight talk from Selenium meetup ([@christian-bromann](https://github.com/christian-bromann))
* [#3519](https://github.com/webdriverio/webdriverio/pull/3519) Webdriverio: fix Hooks interface ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## 5.4.15 (2019-02-06)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3511](https://github.com/webdriverio/webdriverio/pull/3511) webdriver: hack to make chrome support element.saveScreenshot() ([@abjerstedt](https://github.com/abjerstedt))

#### :nail_care: Polish
* `wdio-allure-reporter`, `wdio-reporter`
  * [#3510](https://github.com/webdriverio/webdriverio/pull/3510) wdio-reporter: create outputDir directory if does not exist ([@klamping](https://github.com/klamping))

#### Committers: 2
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))
- Kevin Lamping ([@klamping](https://github.com/klamping))

## 5.4.14 (2019-02-05)

#### :bug: Bug Fix
* `wdio-config`
  * [#3496](https://github.com/webdriverio/webdriverio/pull/3496) Fix/3492 fix multi remote ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-runner`, `webdriverio`
  * [#3506](https://github.com/webdriverio/webdriverio/pull/3506) Fix Appium reload session ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* Other
  * [#3503](https://github.com/webdriverio/webdriverio/pull/3503) Update GettingStarted.md ([@pablopaul](https://github.com/pablopaul))
  * [#3508](https://github.com/webdriverio/webdriverio/pull/3508) Update GettingStarted.md ([@goatsy](https://github.com/goatsy))
  * [#3500](https://github.com/webdriverio/webdriverio/pull/3500) Update contributing docs now that v5 is fully released ([@klamping](https://github.com/klamping))
* `wdio-jasmine-framework`, `wdio-mocha-framework`, `wdio-selenium-standalone-service`
  * [#3497](https://github.com/webdriverio/webdriverio/pull/3497) fix Suite and Test typings for #3495 ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* `wdio-cli`
  * [#3501](https://github.com/webdriverio/webdriverio/pull/3501) wdio-cli: remove timeline option from reporters ([@klamping](https://github.com/klamping))

#### Committers: 5
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Paul Vincent Beigang ([@pablopaul](https://github.com/pablopaul))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@goatsy](https://github.com/goatsy)

## 5.4.13 (2019-02-02)

#### :rocket: New Feature
* `wdio-cli`, `wdio-config`
  * [#3468](https://github.com/webdriverio/webdriverio/pull/3468) Add automatically determination of the RDC hostname for US/EU ([@wswebcreation](https://github.com/wswebcreation))

#### :bug: Bug Fix
* `webdriver`
  * [#3487](https://github.com/webdriverio/webdriverio/pull/3487) Fixing element not found for iPhone ([@abjerstedt](https://github.com/abjerstedt))

#### Committers: 2
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))

## 5.4.12 (2019-02-02)

#### :bug: Bug Fix
* `webdriver`
  * [#3486](https://github.com/webdriverio/webdriverio/pull/3486) Fixing Regression for chrome stale elements ([@abjerstedt](https://github.com/abjerstedt))

#### Committers: 1
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))

## 5.4.11 (2019-02-02)

#### :nail_care: Polish
* `wdio-browserstack-service`, `wdio-config`
  * [#3485](https://github.com/webdriverio/webdriverio/pull/3485) Updating Browserstack to use SSL ([@abjerstedt](https://github.com/abjerstedt))

#### Committers: 1
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))

## 5.4.10 (2019-02-02)

#### :bug: Bug Fix
* `wdio-cli`
  * [#3422](https://github.com/webdriverio/webdriverio/pull/3422) Fix handling of yarn-managed node_modules ([@ccope](https://github.com/ccope))

#### :nail_care: Polish
* `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#3482](https://github.com/webdriverio/webdriverio/pull/3482) Updating stale element handling ([@abjerstedt](https://github.com/abjerstedt))
* `wdio-cli`
  * [#3469](https://github.com/webdriverio/webdriverio/pull/3469) Update config.js ([@daphnemcrossbrowser](https://github.com/daphnemcrossbrowser))
* `webdriverio`
  * [#3481](https://github.com/webdriverio/webdriverio/pull/3481) Fix 3480 ([@needforspeed](https://github.com/needforspeed))

#### :memo: Documentation
* Other
  * [#3474](https://github.com/webdriverio/webdriverio/pull/3474) Fixed type error for CSSProperty #3473 ([@dalenguyen](https://github.com/dalenguyen))
  * [#3470](https://github.com/webdriverio/webdriverio/pull/3470) add missing allure-reporter typings template ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-jasmine-framework`, `wdio-mocha-framework`, `wdio-selenium-standalone-service`
  * [#3477](https://github.com/webdriverio/webdriverio/pull/3477) Extendable typings ([@ablok](https://github.com/ablok))
* `webdriverio`
  * [#3478](https://github.com/webdriverio/webdriverio/pull/3478) changed browser.close() to browser.closeWindow() ([@balukov](https://github.com/balukov))

#### :house: Internal
* `webdriverio`
  * [#3484](https://github.com/webdriverio/webdriverio/pull/3484) webdriverio: adding more addCommand UTs ([@abjerstedt](https://github.com/abjerstedt))

#### Committers: 8
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))
- Arjan Blok ([@ablok](https://github.com/ablok))
- Cam Cope ([@ccope](https://github.com/ccope))
- Dale Nguyen ([@dalenguyen](https://github.com/dalenguyen))
- Daphne Magsby ([@daphnemcrossbrowser](https://github.com/daphnemcrossbrowser))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Yuncong Zhang ([@needforspeed](https://github.com/needforspeed))
- [@balukov](https://github.com/balukov)

## 5.4.9 (2019-01-31)

#### :bug: Bug Fix
* `webdriver`
  * [#3465](https://github.com/webdriverio/webdriverio/pull/3465) Fix type generation ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#3464](https://github.com/webdriverio/webdriverio/pull/3464) Exit program on next tick ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-junit-reporter`
  * [#3463](https://github.com/webdriverio/webdriverio/pull/3463) Fix image path for jenkins job ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#3461](https://github.com/webdriverio/webdriverio/pull/3461) wdio-allure-reporter: generate typings ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## 5.4.8 (2019-01-29)

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#3444](https://github.com/webdriverio/webdriverio/pull/3444) Fix allure multiremote ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-jasmine-framework`
  * [#3453](https://github.com/webdriverio/webdriverio/pull/3453) Fix jasmine logger name ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sauce-service`
  * [#3446](https://github.com/webdriverio/webdriverio/pull/3446) feat: add RDC API to service ([@wswebcreation](https://github.com/wswebcreation))
* `webdriver`, `webdriverio`
  * [#3428](https://github.com/webdriverio/webdriverio/pull/3428) Temporary workaround for addValue and setValue ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-mocha-framework`
  * [#3423](https://github.com/webdriverio/webdriverio/pull/3423) mocha-framework: add file property ([@ablok](https://github.com/ablok))
* `webdriverio`
  * [#3436](https://github.com/webdriverio/webdriverio/pull/3436) Improve regexp to support custom elements that contain multiple dashes ([@erwinheitzman](https://github.com/erwinheitzman))
  * [#3435](https://github.com/webdriverio/webdriverio/pull/3435) Fix the findStrategy for querying elements by tagname and content ([@erwinheitzman](https://github.com/erwinheitzman))

#### :memo: Documentation
* `wdio-junit-reporter`
  * [#3452](https://github.com/webdriverio/webdriverio/pull/3452) Update README.md ([@bearnecessities](https://github.com/bearnecessities))
* Other
  * [#3438](https://github.com/webdriverio/webdriverio/pull/3438) doc: fix xpath position ([@morokosi](https://github.com/morokosi))

#### Committers: 7
- Arjan Blok ([@ablok](https://github.com/ablok))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Danny ([@bearnecessities](https://github.com/bearnecessities))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- Yohei Kishimoto ([@morokosi](https://github.com/morokosi))

## 5.4.7 (2019-01-26)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3432](https://github.com/webdriverio/webdriverio/pull/3432) Add new performance command for sauce protocol ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## 5.4.6 (2019-01-26)

#### :nail_care: Polish
* `wdio-cli`, `wdio-interface`, `webdriverio`
  * [#3430](https://github.com/webdriverio/webdriverio/pull/3430) Allow displaying logs in realtime ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-logger`
  * [#3427](https://github.com/webdriverio/webdriverio/pull/3427) change logger imports/exports for optimized webpack bundling ([@jlipps](https://github.com/jlipps))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jonathan Lipps ([@jlipps](https://github.com/jlipps))

## 5.4.5 (2019-01-25)

#### :nail_care: Polish
* `wdio-cli`
  * [#3420](https://github.com/webdriverio/webdriverio/pull/3420) Fix param for getRunnerName ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## 5.4.4 (2019-01-25)

#### :house: Internal
* `wdio-applitools-service`
  * [#3419](https://github.com/webdriverio/webdriverio/pull/3419) use eyes.webdriverio fork version to support v5 ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## 5.4.3 (2019-01-24)

#### :bug: Bug Fix
* `wdio-allure-reporter`, `wdio-runner`
  * [#3418](https://github.com/webdriverio/webdriverio/pull/3418) Allow custom services with options ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-webdriver-mock-service`, `webdriverio`
  * [#3415](https://github.com/webdriverio/webdriverio/pull/3415) Fix waitForXXX calls ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-reporter`, `wdio-spec-reporter`
  * [#3417](https://github.com/webdriverio/webdriverio/pull/3417) Include link to job details page from Sauce Labs ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-runner`
  * [#3414](https://github.com/webdriverio/webdriverio/pull/3414) Ignore if logs can't be received ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#3413](https://github.com/webdriverio/webdriverio/pull/3413) Better identify runner when running mobile tests ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-config`, `wdio-runner`
  * [#3411](https://github.com/webdriverio/webdriverio/pull/3411) Better error handling when config file is corrupted ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#3409](https://github.com/webdriverio/webdriverio/pull/3409) Update typescript setup docs ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## 5.4.2 (2019-01-24)

#### :bug: Bug Fix
* `wdio-config`, `wdio-repl`, `wdio-sync`, `webdriver`, `webdriverio`
  * [#3403](https://github.com/webdriverio/webdriverio/pull/3403) Run custom commands in fiber context ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#3401](https://github.com/webdriverio/webdriverio/pull/3401) webdriverio: improve typing for remote() function ([@CrispusDH](https://github.com/CrispusDH))
* [#3402](https://github.com/webdriverio/webdriverio/pull/3402) Update TypeScript.md ([@domoritz](https://github.com/domoritz))
* [#3391](https://github.com/webdriverio/webdriverio/pull/3391) Updated Boilerplate Projects ([@amiya-pattnaik](https://github.com/amiya-pattnaik))

#### Committers: 4
- Amiya Pattanaik ([@amiya-pattnaik](https://github.com/amiya-pattnaik))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dominik Moritz ([@domoritz](https://github.com/domoritz))
- Oleksii ([@CrispusDH](https://github.com/CrispusDH))

## 5.4.1 (2019-01-23)

#### :nail_care: Polish
* `wdio-logger`
  * [#3398](https://github.com/webdriverio/webdriverio/pull/3398) guard against bad console method access in web version of logger ([@jlipps](https://github.com/jlipps))

#### Committers: 1
- Jonathan Lipps ([@jlipps](https://github.com/jlipps))

## 5.4.0 (2019-01-23)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3383](https://github.com/webdriverio/webdriverio/pull/3383) Add command to open a new top-level browsing context ([@christian-bromann](https://github.com/christian-bromann))
  * [#3374](https://github.com/webdriverio/webdriverio/pull/3374) Webdriver: Fix support on touchId documentation ([@marthinus-engelbrecht](https://github.com/marthinus-engelbrecht))
  * [#3375](https://github.com/webdriverio/webdriverio/pull/3375) Webdriver: Fix endpoint for Appium sendSms ([@marthinus-engelbrecht](https://github.com/marthinus-engelbrecht))

#### :bug: Bug Fix
* `wdio-cli`, `webdriver`
  * [#3377](https://github.com/webdriverio/webdriverio/pull/3377) Logging Changes ([@abjerstedt](https://github.com/abjerstedt))

#### :memo: Documentation
* Other
  * [#3397](https://github.com/webdriverio/webdriverio/pull/3397) webdriverio: update types for remote() ([@CrispusDH](https://github.com/CrispusDH))
  * [#3376](https://github.com/webdriverio/webdriverio/pull/3376) Added Accessibility Test to TypeScript boilerplate ([@dalenguyen](https://github.com/dalenguyen))
  * [#3261](https://github.com/webdriverio/webdriverio/pull/3261) Update GettingStarted.md ([@dmhalejr](https://github.com/dmhalejr))
  * [#3369](https://github.com/webdriverio/webdriverio/pull/3369) Update TypeScript.md ([@domoritz](https://github.com/domoritz))
* `wdio-allure-reporter`
  * [#3380](https://github.com/webdriverio/webdriverio/pull/3380) Fix allure docs ([@BorisOsipov](https://github.com/BorisOsipov))

#### :house: Internal
* `wdio-mocha-framework`
  * [#3394](https://github.com/webdriverio/webdriverio/pull/3394) wdio-mocha-framework: upgrading mocha version ([@abjerstedt](https://github.com/abjerstedt))
* `wdio-testingbot-service`
  * [#3382](https://github.com/webdriverio/webdriverio/pull/3382) Removing flaky test - this should not be a UT ([@abjerstedt](https://github.com/abjerstedt))
* Other
  * [#3371](https://github.com/webdriverio/webdriverio/pull/3371) Update --question.md ([@domoritz](https://github.com/domoritz))

#### Committers: 9
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dale Nguyen ([@dalenguyen](https://github.com/dalenguyen))
- David Hale ([@dmhalejr](https://github.com/dmhalejr))
- Dominik Moritz ([@domoritz](https://github.com/domoritz))
- Marthinus Engelbrecht ([@marthinus-engelbrecht](https://github.com/marthinus-engelbrecht))
- Nami Varthakavi ([@nami-varthakavi](https://github.com/nami-varthakavi))
- Oleksii ([@CrispusDH](https://github.com/CrispusDH))

## 5.3.5 (2019-01-18)

#### :nail_care: Polish
* `webdriver`
  * [#3364](https://github.com/webdriverio/webdriverio/pull/3364) Webdriver truncate log screenshot ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 1
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## 5.3.4 (2019-01-18)

#### :bug: Bug Fix
* `webdriver`
  * [#3368](https://github.com/webdriverio/webdriverio/pull/3368) Acknowledge responses with body as string ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#3352](https://github.com/webdriverio/webdriverio/pull/3352) wdio-browserstack-service: Remove erroneous call to resolve ([@torgeilo](https://github.com/torgeilo))

#### :nail_care: Polish
* `wdio-browserstack-service`
  * [#3353](https://github.com/webdriverio/webdriverio/pull/3353) wdio-browserstack-service: correcting error message ([@abjerstedt](https://github.com/abjerstedt))

#### :memo: Documentation
* `wdio-allure-reporter`
  * [#3363](https://github.com/webdriverio/webdriverio/pull/3363) Update allure docs ([@BorisOsipov](https://github.com/BorisOsipov))
* `webdriverio`
  * [#3356](https://github.com/webdriverio/webdriverio/pull/3356) Multiple fixes in typings ([@ablok](https://github.com/ablok))
* `webdriver`
  * [#3355](https://github.com/webdriverio/webdriverio/pull/3355) Fix some webdriver and webdriverio typings ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 6
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))
- Arjan Blok ([@ablok](https://github.com/ablok))
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Torgeir Lorange Østby ([@torgeilo](https://github.com/torgeilo))

## 5.3.3 (2019-01-16)

#### :eyeglasses: Spec Compliancy
* `webdriverio`
  * [#3340](https://github.com/webdriverio/webdriverio/pull/3340) Fix error message in webdriverio constants ([@ablok](https://github.com/ablok))

#### :bug: Bug Fix
* `webdriverio`
  * [#3349](https://github.com/webdriverio/webdriverio/pull/3349) missing lodash in dependencies require('lodash') node_modules/webdriverio/build/commands/element/$.js ([@jimmielemontgomery](https://github.com/jimmielemontgomery))
* `wdio-local-runner`, `wdio-runner`, `wdio-webdriver-mock-service`, `webdriverio`
  * [#3348](https://github.com/webdriverio/webdriverio/pull/3348) Fix multiremote with wdio testrunner ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-local-runner`
  * [#3341](https://github.com/webdriverio/webdriverio/pull/3341) Fix VSCode debug mode marking tests as failed ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `webdriver`
  * [#3338](https://github.com/webdriverio/webdriverio/pull/3338) Better error handling for webdriver responses ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* Other
  * [#3343](https://github.com/webdriverio/webdriverio/pull/3343) Fix addCommand typings and docs ([@mgrybyk](https://github.com/mgrybyk))
* `webdriverio`
  * [#3336](https://github.com/webdriverio/webdriverio/pull/3336) Tiny fixes of docs ([@yepninja](https://github.com/yepninja))
  * [#3335](https://github.com/webdriverio/webdriverio/pull/3335) More typings improvements ([@ablok](https://github.com/ablok))

#### Committers: 5
- Arjan Blok ([@ablok](https://github.com/ablok))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jim Montgomery ([@jimmielemontgomery](https://github.com/jimmielemontgomery))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Yevgeny Petukhov ([@yepninja](https://github.com/yepninja))

## 5.3.2 (2019-01-15)

#### :bug: Bug Fix
* `wdio-config`
  * [#3334](https://github.com/webdriverio/webdriverio/pull/3334) fix hook bug - Closes [#3333](https://github.com/webdriverio/webdriverio/issues/3333) ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## 5.3.1 (2019-01-15)

#### :eyeglasses: Spec Compliancy
* `webdriverio`
  * [#3331](https://github.com/webdriverio/webdriverio/pull/3331) webdriverio: Fixes webdriverio constants and adds tests for services, execArgv and capabilities ([@ablok](https://github.com/ablok))

#### :bug: Bug Fix
* `webdriverio`
  * [#3325](https://github.com/webdriverio/webdriverio/pull/3325) Don't do instanceof check for set cookie and rather look for type ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-repl`
  * [#3315](https://github.com/webdriverio/webdriverio/pull/3315) Bugfix service scope ([@stsvilik](https://github.com/stsvilik))
* `wdio-webdriver-mock-service`, `webdriver`
  * [#3312](https://github.com/webdriverio/webdriverio/pull/3312) Keep scope when calling custom command on browser ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#3321](https://github.com/webdriverio/webdriverio/pull/3321) wdio-allure-reporter: make step attachments optional ([@sskorol](https://github.com/sskorol))
* `webdriver`, `webdriverio`
  * [#3313](https://github.com/webdriverio/webdriverio/pull/3313) ability for addCommand to add to element scope ([@abjerstedt](https://github.com/abjerstedt))

#### :memo: Documentation
* `wdio-firefox-profile-service`, `webdriver`, `webdriverio`
  * [#3329](https://github.com/webdriverio/webdriverio/pull/3329) Remove desiredCapabilities in docs ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#3330](https://github.com/webdriverio/webdriverio/pull/3330) Mention isSelected for checkbox and radio inputs ([@kimek](https://github.com/kimek))
  * [#3326](https://github.com/webdriverio/webdriverio/pull/3326) webdriverio: Changed setCookie => setCookies in examples ([@ayoolaao](https://github.com/ayoolaao))
* `wdio-cli`, `wdio-config`, `wdio-junit-reporter`, `webdriverio`
  * [#3319](https://github.com/webdriverio/webdriverio/pull/3319) Add missing typings ([@ablok](https://github.com/ablok))
* Other
  * [#3320](https://github.com/webdriverio/webdriverio/pull/3320) Update ConfigurationFile.md ([@TuHuynhVan](https://github.com/TuHuynhVan))
  * [#3311](https://github.com/webdriverio/webdriverio/pull/3311) Fixes type generation for URL variables ([@ablok](https://github.com/ablok))
  * [#3308](https://github.com/webdriverio/webdriverio/pull/3308) Added new TypeScript boilerplate for WebdriverIO ([@dalenguyen](https://github.com/dalenguyen))
* `wdio-allure-reporter`
  * [#3247](https://github.com/webdriverio/webdriverio/pull/3247) README fix: move addAttachment args into a correct place ([@vgrigoruk](https://github.com/vgrigoruk))

#### Committers: 10
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))
- Arjan Blok ([@ablok](https://github.com/ablok))
- Ayoola Abimbola ([@ayoolaao](https://github.com/ayoolaao))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dale Nguyen ([@dalenguyen](https://github.com/dalenguyen))
- Kimek ([@kimek](https://github.com/kimek))
- Sergey Korol ([@sskorol](https://github.com/sskorol))
- Simon Tsvilik ([@stsvilik](https://github.com/stsvilik))
- Tu Huynh ([@TuHuynhVan](https://github.com/TuHuynhVan))
- Vitalii Grygoruk ([@vgrigoruk](https://github.com/vgrigoruk))

## 5.3.0 (2019-01-11)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3299](https://github.com/webdriverio/webdriverio/pull/3299) Vendor specific protocol commands for Sauce Labs ([@christian-bromann](https://github.com/christian-bromann))
  * [#3296](https://github.com/webdriverio/webdriverio/pull/3296) Fix HTTP method of getCurrentActivity ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-runner`
  * [#3303](https://github.com/webdriverio/webdriverio/pull/3303) Don't log error if service only contains a launcher ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `webdriverio`
  * [#3292](https://github.com/webdriverio/webdriverio/pull/3292) webdriverio: TypeScript defintions of $ - Closes [#3282](https://github.com/webdriverio/webdriverio/issues/3282) ([@mgrybyk](https://github.com/mgrybyk))
* Other
  * [#3302](https://github.com/webdriverio/webdriverio/pull/3302) Improve typings ([@ablok](https://github.com/ablok))

#### Committers: 3
- Arjan Blok ([@ablok](https://github.com/ablok))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## 5.2.8 (2019-01-10)

#### :bug: Bug Fix
* `webdriver`, `webdriverio`
  * [#3290](https://github.com/webdriverio/webdriverio/pull/3290) Do mobile detection in webdriver package ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#3285](https://github.com/webdriverio/webdriverio/pull/3285) Select by index fix ([@simonwilson1985](https://github.com/simonwilson1985))

#### :memo: Documentation
* `wdio-cli`, `wdio-config`, `wdio-logger`, `webdriver`
  * [#3286](https://github.com/webdriverio/webdriverio/pull/3286) Loglevel ([@StephenABoyd](https://github.com/StephenABoyd))

#### :house: Internal
* [#3284](https://github.com/webdriverio/webdriverio/pull/3284) package.json - Fixed Jest's testMatch pattern to also work in Windows ([@urig](https://github.com/urig))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Simon Wilson ([@simonwilson1985](https://github.com/simonwilson1985))
- Uri Goldstein ([@urig](https://github.com/urig))
- [@StephenABoyd](https://github.com/StephenABoyd)

## 5.2.7 (2019-01-09)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#3271](https://github.com/webdriverio/webdriverio/pull/3271) Fix instance prototype and enable custom commands for elements ([@Gilad-WT](https://github.com/Gilad-WT))

#### :nail_care: Polish
* `webdriverio`
  * [#3268](https://github.com/webdriverio/webdriverio/pull/3268) webdriverio: utils.js - using "name" in element locator cause an InvalidSelector Error to be … ([@simonwilson1985](https://github.com/simonwilson1985))

#### :memo: Documentation
* `webdriverio`
  * [#3278](https://github.com/webdriverio/webdriverio/pull/3278) Typescript definition ([@StephenABoyd](https://github.com/StephenABoyd))
* Other
  * [#3281](https://github.com/webdriverio/webdriverio/pull/3281) Remove semicolon from Debugging.md ([@dhyey35](https://github.com/dhyey35))

#### Committers: 4
- Dhyey Thakore  ([@dhyey35](https://github.com/dhyey35))
- Simon Wilson ([@simonwilson1985](https://github.com/simonwilson1985))
- [@Gilad-WT](https://github.com/Gilad-WT)
- [@StephenABoyd](https://github.com/StephenABoyd)

## 5.2.6 (2019-01-08)

#### :nail_care: Polish
* `webdriverio`
  * [#3276](https://github.com/webdriverio/webdriverio/pull/3276) webdriverio: waitForDisplayed() now inherits isDisplayed() logic ([@abjerstedt](https://github.com/abjerstedt))

#### Committers: 1
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))

## 5.2.5 (2019-01-07)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-sauce-service`, `wdio-testingbot-service`, `webdriver`
  * [#3275](https://github.com/webdriverio/webdriverio/pull/3275) Fix config key naming host =>hostname ([@BorisOsipov](https://github.com/BorisOsipov))
* `webdriverio`
  * [#3273](https://github.com/webdriverio/webdriverio/pull/3273) webdriverio: fixing waitForDisplayed to immediately return false ([@abjerstedt](https://github.com/abjerstedt))

#### :nail_care: Polish
* `wdio-webdriver-mock-service`, `webdriverio`
  * [#3244](https://github.com/webdriverio/webdriverio/pull/3244) webdriverio: isDisplayed fix to return false on non existing elements ([@abjerstedt](https://github.com/abjerstedt))

#### :memo: Documentation
* [#3272](https://github.com/webdriverio/webdriverio/pull/3272) Update TypeScript.md docs ([@BorisOsipov](https://github.com/BorisOsipov))

#### Committers: 2
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))

## 5.2.4 (2019-01-07)

#### :bug: Bug Fix
* `webdriver`
  * [#3266](https://github.com/webdriverio/webdriverio/pull/3266) Properly extend base protocol with extension command definitions. ([@martomo](https://github.com/martomo))

#### Committers: 1
- Martijn Dijkhuizen ([@martomo](https://github.com/martomo))

## 5.2.3 (2019-01-06)

#### :bug: Bug Fix
* `wdio-jasmine-framework`
  * [#3249](https://github.com/webdriverio/webdriverio/pull/3249) Jasmine Framework improperly configures test randomization ([@b-smets](https://github.com/b-smets))

#### :nail_care: Polish
* `webdriverio`
  * [#3251](https://github.com/webdriverio/webdriverio/pull/3251) webdriverio: updating screenshot call to handle backslash ([@StephenABoyd](https://github.com/StephenABoyd))
* `wdio-reporter`
  * [#3253](https://github.com/webdriverio/webdriverio/pull/3253) wdio-reporter: updating pending test uid if existing ([@StephenABoyd](https://github.com/StephenABoyd))

#### :memo: Documentation
* `webdriver`
  * [#3262](https://github.com/webdriverio/webdriverio/pull/3262) Revised Chromium command definitions to improve usability ([@martomo](https://github.com/martomo))
* Other
  * [#3258](https://github.com/webdriverio/webdriverio/pull/3258) Missing install of  @babel/core ([@wswebcreation](https://github.com/wswebcreation))
  * [#3260](https://github.com/webdriverio/webdriverio/pull/3260) Updating options docs ([@BorisOsipov](https://github.com/BorisOsipov))
* `wdio-config`
  * [#3254](https://github.com/webdriverio/webdriverio/pull/3254) Fix package name and fix typos ([@mo](https://github.com/mo))

#### Committers: 6
- Bart Smets ([@b-smets](https://github.com/b-smets))
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Martijn Dijkhuizen ([@martomo](https://github.com/martomo))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@StephenABoyd](https://github.com/StephenABoyd)
- molsson ([@mo](https://github.com/mo))

## 5.2.2 (2019-01-04)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#3250](https://github.com/webdriverio/webdriverio/pull/3250) Update other commands which allow/expect 'null' as value. ([@martomo](https://github.com/martomo))

#### :memo: Documentation
* [#3227](https://github.com/webdriverio/webdriverio/pull/3227) Undefined CSS classes for optional command parameters ([@cuki](https://github.com/cuki))

#### Committers: 2
- Cuki ([@cuki](https://github.com/cuki))
- Martijn Dijkhuizen ([@martomo](https://github.com/martomo))

## 5.2.1 (2019-01-04)

#### :bug: Bug Fix
* `wdio-jasmine-framework`
  * [#3240](https://github.com/webdriverio/webdriverio/pull/3240) Don't let jasmine swallow errors by ignoring its expectationResultHandler ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-junit-reporter`
  * [#3248](https://github.com/webdriverio/webdriverio/pull/3248) Add missing @wdio/reporter dep to junit reporter ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriver`
  * [#3239](https://github.com/webdriverio/webdriverio/pull/3239) Unable pass null value to switchToFrame command for WebDriver ([@martomo](https://github.com/martomo))

#### :memo: Documentation
* [#3243](https://github.com/webdriverio/webdriverio/pull/3243) Set google analytics script into footer of website ([@christian-bromann](https://github.com/christian-bromann))
* [#3245](https://github.com/webdriverio/webdriverio/pull/3245) docs: Fix element commnads referencing the browser object ([@WillBrock](https://github.com/WillBrock))
* [#3237](https://github.com/webdriverio/webdriverio/pull/3237) Update ConfigurationFile to use goog:chromeOptions ([@vinchbr](https://github.com/vinchbr))
* [#3236](https://github.com/webdriverio/webdriverio/pull/3236) updating blog post v5 release, thank you section ([@TuHuynhVan](https://github.com/TuHuynhVan))

#### :house: Internal
* `wdio-cli`
  * [#3242](https://github.com/webdriverio/webdriverio/pull/3242) set NODE_ENV to production to not compile source map for NPM code ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#3241](https://github.com/webdriverio/webdriverio/pull/3241) webdriver: update typing to contain capabilities ([@StephenABoyd](https://github.com/StephenABoyd))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Martijn Dijkhuizen ([@martomo](https://github.com/martomo))
- Tu Huynh ([@TuHuynhVan](https://github.com/TuHuynhVan))
- Vicenzo Naves ([@vinchbr](https://github.com/vinchbr))
- Will Brock ([@WillBrock](https://github.com/WillBrock))
- [@StephenABoyd](https://github.com/StephenABoyd)

## 5.2.0 (2019-01-03)

#### :rocket: New Feature
* `webdriver`, `webdriverio`
  * [#3215](https://github.com/webdriverio/webdriverio/pull/3215) Properly implement 'setTimeout' function and /timeouts endpoints ([@martomo](https://github.com/martomo))

#### :bug: Bug Fix
* `webdriverio`
  * [#3226](https://github.com/webdriverio/webdriverio/pull/3226) Updated findStrategy ([@Gilad-WT](https://github.com/Gilad-WT))
* `wdio-runner`
  * [#3219](https://github.com/webdriverio/webdriverio/pull/3219) wdio-runner: Fix custom reporter options not being used ([@WillBrock](https://github.com/WillBrock))

#### :nail_care: Polish
* `webdriver`, `webdriverio`
  * [#3225](https://github.com/webdriverio/webdriverio/pull/3225) Improve command definitions for available protocols ([@martomo](https://github.com/martomo))
* `webdriver`
  * [#3216](https://github.com/webdriverio/webdriverio/pull/3216) Setting of just window position or size instead of both using 'setWindowRect' ([@martomo](https://github.com/martomo))

#### :memo: Documentation
* [#3231](https://github.com/webdriverio/webdriverio/pull/3231) docs: Update custom service export ([@WillBrock](https://github.com/WillBrock))
* [#3220](https://github.com/webdriverio/webdriverio/pull/3220) webdriverio: Update changelog for cli array arguments ([@WillBrock](https://github.com/WillBrock))

#### :house: Internal
* `webdriver`, `webdriverio`
  * [#3218](https://github.com/webdriverio/webdriverio/pull/3218) Webdriver and WebdriverIO Typing ([@StephenABoyd](https://github.com/StephenABoyd))

#### Committers: 4
- Martijn Dijkhuizen ([@martomo](https://github.com/martomo))
- Will Brock ([@WillBrock](https://github.com/WillBrock))
- [@Gilad-WT](https://github.com/Gilad-WT)
- [@StephenABoyd](https://github.com/StephenABoyd)

## 5.1.2 (2018-12-30)

#### :bug: Bug Fix
* `wdio-cli`
  * [#3211](https://github.com/webdriverio/webdriverio/pull/3211) fix hostname cli param ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## 5.1.1 (2018-12-30)

#### :bug: Bug Fix
* `webdriver`
  * [#3208](https://github.com/webdriverio/webdriverio/pull/3208) Fix bug where Geckodriver requires POST requests to have a valid JSON body ([@klipstein](https://github.com/klipstein))

#### :memo: Documentation
* [#3206](https://github.com/webdriverio/webdriverio/pull/3206) Docs: fix Getting Started guide (part 2) ([@goofballLogic](https://github.com/goofballLogic))
* [#3202](https://github.com/webdriverio/webdriverio/pull/3202) fix: this PR fixes a bug on phones  ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 3
- Andrew Stewart Gibson ([@goofballLogic](https://github.com/goofballLogic))
- Tobias von Klipstein ([@klipstein](https://github.com/klipstein))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))

## 5.1.0 (2018-12-28)

#### :rocket: New Feature
* `webdriver`
  * [#3135](https://github.com/webdriverio/webdriverio/pull/3135) Add Chromium specific commands to browser object ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-config`
  * [#3197](https://github.com/webdriverio/webdriverio/pull/3197) Add support for .es6 file types ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#3190](https://github.com/webdriverio/webdriverio/pull/3190) Only set body if a body is required ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-jasmine-framework`
  * [#3179](https://github.com/webdriverio/webdriverio/pull/3179) Fix jasmine error reporting ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-config`, `wdio-junit-reporter`, `wdio-local-runner`, `wdio-reporter`, `wdio-runner`, `webdriverio`
  * [#3178](https://github.com/webdriverio/webdriverio/pull/3178) Fix unknwon logFile issue + add documentation on logDir option ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#3201](https://github.com/webdriverio/webdriverio/pull/3201) webdriverio: added error messages to the waitForExist call ([@StephenABoyd](https://github.com/StephenABoyd))
* `webdriver`, `webdriverio`
  * [#3176](https://github.com/webdriverio/webdriverio/pull/3176) webdriver: Change getCurrentUrl to getUrl ([@WillBrock](https://github.com/WillBrock))

#### :memo: Documentation
* `wdio-cli`
  * [#3199](https://github.com/webdriverio/webdriverio/pull/3199) Disable unsupported cli wizard options ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#3195](https://github.com/webdriverio/webdriverio/pull/3195) webdriverio: Update upgrade instructions ([@WillBrock](https://github.com/WillBrock))
* `webdriverio`
  * [#3184](https://github.com/webdriverio/webdriverio/pull/3184) webdriverio: getCssPropertry changed to getCSSProperty ([@WillBrock](https://github.com/WillBrock))
  * [#3180](https://github.com/webdriverio/webdriverio/pull/3180) webdriverio: Correct deleteCookies example ([@WillBrock](https://github.com/WillBrock))
* `wdio-cli`, `wdio-config`, `wdio-junit-reporter`, `wdio-local-runner`, `wdio-reporter`, `wdio-runner`, `webdriverio`
  * [#3178](https://github.com/webdriverio/webdriverio/pull/3178) Fix unknwon logFile issue + add documentation on logDir option ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* [#3175](https://github.com/webdriverio/webdriverio/pull/3175) Garbage in npm wdio packages ([@BorisOsipov](https://github.com/BorisOsipov))

#### Committers: 4
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Will Brock ([@WillBrock](https://github.com/WillBrock))
- [@StephenABoyd](https://github.com/StephenABoyd)



## 5.0.3 (2018-12-23)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-config`, `wdio-interface`, `wdio-local-runner`, `wdio-runner`, `wdio-webdriver-mock-service`, `webdriverio`
  * [#3171](https://github.com/webdriverio/webdriverio/pull/3171) Fix middleware regression and add smoke tests ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* [#3165](https://github.com/webdriverio/webdriverio/pull/3165) Ensure GITHUB_AUTH token is set to generate changelogs ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dmytro Shpakovskyi ([@Marketionist](https://github.com/Marketionist))

## v5.0.2 (2018-12-22)

#### :memo: Documentation
* [#3163](https://github.com/webdriverio/webdriverio/pull/3163) Name mobile variable "driver" instead of "browser" ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v5.0.1 (2018-12-21)

#### :bug: Bug Fix
* `wdio-runner`
  * [#3162](https://github.com/webdriverio/webdriverio/pull/3162) wdio-runner: Fix looking at caps as an array ([@WillBrock](https://github.com/WillBrock))

#### :memo: Documentation
* [#3161](https://github.com/webdriverio/webdriverio/pull/3161) Update API.md ([@wobbleRed](https://github.com/wobbleRed))

#### Committers: 2
- Derek Allred ([@wobbleRed](https://github.com/wobbleRed))
- Will Brock ([@WillBrock](https://github.com/WillBrock))

## v5.0.0 (2018-12-20)

This version comes with a variety of technical changes that might affect the functionality of 3rd party WebdriverIO packages from the community. If such a package causes problems after the update, please raise an issue in the repository of that package and __not__ in this repository. You can find a list of officially maintained packages [here](https://github.com/webdriverio/webdriverio/blob/master/README.md#packages).

#### :boom: Breaking Change
* moved `wdio` cli command from [`webdriverio`](https://www.npmjs.com/package/webdriverio) package to [`@wdio/cli`](https://www.npmjs.com/package/@wdio/cli)
* commands are scoped to `browser` and `element` - no selector property on commands anymore
  ```js
  // v4
  browser.click('#myElem')
  ```
  ```js
  // v5 and upwards
  const elem = $('#myElem')
  elem.click()
  ```
* no command chaining anymore (in standalone and wdio mode)
  ```js
  // v4 (standalone/async mode)
  browser
    .url('https://duckduckgo.com/')
    .setValue('#search_form_input_homepage', 'WebdriverIO')
    // ...
  ```
  ```js
  // v5 (standalone/async mode)
  await browser.url('https://duckduckgo.com/')
  const elem = await browser.$('#search_form_input_homepage')
  await elem.click()
  await elem.setValue('WebdriverIO')
  ```
* every protocol command returns a `value` property instead of raw driver response
  ```js
  // v4
  const result = browser.execute(() => 1 + 1)
  console.log(result)
  // outputs:
  // { sessionId: '02aee149a1a421b81598ff2a3b90e33d',
  //   value: 2,
  //   _status: 0 }
  ```
  ```js
  // v5
  const result = browser.execute(() => 1 + 1)
  console.log(result) // outputs: 2
  ```
* the `remote` and `multiremote` methods to initiate a driver instance now also start the driver session and therefore return a promise (no `init` command anymore)
  ```js
  // v4
  import { remote } from 'webdriverio'
  const driver = remote({ ... })
  driver.init().url('https://webdriver.io').end()
  ```
  ```js
  // v5
  import { remote } from 'webdriverio'
  const driver = await remote({ ... })
  await driver.url('https://webdriver.io')
  await driver.deleteSession()
  ```
* command changes: over the years WebdriverIO added more and more commands for different automation protocols without applying a pattern to it which resulted in having a bunch of duplication and inconsistent naming, even though the list looks exhausting, most of the commands that have changed were used internally
    * renamed commands:
        * `isVisible` → `isDisplayed`
        * `isVisibleWithinViewport` → `isDisplayedInViewport`
        * `waitForVisible` → `waitForDisplayed`
        * `clearElement` → `clearValue`
        * `moveToObject` → `moveTo` (element scope only)
        * `setCookie`, `getCookie`, `deleteCookie` → `setCookies`, `getCookies`, `deleteCookies`
        * `getElementSize` → `getSize`
        * `source`, `getSource` → `getPageSource`
        * `title` → `getTitle`
        * `actions` → `performActions` (WebDriver protocol only)
        * `alertAccept` → `acceptAlert`
        * `alertDismiss` → `dismissAlert`
        * `alertText` → `getAlertText`, `sendAlertText`
        * `applicationCacheStatus` → `getApplicationCacheStatus` (JsonWireProtocol only)
        * `cookie` → `getAllCookies`, `addCookie`, `deleteCookie`
        * `getCssProperty` → `getCSSProperty`
        * `element` → `findElement`
        * `elements` → `findElements`
        * `elementActive` → `getActiveElement`
        * `elementIdAttribute` → `getElementAttribute`
        * `elementIdClear` → `elementClear`
        * `elementIdClick` → `elementClick`
        * `elementIdCssProperty` → `getElementCSSValue`
        * `elementIdDisplayed` → `isElementDisplayed`
        * `elementIdElement` → `findElementFromElement`
        * `elementIdElements` → `findElementsFromElement`
        * `elementIdEnabled` → `isElementEnabled`
        * `elementIdLocation` → `getElementLocation`
        * `elementIdLocationInView` → `getElementLocationInView` (JsonWireProtocol only)
        * `elementIdName` → `getElementTagName`
        * `elementIdProperty` → `getElementProperty`
        * `elementIdRect` → `getElementRect`
        * `elementIdScreenshot` → `takeElementScreenshot`
        * `elementIdSelected` → `isElementSelected`
        * `elementIdSize` → `getElementSize` (JsonWireProtocol only)
        * `elementIdText` → `getElementText`
        * `elementIdValue` → `elementSendKeys`
        * `frame` → `switchToFrame`
        * `frameParent` → `switchToParentFrame`
        * `timeoutsAsyncScript`, `timeoutsImplicitWait` → `setAsyncTimeout`, `setImplicitTimeout` (JsonWireProtocol only)
        * `getLocationInView` → `getElementLocationInView` (JsonWireProtocol only)
        * `imeActivate` → `activateIME` (JsonWireProtocol only)
        * `imeActivated` → `isIMEActivated` (JsonWireProtocol only)
        * `imeActiveEngine` → `getActiveEngine` (JsonWireProtocol only)
        * `imeAvailableEngines` → `getAvailableEngines` (JsonWireProtocol only)
        * `imeDeactivated` → `deactivateIME` (JsonWireProtocol only)
        * `localStorage` → `getLocalStorage`, `setLocalStorage`, `clearLocalStorage`, `getLocalStorageItem`, `deleteLocalStorageItem` (JsonWireProtocol only)
        * `localStorageSize` → `getLocalStorageSize` (JsonWireProtocol only)
        * `sessionStorage` → `getSessionStorage`, `setSessionStorage`, `clearSessionStorage`, `getSessionStorageItem`, `deleteSessionStorageItem` (JsonWireProtocol only)
        * `sessionStorageSize` → `getSessionStorageSize` (JsonWireProtocol only)
        * `location` → `getElementLocation`
        * `log` → `getLogs` (JsonWireProtocol only)
        * `logTypes` → `getLogTypes` (JsonWireProtocol only)
        * `screenshot` → `takeScreenshot`
        * `session` → `getSession`, `deleteSession` (JsonWireProtocol only)
        * `sessions` → `getSessions`
        * `submit` → `elementSubmit`
        * `timeouts` → `getTimeouts`, `setTimeouts`
        * `window`, `switchToWindow` → `switchWindow`
        * `windowHandle` → `closeWindow`, `getWindowHandle`
        * `windowHandles` → `getWindowHandles`
        * `windowHandleFullscreen` → `fullscreenWindow`
        * `windowHandleMaximize` → `maximizeWindow`
        * `windowHandlePosition` → `setWindowPosition`, `getWindowPosition` (JsonWireProtocol only), `setWindowRect`, `getWindowRect` (WebDriver protocol only)
        * `windowHandleSize` → `setWindowSize`, `getWindowSize` (JsonWireProtocol only), `setWindowRect`, `getWindowRect` (WebDriver protocol only)
        * `hasFocus` → `isFocused`
        * `end` → `deleteSession`
        * `reload` → `reloadSession`
        * `scroll` → `scrollIntoView`
        * `context` → `getContext`, `switchContext`
        * `contexts` → `getContexts`
        * `currentActivity` → `getCurrentActivity`
        * `deviceKeyEvent` → `sendKeyEvent`
        * `getAppStrings` → `getStrings`
        * `hideDeviceKeyboard` → `hideKeyboard`
        * `hold` → `longPressKeyCode`
        * `launch` → `launchApp`
        * `performMultiAction` → `multiTouchPerform`
        * `pressKeycode` → `pressKeyCode`
        * `rotate` → `rotateDevice`
        * `setImmediateValue` → `setValueImmediate`
        * `settings` → `getSettings`, `updateSettings`
        * `strings` → `getStrings`
        * `toggleTouchIdEnrollment` → `toggleEnrollTouchId`
    * removed commands (_Note: there are chances that removed commands will come back if their use case scenario seem to be reasonable._):
        * `doDoubleClick`, `doubleClick` - replace with double `click` command or `performActions` command
        * `dragAndDrop` - replace with `performActions` command
        * `leftClick`, `middleClick`, `rightClick` - replace with `performActions` command
        * `selectByValue` - replace with `selectByAttribute('value')`
        * `selectorExecute`, `selectorExecuteAsync` - replace with `execute(elem)`
        * `submit` - replace by clicking on submit button
        * `getCurrentDeviceActivity` - replace by `getCurrentActivity`
        * `release` - replace by `touchAction` command
        * `swipe`, `swipeDown`, `swipeLeft`, `swipeRight`, `swipeUp` - replace by `touchAction` command
        * `performTouchAction` - replace by `touchPerform`
        * with no replacements: `init`, `buttonPress`, `file`, `chooseFile`, `uploadFile`, `endAll`, `getCommandHistory`, `waitForSelected`, `waitForText`, `waitForValue`, `getGridNodeDetails`, `gridProxyDetails`, `gridTestSession`, `hold`
    * new commands:
        * WebDriver / JsonWireProtocol: `minimizeWindow`
        * Appium: `startRecordingScreen`, `stopRecordingScreen`, `isKeyboardShown`, `getSystemBars`, `getDisplayDensity`, `endCoverage`, `replaceValue`, `receiveAsyncResponse`, `gsmCall`, `gsmSignal`, `gsmVoice`, `sendSms`, `fingerPrint`
* adding custom commands are scoped to the prototype they are being added to
  ```js
  // v4
  browser.addCommand('myCommand', () => { ... })
  const elem = $('myElem')
  console.log(typeof browser.myCommand) // outputs "function"
  console.log(typeof elem.myCommand) // outputs "function"
  ```
  ```js
  // v5
  browser.addCommand('myCommand', () => { ... })
  const elem = $('myElem')
  console.log(typeof browser.myCommand) // outputs "function"
  console.log(typeof elem.myCommand) // outputs "undefined"
  elem.addCommand('myElemCommand', () => { ... })
  console.log(typeof elem.myElemCommand) // outputs "function"
  const elem2 = $('myOtherElem')
  console.log(typeof elem2.myElemCommand) // outputs "undefined"
  ```

* spec and suite cli arguments are now passed as an array, e.g.
  ```js
  // v4
  ./node_modules/.bin/wdio wdio.conf.js --spec ./tests/foobar.js,./tests/baz.js

  ./node_modules/.bin/wdio wdio.conf.js --suite FooBar,BarBaz

  ./node_modules/.bin/wdio wdio.conf.js --suite FooBar
  ```
  ```js
  // v5
  ./node_modules/.bin/wdio wdio.conf.js --spec ./tests/foobar.js ./tests/baz.js

  ./node_modules/.bin/wdio wdio.conf.js --suite FooBar BarBaz

  ./node_modules/.bin/wdio wdio.conf.js --suite FooBar
  ```

* custom configuration for services or reporters are now directly applied to the config list, e.g.
  ```js
  // ...
  reporters: [
    'spec',
    [
      'junit',
      { outputDir: __dirname + '/junit_logs' }
    ]
  ],
  // ...
  ```

#### :eyeglasses: Spec Compliancy
* implemented parameter assertions for protocol commands
* full W3C WebDriver compliancy
* full Appium and Mobile JSONWire Protocol compliancy
* simplified protocol command maintenance by defining commands, their parameters and response values within simple [json constructs](https://github.com/webdriverio/webdriverio/tree/master/packages/webdriver/protocol)
* instead of switching protocol within a running session, WebdriverIO now determines the supported protocol by the driver based on the create session response

#### :rocket: New Feature
* new package `@wdio/applitools-service` for simple visual regression testing with [Applitools](https://applitools.com/)
* new package `eslint-plugin-wdio` for WebdriverIO specific linting rules for [ESLint](https://eslint.org/)
* `@wdio/devtools-service` now with frontend performance testing capabilities (see [example](https://github.com/christian-bromann/webdriverio-performance-testing))
* new `region` [option](https://github.com/webdriverio/webdriverio/blob/cb-changelog/examples/wdio.conf.js#L29-L33) to simply run tests on SauceLabs in different datacenters
* [`debug`](http://beta.webdriver.io/docs/api/browser/debug.html) command now allows to connect the runner with the [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/) application for more indepth debugging
* decoupling of `@wdio/sync` package from framework adapters so that there is no need to install [`fibers`](https://www.npmjs.com/package/fibers) when you want to run your commands with async/await
* autofetching of all provides log types
* auto retry mechansim for all command requests
* auto refetch mechanism for stale elements
* simplified reattachment to existing sessions with `attach` functionality
* integrated and auto maintained [TypeScript](https://www.typescriptlang.org/) definitions
* wdio testrunner fails if no spec files were found

#### :bug: Bug Fix
* fixed loss of scope when chaining elements (e.g. `$$('div')[2].$('span').getHTML()`)
* browser scope with now updated capabilities (`browser.capabilities`)
* improved [watch functionality](https://youtu.be/EUNoPFSomhM?t=17m4s) allows to rerun tests without starting a new session all over again
* fixed problems with `addCommand` in multiremote

#### :memo: Documentation
* brand new documentation page based on the [Docusaurus](https://docusaurus.io/) framework
    * written in a modern web framework called [React](https://reactjs.org/)
    * completely responsive with full support for mobile viewports
* included blog for WebdriverIO related news and article
* fixed links to edit certain documentation pages
* documentation page served via HTTPS per default

#### :house: Internal
* complete rearchitecturing of the whole project into a monorepo
    * new v5 codebase with all "offical" supported packages are at [`webdriverio/webdriverio`](https://github.com/webdriverio/webdriverio)
    * all depcrecated v4 packages can still be found at [github.com/webdriverio-boneyard](https://github.com/webdriverio-boneyard)
* moved all protocol commands into a [`webdriver`](https://www.npmjs.com/package/webdriver) base package
* project sub packages are now released within the `@wdio` NPM [organization](https://www.npmjs.com/org/wdio)
* renamed services, reporters and other internal packages (e.g. `wdio-sauce-service` → `@wdio/sauce-service`)
* removed all e2e tests from project to run as unit tests using [Jest](https://jestjs.io/) with a coverage of [~96%](https://codecov.io/gh/webdriverio/webdriverio)
* update to [Babel](https://babeljs.io/) v7 (latest) as well as various of other dependency updates with security fixes
* CPU and Memory improvements by reducing amount of IPC calls

#### :nail_care: Polish
* laid out better [governance model](https://github.com/webdriverio/webdriverio/blob/master/GOVERNANCE.md) for project
