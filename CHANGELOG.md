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

## v5.18.4 (2020-01-03)

#### :bug: Bug Fix
* `wdio-config`, `wdio-runner`
  * [#4938](https://github.com/webdriverio/webdriverio/pull/4938) Fix sanitization of capabilities object (due to DEFAULT_CONFIGS now being a function) ([@mehibbs](https://github.com/mehibbs))

#### :memo: Documentation
* [#4935](https://github.com/webdriverio/webdriverio/pull/4935) Add storybook-wdio boilerplate to document ([@davidnguyen179](https://github.com/davidnguyen179))

#### Committers: 2
- David Nguyen ([@davidnguyen179](https://github.com/davidnguyen179))
- [@mehibbs](https://github.com/mehibbs)


## v5.18.3 (2019-12-31)

#### :nail_care: Polish
* `wdio-junit-reporter`
  * [#4878](https://github.com/webdriverio/webdriverio/pull/4878) 💥🚀 Cucumber-style JUnit reports in @wdio/junit-reporter ([@mikesalvia](https://github.com/mikesalvia))

#### Committers: 1
- Mike Salvia ([@mikesalvia](https://github.com/mikesalvia))


## v5.18.2 (2019-12-31)

#### :bug: Bug Fix
* `wdio-config`
  * [#4923](https://github.com/webdriverio/webdriverio/pull/4923) fix default configs being exported as a singleton ([@naorzr](https://github.com/naorzr))
* `webdriverio`
  * [#4918](https://github.com/webdriverio/webdriverio/pull/4918) Fix selection of h1 using tag name selector strategy ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-appium-service`
  * [#4915](https://github.com/webdriverio/webdriverio/pull/4915) fix: fix spawning Appium on Windows ([@wswebcreation](https://github.com/wswebcreation))

#### :nail_care: Polish
* `devtools`
  * [#4927](https://github.com/webdriverio/webdriverio/pull/4927) Remove ff dependency ([@pmerwin](https://github.com/pmerwin))
  * [#4924](https://github.com/webdriverio/webdriverio/pull/4924) Remove ff dependency ([@pmerwin](https://github.com/pmerwin))

#### :memo: Documentation
* `wdio-cli`
  * [#4920](https://github.com/webdriverio/webdriverio/pull/4920) Add markdown Reporter ([@carmenmitru](https://github.com/carmenmitru))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mitru Carmen ([@carmenmitru](https://github.com/carmenmitru))
- Phil Merwin ([@pmerwin](https://github.com/pmerwin))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@naorzr](https://github.com/naorzr)


## v5.18.1 (2019-12-23)

#### :nail_care: Polish
* `wdio-cli`
  * [#4911](https://github.com/webdriverio/webdriverio/pull/4911) wdio-cli: allow for custom path for WDIO config ([@baruchvlz](https://github.com/baruchvlz))

#### :memo: Documentation
* `wdio-cli`
  * [#4910](https://github.com/webdriverio/webdriverio/pull/4910) Add  Slack Service to WDIO  ([@carmenmitru](https://github.com/carmenmitru))

#### Committers: 2
- Baruch Velez ([@baruchvlz](https://github.com/baruchvlz))
- Mitru Carmen ([@carmenmitru](https://github.com/carmenmitru))


## v5.18.0 (2019-12-19)

#### :rocket: New Feature
* `wdio-cli`, `wdio-config`, `wdio-junit-reporter`, `webdriver`
  * [#4906](https://github.com/webdriverio/webdriverio/pull/4906) Feature/read timeout ([@rsquires](https://github.com/rsquires))

#### Committers: 1
- Ross Squires ([@rsquires](https://github.com/rsquires))


## v5.17.0 (2019-12-18)

#### :rocket: New Feature
* `wdio-sync`, `webdriverio`
  * [#4802](https://github.com/webdriverio/webdriverio/pull/4802) Proposal to add element equals command ([@mgrybyk](https://github.com/mgrybyk))

#### :bug: Bug Fix
* `wdio-config`
  * [#4897](https://github.com/webdriverio/webdriverio/pull/4897) Prefer custom properties if detecting backend ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#4898](https://github.com/webdriverio/webdriverio/pull/4898) Minor styling fixes for flowchart ([@christian-bromann](https://github.com/christian-bromann))
* [#4873](https://github.com/webdriverio/webdriverio/pull/4873) Added flowcharts ([@jdavis61](https://github.com/jdavis61))

#### :house: Internal
* [#4888](https://github.com/webdriverio/webdriverio/pull/4888) Implement back-porting process for maintainers ([@christian-bromann](https://github.com/christian-bromann))
* [#4884](https://github.com/webdriverio/webdriverio/pull/4884) Remove sponsoring section from Governance.md ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- James Davis ([@jdavis61](https://github.com/jdavis61))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.16.16 (2019-12-14)

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#4875](https://github.com/webdriverio/webdriverio/pull/4875) Fix: #4856 condition never reached ([@woolter](https://github.com/woolter))

#### :nail_care: Polish
* `wdio-cli`
  * [#4881](https://github.com/webdriverio/webdriverio/pull/4881) Minor cleanup to avoid `getSpecs` call ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* Other
  * [#4879](https://github.com/webdriverio/webdriverio/pull/4879) fixed typo on cucumber pckg info (2019-7-11 website blog) ([@johnhiggs](https://github.com/johnhiggs))
* `wdio-devtools-service`
  * [#4876](https://github.com/webdriverio/webdriverio/pull/4876) wdio-devtools-service: Readme update about emulateDevice and mobileEmulation ([@versedi](https://github.com/versedi))

#### :house: Internal
* [#4885](https://github.com/webdriverio/webdriverio/pull/4885) Add Fossa badge ([@christian-bromann](https://github.com/christian-bromann))
* [#4883](https://github.com/webdriverio/webdriverio/pull/4883) Docs: Minor typo fixes to PROJECT_CHARTER.md ([@eemeli](https://github.com/eemeli))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Eemeli Aro ([@eemeli](https://github.com/eemeli))
- John Ahigian ([@johnhiggs](https://github.com/johnhiggs))
- Tadeusz Stępnikowski ([@versedi](https://github.com/versedi))
- Walter Hector Lijo ([@woolter](https://github.com/woolter))


## v5.16.15 (2019-12-10)

#### :bug: Bug Fix
* `wdio-cucumber-framework`, `wdio-local-runner`, `wdio-sync`, `wdio-utils`, `webdriverio`
  * [#4861](https://github.com/webdriverio/webdriverio/pull/4861) Fix naming of retry variable ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#4862](https://github.com/webdriverio/webdriverio/pull/4862) Update boilerplete information ([@luuizeduardo](https://github.com/luuizeduardo))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Luiz Eduardo Martins ([@luuizeduardo](https://github.com/luuizeduardo))


## v5.16.14 (2019-12-06)

#### :bug: Bug Fix
* `wdio-sync`
  * [#4860](https://github.com/webdriverio/webdriverio/pull/4860) Run synchronous commands with standalone script ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v5.16.13 (2019-12-06)

#### :bug: Bug Fix
* `wdio-utils`
  * [#4858](https://github.com/webdriverio/webdriverio/pull/4858) Fix wrapCommand for async command execution ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#4857](https://github.com/webdriverio/webdriverio/pull/4857) add blog for newly added service ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))


## v5.16.12 (2019-12-05)

#### :bug: Bug Fix
* `wdio-sync`, `wdio-utils`
  * [#4853](https://github.com/webdriverio/webdriverio/pull/4853) Sync vs Async test execution equality ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-runner`
  * [#4843](https://github.com/webdriverio/webdriverio/pull/4843) Add sessionId to normal capabilities for spec-reporter ([@Smashman](https://github.com/Smashman))

#### :memo: Documentation
* Other
  * [#4847](https://github.com/webdriverio/webdriverio/pull/4847) Docs: Update Debugging.md  ([@edoardoo](https://github.com/edoardoo))
  * [#4854](https://github.com/webdriverio/webdriverio/pull/4854) docs: change homepage link from course to book ([@klamping](https://github.com/klamping))
  * [#4846](https://github.com/webdriverio/webdriverio/pull/4846) Docs: Add unbound function note on mocha rerun section. ([@edoardoo](https://github.com/edoardoo))
* `wdio-cli`
  * [#4852](https://github.com/webdriverio/webdriverio/pull/4852) wdio-cli: add wdio-wiremock-service to cli wizard ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 5
- Ben Williams ([@Smashman](https://github.com/Smashman))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Edoardo Odorico ([@edoardoo](https://github.com/edoardoo))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Kevin Lamping ([@klamping](https://github.com/klamping))


## v5.16.11 (2019-12-02)

#### :rocket: New Feature
* `wdio-sync`, `webdriver`, `webdriverio`
  * [#4835](https://github.com/webdriverio/webdriverio/pull/4835) Add data to refetch elements ([@mgrybyk](https://github.com/mgrybyk))

#### :bug: Bug Fix
* `wdio-runner`, `wdio-spec-reporter`
  * [#4833](https://github.com/webdriverio/webdriverio/pull/4833) Show link to job details page for each multiremote instance - … ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`
  * [#4829](https://github.com/webdriverio/webdriverio/pull/4829) Better handle script evaluation in devtools protocol ([@christian-bromann](https://github.com/christian-bromann))
  * [#4828](https://github.com/webdriverio/webdriverio/pull/4828) Emit before and after command events in devtools ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-mocha-framework`
  * [#4836](https://github.com/webdriverio/webdriverio/pull/4836) wdio-mocha-framework: translate test:fail for error in "before each"-hook into hook:end ([@akloeber](https://github.com/akloeber))
* `devtools`, `webdriverio`
  * [#4766](https://github.com/webdriverio/webdriverio/pull/4766) Inconsistency between webdriver and devtools getElementText command ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-utils`
  * [#4823](https://github.com/webdriverio/webdriverio/pull/4823) Set first failed expectation as error for jasmine ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-applitools-service`
  * [#4831](https://github.com/webdriverio/webdriverio/pull/4831) Feature/add proxy support for applitools ([@kwoding](https://github.com/kwoding))
* `wdio-allure-reporter`
  * [#4819](https://github.com/webdriverio/webdriverio/pull/4819) wdio-allure-reporter: add tags cucumber support for scenario ([@lacell75](https://github.com/lacell75))

#### :memo: Documentation
* `wdio-shared-store-service`
  * [#4838](https://github.com/webdriverio/webdriverio/pull/4838) Fix typo in shared-store service doc ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`, `wdio-config`, `wdio-junit-reporter`, `webdriver`
  * [#4822](https://github.com/webdriverio/webdriverio/pull/4822) Remove `connectionRetryTimeout` option ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-firefox-profile-service`
  * [#4821](https://github.com/webdriverio/webdriverio/pull/4821) Add note that FF extensions need to be signed or flag has to be set ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 5
- Andreas Klöber ([@akloeber](https://github.com/akloeber))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))
- Kwo Ding ([@kwoding](https://github.com/kwoding))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.16.10 (2019-11-26)

#### :bug: Bug Fix
* `devtools`
  * [#4659](https://github.com/webdriverio/webdriverio/pull/4659) devtools automationProtocol: getUrl does not include #hash ([@dylang](https://github.com/dylang))
* `wdio-config`
  * [#4812](https://github.com/webdriverio/webdriverio/pull/4812) Allow overwriting specs and exclude in capabilities ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-logger`
  * [#4785](https://github.com/webdriverio/webdriverio/pull/4785) Fix bug where multiple copies of logger breaks logging errors ([@johnnymo87](https://github.com/johnnymo87))
* `webdriverio`
  * [#4808](https://github.com/webdriverio/webdriverio/pull/4808) Fix isClickable in Edge if element is in ShadowRoot polyfill ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#4773](https://github.com/webdriverio/webdriverio/pull/4773) wdio-allure-reporter: add flag to ignore/allow mocha hooks to have stacktrace and screenshots when they fail ([@luiscspinho](https://github.com/luiscspinho))

#### :memo: Documentation
* Other
  * [#4813](https://github.com/webdriverio/webdriverio/pull/4813) Extend checklist for type definitions ([@christian-bromann](https://github.com/christian-bromann))
  * [#4814](https://github.com/webdriverio/webdriverio/pull/4814) document isSynchronised in custom reporter ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sync`, `webdriver`, `webdriverio`
  * [#4811](https://github.com/webdriverio/webdriverio/pull/4811) Warn devs to not develop on generate d.ts files ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#4809](https://github.com/webdriverio/webdriverio/pull/4809) webdriver: Add the `headers` option to the Options type ([@iamakulov](https://github.com/iamakulov))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dylan Greene ([@dylang](https://github.com/dylang))
- Ivan Akulov ([@iamakulov](https://github.com/iamakulov))
- Jon Mohrbacher ([@johnnymo87](https://github.com/johnnymo87))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@luiscspinho](https://github.com/luiscspinho)


## v5.16.9 (2019-11-25)

#### :bug: Bug Fix
* `webdriverio`
  * [#4800](https://github.com/webdriverio/webdriverio/pull/4800) isClickable shadow root support ([@mgrybyk](https://github.com/mgrybyk))
  * [#4798](https://github.com/webdriverio/webdriverio/pull/4798) Fix scrollIntoView in isClickable for old browsers  ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-crossbrowsertesting-service`
  * [#4794](https://github.com/webdriverio/webdriverio/pull/4794) wdio-crossbrowsertesting-service: fix process killed prematurely ([@bcaudan](https://github.com/bcaudan))

#### :memo: Documentation
* `wdio-sync`, `webdriverio`
  * [#4797](https://github.com/webdriverio/webdriverio/pull/4797) fix(webdriverio): broader return types for Element.getProperty ([@jrobinson01](https://github.com/jrobinson01))

#### Committers: 3
- Bastien Caudan ([@bcaudan](https://github.com/bcaudan))
- John Robinson ([@jrobinson01](https://github.com/jrobinson01))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.16.7 (2019-11-13)

#### :bug: Bug Fix
* `webdriverio`
  * [#4772](https://github.com/webdriverio/webdriverio/pull/4772) Handle multiline text in isClickable ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* [#4775](https://github.com/webdriverio/webdriverio/pull/4775) Document behaviour of custom services added by name ([@codiophile](https://github.com/codiophile))

#### Committers: 3
- Enrique Gonzalez ([@enriquegh](https://github.com/enriquegh))
- Erik Blomqvist ([@codiophile](https://github.com/codiophile))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.16.6 (2019-11-11)

#### :bug: Bug Fix
* `wdio-config`, `wdio-cucumber-framework`
  * [#4764](https://github.com/webdriverio/webdriverio/pull/4764) Fix watch mode ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* `wdio-applitools-service`
  * [#4762](https://github.com/webdriverio/webdriverio/pull/4762) wdio-applitools-service: add typings ([@ablok](https://github.com/ablok))
* Other
  * [#4763](https://github.com/webdriverio/webdriverio/pull/4763) docs(template): Fix API parameters ([@Zearin](https://github.com/Zearin))

#### Committers: 3
- Arjan Blok ([@ablok](https://github.com/ablok))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Zearin ([@Zearin](https://github.com/Zearin))


## v5.16.5 (2019-11-09)

#### :bug: Bug Fix
* `wdio-cucumber-framework`, `wdio-sync`, `webdriverio`
  * [#4760](https://github.com/webdriverio/webdriverio/pull/4760) wdio-cucumber-framework: test-run-started event ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 1
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.16.4 (2019-11-08)

#### :bug: Bug Fix
* `webdriverio`
  * [#4754](https://github.com/webdriverio/webdriverio/pull/4754) isClickable handles child elements ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cucumber-framework`
  * [#4753](https://github.com/webdriverio/webdriverio/pull/4753) Fix cucumber framework initialisation  ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* `webdriverio`
  * [#4755](https://github.com/webdriverio/webdriverio/pull/4755) webdriverio: update url doc ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-protocols`, `webdriver`
  * [#4752](https://github.com/webdriverio/webdriverio/pull/4752) Assertperf typings fix ([@enriquegh](https://github.com/enriquegh))

#### :house: Internal
* [#4756](https://github.com/webdriverio/webdriverio/pull/4756) website: build status of master branch ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 2
- Enrique Gonzalez ([@enriquegh](https://github.com/enriquegh))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.16.3 (2019-11-07)

#### :bug: Bug Fix
* `wdio-config`
  * [#4750](https://github.com/webdriverio/webdriverio/pull/4750) Fix removeLineNumbers ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 1
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.16.2 (2019-11-06)

#### :rocket: New Feature
* `wdio-cli`, `wdio-config`, `wdio-cucumber-framework`
  * [#4696](https://github.com/webdriverio/webdriverio/pull/4696) [NEW FEATURE] Add the ability to provided Feature file with line number or numbers as --spec on CLI ([@mikesalvia](https://github.com/mikesalvia))

#### :bug: Bug Fix
* `wdio-runner`
  * [#4745](https://github.com/webdriverio/webdriverio/pull/4745) Fix before hook args ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* [#4737](https://github.com/webdriverio/webdriverio/pull/4737) Build a script that grants TSC members to release @wdio packages ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mike Salvia ([@mikesalvia](https://github.com/mikesalvia))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.16.1 (2019-11-06)

#### :bug: Bug Fix
* `wdio-runner`
  * [#4739](https://github.com/webdriverio/webdriverio/pull/4739) Pass capabilities to reporter before session started ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* [#4729](https://github.com/webdriverio/webdriverio/pull/4729) Update autocompletion doc ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 1
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.16.0 (2019-11-05)

#### :rocket: New Feature
* `devtools`, `wdio-cli`, `wdio-config`, `wdio-cucumber-framework`, `wdio-jasmine-framework`, `wdio-mocha-framework`, `wdio-runner`, `wdio-sync`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#4531](https://github.com/webdriverio/webdriverio/pull/4531) Init framework before browser ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-sync`, `webdriverio`
  * [#4736](https://github.com/webdriverio/webdriverio/pull/4736) Add waitForClickable command ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`, `wdio-runner`, `wdio-sync`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#4722](https://github.com/webdriverio/webdriverio/pull/4722) Add test retry attempts to after hooks ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`, `wdio-protocols`, `webdriverio`
  * [#4603](https://github.com/webdriverio/webdriverio/pull/4603) custom locator strategy ([@baruchvlz](https://github.com/baruchvlz))
* `wdio-shared-store-service`
  * [#4663](https://github.com/webdriverio/webdriverio/pull/4663) Shared store service to exchange data between workers ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`, `webdriver`
  * [#4690](https://github.com/webdriverio/webdriverio/pull/4690) Handle session errors ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-runner`, `webdriver`
  * [#4730](https://github.com/webdriverio/webdriverio/pull/4730) Pass empty capabilities if session failed to start ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-allure-reporter`
  * [#4719](https://github.com/webdriverio/webdriverio/pull/4719) Looks for Browserstack style versions in capabilities ([@mikesalvia](https://github.com/mikesalvia))

#### :memo: Documentation
* Other
  * [#4733](https://github.com/webdriverio/webdriverio/pull/4733) Add docs to describe difference between sync and async modes ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-shared-store-service`
  * [#4727](https://github.com/webdriverio/webdriverio/pull/4727) shared-store: add types ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-sync`, `webdriver`, `webdriverio`
  * [#4706](https://github.com/webdriverio/webdriverio/pull/4706) Types refactoring ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 3
- Baruch Velez ([@baruchvlz](https://github.com/baruchvlz))
- Mike Salvia ([@mikesalvia](https://github.com/mikesalvia))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.15.7 (2019-10-30)

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#4713](https://github.com/webdriverio/webdriverio/pull/4713) wdio-allure-reporter:fix addLabel ([@erwinheitzman](https://github.com/erwinheitzman))

#### :nail_care: Polish
* `wdio-sync`
  * [#4698](https://github.com/webdriverio/webdriverio/pull/4698) pretty e.stack only if it exists ([@colinbendell](https://github.com/colinbendell))

#### Committers: 2
- Colin Bendell ([@colinbendell](https://github.com/colinbendell))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))


## v5.15.6 (2019-10-30)

#### :memo: Documentation
* `wdio-protocols`
  * [#4702](https://github.com/webdriverio/webdriverio/pull/4702) Add readme for @wdio/protocols ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v5.15.5 (2019-10-30)

#### :rocket: New Feature
* `webdriverio`
  * [#4700](https://github.com/webdriverio/webdriverio/pull/4700) webdriverio: expanded click command with offset ([@erwinheitzman](https://github.com/erwinheitzman))

#### :memo: Documentation
* Other
  * [#4701](https://github.com/webdriverio/webdriverio/pull/4701) website: add isClickable to en.json ([@mgrybyk](https://github.com/mgrybyk))
* `webdriverio`
  * [#4695](https://github.com/webdriverio/webdriverio/pull/4695) Webdriverio add config typing to browser object ([@erwinheitzman](https://github.com/erwinheitzman))

#### :house: Internal
* `wdio-devtools-service`
  * [#4678](https://github.com/webdriverio/webdriverio/pull/4678) Update puppeteer-core in group default to the latest version 🚀 ([@greenkeeper[bot]](https://github.com/apps/greenkeeper))
* `wdio-junit-reporter`
  * [#4692](https://github.com/webdriverio/webdriverio/pull/4692) Update validator in group default to the latest version 🚀 ([@greenkeeper[bot]](https://github.com/apps/greenkeeper))

#### Committers: 2
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.15.4 (2019-10-25)

#### :memo: Documentation
* `wdio-protocols`
  * [#4686](https://github.com/webdriverio/webdriverio/pull/4686) mention error scenario for dismiss and accept alert ([@kellyselden](https://github.com/kellyselden))

#### :house: Internal
* [#4684](https://github.com/webdriverio/webdriverio/pull/4684) open travis site instead of picture when clicking on build-badge ([@anneloreegger](https://github.com/anneloreegger))

#### Committers: 3
- Kelly Selden ([@kellyselden](https://github.com/kellyselden))
- [@anneloreegger](https://github.com/anneloreegger)


## v5.15.3 (2019-10-25)

#### :rocket: New Feature
* `wdio-config`
  * [#4672](https://github.com/webdriverio/webdriverio/pull/4672) Add support for run *.mjs files ([@AleksandrHorev](https://github.com/AleksandrHorev))
* `webdriverio`
  * [#4656](https://github.com/webdriverio/webdriverio/pull/4656) Check if element is clickable ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#4676](https://github.com/webdriverio/webdriverio/pull/4676) wdio-allure-reporter: implement addLabel ([@erwinheitzman](https://github.com/erwinheitzman))
* `webdriverio`
  * [#4669](https://github.com/webdriverio/webdriverio/pull/4669) Update reloadSession.js in order to allow for session reload even if remote session has been terminated on server-side ([@mikesalvia](https://github.com/mikesalvia))

#### :memo: Documentation
* [#4670](https://github.com/webdriverio/webdriverio/pull/4670) Update Boilerplate example readme ([@ssehmi](https://github.com/ssehmi))

#### Committers: 5
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Mike Salvia ([@mikesalvia](https://github.com/mikesalvia))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@AleksandrHorev](https://github.com/AleksandrHorev)
- sat ([@ssehmi](https://github.com/ssehmi))


## v5.15.2 (2019-10-21)

#### :bug: Bug Fix
* `wdio-crossbrowsertesting-service`
  * [#4664](https://github.com/webdriverio/webdriverio/pull/4664) Fix CrossBrowserTesting Service error  ([@daphnemcrossbrowser](https://github.com/daphnemcrossbrowser))
* `wdio-allure-reporter`, `wdio-runner`
  * [#4655](https://github.com/webdriverio/webdriverio/pull/4655) Fix attach to session caps ([@mgrybyk](https://github.com/mgrybyk))
* `webdriverio`
  * [#4647](https://github.com/webdriverio/webdriverio/pull/4647) isDisplayedInViewport returns false if element is missing ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* `webdriverio`
  * [#4654](https://github.com/webdriverio/webdriverio/pull/4654) Update waitForExist.js ([@hakubo](https://github.com/hakubo))
* Other
  * [#4653](https://github.com/webdriverio/webdriverio/pull/4653) Update API.md ([@hakubo](https://github.com/hakubo))

#### Committers: 4
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Daphne Magsby ([@daphnemcrossbrowser](https://github.com/daphnemcrossbrowser))
- Jakub Olek ([@hakubo](https://github.com/hakubo))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.15.1 (2019-10-16)

#### :rocket: New Feature
* `wdio-protocols`
  * [#4617](https://github.com/webdriverio/webdriverio/pull/4617) Add new custom sauce command: jankinessCheck ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#4629](https://github.com/webdriverio/webdriverio/pull/4629) Fix tagged hooks in Cucumber ([@mgrybyk](https://github.com/mgrybyk))
  * [#4627](https://github.com/webdriverio/webdriverio/pull/4627) Fix getting identifier for multiple tables ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-utils`
  * [#4641](https://github.com/webdriverio/webdriverio/pull/4641) Avoid wrapping it.only fn ([@mgrybyk](https://github.com/mgrybyk))
  * [#4633](https://github.com/webdriverio/webdriverio/pull/4633) Add jasmine title to hook ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`, `wdio-config`
  * [#4640](https://github.com/webdriverio/webdriverio/pull/4640) Fix watch mode ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`
  * [#4637](https://github.com/webdriverio/webdriverio/pull/4637) Remove default path in cli ([@mgrybyk](https://github.com/mgrybyk))
  * [#4634](https://github.com/webdriverio/webdriverio/pull/4634) Move cbt to internal services in wdio-cli ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-sync`, `wdio-utils`, `webdriverio`
  * [#4609](https://github.com/webdriverio/webdriverio/pull/4609) reset _NOT_FIBER flag on Timer timeout ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-sync`
  * [#4610](https://github.com/webdriverio/webdriverio/pull/4610) Avoid running command hooks while in command hook ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-config`, `wdio-runner`
  * [#4623](https://github.com/webdriverio/webdriverio/pull/4623) Filter services that should not run in worker process ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-spec-reporter`
  * [#4624](https://github.com/webdriverio/webdriverio/pull/4624) Replace table with easy-table in @wdio/spec-repoter ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* Other
  * [#4593](https://github.com/webdriverio/webdriverio/pull/4593) Update BoilerplateProjects.md ([@amiya-pattnaik](https://github.com/amiya-pattnaik))
* `wdio-junit-reporter`
  * [#4607](https://github.com/webdriverio/webdriverio/pull/4607) Update wdio-junit-reporter doc ([@shinxi](https://github.com/shinxi))
* `wdio-devtools-service`
  * [#4608](https://github.com/webdriverio/webdriverio/pull/4608) Update README.md ([@ducle91](https://github.com/ducle91))

#### :house: Internal
* `wdio-sync`
  * [#4620](https://github.com/webdriverio/webdriverio/pull/4620) wdio-sync: convert executeAsync to async/await ([@MatthewBurstein](https://github.com/MatthewBurstein))
  * [#4612](https://github.com/webdriverio/webdriverio/pull/4612) Wdio sync executeAsync tests ([@MatthewBurstein](https://github.com/MatthewBurstein))

#### Committers: 6
- Amiya Pattanaik ([@amiya-pattnaik](https://github.com/amiya-pattnaik))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Duc Le ([@ducle91](https://github.com/ducle91))
- Jonathan Xi ([@shinxi](https://github.com/shinxi))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@MatthewBurstein](https://github.com/MatthewBurstein)

## v5.15.0 (2019-10-11)

#### :rocket: New Feature
* `wdio-cli`
  * [#4586](https://github.com/webdriverio/webdriverio/pull/4586) wdio-cli: REPL Appium config v2 ([@lamkovod](https://github.com/lamkovod))
  * [#4576](https://github.com/webdriverio/webdriverio/pull/4576) Wdio config yes ([@schuttsm](https://github.com/schuttsm))

#### :nail_care: Polish
* `wdio-cli`, `wdio-crossbrowsertesting-service`, `wdio-utils`, `webdriver`
  * [#4587](https://github.com/webdriverio/webdriverio/pull/4587) add examples and epilogue to cli commands ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#4598](https://github.com/webdriverio/webdriverio/pull/4598) touchAction should be used with Appium ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* `wdio-config`, `wdio-junit-reporter`, `wdio-selenium-standalone-service`, `webdriverio`
  * [#4596](https://github.com/webdriverio/webdriverio/pull/4596) Proposal to update docs ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Stephen Schutt ([@schuttsm](https://github.com/schuttsm))
- [@lamkovod](https://github.com/lamkovod)

## v5.14.5 (2019-10-09)

#### :rocket: New Feature
* `webdriverio`
  * [#4592](https://github.com/webdriverio/webdriverio/pull/4592) Webdriverio expand click command ([@erwinheitzman](https://github.com/erwinheitzman))

#### :bug: Bug Fix
* `wdio-devtools-service`
  * [#4591](https://github.com/webdriverio/webdriverio/pull/4591) wdio-devtools-service: better browser name and version check ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-jasmine-framework`
  * [#4572](https://github.com/webdriverio/webdriverio/pull/4572) Report errors in beforeAll and afterAll with Jasmine ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`
  * [#4581](https://github.com/webdriverio/webdriverio/pull/4581) Fix sync support for repl command ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-jasmine-framework`, `wdio-reporter`
  * [#4594](https://github.com/webdriverio/webdriverio/pull/4594) Report pendingReason from Jasmine tests ([@raketenolli](https://github.com/raketenolli))

#### :memo: Documentation
* [#4584](https://github.com/webdriverio/webdriverio/pull/4584) docs: Edited for grammar, formatting, phrasing, and clarity. ([@Zearin](https://github.com/Zearin))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Oliver Arend ([@raketenolli](https://github.com/raketenolli))
- Zearin ([@Zearin](https://github.com/Zearin))

## v5.14.4 (2019-10-06)

#### :bug: Bug Fix
* `wdio-reporter`, `wdio-spec-reporter`
  * [#4577](https://github.com/webdriverio/webdriverio/pull/4577) Print hooks as they appear in spec reporter ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-sync`
  * [#4575](https://github.com/webdriverio/webdriverio/pull/4575) runSync return value ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-utils`
  * [#4574](https://github.com/webdriverio/webdriverio/pull/4574) Add fullTitle to hooks ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* `wdio-reporter`
  * [#4550](https://github.com/webdriverio/webdriverio/pull/4550) wdio-reporter: Type definitions ([@lamkovod](https://github.com/lamkovod))

#### :house: Internal
* `wdio-allure-reporter`
  * [#4568](https://github.com/webdriverio/webdriverio/pull/4568) Add eslint rule "no-else-return" ([@martinfrancois](https://github.com/martinfrancois))
* `wdio-static-server-service`, `wdio-webdriver-mock-service`
  * [#4564](https://github.com/webdriverio/webdriverio/pull/4564) Fix WebdriverIO Tests on Windows ([@martinfrancois](https://github.com/martinfrancois))

#### Committers: 3
- François Martin ([@martinfrancois](https://github.com/martinfrancois))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@lamkovod](https://github.com/lamkovod)

## v5.14.3 (2019-10-02)

#### :bug: Bug Fix
* `wdio-sync`, `wdio-utils`
  * [#4561](https://github.com/webdriverio/webdriverio/pull/4561) Remove args filter in executeHooksWithArgs ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 1
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.14.2 (2019-10-02)

#### :bug: Bug Fix
* `wdio-cli`
  * [#4560](https://github.com/webdriverio/webdriverio/pull/4560) Fix rendering config file ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cli`
  * [#4559](https://github.com/webdriverio/webdriverio/pull/4559) wdio-cli: validate exclusive services ([@baruchvlz](https://github.com/baruchvlz))

#### Committers: 2
- Baruch Velez ([@baruchvlz](https://github.com/baruchvlz))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v5.14.1 (2019-10-01)

#### :bug: Bug Fix
* `wdio-cli`
  * [#4557](https://github.com/webdriverio/webdriverio/pull/4557) don't demand to have a command ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## v5.14.0 (2019-10-01)

#### :rocket: New Feature
* `wdio-cli`, `wdio-cucumber-framework`, `wdio-utils`
  * [#4545](https://github.com/webdriverio/webdriverio/pull/4545) Add step data and context to hooks ([@mgrybyk](https://github.com/mgrybyk))

#### :bug: Bug Fix
* `wdio-protocols`
  * [#4552](https://github.com/webdriverio/webdriverio/pull/4552) startRecordingScreen parameter are "options" ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-crossbrowsertesting-service`
  * [#4543](https://github.com/webdriverio/webdriverio/pull/4543) Remove pac-resolver import workaround ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`, `wdio-config`, `wdio-cucumber-framework`, `wdio-jasmine-framework`, `wdio-mocha-framework`, `wdio-repl`, `wdio-runner`, `wdio-sync`, `wdio-utils`, `webdriverio`
  * [#4354](https://github.com/webdriverio/webdriverio/pull/4354) Wrap test function with before after step hooks ([@mgrybyk](https://github.com/mgrybyk))
* `webdriverio`
  * [#4527](https://github.com/webdriverio/webdriverio/pull/4527) Set log levels when run in standalone mode ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriver`
  * [#4556](https://github.com/webdriverio/webdriverio/pull/4556) Fix error wording if function is passed into execute ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-local-runner`, `wdio-sync`
  * [#4402](https://github.com/webdriverio/webdriverio/pull/4402) Updates/wdio cli ([@baruchvlz](https://github.com/baruchvlz))
* `wdio-config`
  * [#4544](https://github.com/webdriverio/webdriverio/pull/4544) wdio-cli: add glob support for the exclude param ([@schuttsm](https://github.com/schuttsm))

#### :memo: Documentation
* `webdriverio`
  * [#4532](https://github.com/webdriverio/webdriverio/pull/4532) Fixtypings ([@SanthoshBonala](https://github.com/SanthoshBonala))
* `wdio-cli`
  * [#4533](https://github.com/webdriverio/webdriverio/pull/4533) Add information about possibility to configure protocol for Server Configurations ([@szemek](https://github.com/szemek))
* Other
  * [#4528](https://github.com/webdriverio/webdriverio/pull/4528) CDP page link fix ([@Raulster24](https://github.com/Raulster24))

#### :house: Internal
* `wdio-crossbrowsertesting-service`
  * [#4529](https://github.com/webdriverio/webdriverio/pull/4529) wdio-crossbrowsertesting-service: temporary mock pac-resolver ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 7
- Baruch Velez ([@baruchvlz](https://github.com/baruchvlz))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Przemysław Dąbek ([@szemek](https://github.com/szemek))
- Rahul Srivastava ([@Raulster24](https://github.com/Raulster24))
- Stephen Schutt ([@schuttsm](https://github.com/schuttsm))
- [@SanthoshBonala](https://github.com/SanthoshBonala)


## v5.13.2 (2019-09-25)

#### :bug: Bug Fix
* `wdio-jasmine-framework`
  * [#4516](https://github.com/webdriverio/webdriverio/pull/4516) Fix Error in "undefined" in Jasmine framework ([@mgrybyk](https://github.com/mgrybyk))
* `devtools`, `wdio-devtools-service`
  * [#4512](https://github.com/webdriverio/webdriverio/pull/4512) Devtools: should not throw if there are no pages ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* [#4511](https://github.com/webdriverio/webdriverio/pull/4511) Update SetupTypes.md ([@n370](https://github.com/n370))

#### :house: Internal
* `webdriverio`
  * [#4521](https://github.com/webdriverio/webdriverio/pull/4521) Update serialize-error in group default to the latest version 🚀 ([@greenkeeper[bot]](https://github.com/apps/greenkeeper))
* Other
  * [#4508](https://github.com/webdriverio/webdriverio/pull/4508) Run `lerna publish` with `--exact` ([@kellyselden](https://github.com/kellyselden))

#### Committers: 3
- Dylson ([@n370](https://github.com/n370))
- Kelly Selden ([@kellyselden](https://github.com/kellyselden))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))


## v5.13.1 (2019-09-18)

#### :bug: Bug Fix
* `webdriver`
  * [#4507](https://github.com/webdriverio/webdriverio/pull/4507) Better propagate custom headers with default headers ([@christian-bromann](https://github.com/christian-bromann))
  * [#4498](https://github.com/webdriverio/webdriverio/pull/4498) webdriver: Fixed url params being encoded twice, breaking id/name based lookups ([@lnewson](https://github.com/lnewson))

#### :nail_care: Polish
* `webdriver`
  * [#4506](https://github.com/webdriverio/webdriverio/pull/4506) webdriver: add actual capabilities processing of experitest response (#4501) ([@andy-schulz](https://github.com/andy-schulz))

#### :memo: Documentation
* [#4504](https://github.com/webdriverio/webdriverio/pull/4504) Chore: increase blog posts shown in the side meny ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 4
- Andy Schulz ([@andy-schulz](https://github.com/andy-schulz))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Lee Newson ([@lnewson](https://github.com/lnewson))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))

## v5.13.0 (2019-09-16)

#### :rocket: New Feature
* `webdriverio`
  * [#4266](https://github.com/webdriverio/webdriverio/pull/4266) Convert protocol elements to WebdriverIO elements ([@mgrybyk](https://github.com/mgrybyk))
* `devtools`, `wdio-cli`, `wdio-config`, `wdio-protocols`, `wdio-runner`, `wdio-sync`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#4210](https://github.com/webdriverio/webdriverio/pull/4210) Allow to choose between WebDriver and Chrome DevTools Protocol as automation backend ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#4424](https://github.com/webdriverio/webdriverio/pull/4424) support direct connect functionality for load balanced session redirection ([@jlipps](https://github.com/jlipps))
* `wdio-devtools-service`
  * [#4419](https://github.com/webdriverio/webdriverio/pull/4419) [@wdio/devtools-service] Add command for mobile emulation ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `devtools`
  * [#4476](https://github.com/webdriverio/webdriverio/pull/4476) Fix interaction with iframe with devtools protocol ([@mgrybyk](https://github.com/mgrybyk))
  * [#4472](https://github.com/webdriverio/webdriverio/pull/4472) devtools: fix getWindowHandles ([@mgrybyk](https://github.com/mgrybyk))
  * [#4469](https://github.com/webdriverio/webdriverio/pull/4469) Element search by function is not working ([@mgrybyk](https://github.com/mgrybyk))
  * [#4444](https://github.com/webdriverio/webdriverio/pull/4444) Execution fails when running tests in parallel ([@mgrybyk](https://github.com/mgrybyk))
  * [#4431](https://github.com/webdriverio/webdriverio/pull/4431) Element refetch is not working with devtools protocol ([@mgrybyk](https://github.com/mgrybyk))
  * [#4434](https://github.com/webdriverio/webdriverio/pull/4434) Unable to get element parent by xpath ([@mgrybyk](https://github.com/mgrybyk))
  * [#4432](https://github.com/webdriverio/webdriverio/pull/4432) Don't close all tabs when deleting session ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#4477](https://github.com/webdriverio/webdriverio/pull/4477) Fix isDisplayed in devtools ([@mgrybyk](https://github.com/mgrybyk))
* `devtools`, `webdriverio`
  * [#4459](https://github.com/webdriverio/webdriverio/pull/4459) Bugfixes for DevTools package ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sync`, `wdio-webdriver-mock-service`, `webdriverio`
  * [#4438](https://github.com/webdriverio/webdriverio/pull/4438) Fix custom command and command overwrites in multiremote ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#4428](https://github.com/webdriverio/webdriverio/pull/4428) wdio-allure-reporter - Fix unknown status in allure report ([@Kignuf](https://github.com/Kignuf))
  * [#4420](https://github.com/webdriverio/webdriverio/pull/4420) @wdio/allure-reporter: Fix undefined/unknown step status ([@Kignuf](https://github.com/Kignuf))
  * [#4406](https://github.com/webdriverio/webdriverio/pull/4406) allure-reporter: fixed bug with mocha all hooks being treated as tests ([@Gennadiii](https://github.com/Gennadiii))
* `wdio-devtools-service`
  * [#4416](https://github.com/webdriverio/webdriverio/pull/4416) Let auditors command fail if tracing failed ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-utils`
  * [#4468](https://github.com/webdriverio/webdriverio/pull/4468) Shorten string function in logs ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sauce-service`
  * [#4474](https://github.com/webdriverio/webdriverio/pull/4474) Add scRelay flag to not use SC as a Selenium Relay by default ([@enriquegh](https://github.com/enriquegh))
* `webdriverio`
  * [#4454](https://github.com/webdriverio/webdriverio/pull/4454) Adjust commands to use React selectors if element has isReactElement flag ([@baruchvlz](https://github.com/baruchvlz))
* `devtools`
  * [#4462](https://github.com/webdriverio/webdriverio/pull/4462) Print not implemented command ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-allure-reporter`
  * [#4418](https://github.com/webdriverio/webdriverio/pull/4418) @wdio/allure-reporter: Handle test failures where 'error.name' and 'error.stack' are undefined ([@BorisOsipov](https://github.com/BorisOsipov))

#### :memo: Documentation
* Other
  * [#4473](https://github.com/webdriverio/webdriverio/pull/4473) Fix devtools types ([@mgrybyk](https://github.com/mgrybyk))
  * [#4437](https://github.com/webdriverio/webdriverio/pull/4437) Update OrganizingTestSuites.md ([@Zearin](https://github.com/Zearin))
  * [#4412](https://github.com/webdriverio/webdriverio/pull/4412) Add example for custom service ([@christian-bromann](https://github.com/christian-bromann))
  * [#4499](https://github.com/webdriverio/webdriverio/pull/4499) Docs/encourage modern js ([@Zearin](https://github.com/Zearin))
* `devtools`
  * [#4458](https://github.com/webdriverio/webdriverio/pull/4458) Devtools: fix typos in docs ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-static-server-service`
  * [#4436](https://github.com/webdriverio/webdriverio/pull/4436) Update README.md ([@Zearin](https://github.com/Zearin))
* `webdriverio`
  * [#4413](https://github.com/webdriverio/webdriverio/pull/4413) Add link to the browser `waitUntil` command ([@klamping](https://github.com/klamping))

#### :house: Internal
* `wdio-sync`
  * [#4460](https://github.com/webdriverio/webdriverio/pull/4460) Add unit tests for wrapCommand ([@mgrybyk](https://github.com/mgrybyk))
  * [#4429](https://github.com/webdriverio/webdriverio/pull/4429) Only print warning if user is running wdio testrunner ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#4415](https://github.com/webdriverio/webdriverio/pull/4415) Add smoke tests for retries ([@christian-bromann](https://github.com/christian-bromann))
  * [#4414](https://github.com/webdriverio/webdriverio/pull/4414) Add 'documentation change' to PR template ([@klamping](https://github.com/klamping))
  * [#4492](https://github.com/webdriverio/webdriverio/pull/4492) Update packages and add package-lock.json ([@mgrybyk](https://github.com/mgrybyk))
  * [#4491](https://github.com/webdriverio/webdriverio/pull/4491) Update travis ci dist to xenial and set @babel/core version to 7.5.5 ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-runner`, `wdio-sync`
  * [#4234](https://github.com/webdriverio/webdriverio/pull/4234) @wdio/sync: throw if command is executed outside of a fiber context ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`, `wdio-devtools-service`
  * [#4493](https://github.com/webdriverio/webdriverio/pull/4493) Update chrome flags for devtools ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 10
- Baruch Velez ([@baruchvlz](https://github.com/baruchvlz))
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Enrique Gonzalez ([@enriquegh](https://github.com/enriquegh))
- Gennadii ([@Gennadiii](https://github.com/Gennadiii))
- Jonathan Lipps ([@jlipps](https://github.com/jlipps))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Kevin Roulleau ([@Kignuf](https://github.com/Kignuf))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Zearin ([@Zearin](https://github.com/Zearin))

## v5.12.5 (2019-08-27)

#### :nail_care: Polish
* `webdriverio`
  * [#4393](https://github.com/webdriverio/webdriverio/pull/4393) webdriverio: throw proper errors from selectByAttribute/VisibleText when option is not found ([@romovs](https://github.com/romovs))
* `wdio-browserstack-service`, `wdio-crossbrowsertesting-service`, `wdio-sauce-service`, `wdio-testingbot-service`
  * [#4407](https://github.com/webdriverio/webdriverio/pull/4407) Sauce: Fix update cucumber feature name and job status in Sauce Labs ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 2
- Roman Ovseitsev ([@romovs](https://github.com/romovs))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))

## v5.12.4 (2019-08-21)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-local-runner`
  * [#4386](https://github.com/webdriverio/webdriverio/pull/4386) Fix process exit code ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-cli`
  * [#4382](https://github.com/webdriverio/webdriverio/pull/4382) wdio-cli: configure allure reporter with wdio cli ([@marcelblijleven](https://github.com/marcelblijleven))

#### :house: Internal
* `webdriverio`
  * [#4389](https://github.com/webdriverio/webdriverio/pull/4389) webdriverio: bump resq version to 1.6 ([@baruchvlz](https://github.com/baruchvlz))

#### Committers: 3
- Baruch Velez ([@baruchvlz](https://github.com/baruchvlz))
- Marcel Blijleven ([@marcelblijleven](https://github.com/marcelblijleven))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.12.3 (2019-08-18)

#### :bug: Bug Fix
* `wdio-applitools-service`, `wdio-devtools-service`, `wdio-junit-reporter`, `wdio-sync`
  * [#4365](https://github.com/webdriverio/webdriverio/pull/4365) use `optionalDependencies` instead of `postinstall` for `fibers ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cucumber-framework`
  * [#4367](https://github.com/webdriverio/webdriverio/pull/4367) Fix user hooks in sync mode ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.12.2 (2019-08-16)

#### :rocket: New Feature
* `wdio-applitools-service`
  * [#4358](https://github.com/webdriverio/webdriverio/pull/4358) Updated to add command to take region snapshot ([@crutledgejr](https://github.com/crutledgejr))

#### :bug: Bug Fix
* `wdio-crossbrowsertesting-service`
  * [#4363](https://github.com/webdriverio/webdriverio/pull/4363) wdio-crossbrowsertesting-service: Pass along `cbtTunnelOpts` to `cbtTunnels.start()` ([@davidcochrum](https://github.com/davidcochrum))

#### Committers: 2
- Colston Rutledge, Jr. ([@crutledgejr](https://github.com/crutledgejr))
- David Cochrum ([@davidcochrum](https://github.com/davidcochrum))

## v5.12.1 (2019-08-14)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#4359](https://github.com/webdriverio/webdriverio/pull/4359) add execute driver support ([@jlipps](https://github.com/jlipps))

#### :boom: Breaking Change
* `eslint-plugin-wdio`, `wdio-allure-reporter`, `wdio-appium-service`, `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-dot-reporter`, `wdio-firefox-profile-service`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-lambda-runner`, `wdio-local-runner`, `wdio-logger`, `wdio-mocha-framework`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-smoke-test-reporter`, `wdio-smoke-test-service`, `wdio-spec-reporter`, `wdio-static-server-service`, `wdio-sumologic-reporter`, `wdio-sync`, `wdio-testingbot-service`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#4360](https://github.com/webdriverio/webdriverio/pull/4360) Proposal: change minimum node version to 8 ([@mgrybyk](https://github.com/mgrybyk))
  * Post Mortem for this: https://gist.github.com/christian-bromann/1b6245c04b894b5b989accdc90eb250d

#### :bug: Bug Fix
* `wdio-cli`, `wdio-config`, `wdio-cucumber-framework`, `wdio-sync`, `wdio-utils`, `webdriverio`
  * [#4288](https://github.com/webdriverio/webdriverio/pull/4288) Cucumber sync hooks ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`, `wdio-local-runner`
  * [#4332](https://github.com/webdriverio/webdriverio/pull/4332) End process normally ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 2
- Jonathan Lipps ([@jlipps](https://github.com/jlipps))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.12.0 (2019-08-13)

#### :nail_care: Polish
* `wdio-sync`
  * [#4325](https://github.com/webdriverio/webdriverio/pull/4325) Fix stacktrace formatting ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* `eslint-plugin-wdio`, `wdio-allure-reporter`, `wdio-appium-service`, `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-cli`, `wdio-concise-reporter`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-dot-reporter`, `wdio-firefox-profile-service`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-lambda-runner`, `wdio-local-runner`, `wdio-logger`, `wdio-mocha-framework`, `wdio-repl`, `wdio-reporter`, `wdio-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-smoke-test-reporter`, `wdio-smoke-test-service`, `wdio-spec-reporter`, `wdio-static-server-service`, `wdio-sumologic-reporter`, `wdio-sync`, `wdio-testingbot-service`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriver`, `webdriverio`
  * [#4356](https://github.com/webdriverio/webdriverio/pull/4356) Update minimum node version requirement to Node 10 ([@patthiel](https://github.com/patthiel))

#### Committers: 2
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Pat Thiel ([@patthiel](https://github.com/patthiel))

## v5.11.14 (2019-08-12)

#### :bug: Bug Fix
* `webdriverio`
  * [#4342](https://github.com/webdriverio/webdriverio/pull/4342) Fix getting scroll position in IE11 ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-devtools-service`
  * [#4350](https://github.com/webdriverio/webdriverio/pull/4350) Devtools service: fix timeToFirstByte ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-browserstack-service`
  * [#4316](https://github.com/webdriverio/webdriverio/pull/4316) browserstack-service: fix 404 error for app test ([@jayrepo](https://github.com/jayrepo))

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#4309](https://github.com/webdriverio/webdriverio/pull/4309) @wdio/allure-reporter: Skip reporting of passing hooks with option useCucumberStepReporter ([@Kignuf](https://github.com/Kignuf))

#### :memo: Documentation
* Other
  * [#4327](https://github.com/webdriverio/webdriverio/pull/4327) Add JS boilerplate with closure functions ([@luuizeduardo](https://github.com/luuizeduardo))
  * [#4313](https://github.com/webdriverio/webdriverio/pull/4313) types: Add types for w3c capabilities of cloud services ([@jayrepo](https://github.com/jayrepo))
* `webdriverio`
  * [#4334](https://github.com/webdriverio/webdriverio/pull/4334) Fix type generation for browser.uploadFile ([@johnathafelix](https://github.com/johnathafelix))

#### Committers: 6
- Jay Chen ([@JieC](https://github.com/JieC))
- Jay Chen ([@jayrepo](https://github.com/jayrepo))
- Kevin Roulleau ([@Kignuf](https://github.com/Kignuf))
- Luiz Eduardo Martins ([@luuizeduardo](https://github.com/luuizeduardo))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@johnathafelix](https://github.com/johnathafelix)

## v5.11.13 (2019-08-05)

#### :bug: Bug Fix
* `webdriver`
  * [#4299](https://github.com/webdriverio/webdriverio/pull/4299) Fix chrome getLogs and getLogTypes ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-devtools-service`
  * [#4295](https://github.com/webdriverio/webdriverio/pull/4295) devtools-service: fix tracing ([@mgrybyk](https://github.com/mgrybyk))
  * [#4296](https://github.com/webdriverio/webdriverio/pull/4296) devtools-service: onFrameNavigated - do nothing if tracing is not started ([@mgrybyk](https://github.com/mgrybyk))
* `webdriverio`
  * [#4302](https://github.com/webdriverio/webdriverio/pull/4302) Make dragAndDrop respect scroll position ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-sync`
  * [#4308](https://github.com/webdriverio/webdriverio/pull/4308) Fix for async mode in wdio-sync ([@SanthoshBonala](https://github.com/SanthoshBonala))

#### :memo: Documentation
* `webdriverio`
  * [#4300](https://github.com/webdriverio/webdriverio/pull/4300) TypeScript: add elementId as parameter to protocol commands with variable ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 2
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@SanthoshBonala](https://github.com/SanthoshBonala)

## v5.11.12 (2019-08-01)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#4290](https://github.com/webdriverio/webdriverio/pull/4290) Support multiple tables in scenario outline ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`, `wdio-cucumber-framework`
  * [#4285](https://github.com/webdriverio/webdriverio/pull/4285) Add types for Cucumber hooks ([@mgrybyk](https://github.com/mgrybyk))
* `webdriver`
  * [#4283](https://github.com/webdriverio/webdriverio/pull/4283) Encode uri params ([@mgrybyk](https://github.com/mgrybyk))

#### :house: Internal
* [#4281](https://github.com/webdriverio/webdriverio/pull/4281) Speedup internal tests ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 1
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.11.11 (2019-07-30)

#### :bug: Bug Fix
* `webdriverio`
  * [#4276](https://github.com/webdriverio/webdriverio/pull/4276) Use index when refetching element ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-sync`
  * [#4269](https://github.com/webdriverio/webdriverio/pull/4269) Fix waitUntil first iteration is promise ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* [#4261](https://github.com/webdriverio/webdriverio/pull/4261) typings: add isChrome's type dsl. ([@aha-oretama](https://github.com/aha-oretama))
* [#4260](https://github.com/webdriverio/webdriverio/pull/4260) Fix FirefoxOptions prefs type to optional ([@tadashi0713](https://github.com/tadashi0713))

#### Committers: 3
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Tadashi Nemoto ([@tadashi0713](https://github.com/tadashi0713))
- aha-oretama ([@aha-oretama](https://github.com/aha-oretama))

## v5.11.10 (2019-07-26)

#### :bug: Bug Fix
* `wdio-sync`, `wdio-webdriver-mock-service`
  * [#4256](https://github.com/webdriverio/webdriverio/pull/4256) Fix element chaining in async mode ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-sync`
  * [#4255](https://github.com/webdriverio/webdriverio/pull/4255) Fix debug command in async mode ([@mgrybyk](https://github.com/mgrybyk))
* `webdriver`
  * [#4252](https://github.com/webdriverio/webdriverio/pull/4252) webdriver: truncate screen recording log #4251 ([@mooyoul](https://github.com/mooyoul))

#### :nail_care: Polish
* `wdio-firefox-profile-service`
  * [#4250](https://github.com/webdriverio/webdriverio/pull/4250) introduce profileDirectory option in wdio-firefox-profile-service ([@Unichron](https://github.com/Unichron))

#### Committers: 3
- MooYeol Prescott Lee ([@mooyoul](https://github.com/mooyoul))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- [@Unichron](https://github.com/Unichron)

## v5.11.9 (2019-07-24)

#### :bug: Bug Fix
* `wdio-sync`, `wdio-webdriver-mock-service`
  * [#4249](https://github.com/webdriverio/webdriverio/pull/4249) Fix commands error handling in sync mode ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* [#4247](https://github.com/webdriverio/webdriverio/pull/4247) webdriver: add prefs to ChromeOptions typings ([@klamping](https://github.com/klamping))

#### Committers: 2
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.11.8 (2019-07-24)

#### :nail_care: Polish
* `wdio-cli`, `wdio-cucumber-framework`
  * [#4239](https://github.com/webdriverio/webdriverio/pull/4239) Cucumber: add result argument to afterScenario hook ([@Kignuf](https://github.com/Kignuf))

#### :memo: Documentation
* `wdio-cli`
  * [#4243](https://github.com/webdriverio/webdriverio/pull/4243) Feat/add cucumberjs json ([@wswebcreation](https://github.com/wswebcreation))

#### :house: Internal
* [#4237](https://github.com/webdriverio/webdriverio/pull/4237) speedup build, clean, bootstrap ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 3
- Kevin Roulleau ([@Kignuf](https://github.com/Kignuf))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))

## v5.11.7 (2019-07-23)

#### :eyeglasses: Spec Compliancy
* `webdriver`
  * [#4046](https://github.com/webdriverio/webdriverio/pull/4046) Add throttleCPU command ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-sync`, `webdriver`, `webdriverio`
  * [#4221](https://github.com/webdriverio/webdriverio/pull/4221) Fix slow before/after command hook in sync mode ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-local-runner`
  * [#4223](https://github.com/webdriverio/webdriverio/pull/4223) Fix MaxListenersExceededWarning ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-allure-reporter`, `wdio-cucumber-framework`, `wdio-reporter`
  * [#4220](https://github.com/webdriverio/webdriverio/pull/4220) Add allure-reporter option useCucumberStepReporter ([@Kignuf](https://github.com/Kignuf))

#### :memo: Documentation
* Other
  * [#4233](https://github.com/webdriverio/webdriverio/pull/4233) Add Cucumber and Mocha boilerplate ([@WarleyGabriel](https://github.com/WarleyGabriel))
  * [#4213](https://github.com/webdriverio/webdriverio/pull/4213) Fixed text in 2019-07-11-cucumberjs-v5-released.md ([@Marketionist](https://github.com/Marketionist))
* `webdriverio`
  * [#4224](https://github.com/webdriverio/webdriverio/pull/4224) webdriverio: uploadFile return type void => string ([@drewctate](https://github.com/drewctate))

#### :house: Internal
* `webdriver`, `webdriverio`
  * [#4229](https://github.com/webdriverio/webdriverio/pull/4229) Browser/element prototype performance improvements ([@mgrybyk](https://github.com/mgrybyk))
* Other
  * [#4226](https://github.com/webdriverio/webdriverio/pull/4226) Fix failing ci ([@mgrybyk](https://github.com/mgrybyk))
* `webdriverio`
  * [#4212](https://github.com/webdriverio/webdriverio/pull/4212) Remove safe-buffer dependency ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 7
- Andrew Tate ([@drewctate](https://github.com/drewctate))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dmytro Shpakovskyi ([@Marketionist](https://github.com/Marketionist))
- Kevin Roulleau ([@Kignuf](https://github.com/Kignuf))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Warley Gabriel ([@WarleyGabriel](https://github.com/WarleyGabriel))
- [@johnathafelix](https://github.com/johnathafelix)

## v5.11.6 (2019-07-17)

#### :bug: Bug Fix
* `wdio-spec-reporter`
  * [#4204](https://github.com/webdriverio/webdriverio/pull/4204) Print link to Sauce Labs job details page when using Sauce Connect ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#4202](https://github.com/webdriverio/webdriverio/pull/4202) Fix overflow text is displayed ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `webdriverio`
  * [#4211](https://github.com/webdriverio/webdriverio/pull/4211) clean up setTimeout implementation ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cucumber-framework`, `wdio-spec-reporter`
  * [#4201](https://github.com/webdriverio/webdriverio/pull/4201) Print data tables in spec reporter ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#4189](https://github.com/webdriverio/webdriverio/pull/4189) Fix type for webdriverio onPrepare parameter ([@archonandrewhunt](https://github.com/archonandrewhunt))
* [#4117](https://github.com/webdriverio/webdriverio/pull/4117) Updated selectors documentation for element ID ([@reds71](https://github.com/reds71))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Stéphane Rouges ([@reds71](https://github.com/reds71))
- [@archonandrewhunt](https://github.com/archonandrewhunt)

## v5.11.5 (2019-07-15)

#### :bug: Bug Fix
* `webdriver`
  * [#4194](https://github.com/webdriverio/webdriverio/pull/4194) isSauce should not depend on hostname ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-webdriver-mock-service`, `webdriver`
  * [#4186](https://github.com/webdriverio/webdriverio/pull/4186) webdriver: support rebinding of context when invoking origFn in element.overwriteCommand ([@akloeber](https://github.com/akloeber))

#### Committers: 2
- Andreas Klöber ([@akloeber](https://github.com/akloeber))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## v5.11.4 (2019-07-12)

#### :bug: Bug Fix
* `wdio-appium-service`, `wdio-crossbrowsertesting-service`, `wdio-testingbot-service`
  * [#4179](https://github.com/webdriverio/webdriverio/pull/4179) Add EsLint check for dependencies ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#4153](https://github.com/webdriverio/webdriverio/pull/4153) Add Changelog and Roadmap links to README.md ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))

## v5.11.3 (2019-07-11)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#4181](https://github.com/webdriverio/webdriverio/pull/4181) wdio-cucumber-framework: fix hook handling ([@mgrybyk](https://github.com/mgrybyk))

#### :memo: Documentation
* [#4176](https://github.com/webdriverio/webdriverio/pull/4176) Chore/cucumber5 blogpost ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 2
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))

## v5.11.2 (2019-07-11)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#4174](https://github.com/webdriverio/webdriverio/pull/4174) Cucumber fix error message ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.11.1 (2019-07-11)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#4166](https://github.com/webdriverio/webdriverio/pull/4166) fix cucumber hook args ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-sauce-service`
  * [#4162](https://github.com/webdriverio/webdriverio/pull/4162) Add sauce-connect-launcher to logger of wdio-sauce-service ([@enriquegh](https://github.com/enriquegh))
* `wdio-utils`
  * [#4158](https://github.com/webdriverio/webdriverio/pull/4158) wdio-utils: Make safeRequire use require.resolve ([@nemisj](https://github.com/nemisj))

#### :memo: Documentation
* Other
  * [#4173](https://github.com/webdriverio/webdriverio/pull/4173) Cucumber related minor update to frameworks doc ([@mgrybyk](https://github.com/mgrybyk))
  * [#4160](https://github.com/webdriverio/webdriverio/pull/4160) Fixed text in 2019-05-18-visual-regression-for-v5.md ([@Marketionist](https://github.com/Marketionist))
* `wdio-cli`, `wdio-cucumber-framework`
  * [#4169](https://github.com/webdriverio/webdriverio/pull/4169) Update Cucumber Babel setup doc ([@mgrybyk](https://github.com/mgrybyk))
* `webdriverio`
  * [#4167](https://github.com/webdriverio/webdriverio/pull/4167) Add selector and elementId to Element ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cucumber-framework`
  * [#4159](https://github.com/webdriverio/webdriverio/pull/4159) Cucumber: TypeScript Setup doc, pass function to requireModule ([@mgrybyk](https://github.com/mgrybyk))

#### Committers: 4
- Dmytro Shpakovskyi ([@Marketionist](https://github.com/Marketionist))
- Enrique Gonzalez ([@enriquegh](https://github.com/enriquegh))
- Maks Nemisj ([@nemisj](https://github.com/nemisj))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))

## v5.11.0 (2019-07-09)

#### :rocket: New Feature
* `wdio-allure-reporter`, `wdio-browserstack-service`, `wdio-cli`, `wdio-config`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-reporter`, `wdio-sauce-service`, `wdio-spec-reporter`, `wdio-sync`, `wdio-testingbot-service`, `wdio-webdriver-mock-service`, `webdriverio`
  * [#3667](https://github.com/webdriverio/webdriverio/pull/3667) Cucumber Framework Support ([@abjerstedt](https://github.com/abjerstedt))
* `wdio-static-server-service`
  * [#4142](https://github.com/webdriverio/webdriverio/pull/4142) Port wdio-static-server-service ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`, `webdriverio`
  * [#3632](https://github.com/webdriverio/webdriverio/pull/3632) Upload blog post ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-spec-reporter`
  * [#4156](https://github.com/webdriverio/webdriverio/pull/4156) wdio-spec-reporter: fix header in multiremote mode ([@mgrybyk](https://github.com/mgrybyk))

#### :nail_care: Polish
* `wdio-allure-reporter`
  * [#4152](https://github.com/webdriverio/webdriverio/pull/4152) wdio-allure-reporter: add suite separator ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-cli`
  * [#4150](https://github.com/webdriverio/webdriverio/pull/4150) cli: Add defaults when running programmatically ([@WillBrock](https://github.com/WillBrock))
* `webdriverio`
  * [#4128](https://github.com/webdriverio/webdriverio/pull/4128) webdriverio: fix isDisplayed script to work with shadow dom ([@jrobinson01](https://github.com/jrobinson01))

#### :memo: Documentation
* [#4146](https://github.com/webdriverio/webdriverio/pull/4146) Docs: Normalize terminal commands ([@WillBrock](https://github.com/WillBrock))

#### :house: Internal
* [#4140](https://github.com/webdriverio/webdriverio/pull/4140) Update affiliation from JSF to OpenJSF ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 5
- Adam Bjerstedt ([@abjerstedt](https://github.com/abjerstedt))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- John Robinson ([@jrobinson01](https://github.com/jrobinson01))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Will Brock ([@WillBrock](https://github.com/WillBrock))

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
  * [#4025](https://github.com/webdriverio/webdriverio/pull/4025) Implement issue#4024: jasmine-framework - introduce new jasmineNodeOpts option: stopSpecOnExpectationFailure ([@mike-d-davydov](https://github.com/mike-d-davydov))

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
