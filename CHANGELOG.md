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

---

## v7.7.0 (2021-06-01)

#### :rocket: New Feature
* `wdio-logger`, `webdriverio`
  * [#6930](https://github.com/webdriverio/webdriverio/pull/6930) Implement restore/clear all mocks ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `devtools`
  * [#6924](https://github.com/webdriverio/webdriverio/pull/6924) Improve window management in devtools ([@christian-bromann](https://github.com/christian-bromann))
  * [#6927](https://github.com/webdriverio/webdriverio/pull/6927) Fix double click in devtools ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#6926](https://github.com/webdriverio/webdriverio/pull/6926) Better allow for manual TS transpiling ([@christian-bromann](https://github.com/christian-bromann))
  * [#6933](https://github.com/webdriverio/webdriverio/pull/6933) CLI : Update visual-regression-testing to image-comparison ([@pjcalvo](https://github.com/pjcalvo))
* `webdriverio`
  * [#6915](https://github.com/webdriverio/webdriverio/pull/6915) keep original selector for custom locator strategy ([@christian-bromann](https://github.com/christian-bromann))
  * [#6929](https://github.com/webdriverio/webdriverio/pull/6929) Use WebDriver if Appium capabilities are found ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sauce-service`
  * [#6662](https://github.com/webdriverio/webdriverio/pull/6662) Strip color ascii characters when uploading error message to Sauce Labs job ([@christian-bromann](https://github.com/christian-bromann))
  * [#6912](https://github.com/webdriverio/webdriverio/pull/6912) Report errors on Sauce Labs in test hooks ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-devtools-service`
  * [#6920](https://github.com/webdriverio/webdriverio/pull/6920) Issue #6877: Exclude files from code coverage ([@kailin0512](https://github.com/kailin0512))
* `wdio-cli`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-sauce-service`, `wdio-testingbot-service`, `wdio-types`
  * [#6941](https://github.com/webdriverio/webdriverio/pull/6941) Propagate better result object in `afterScenario` ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* Other
  * [#6935](https://github.com/webdriverio/webdriverio/pull/6935) Update Debugging.md ([@jpratt2](https://github.com/jpratt2))
* `webdriverio`
  * [#6934](https://github.com/webdriverio/webdriverio/pull/6934) Click x and y are actually counted from center of element ([@stwippie](https://github.com/stwippie))
* `wdio-cli`
  * [#6933](https://github.com/webdriverio/webdriverio/pull/6933) CLI : Update visual-regression-testing to image-comparison ([@pjcalvo](https://github.com/pjcalvo))
* `wdio-cucumber-framework`
  * [#6922](https://github.com/webdriverio/webdriverio/pull/6922) Fixes Types for cucumber-framework ([@jonn-set](https://github.com/jonn-set))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- John Pratt ([@jpratt2](https://github.com/jpratt2))
- Johnson E ([@jonn-set](https://github.com/jonn-set))
- Kai ([@kailin0512](https://github.com/kailin0512))
- Pablillo Calvo ([@pjcalvo](https://github.com/pjcalvo))
- Stwippie ([@stwippie](https://github.com/stwippie))


## v7.6.1 (2021-05-25)

#### :bug: Bug Fix
* `webdriverio`
  * [#6896](https://github.com/webdriverio/webdriverio/pull/6896) Closes [#6786](https://github.com/webdriverio/webdriverio/issues/6786) ([@jonn-set](https://github.com/jonn-set))
* `wdio-allure-reporter`, `wdio-cucumber-framework`
  * [#6874](https://github.com/webdriverio/webdriverio/pull/6874) 6859 - Fixes the issue where wdio before/after Step gets wrapped around a Cucumber Before/After Step ([@jonn-set](https://github.com/jonn-set))

#### :nail_care: Polish
* `wdio-cli`, `wdio-cucumber-framework`, `wdio-spec-reporter`
  * [#6836](https://github.com/webdriverio/webdriverio/pull/6836) Modifies the cucumberEventListener to emit before-feature and after-feature events differently when using spec grouping configurations ([@mikesalvia](https://github.com/mikesalvia))

#### :memo: Documentation
* `wdio-cli`
  * [#6893](https://github.com/webdriverio/webdriverio/pull/6893) Add custom wdio-ms-teams-service ([@marcelblijleven](https://github.com/marcelblijleven))
  * [#6862](https://github.com/webdriverio/webdriverio/pull/6862) Adding wdio-eslinter-service to auto-detect missing require imports i… ([@jamesmortensen](https://github.com/jamesmortensen))
* Other
  * [#6875](https://github.com/webdriverio/webdriverio/pull/6875) Add missing documentation on returned Cucumber afterStep 'results' object ([@esaari](https://github.com/esaari))

#### Committers: 5
- Eric Saari ([@esaari](https://github.com/esaari))
- James ([@jamesmortensen](https://github.com/jamesmortensen))
- Johnson E ([@jonn-set](https://github.com/jonn-set))
- Marcel Blijleven ([@marcelblijleven](https://github.com/marcelblijleven))
- Mike Salvia ([@mikesalvia](https://github.com/mikesalvia))


## v7.6.0 (2021-05-17)

#### :rocket: New Feature
* `wdio-spec-reporter`
  * [#6852](https://github.com/webdriverio/webdriverio/pull/6852) Spec Reporter - Display only failures ([@unickq](https://github.com/unickq))

#### :bug: Bug Fix
* `wdio-cli`
  * [#6858](https://github.com/webdriverio/webdriverio/pull/6858) Fix `wdio-wait-for` install via cli ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `devtools`, `wdio-utils`, `webdriverio`
  * [#6661](https://github.com/webdriverio/webdriverio/pull/6661) Special characters not properly detected with Puppeteer ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* Other
  * [#6860](https://github.com/webdriverio/webdriverio/pull/6860) removing Contributor Guide reference link ([@sadabnepal](https://github.com/sadabnepal))
  * [#6753](https://github.com/webdriverio/webdriverio/pull/6753) chore: Docusaurus with webpack 5 ([@slorber](https://github.com/slorber))
  * [#6846](https://github.com/webdriverio/webdriverio/pull/6846) Update typescript examples, documentation and release notes ([@osmolyar](https://github.com/osmolyar))
* `webdriverio`
  * [#6856](https://github.com/webdriverio/webdriverio/pull/6856) Rename uploadFile Doc Example File ([@klamping](https://github.com/klamping))

#### :house: Internal
* `wdio-cucumber-framework`, `wdio-jasmine-framework`, `wdio-mocha-framework`
  * [#6869](https://github.com/webdriverio/webdriverio/pull/6869) Upgrade `expect-webdriverio` to v3 ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 7
- Abhinaba Ghosh ([@abhinaba-ghosh](https://github.com/abhinaba-ghosh))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- MD SADAB SAQIB ([@sadabnepal](https://github.com/sadabnepal))
- Nick Chursin ([@unickq](https://github.com/unickq))
- Olga ([@osmolyar](https://github.com/osmolyar))
- Sébastien Lorber ([@slorber](https://github.com/slorber))


## v7.5.7 (2021-05-06)

#### :bug: Bug Fix
* `devtools`, `wdio-devtools-service`
  * [#6832](https://github.com/webdriverio/webdriverio/pull/6832) Fix reloading devtools sessions ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cli`, `wdio-reporter`
  * [#6833](https://github.com/webdriverio/webdriverio/pull/6833) Setup Babel if not already ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v7.5.6 (2021-05-05)

#### :bug: Bug Fix
* `webdriverio`
  * [#6814](https://github.com/webdriverio/webdriverio/pull/6814) Properly scope deep selector calls ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#6810](https://github.com/webdriverio/webdriverio/pull/6810) Have a single implementation for $ command ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* Other
  * [#6788](https://github.com/webdriverio/webdriverio/pull/6788) Document package exports for `webdriverio`, `webdriver` and `devtools` package ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#6809](https://github.com/webdriverio/webdriverio/pull/6809) Fix newWindow example ([@Joozty](https://github.com/Joozty))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jozef Harag ([@Joozty](https://github.com/Joozty))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v7.5.5 (2021-05-03)

#### :nail_care: Polish
* `wdio-local-runner`
  * [#6790](https://github.com/webdriverio/webdriverio/pull/6790) Corrected output stream handling (issue from 7.5.3) ([@jan-molak](https://github.com/jan-molak))

#### Committers: 1
- Jan Molak ([@jan-molak](https://github.com/jan-molak))


## v7.5.4 (2021-04-30)

#### :memo: Documentation
* [#6783](https://github.com/webdriverio/webdriverio/pull/6783) Adding a example test suite  ([@larryg01](https://github.com/larryg01))

#### Committers: 1
- LarryG ([@larryg01](https://github.com/larryg01))


## v7.5.3 (2021-04-30)

#### :nail_care: Polish
* `wdio-local-runner`
  * [#6781](https://github.com/webdriverio/webdriverio/pull/6781) Add CID to every line printed to stdout ([@jan-molak](https://github.com/jan-molak))

#### :memo: Documentation
* [#6782](https://github.com/webdriverio/webdriverio/pull/6782) Documentation fix: Removed $ sign in commands so it wont be copied ([@Xotabu4](https://github.com/Xotabu4))
* [#6762](https://github.com/webdriverio/webdriverio/pull/6762) Added wdio 7 with appium and cucumber boilerplate ([@Arjun-Ar91](https://github.com/Arjun-Ar91))

#### Committers: 3
- Arjun ([@Arjun-Ar91](https://github.com/Arjun-Ar91))
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Oleksandr Khotemskyi ([@Xotabu4](https://github.com/Xotabu4))


## v7.5.2 (2021-04-26)

#### :bug: Bug Fix
* `wdio-types`, `webdriver`, `webdriverio`
  * [#6759](https://github.com/webdriverio/webdriverio/pull/6759) attach to session improvements ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`
  * [#6751](https://github.com/webdriverio/webdriverio/pull/6751) fix executeScript results transformation in devtools ([@kyryloonufriiev](https://github.com/kyryloonufriiev))

#### :nail_care: Polish
* `webdriver`, `webdriverio`
  * [#6756](https://github.com/webdriverio/webdriverio/pull/6756) Retry connection refused errors ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#6758](https://github.com/webdriverio/webdriverio/pull/6758) Print custom error message if installing deps fails with no stderr ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#6755](https://github.com/webdriverio/webdriverio/pull/6755) Add documentation for accessing browser instances via strings ([@evilC](https://github.com/evilC))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Clive Galway ([@evilC](https://github.com/evilC))
- Kyrylo ([@kyryloonufriiev](https://github.com/kyryloonufriiev))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v7.5.1 (2021-04-21)

#### :bug: Bug Fix
* `wdio-devtools-service`
  * [#6736](https://github.com/webdriverio/webdriverio/pull/6736) `checkPWA` command is broken ([@christian-bromann](https://github.com/christian-bromann))
  * [#6664](https://github.com/webdriverio/webdriverio/pull/6664) Fix Devtools hang on Android ([@nicolasbouffard](https://github.com/nicolasbouffard))
* `wdio-cucumber-framework`
  * [#6737](https://github.com/webdriverio/webdriverio/pull/6737) Pin Cucumber package versions ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-cli`
  * [#6732](https://github.com/webdriverio/webdriverio/pull/6732) add(service): waitFor external package ([@elaichenkov](https://github.com/elaichenkov))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Yevhen ([@elaichenkov](https://github.com/elaichenkov))
- [@nicolasbouffard](https://github.com/nicolasbouffard)


## v7.5.0 (2021-04-20)

#### :rocket: New Feature
* `devtools`, `webdriverio`
  * [#6709](https://github.com/webdriverio/webdriverio/pull/6709) Implement `>>>` (deep) selector for WebdriverIO ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `devtools`
  * [#6725](https://github.com/webdriverio/webdriverio/pull/6725) Fix DevToolsDriver elements storing ([@kyryloonufriiev](https://github.com/kyryloonufriiev))

#### :nail_care: Polish
* `wdio-config`
  * [#6720](https://github.com/webdriverio/webdriverio/pull/6720) fix: Only log when the entry is not a string or array ([@seanpoulter](https://github.com/seanpoulter))

#### :memo: Documentation
* [#6678](https://github.com/webdriverio/webdriverio/pull/6678) Document the transition from a Protractor to WebdriverIO framework ([@christian-bromann](https://github.com/christian-bromann))
* [#6722](https://github.com/webdriverio/webdriverio/pull/6722) Update broken links ([@rueyaa332266](https://github.com/rueyaa332266))
* [#6626](https://github.com/webdriverio/webdriverio/pull/6626) Update CustomServices.md ([@tzurp](https://github.com/tzurp))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jye Ruey ([@rueyaa332266](https://github.com/rueyaa332266))
- Kyrylo ([@kyryloonufriiev](https://github.com/kyryloonufriiev))
- Sean Poulter ([@seanpoulter](https://github.com/seanpoulter))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)
- [@tzurp](https://github.com/tzurp)


## v7.4.6 (2021-04-15)

#### :nail_care: Polish
* `wdio-cli`
  * [#6718](https://github.com/webdriverio/webdriverio/pull/6718) Remove `@wdio/sync` package from cli wizard ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`, `webdriverio`
  * [#6606](https://github.com/webdriverio/webdriverio/pull/6606) webdriverio: fix setvalue typings ([@erwinheitzman](https://github.com/erwinheitzman))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))


## v7.4.4 (2021-04-14)

#### :memo: Documentation
* [#6708](https://github.com/webdriverio/webdriverio/pull/6708) Update name and link to @wdio/browserstack-service ([@sbley](https://github.com/sbley))

#### Committers: 1
- Stefan Bley ([@sbley](https://github.com/sbley))


## v7.4.0 (2021-04-13)

#### :rocket: New Feature
* `devtools`
  * [#6684](https://github.com/webdriverio/webdriverio/pull/6684) Allow more options to connect to a remote devtools connection ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-devtools-service`
  * [#6701](https://github.com/webdriverio/webdriverio/pull/6701) Fix `checkPWA` command ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-reporter`, `wdio-runner`, `wdio-spec-reporter`, `wdio-types`
  * [#6700](https://github.com/webdriverio/webdriverio/pull/6700) Improve spec reporting for multiremote ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-selenium-standalone-service`
  * [#6681](https://github.com/webdriverio/webdriverio/pull/6681) Fix connection details setting for multiremote in selenium server ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-jasmine-framework`
  * [#6687](https://github.com/webdriverio/webdriverio/pull/6687) Remove done callback in Jasmine ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#6683](https://github.com/webdriverio/webdriverio/pull/6683) [BUGFIX] wdio-browserstack-service using the wrong session url when w3c properties are enforced ([@sanghun89](https://github.com/sanghun89))

#### :nail_care: Polish
* `wdio-cli`
  * [#6699](https://github.com/webdriverio/webdriverio/pull/6699) Properly type config file if TypeScript is being used ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-config`
  * [#6658](https://github.com/webdriverio/webdriverio/pull/6658) Added ability to group specs in suites ([@RossVertizan](https://github.com/RossVertizan))

#### :memo: Documentation
* `webdriverio`
  * [#6682](https://github.com/webdriverio/webdriverio/pull/6682) Enhance docs for custom locator strategy ([@christian-bromann](https://github.com/christian-bromann))
  * [#6698](https://github.com/webdriverio/webdriverio/pull/6698) Small typo ([@idanen](https://github.com/idanen))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Idan Entin ([@idanen](https://github.com/idanen))
- Ross Addinall ([@RossVertizan](https://github.com/RossVertizan))
- Sam Chun ([@sanghun89](https://github.com/sanghun89))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v7.3.1 (2021-04-08)

#### :bug: Bug Fix
* `webdriverio`
  * [#6676](https://github.com/webdriverio/webdriverio/pull/6676) Fix devtools url for Aerokube Selenoid\Moon sessions ([@BorisOsipov](https://github.com/BorisOsipov))
  * [#6625](https://github.com/webdriverio/webdriverio/pull/6625) fix sync browser type for "call" method ([@giacomomagini](https://github.com/giacomomagini))

#### :nail_care: Polish
* `wdio-types`, `webdriverio`
  * [#6673](https://github.com/webdriverio/webdriverio/pull/6673) webdriverio: Allow to use devtools features for Aerokube Selenoid\Moon sessions ([@BorisOsipov](https://github.com/BorisOsipov))

#### :memo: Documentation
* `wdio-cli`
  * [#6668](https://github.com/webdriverio/webdriverio/pull/6668) feat: add wdio-ocr-service to the service menu and service cli ([@wswebcreation](https://github.com/wswebcreation))
* Other
  * [#6647](https://github.com/webdriverio/webdriverio/pull/6647) Fixed github logo color for dark mode ([@arsen1c](https://github.com/arsen1c))
  * [#6646](https://github.com/webdriverio/webdriverio/pull/6646) Fixed missing github icon on the Team page ([@arsen1c](https://github.com/arsen1c))

#### Committers: 7
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Giacomo Magini ([@giacomomagini](https://github.com/giacomomagini))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@arsen1c](https://github.com/arsen1c)
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v7.3.0 (2021-03-30)

#### :rocket: New Feature
* `wdio-cli`, `wdio-config`, `wdio-reporter`, `wdio-spec-reporter`
  * [#6548](https://github.com/webdriverio/webdriverio/pull/6548) Implementation of grouped spec files for a single worker instance ([@RossVertizan](https://github.com/RossVertizan))
* `devtools`, `webdriverio`
  * [#6637](https://github.com/webdriverio/webdriverio/pull/6637) Implement`attachToSession` for devtools package ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-utils`
  * [#6512](https://github.com/webdriverio/webdriverio/pull/6512) Issue #6511 fix  ([@patkunicki](https://github.com/patkunicki))
* `wdio-runner`
  * [#6629](https://github.com/webdriverio/webdriverio/pull/6629) Propagate connection details from capabilities ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-selenium-standalone-service`
  * [#6628](https://github.com/webdriverio/webdriverio/pull/6628) Check caps in `@wdio/selenium-standalone-server` before modifying capabilities ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cucumber-framework`
  * [#6619](https://github.com/webdriverio/webdriverio/pull/6619) Make CucumberOpts properties optional ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#6641](https://github.com/webdriverio/webdriverio/pull/6641) Fix name typo ([@klamping](https://github.com/klamping))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Ross Addinall ([@RossVertizan](https://github.com/RossVertizan))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)
- [@patkunicki](https://github.com/patkunicki)


## v7.2.2 (2021-03-22)

#### :bug: Bug Fix
* `webdriverio`
  * [#6600](https://github.com/webdriverio/webdriverio/pull/6600) Fix drag and drop ([@erwinheitzman](https://github.com/erwinheitzman))
  * [#6610](https://github.com/webdriverio/webdriverio/pull/6610) fix(typo): Minor typo fixes and #6553 ([@JS31096](https://github.com/JS31096))

#### :nail_care: Polish
* `webdriverio`
  * [#6602](https://github.com/webdriverio/webdriverio/pull/6602) Fix typo in error message ([@cpeck-bi](https://github.com/cpeck-bi))

#### Committers: 3
- Christopher Peck ([@cpeck-bi](https://github.com/cpeck-bi))
- Erwin Heitzman ([@erwinheitzman](https://github.com/erwinheitzman))
- Sri Harsha ([@JS31096](https://github.com/JS31096))


## v7.2.1 (2021-03-18)

#### :nail_care: Polish
* `wdio-cli`
  * [#6594](https://github.com/webdriverio/webdriverio/pull/6594) Better expose config handler ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-appium-service`, `wdio-applitools-service`, `wdio-cli`, `wdio-devtools-service`, `wdio-jasmine-framework`
  * [#6597](https://github.com/webdriverio/webdriverio/pull/6597) Mitigate LGTM scan warnings ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-types`, `webdriverio`
  * [#6599](https://github.com/webdriverio/webdriverio/pull/6599) Use a flat namespace for selenium options for finding WebDriver Bidi endpoint ([@BorisOsipov](https://github.com/BorisOsipov))

#### :memo: Documentation
* Other
  * [#6598](https://github.com/webdriverio/webdriverio/pull/6598) Improve project contributing guidelines ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#6317](https://github.com/webdriverio/webdriverio/pull/6317) Make it easier to add commands that make WebDriver based requests ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v7.2.0 (2021-03-16)

#### :rocket: New Feature
* `wdio-sauce-service`
  * [#6099](https://github.com/webdriverio/webdriverio/pull/6099) Upload WDIO logs to Sauce Labs via Sauce Service ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-config`, `wdio-types`
  * [#6581](https://github.com/webdriverio/webdriverio/pull/6581) Support custom tsconfig-paths options ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `webdriverio`
  * [#6582](https://github.com/webdriverio/webdriverio/pull/6582) Only apply base url if not empty string ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#6574](https://github.com/webdriverio/webdriverio/pull/6574) docs(typings): #6458 use a more suitable return type for waitUntil ([@iamkenos](https://github.com/iamkenos))

#### :memo: Documentation
* [#6580](https://github.com/webdriverio/webdriverio/pull/6580) Update BambooIntegration.md ([@vishwanath7sh](https://github.com/vishwanath7sh))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Vishwanath S h ([@vishwanath7sh](https://github.com/vishwanath7sh))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)
- iamkenos ([@iamkenos](https://github.com/iamkenos))


## v7.1.2 (2021-03-11)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-cucumber-framework`, `wdio-jasmine-framework`, `wdio-local-runner`, `wdio-mocha-framework`
  * [#6577](https://github.com/webdriverio/webdriverio/pull/6577) Update `expect-webdriverio` ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-junit-reporter`
  * [#6464](https://github.com/webdriverio/webdriverio/pull/6464) Junit cucumber reporting fix ([@AutomationReddy](https://github.com/AutomationReddy))
* `wdio-cli`
  * [#6573](https://github.com/webdriverio/webdriverio/pull/6573) bugfix: #6569 only install tagged version if requested spec doesnt match semver ([@iamkenos](https://github.com/iamkenos))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Vinod Reddy ([@AutomationReddy](https://github.com/AutomationReddy))
- iamkenos ([@iamkenos](https://github.com/iamkenos))


## v7.1.1 (2021-03-09)

#### :rocket: New Feature
* `wdio-types`, `webdriverio`
  * [#6508](https://github.com/webdriverio/webdriverio/pull/6508) Support Selenium 4.0 Grid CDP for Devtools Service ([@dylanlive](https://github.com/dylanlive))

#### :nail_care: Polish
* `wdio-jasmine-framework`, `webdriverio`
  * [#6558](https://github.com/webdriverio/webdriverio/pull/6558) docs(typings): #6549 improve typings using overloads - getLocation, getSize ([@iamkenos](https://github.com/iamkenos))

#### :memo: Documentation
* `wdio-types`
  * [#6507](https://github.com/webdriverio/webdriverio/pull/6507) Fix unable to use nativeWebTap in capabilities ([@lukyth](https://github.com/lukyth))

#### Committers: 3
- Dylan Reichstadt ([@dylanlive](https://github.com/dylanlive))
- Kanitkorn Sujautra ([@lukyth](https://github.com/lukyth))
- iamkenos ([@iamkenos](https://github.com/iamkenos))


## v7.1.0 (2021-03-05)

#### :rocket: New Feature
* `webdriverio`
  * [#6480](https://github.com/webdriverio/webdriverio/pull/6480) make use of ARIA Sematics role to identify element(webdriverio#6363) ([@jayandran-Sampath](https://github.com/jayandran-Sampath))

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#6541](https://github.com/webdriverio/webdriverio/pull/6541) Fix test status in allure when several steps are passed and other skipped ([@lacell75](https://github.com/lacell75))
  * [#6533](https://github.com/webdriverio/webdriverio/pull/6533) Closes [#6531](https://github.com/webdriverio/webdriverio/issues/6531) return correct test status in allure report ([@lacell75](https://github.com/lacell75))

#### Committers: 2
- Fabien CELLIER ([@lacell75](https://github.com/lacell75))
- [@jayandran-Sampath](https://github.com/jayandran-Sampath)


## v7.0.9 (2021-03-01)

#### :bug: Bug Fix
* `webdriverio`
  * [#6520](https://github.com/webdriverio/webdriverio/pull/6520) Fix TS return types for $ command ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`, `webdriverio`
  * [#6487](https://github.com/webdriverio/webdriverio/pull/6487) Fix shrinked viewport for devtools package ([@L0tso](https://github.com/L0tso))

#### :nail_care: Polish
* `webdriverio`
  * [#6521](https://github.com/webdriverio/webdriverio/pull/6521) Expose ElementArray as type to the WebdriverIO namespace ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* Other
  * [#6522](https://github.com/webdriverio/webdriverio/pull/6522) Minor typo in example in README.md ([@pgAdmin](https://github.com/pgAdmin))
  * [#6509](https://github.com/webdriverio/webdriverio/pull/6509) Fix a typo ([@tai2](https://github.com/tai2))
* `wdio-sauce-service`
  * [#6513](https://github.com/webdriverio/webdriverio/pull/6513) change SC options link ([@enriquegh](https://github.com/enriquegh))

#### Committers: 6
- Bohdan Belenok ([@L0tso](https://github.com/L0tso))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Enrique Gonzalez ([@enriquegh](https://github.com/enriquegh))
- Punit Gupta ([@pgAdmin](https://github.com/pgAdmin))
- Taiju Muto ([@tai2](https://github.com/tai2))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v7.0.8 (2021-02-25)

#### :rocket: New Feature
* `devtools`
  * [#6371](https://github.com/webdriverio/webdriverio/pull/6371) Added goog:chromeOption for passing the debugging port to the devtools chrome launcher (Closes [#6370](https://github.com/webdriverio/webdriverio/issues/6370)) ([@jamesmortensen](https://github.com/jamesmortensen))

#### :bug: Bug Fix
* `wdio-sumologic-reporter`
  * [#6485](https://github.com/webdriverio/webdriverio/pull/6485) change internal variable type to resolve build issue ([@jayandran-Sampath](https://github.com/jayandran-Sampath))

#### :memo: Documentation
* `webdriverio`
  * [#6498](https://github.com/webdriverio/webdriverio/pull/6498) add missing type property hex for ParsedColor ([@dannyfink](https://github.com/dannyfink))
* `wdio-devtools-service`
  * [#6497](https://github.com/webdriverio/webdriverio/pull/6497) add missing comma for code coverage snippet for devtools service ([@dannyfink](https://github.com/dannyfink))
* Other
  * [#6493](https://github.com/webdriverio/webdriverio/pull/6493) docs: fix minor typo ([@timbru31](https://github.com/timbru31))
  * [#6484](https://github.com/webdriverio/webdriverio/pull/6484) Add og:image and twitter:image ([@38elements](https://github.com/38elements))

#### :house: Internal
* Other
  * [#6504](https://github.com/webdriverio/webdriverio/pull/6504) Fix failed test from conflicting node type definition ([@lukyth](https://github.com/lukyth))
* `webdriverio`
  * [#6505](https://github.com/webdriverio/webdriverio/pull/6505) Remove unused constants ([@lukyth](https://github.com/lukyth))

#### Committers: 7
- 17thSep.net ([@17thSep](https://github.com/17thSep))
- 38elements ([@38elements](https://github.com/38elements))
- James ([@jamesmortensen](https://github.com/jamesmortensen))
- Kanitkorn Sujautra ([@lukyth](https://github.com/lukyth))
- Tim Brust ([@timbru31](https://github.com/timbru31))
- [@dannyfink](https://github.com/dannyfink)
- [@jayandran-Sampath](https://github.com/jayandran-Sampath)


## v7.0.7 (2021-02-18)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-config`, `wdio-runner`, `wdio-types`
  * [#6475](https://github.com/webdriverio/webdriverio/pull/6475) Fix auto compile mechanism ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`, `wdio-types`
  * [#6473](https://github.com/webdriverio/webdriverio/pull/6473) better type and document `wdio:devtoolsOptions` ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-config`, `wdio-jasmine-framework`, `wdio-junit-reporter`
  * [#6472](https://github.com/webdriverio/webdriverio/pull/6472) Rename `jasmineNodeOpts` into `jasmineOpts` ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-types`
  * [#6474](https://github.com/webdriverio/webdriverio/pull/6474) Improve type definition for Sauce Labs capabilities ([@christian-bromann](https://github.com/christian-bromann))
* Other
  * [#6462](https://github.com/webdriverio/webdriverio/pull/6462) Update autocompletion ([@MikoSh95](https://github.com/MikoSh95))

#### :house: Internal
* `wdio-cucumber-framework`
  * [#6476](https://github.com/webdriverio/webdriverio/pull/6476) Cleanup cucumber-framework dependencies ([@esaari](https://github.com/esaari))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Eric Saari ([@esaari](https://github.com/esaari))
- Piotr Mikosz ([@MikoSh95](https://github.com/MikoSh95))


## v7.0.6 (2021-02-17)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#6453](https://github.com/webdriverio/webdriverio/pull/6453) Fix/add cucumber keyword ([@wswebcreation](https://github.com/wswebcreation))

#### :memo: Documentation
* [#6455](https://github.com/webdriverio/webdriverio/pull/6455) Update autocompletion.md ([@MikoSh95](https://github.com/MikoSh95))

#### Committers: 2
- Piotr Mikosz ([@MikoSh95](https://github.com/MikoSh95))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v7.0.5 (2021-02-16)

#### :bug: Bug Fix
* `wdio-sauce-service`
  * [#6454](https://github.com/webdriverio/webdriverio/pull/6454) Fix/sauce service cucumber ([@wswebcreation](https://github.com/wswebcreation))

#### :memo: Documentation
* [#6446](https://github.com/webdriverio/webdriverio/pull/6446) chore: fix link to contributor guide in README ([@web-padawan](https://github.com/web-padawan))

#### :house: Internal
* `devtools`, `wdio-devtools-service`, `webdriverio`
  * [#6447](https://github.com/webdriverio/webdriverio/pull/6447) chore: remove obsolete puppeteer types ([@web-padawan](https://github.com/web-padawan))

#### Committers: 2
- Serhii Kulykov ([@web-padawan](https://github.com/web-padawan))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v7.0.4 (2021-02-15)

#### :bug: Bug Fix
* `wdio-cucumber-framework`
  * [#6441](https://github.com/webdriverio/webdriverio/pull/6441) Ensure that 'title' property is passed down by cucumber framework to reporters ([@rickschubert](https://github.com/rickschubert))
* `wdio-cli`, `wdio-local-runner`, `wdio-types`
  * [#6373](https://github.com/webdriverio/webdriverio/pull/6373) @wdio/cli: Ensure watch mode re-runs all specs when the --spec command line option is set and a filesToWatch file is added or changed ([@kohlmannj](https://github.com/kohlmannj))

#### :nail_care: Polish
* `wdio-junit-reporter`
  * [#6439](https://github.com/webdriverio/webdriverio/pull/6439) Removed _ from suite/test name in junit reporter ([@AutomationReddy](https://github.com/AutomationReddy))

#### :memo: Documentation
* `devtools`, `wdio-allure-reporter`
  * [#6419](https://github.com/webdriverio/webdriverio/pull/6419) fix typos and version doc link ([@spnraju](https://github.com/spnraju))
* Other
  * [#6444](https://github.com/webdriverio/webdriverio/pull/6444) fixed typo in the wdio exec command ([@AutomationReddy](https://github.com/AutomationReddy))
* `wdio-runner`, `webdriverio`
  * [#6429](https://github.com/webdriverio/webdriverio/pull/6429) Improve typings for instance base ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`, `wdio-cucumber-framework`, `webdriverio`
  * [#6431](https://github.com/webdriverio/webdriverio/pull/6431) fix docs for cucumber hooks ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* `wdio-junit-reporter`
  * [#6430](https://github.com/webdriverio/webdriverio/pull/6430) bump junit reporter builder ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Joseph Kohlmann (he/him/his) ([@kohlmannj](https://github.com/kohlmannj))
- Raju ([@spnraju](https://github.com/spnraju))
- Rick Schubert ([@rickschubert](https://github.com/rickschubert))
- Vinod Reddy ([@AutomationReddy](https://github.com/AutomationReddy))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v7.0.3 (2021-02-12)

#### :bug: Bug Fix
* `wdio-types`, `webdriver`, `webdriverio`
  * [#6416](https://github.com/webdriverio/webdriverio/pull/6416) Move user/key options back to `webdriver` package ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#6415](https://github.com/webdriverio/webdriverio/pull/6415) Allow `ScrollIntoViewOptions` in `scrollIntoView` ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v7.0.2 (2021-02-11)

#### :nail_care: Polish
* `wdio-config`, `wdio-runner`, `wdio-sync`, `wdio-types`, `webdriver`, `webdriverio`
  * [#6408](https://github.com/webdriverio/webdriverio/pull/6408) Refactor `detectBackend` and move it to the `webdriverio` package ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v7.0.1 (2021-02-09)

#### :nail_care: Polish
* `webdriverio`
  * [#6401](https://github.com/webdriverio/webdriverio/pull/6401) Export RemoteOptions type ([@lukyth](https://github.com/lukyth))

#### :house: Internal
* `wdio-allure-reporter`, `wdio-appium-service`, `wdio-applitools-service`, `wdio-browserstack-service`, `wdio-concise-reporter`, `wdio-crossbrowsertesting-service`, `wdio-cucumber-framework`, `wdio-devtools-service`, `wdio-dot-reporter`, `wdio-firefox-profile-service`, `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-local-runner`, `wdio-sauce-service`, `wdio-selenium-standalone-service`, `wdio-spec-reporter`, `wdio-sumologic-reporter`, `wdio-testingbot-service`
  * [#6402](https://github.com/webdriverio/webdriverio/pull/6402) Update peer dependencies ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kanitkorn Sujautra ([@lukyth](https://github.com/lukyth))


## v7.0.0 (2021-02-09)

#### :boom: Breaking Change
* [#6302](https://github.com/webdriverio/webdriverio/pull/6302) TypeScript Rewrite
  * As we have moved the complete code base to TypeScript we have rewritten the way how WebdriverIO provides type definitions to you. This has been more or less and internal change that should only affect users using TypeScript and having custom command definitions. In order to have proper type support now you need to add `webdriverio/sync` to your list of types, e.g.:
    ```json
    // tsconfig.json
    "types": [
      "node",
      "webdriverio/sync",
      "@wdio/mocha-framework"
    ],
    ```

    Custom commands can now be added like this:

    ```js
    declare global {
        namespace WebdriverIO {
            interface Browser {
                browserCustomCommand: (arg: number) => void
            }
        }
    }
    browser.browserCustomCommand(42)
    ```
    We do __not__ recommend to specify `webdriverio` or `@wdio/sync` in there anymore. For more information visit our updated docs on [TypeScript Integration](https://webdriver.io/docs/typescript).
  * If you use WebdriverIO in [multiremote mode](https://webdriver.io/docs/multiremote) to get proper typing you should use the `multiremote` global variable
  * Alongside with this change we also equipped the testrunner to auto-compile your configuration if TypeScript is detected, this allows to leverage type safety in your WDIO configuration without any additional setup (big thanks for this contribution goes to [@r4j4h](https://github.com/r4j4h)) 👏 With that you also don't need `ts-node/register` to be required in your Mocha, Jasmine or Cucumber options, e.g.:
    ```suggestion
    jasmineOpts: {
        - requires: ['ts-node/register', 'tsconfig-paths/register'],
        + requires: ['tsconfig-paths/register'],
    },
    ```
  * It is required to have TypeScript v4 or higher
* [#6309](https://github.com/webdriverio/webdriverio/pull/6309) Cucumber Framework update to v7
  * We have updated our Cucumber integration to use Cucumber v7
  * To provide proper type safety we updated the Cucumber hooks to match original Cucumber types
* [#6276](https://github.com/webdriverio/webdriverio/pull/6276) Google Lighthouse Updates
  * We have updated Google Lighthouse to support the latest performance metrics introduced by Google Lighthouse v7
  * There are no default environment changes when running performance tests anymore. If you want to emulate a mobile user (which is a recommended practice) you have to pass these information when running `enablePerformanceAudits`, e.g.:
    ```js
    browser.emulateDevice('iPhone X')
    browser.enablePerformanceAudits({
        networkThrottling: 'Regular 3G',
        cpuThrottling: 4,
        cacheEnabled: false,
        formFactor: 'mobile'
    })
    ```
  * We added `formFactor` to the `EnablePerformanceAuditsOptions` as it has been added to Lighthouse v7 as well, it tweaks the performance results based on which environment you run your tests in to give certain performance factors more weight
  * We added a new command test PWA apps based on Google Lighthouse audits, e.g.:
    ```js
    const result = browser.checkPWA()
    expect(result.passed).toBe(true)
    ```
    Checks the following PWA criterias:
    - [Installable](https://web.dev/lighthouse-pwa/#installable)
    - [PWA optimized](https://web.dev/lighthouse-pwa/#pwa-optimized) (without checking for HTTPS redirect)

    We have purposely not added the complete set of audits as they require data that can only be captured through additional automation commands. These could interfer with further test processes and skew results and create flakiness which would make integrating these commands difficult.
* [#3407](https://github.com/webdriverio/webdriverio/pull/3407) Automatically run worker with Babel if setup
  * In order to improve the onboarding experience we will now automatically compile the configuration and your test files using Babel or TypeScript
  * This will allow you to have `import` statements in your config file without any additional setup
* [#6054](https://github.com/webdriverio/webdriverio/pull/6054) Validate W3C Capabilities
  * With the [WebDriver protocol](https://w3c.github.io/webdriver/) being a recommended standard since 2018 we want to move away from usage of outdated capability sets that might confuse WebDriver endpoints
  * This breaking change will throw an error if we detect invalid capabilities when user use a mixture of clear W3C capabilities and outdated JSONWireProtocol capabilities, e.g.:
    ```js
    capabilities: {
        browserName: 'Chrome',
        platform: 'Windows 10', // invalid JSONWire Protocol capability
        'goog:chromeOptions': { ... }
    }
    ```
    will fail this check because vendor capabilities have been used which were introduced by WebDriver while at the same time a JSONWireProtocol capability (`platform`) has been used too
* [#6236](https://github.com/webdriverio/webdriverio/pull/6236) Update fibers to v5 and drop Node.js support for v10
  * We recommend to continue to use Node.js v12 and higher)

#### :rocket: New Feature
* [#6311](https://github.com/webdriverio/webdriverio/pull/6311) Get Test Coverage Report
  * The `@wdio/devtools-service` now offers to capture the code coverage of your JavaScript application files. This can help you to identify whether you should write more e2e tests or not. To enable the feature you have to enable it by setting the `coverageReporter` option for the service:
    ```js
    // wdio.conf.js
    services: [
        ['devtools' {
            coverageReporter: {
                enable: true,
                type: 'html',
                logDir: __dirname + '/coverage'
            }
        }]
    ]
    ```
  * You can also assert the code coverage within your tests using the new `getCoverageReport` command, e.g.:
    ```js
    const coverage = browser.getCoverageReport()
    expect(coverage.lines.total).toBeAbove(0.9)
    expect(coverage.statements.total).toBeAbove(0.9)
    expect(coverage.functions.total).toBeAbove(0.9)
    expect(coverage.branches.total).toBeAbove(0.9)
    ```

#### :house: Internal
* We have renamed our main development branch from `master` to `main`
  * As the WebdriverIO community is committed to be an inclusive community we join the global effort to remove all unnecessary references to slavery and other non-inclusive terms.

#### :nail_care: Polish
* [#6392](https://github.com/webdriverio/webdriverio/pull/6392) Add Sauce Labs sharable report links in `@wdio/spec-reporter`

#### :memo: Documentation
* New Website Design and Documentation Overhaul
  * The project maintainers are constantly striving to provide better documentation and clear descriptions on commands and WebdriverIO functionality. We the v7 release we now also publish an overhauled website design and re-organisation of our docs.
  * You will continue to find the old docs in their respective places:
    - v6 docs - [v6.webdriver.io](https://v6.webdriver.io)
    - v5 docs - [v5.webdriver.io](https://v5.webdriver.io)
    - v4 docs - [v4.webdriver.io](https://v4.webdriver.io)
