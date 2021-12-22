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

## v7.16.12 (2021-12-15)

#### :memo: Documentation
* `wdio-cli`, `wdio-cucumber-framework`, `wdio-junit-reporter`
  * [#7818](https://github.com/webdriverio/webdriverio/pull/7818) Removed cucumberopts profile and format that has no support yet.  ([@praveendvd](https://github.com/praveendvd))
* Other
  * [#7802](https://github.com/webdriverio/webdriverio/pull/7802) Update Overwriting element commands example ([@alexmi256](https://github.com/alexmi256))

#### Committers: 2
- Alex Mi ([@alexmi256](https://github.com/alexmi256))
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v7.16.11 (2021-12-10)

#### :bug: Bug Fix
* `wdio-sauce-service`
  * [#7769](https://github.com/webdriverio/webdriverio/pull/7769) Fix sauce w3c support ([@wswebcreation](https://github.com/wswebcreation))

#### :nail_care: Polish
* `wdio-sauce-service`, `wdio-types`
  * [#7779](https://github.com/webdriverio/webdriverio/pull/7779) feat: add cucumber step name in Sauce ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-cucumber-framework`
  * [#7777](https://github.com/webdriverio/webdriverio/pull/7777) fix: update state for a skipped test ([@wswebcreation](https://github.com/wswebcreation))
  * [#7757](https://github.com/webdriverio/webdriverio/pull/7757) Make @wdio/cucumber-framework export World class ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-types`, `webdriverio`
  * [#7799](https://github.com/webdriverio/webdriverio/pull/7799) docs: port descriptions from Appium's official document ([@DevDengChao](https://github.com/DevDengChao))
* `wdio-types`
  * [#7795](https://github.com/webdriverio/webdriverio/pull/7795) Docs ([@DevDengChao](https://github.com/DevDengChao))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dmitriy Dudkevich ([@DudaGod](https://github.com/DudaGod))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- 邓超 ([@DevDengChao](https://github.com/DevDengChao))


## v7.16.10 (2021-11-25)

#### :bug: Bug Fix
* `devtools`
  * [#7746](https://github.com/webdriverio/webdriverio/pull/7746) fix(devtools): accepting a prompt preserves the default value. Closes [#7744](https://github.com/webdriverio/webdriverio/issues/7744) ([@jan-molak](https://github.com/jan-molak))

#### :nail_care: Polish
* `wdio-sauce-service`
  * [#7732](https://github.com/webdriverio/webdriverio/pull/7732) feat: properly update Multi Remote jobs on Sauce ([@wswebcreation](https://github.com/wswebcreation))

#### Committers: 3
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@LilyAita](https://github.com/LilyAita)


## v7.16.9 (2021-11-22)

#### :bug: Bug Fix
* `wdio-spec-reporter`
  * [#7727](https://github.com/webdriverio/webdriverio/pull/7727) fix: fix 6357 ([@wswebcreation](https://github.com/wswebcreation))

#### :nail_care: Polish
* `wdio-devtools-service`, `webdriver`, `webdriverio`
  * [#7711](https://github.com/webdriverio/webdriverio/pull/7711) Use buffer instead of atob/btoa ([@Nio-o](https://github.com/Nio-o))

#### :memo: Documentation
* [#7721](https://github.com/webdriverio/webdriverio/pull/7721) doc(README): add a community section ([@Badisi](https://github.com/Badisi))
* [#7707](https://github.com/webdriverio/webdriverio/pull/7707) Remove outdated double-await issue in docs ([@klamping](https://github.com/klamping))

#### Committers: 4
- Eugene ([@Nio-o](https://github.com/Nio-o))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))
- [@Badisi](https://github.com/Badisi)


## v7.16.8 (2021-11-15)

#### :nail_care: Polish
* `wdio-sauce-service`
  * [#7672](https://github.com/webdriverio/webdriverio/pull/7672) Set the job name before a suite is run ([@gabriel-kohen-by](https://github.com/gabriel-kohen-by))
* `wdio-allure-reporter`
  * [#7691](https://github.com/webdriverio/webdriverio/pull/7691) Fix for Console log note added to failed cucumber step ([@praveendvd](https://github.com/praveendvd))

#### :house: Internal
* [#7699](https://github.com/webdriverio/webdriverio/pull/7699) doc(README): replace broken logo ([@Badisi](https://github.com/Badisi))

#### Committers: 3
- Gabriel Kohen ([@gabriel-kohen-by](https://github.com/gabriel-kohen-by))
- [@Badisi](https://github.com/Badisi)
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v7.16.7 (2021-11-12)

#### :rocket: New Feature
* `devtools`, `wdio-protocols`
  * [#7689](https://github.com/webdriverio/webdriverio/pull/7689) Implement WebDriver shadow commands in DevTools bridge ([@christian-bromann](https://github.com/christian-bromann))
  * [#7682](https://github.com/webdriverio/webdriverio/pull/7682) Add WebDriver protocol commands to fetch shadow elements ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-cli`
  * [#7688](https://github.com/webdriverio/webdriverio/pull/7688) Don't escape characters in templates ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Abhi Singh ([@abhi2810](https://github.com/abhi2810))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v7.16.6 (2021-11-10)

#### :bug: Bug Fix
* `webdriverio`
  * [#7677](https://github.com/webdriverio/webdriverio/pull/7677) Explicitly wait for window handle to be picked up in DevTools ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-junit-reporter`
  * [#7680](https://github.com/webdriverio/webdriverio/pull/7680) Adding ability to override Suite Name ([@facusantillo](https://github.com/facusantillo))
* `wdio-cli`
  * [#7671](https://github.com/webdriverio/webdriverio/pull/7671) Stricter typing examples ([@Badisi](https://github.com/Badisi))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Facundo Santillo Alarcon ([@facusantillo](https://github.com/facusantillo))
- [@Badisi](https://github.com/Badisi)


## v7.16.5 (2021-11-09)

#### :nail_care: Polish
* `wdio-cli`, `wdio-cucumber-framework`
  * [#7662](https://github.com/webdriverio/webdriverio/pull/7662) Issue 7651: add Cucumber World object back to step/scenario hooks ([@jvisco](https://github.com/jvisco))

#### :memo: Documentation
* `webdriverio`
  * [#7663](https://github.com/webdriverio/webdriverio/pull/7663) Better clarify which commands wait on elements to exist ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@jvisco](https://github.com/jvisco)


## v7.16.4 (2021-11-03)

#### :bug: Bug Fix
* `wdio-devtools-service`
  * [#7618](https://github.com/webdriverio/webdriverio/pull/7618) Connect to target manually if going through remote server ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* Other
  * [#7615](https://github.com/webdriverio/webdriverio/pull/7615) add comments for maxInstances default value ([@KennethKinLum](https://github.com/KennethKinLum))
  * [#7611](https://github.com/webdriverio/webdriverio/pull/7611) Fix typo in Auto-waiting doc ([@lojzatran](https://github.com/lojzatran))
* `wdio-cli`
  * [#7610](https://github.com/webdriverio/webdriverio/pull/7610) fix typo in login.page.js.ejs ([@hgsgtk](https://github.com/hgsgtk))

#### Committers: 5
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Kazuki Higashiguchi ([@hgsgtk](https://github.com/hgsgtk))
- Kenneth Lum ([@KennethKinLum](https://github.com/KennethKinLum))
- Lam Tran ([@lojzatran](https://github.com/lojzatran))
- Mikita Lisavets ([@MikitaLisavets](https://github.com/MikitaLisavets))


## v7.16.3 (2021-10-26)

#### :bug: Bug Fix
* `wdio-shared-store-service`
  * [#7593](https://github.com/webdriverio/webdriverio/pull/7593) Fix running setValue in onPrepare hook ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cucumber-framework`, `wdio-jasmine-framework`, `wdio-mocha-framework`
  * [#7604](https://github.com/webdriverio/webdriverio/pull/7604) Automatically export expect-webdriverio types ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-cli`
  * [#7602](https://github.com/webdriverio/webdriverio/pull/7602) update links to test-configuration-options ([@walkerlj0](https://github.com/walkerlj0))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Lindsay Walker ([@walkerlj0](https://github.com/walkerlj0))


## v7.16.1 (2021-10-22)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-types`
  * [#7578](https://github.com/webdriverio/webdriverio/pull/7578) Fix for device Name not showing up ([@praveendvd](https://github.com/praveendvd))

#### :nail_care: Polish
* `wdio-cucumber-framework`, `wdio-reporter`, `wdio-spec-reporter`
  * [#7554](https://github.com/webdriverio/webdriverio/pull/7554) #7439 Propagating rule keyboard to wdio-spec-reporter ([@lthurr](https://github.com/lthurr))

#### :memo: Documentation
* [#7575](https://github.com/webdriverio/webdriverio/pull/7575) updated documentation ([@praveendvd](https://github.com/praveendvd))

#### Committers: 2
- Luis Thur ([@lthurr](https://github.com/lthurr))
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v7.15.0 (2021-10-08)

#### :rocket: New Feature
* `wdio-junit-reporter`
  * [#7525](https://github.com/webdriverio/webdriverio/pull/7525) feat(wdio-junit-reporter): allow to override className format ([@Slashgear](https://github.com/Slashgear))
* `wdio-shared-store-service`
  * [#7519](https://github.com/webdriverio/webdriverio/pull/7519) feat(shared-store-service): export set and get value globally ([@Slashgear](https://github.com/Slashgear))

#### :memo: Documentation
* [#7529](https://github.com/webdriverio/webdriverio/pull/7529) 7324 - added support for fragment identifiers (#) in 3rd party doc  ([@babusekaran](https://github.com/babusekaran))

#### Committers: 2
- Antoine Caron ([@Slashgear](https://github.com/Slashgear))
- Babu Sekaran ([@babusekaran](https://github.com/babusekaran))


## v7.14.1 (2021-10-04)

#### :bug: Bug Fix
* `wdio-browserstack-service`, `wdio-types`
  * [#7507](https://github.com/webdriverio/webdriverio/pull/7507) fix status type in afterScenario hook of BS service ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#7508](https://github.com/webdriverio/webdriverio/pull/7508) Ignore errors in releaseActions click command ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v7.14.0 (2021-09-30)

#### :bug: Bug Fix
* `wdio-devtools-service`
  * [#7019](https://github.com/webdriverio/webdriverio/pull/7019) Upgrade lighthouse dependencies and fix performance tests ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-cli`
  * [#7471](https://github.com/webdriverio/webdriverio/pull/7471) Check for tsconfig file and create if it doesn't exists for type script project ([@praveendvd](https://github.com/praveendvd))

#### :memo: Documentation
* [#7487](https://github.com/webdriverio/webdriverio/pull/7487) Added boiler plate code for webdriverIO electronjs , winappdriver , mutiremote setups ([@praveendvd](https://github.com/praveendvd))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v7.13.2 (2021-09-27)

#### :memo: Documentation
* `wdio-jasmine-framework`, `wdio-types`, `wdio-utils`
  * [#7475](https://github.com/webdriverio/webdriverio/pull/7475) Fix before/afterHook parameters for Cucumber ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-protocols`
  * [#7472](https://github.com/webdriverio/webdriverio/pull/7472) Documentation update for webdriver protocol ([@praveendvd](https://github.com/praveendvd))
* `wdio-allure-reporter`
  * [#7420](https://github.com/webdriverio/webdriverio/pull/7420) updated documentation for accepted values for allure reporter > severity ([@saranyaeaswaran](https://github.com/saranyaeaswaran))

#### :house: Internal
* [#7359](https://github.com/webdriverio/webdriverio/pull/7359) Fix broken iFrame e2e test ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Saranya Easwaran ([@saranyaeaswaran](https://github.com/saranyaeaswaran))
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v7.13.1 (2021-09-23)

#### :bug: Bug Fix
* `wdio-utils`
  * [#7467](https://github.com/webdriverio/webdriverio/pull/7467) Allow sync assertions in async context ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v7.13.0 (2021-09-22)

#### :rocket: New Feature
* `wdio-protocols`
  * [#7451](https://github.com/webdriverio/webdriverio/pull/7451) Allow to access Selenium v4 GraphQL data ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-cli`, `wdio-runner`, `wdio-sauce-service`, `wdio-types`
  * [#7461](https://github.com/webdriverio/webdriverio/pull/7461) only upload log files with the same cid ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`
  * [#7437](https://github.com/webdriverio/webdriverio/pull/7437) Detect Selenium v4 Server ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#7425](https://github.com/webdriverio/webdriverio/pull/7425) Write migration guide from sync to async tests ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* `wdio-cli`, `wdio-utils`
  * [#7458](https://github.com/webdriverio/webdriverio/pull/7458) Bump expect-webdriverio to improve async jasmine execution ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v7.12.5 (2021-09-14)

#### :bug: Bug Fix
* `devtools`, `wdio-types`
  * [#7422](https://github.com/webdriverio/webdriverio/pull/7422) Improve mobile emulation capabilities ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-reporter`
  * [#7421](https://github.com/webdriverio/webdriverio/pull/7421) Fix error diffing in Jasmine ([@christian-bromann](https://github.com/christian-bromann))
* `webdriver`
  * [#7401](https://github.com/webdriverio/webdriverio/pull/7401) fix(webdriver): browser request should use btoa for basic auth, not atob ([@jlipps](https://github.com/jlipps))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jonathan Lipps ([@jlipps](https://github.com/jlipps))


## v7.12.3 (2021-09-10)

#### :bug: Bug Fix
* `wdio-utils`
  * [#7313](https://github.com/webdriverio/webdriverio/pull/7313) Enable custom chain-able commands with async API ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-runner`, `wdio-shared-store-service`, `webdriverio`
  * [#7215](https://github.com/webdriverio/webdriverio/pull/7215) Only run stale element work around for safari browser ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v7.12.2 (2021-09-08)

#### :bug: Bug Fix
* `wdio-utils`, `wdio-webdriver-mock-service`, `webdriverio`
  * [#7397](https://github.com/webdriverio/webdriverio/pull/7397) Fix chaining of custom$ and custom$ ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 1
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v7.12.1 (2021-09-07)

#### :rocket: New Feature
* `wdio-cli`, `wdio-cucumber-framework`
  * [#7398](https://github.com/webdriverio/webdriverio/pull/7398) Export Cucumber functions through `@wdio/cucumber-framework` package ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#7352](https://github.com/webdriverio/webdriverio/pull/7352) chore: make return value optional in executeAsync function ([@Joozty](https://github.com/Joozty))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jozef Harag ([@Joozty](https://github.com/Joozty))


## v7.12.0 (2021-09-06)

#### :rocket: New Feature
* `wdio-protocols`, `wdio-utils`, `webdriver`, `webdriverio`
  * [#7384](https://github.com/webdriverio/webdriverio/pull/7384) Add Geckodriver specific protocol commands ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `wdio-cli`
  * [#7379](https://github.com/webdriverio/webdriverio/pull/7379) Fixes afterTest template for allure reporter ([@gpt14](https://github.com/gpt14))
* `devtools`
  * [#7358](https://github.com/webdriverio/webdriverio/pull/7358) Allow undefined as executeAsync parameter ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-jasmine-framework`
  * [#7371](https://github.com/webdriverio/webdriverio/pull/7371) Overwrite jasmine types to allow retries ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#7382](https://github.com/webdriverio/webdriverio/pull/7382) docs(website): add new company in carousel ([@Slashgear](https://github.com/Slashgear))
* [#7372](https://github.com/webdriverio/webdriverio/pull/7372) docs: typos, grammar ([@saintmalik](https://github.com/saintmalik))
* [#7370](https://github.com/webdriverio/webdriverio/pull/7370) removed duplicate reporter entry ([@babusekaran](https://github.com/babusekaran))

#### Committers: 5
- Antoine Caron ([@Slashgear](https://github.com/Slashgear))
- Babu Sekaran ([@babusekaran](https://github.com/babusekaran))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- GPT14 ([@gpt14](https://github.com/gpt14))
- SaintMalik ([@saintmalik](https://github.com/saintmalik))


## v7.11.1 (2021-08-30)

#### :bug: Bug Fix
* `wdio-jasmine-framework`, `wdio-junit-reporter`, `wdio-mocha-framework`
  * [#7357](https://github.com/webdriverio/webdriverio/pull/7357) (junit-reporter) Include all parent suites in suite.fullTitle ([@lthurr](https://github.com/lthurr))

#### :nail_care: Polish
* `webdriverio`
  * [#7348](https://github.com/webdriverio/webdriverio/pull/7348) Allow `isExisting` to work with an composed element ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Luis Thur ([@lthurr](https://github.com/lthurr))


## v7.11.0 (2021-08-26)

#### :eyeglasses: Spec Compliancy
* `wdio-protocols`
  * [#7329](https://github.com/webdriverio/webdriverio/pull/7329) fix: correct appium protocol use of app/bundle ID ([@jlipps](https://github.com/jlipps))

#### :bug: Bug Fix
* `wdio-utils`
  * [#7339](https://github.com/webdriverio/webdriverio/pull/7339) Be compliant with Jasmine timeout parameter for specs and hooks ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#7328](https://github.com/webdriverio/webdriverio/pull/7328) Serenity/JS + WebdriverIO blog post and boilerplates ([@jan-molak](https://github.com/jan-molak))
* [#7287](https://github.com/webdriverio/webdriverio/pull/7287) Document WebdriverIO TypeScript definitions ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* `wdio-cucumber-framework`
  * [#7309](https://github.com/webdriverio/webdriverio/pull/7309) Update Cucumber packages ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jan Molak ([@jan-molak](https://github.com/jan-molak))
- Jonathan Lipps ([@jlipps](https://github.com/jlipps))


## v7.10.1 (2021-08-23)

#### :nail_care: Polish
* `wdio-types`, `wdio-utils`
  * [#7308](https://github.com/webdriverio/webdriverio/pull/7308) Better detect Appium sessions ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#7296](https://github.com/webdriverio/webdriverio/pull/7296) website/docs: fix confusing adjective usage ([@p1100i](https://github.com/p1100i))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- peters ([@p1100i](https://github.com/p1100i))


## v7.10.0 (2021-08-17)

#### :bug: Bug Fix
* `wdio-utils`, `wdio-webdriver-mock-service`
  * [#7291](https://github.com/webdriverio/webdriverio/pull/7291) Allow to call catch and finally on element calls ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-runner`
  * [#7290](https://github.com/webdriverio/webdriverio/pull/7290) Run after hook even if session initiation fails ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`
  * [#7289](https://github.com/webdriverio/webdriverio/pull/7289) Support for @wdio/sync alongside the new v7.9.x Async API ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-browserstack-service`
  * [#7198](https://github.com/webdriverio/webdriverio/pull/7198) Set most parent Jasmine describe as BrowserStack session name in wdio-browserstack-service ([@sbley](https://github.com/sbley))

#### :nail_care: Polish
* `wdio-reporter`
  * [#7262](https://github.com/webdriverio/webdriverio/pull/7262) Don't show error diff if 'actual' and 'expected' are empty ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-sauce-service`
  * [#7263](https://github.com/webdriverio/webdriverio/pull/7263) Don't report pending in Jasmine as error in Sauce ([@christian-bromann](https://github.com/christian-bromann))
  * [#7265](https://github.com/webdriverio/webdriverio/pull/7265) Allow to set custom job name in Sauce Labs service ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#7252](https://github.com/webdriverio/webdriverio/pull/7252) Fix for newWindow called twice opens only one window ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* [#7286](https://github.com/webdriverio/webdriverio/pull/7286) Fix wrapping  for caution ([@balukov](https://github.com/balukov))

#### :house: Internal
* `wdio-utils`
  * [#7272](https://github.com/webdriverio/webdriverio/pull/7272) Order UNICODE_CHARACTERS map ([@pieceOpiland](https://github.com/pieceOpiland))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Ivan Balukov ([@balukov](https://github.com/balukov))
- Stefan Bley ([@sbley](https://github.com/sbley))
- [@pieceOpiland](https://github.com/pieceOpiland)


## v7.9.1 (2021-08-09)

#### :bug: Bug Fix
* `wdio-utils`, `wdio-webdriver-mock-service`
  * [#7225](https://github.com/webdriverio/webdriverio/pull/7225) Add support for async iterators ([@christian-bromann](https://github.com/christian-bromann))
* `webdriverio`
  * [#7226](https://github.com/webdriverio/webdriverio/pull/7226) Fix typings for addLocatorStrategy ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-allure-reporter`
  * [#7208](https://github.com/webdriverio/webdriverio/pull/7208) Fix: check current step instance before calling end step ([@iamkenos](https://github.com/iamkenos))
* `wdio-cucumber-framework`
  * [#7209](https://github.com/webdriverio/webdriverio/pull/7209) fix: duplicate steps on allure report ([@iamkenos](https://github.com/iamkenos))

#### :nail_care: Polish
* `wdio-allure-reporter`, `webdriver`
  * [#7206](https://github.com/webdriverio/webdriverio/pull/7206) Improve WebDriver error handling ([@christian-bromann](https://github.com/christian-bromann))

#### :memo: Documentation
* `wdio-repl`
  * [#7205](https://github.com/webdriverio/webdriverio/pull/7205) fix gif link in wdio-repl docs ([@Meir017](https://github.com/Meir017))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Meir Blachman ([@Meir017](https://github.com/Meir017))
- Raju ([@spnraju](https://github.com/spnraju))
- iamkenos ([@iamkenos](https://github.com/iamkenos))


## v7.9.0 (2021-07-28)

#### :rocket: New Feature
* `wdio-cli`, `wdio-jasmine-framework`, `wdio-utils`, `wdio-webdriver-mock-service`, `webdriverio`
  * [#6954](https://github.com/webdriverio/webdriverio/pull/6954) Implement new async API ([@christian-bromann](https://github.com/christian-bromann))

#### :bug: Bug Fix
* `webdriverio`
  * [#7190](https://github.com/webdriverio/webdriverio/pull/7190) fix-isdisplayed-msedge ([@savkaoleg](https://github.com/savkaoleg))

#### :nail_care: Polish
* `webdriverio`
  * [#7183](https://github.com/webdriverio/webdriverio/pull/7183) Removed invalid strategy check as fix for #7174 ([@praveendvd](https://github.com/praveendvd))

#### :house: Internal
* `wdio-reporter`
  * [#7184](https://github.com/webdriverio/webdriverio/pull/7184) export Test Element ([@yon-cuadrado](https://github.com/yon-cuadrado))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Savka Oleg ([@savkaoleg](https://github.com/savkaoleg))
- [@yon-cuadrado](https://github.com/yon-cuadrado)
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v7.8.0 (2021-07-22)

#### :bug: Bug Fix
* `wdio-mocha-framework`
  * [#7171](https://github.com/webdriverio/webdriverio/pull/7171) @wdio/mocha-framework - fix deprecation warning ([@unickq](https://github.com/unickq))

#### :nail_care: Polish
* `wdio-cucumber-framework`
  * [#7153](https://github.com/webdriverio/webdriverio/pull/7153) Fix for rule keyowrd not working 'Cannot use Rule keyword in Cucumber… ([@praveendvd](https://github.com/praveendvd))

#### :house: Internal
* `devtools`, `wdio-browserstack-service`, `wdio-crossbrowsertesting-service`, `wdio-sauce-service`, `wdio-testingbot-service`, `wdio-types`, `webdriver`
  * [#7169](https://github.com/webdriverio/webdriverio/pull/7169) feat: allow use of the ky request library in browser contexts ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Nick Chursin ([@unickq](https://github.com/unickq))
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v7.7.8 (2021-07-19)

#### :bug: Bug Fix
* `wdio-junit-reporter`
  * [#7157](https://github.com/webdriverio/webdriverio/pull/7157) #7104 wdio-junit-reporter - Mark test as skipped if on retry ([@lthurr](https://github.com/lthurr))
* `webdriverio`
  * [#7154](https://github.com/webdriverio/webdriverio/pull/7154) fix: detect lambdatest service ([@Joozty](https://github.com/Joozty))
  * [#7155](https://github.com/webdriverio/webdriverio/pull/7155) Propagate requestedCapabilities when attaching to running session ([@christian-bromann](https://github.com/christian-bromann))
  * [#7156](https://github.com/webdriverio/webdriverio/pull/7156) Improve typings for touchAction command ([@christian-bromann](https://github.com/christian-bromann))
* `devtools`
  * [#7149](https://github.com/webdriverio/webdriverio/pull/7149) Propagate chrome flags and user data dir to `chrome-launcher` ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `webdriverio`
  * [#7158](https://github.com/webdriverio/webdriverio/pull/7158) Support regular expressions for mock urls ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* [#7152](https://github.com/webdriverio/webdriverio/pull/7152) DepCheck : Added console log for error ([@jayandran-Sampath](https://github.com/jayandran-Sampath))

#### Committers: 4
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Jozef Harag ([@Joozty](https://github.com/Joozty))
- Luis Thur ([@lthurr](https://github.com/lthurr))
- [@jayandran-Sampath](https://github.com/jayandran-Sampath)


## v7.7.7 (2021-07-16)

#### :rocket: New Feature
* `wdio-mocha-framework`, `wdio-reporter`, `wdio-spec-reporter`
  * [#6943](https://github.com/webdriverio/webdriverio/pull/6943) Report error diff if error is assertion error ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-config`, `wdio-runner`, `wdio-types`, `webdriverio`
  * [#7126](https://github.com/webdriverio/webdriverio/pull/7126) Improve documentation and type support for spec grouping ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-cli`
  * [#7141](https://github.com/webdriverio/webdriverio/pull/7141) Update constants.ts ([@tzurp](https://github.com/tzurp))
* `wdio-allure-reporter`, `wdio-spec-reporter`
  * [#7134](https://github.com/webdriverio/webdriverio/pull/7134) Added ability to add console log to allure and spec reporters (fix for #7001) ([@praveendvd](https://github.com/praveendvd))
* `webdriverio`
  * [#7136](https://github.com/webdriverio/webdriverio/pull/7136) Fix CSS selector misinterpretation (#7087) ([@L0tso](https://github.com/L0tso))

#### :memo: Documentation
* [#7142](https://github.com/webdriverio/webdriverio/pull/7142) Update services.json ([@tzurp](https://github.com/tzurp))

#### :house: Internal
* `wdio-applitools-service`, `wdio-cli`
  * [#6884](https://github.com/webdriverio/webdriverio/pull/6884) Deprecate and remove `@wdio/applitools-service` ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 4
- Bohdan Belenok ([@L0tso](https://github.com/L0tso))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- [@tzurp](https://github.com/tzurp)
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v7.7.6 (2021-07-14)

#### :bug: Bug Fix
* `wdio-allure-reporter`
  * [#7081](https://github.com/webdriverio/webdriverio/pull/7081) Fix for Cucumber Data Table not showing in allure report #7078 ([@praveendvd](https://github.com/praveendvd))

#### :house: Internal
* `devtools`, `wdio-devtools-service`, `webdriverio`
  * [#7135](https://github.com/webdriverio/webdriverio/pull/7135) chore: up puppeteer-core@10.1.0 ([@DudaGod](https://github.com/DudaGod))

#### Committers: 2
- Dmitriy Dudkevich ([@DudaGod](https://github.com/DudaGod))
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v7.7.5 (2021-07-12)

#### :bug: Bug Fix
* `wdio-allure-reporter`, `wdio-utils`
  * [#7059](https://github.com/webdriverio/webdriverio/pull/7059) Fix for Assertions are thrown twice (https://github.com/webdriverio/expect-webdriverio/issues/462) ([@praveendvd](https://github.com/praveendvd))

#### :nail_care: Polish
* `wdio-cli`
  * [#7045](https://github.com/webdriverio/webdriverio/pull/7045) Fix sample test for jasmine framework ([@cek333](https://github.com/cek333))
* `wdio-junit-reporter`
  * [#7054](https://github.com/webdriverio/webdriverio/pull/7054) @wdio/junit-reporter - replace ansi chars in test.error.message ([@unickq](https://github.com/unickq))

#### :memo: Documentation
* `wdio-selenium-standalone-service`
  * [#7093](https://github.com/webdriverio/webdriverio/pull/7093) (docs) Updating @wdio/selenium-standalone-service install version ([@harsha509](https://github.com/harsha509))
* `webdriverio`
  * [#7073](https://github.com/webdriverio/webdriverio/pull/7073) Docs: Example code correction ([@harsha509](https://github.com/harsha509))
* Other
  * [#7076](https://github.com/webdriverio/webdriverio/pull/7076) website - docusaurus organizationName & projectName, ([@unickq](https://github.com/unickq))
  * [#7084](https://github.com/webdriverio/webdriverio/pull/7084) Typos, minor edits and grammatical corrections ([@rubencanlas](https://github.com/rubencanlas))
  * [#7041](https://github.com/webdriverio/webdriverio/pull/7041) JW Player blog post ([@esaari](https://github.com/esaari))

#### Committers: 6
- Cecil ([@cek333](https://github.com/cek333))
- Eric Saari ([@esaari](https://github.com/esaari))
- Nick Chursin ([@unickq](https://github.com/unickq))
- Sri Harsha ([@harsha509](https://github.com/harsha509))
- [@rubencanlas](https://github.com/rubencanlas)
- praveendvd ([@praveendvd](https://github.com/praveendvd))


## v7.7.4 (2021-06-20)

#### :eyeglasses: Spec Compliancy
* `wdio-protocols`
  * [#7002](https://github.com/webdriverio/webdriverio/pull/7002) Issue #6977: Renamed 'reset' command in Appium to 'resetApp' ([@srikanthgurram](https://github.com/srikanthgurram))

#### :bug: Bug Fix
* `wdio-devtools-service`
  * [#7020](https://github.com/webdriverio/webdriverio/pull/7020) Wrap coverage transform into try/catch to avoid staleness ([@christian-bromann](https://github.com/christian-bromann))

#### :nail_care: Polish
* `wdio-selenium-standalone-service`
  * [#7031](https://github.com/webdriverio/webdriverio/pull/7031) Update selenium-standalone-service to use v7 ([@mgrybyk](https://github.com/mgrybyk))
* `wdio-sauce-service`
  * [#7028](https://github.com/webdriverio/webdriverio/pull/7028) Enable updating job name for UP tests for Sauce Labs ([@wswebcreation](https://github.com/wswebcreation))
* `wdio-devtools-service`
  * [#7027](https://github.com/webdriverio/webdriverio/pull/7027) Support Firefox 86+ in Devtools Service & Migrate from deprecated Console domain ([@dylanlive](https://github.com/dylanlive))

#### :memo: Documentation
* [#6996](https://github.com/webdriverio/webdriverio/pull/6996) Add in Learn WebdriverIO course link to homepage masthead ([@klamping](https://github.com/klamping))

#### Committers: 6
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dylan Reichstadt ([@dylanlive](https://github.com/dylanlive))
- Kevin Lamping ([@klamping](https://github.com/klamping))
- Mykola Grybyk ([@mgrybyk](https://github.com/mgrybyk))
- Srikanth ([@srikanthgurram](https://github.com/srikanthgurram))
- Wim Selles ([@wswebcreation](https://github.com/wswebcreation))


## v7.7.3 (2021-06-04)

#### :nail_care: Polish
* `wdio-cli`, `wdio-sauce-service`, `wdio-spec-reporter`, `wdio-types`, `webdriverio`
  * [#6964](https://github.com/webdriverio/webdriverio/pull/6964) support APAC region for Sauce Labs ([@christian-bromann](https://github.com/christian-bromann))
* `wdio-utils`
  * [#6965](https://github.com/webdriverio/webdriverio/pull/6965) fix: Remove scripts from log payload  ([@OlaoluwaM](https://github.com/OlaoluwaM))
* `wdio-mocha-framework`
  * [#6967](https://github.com/webdriverio/webdriverio/pull/6967) fix(mocha-framework): move @types/mocha and @types/node to devDepende… ([@PiQx](https://github.com/PiQx))

#### Committers: 3
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Olaoluwa Mustapha ([@OlaoluwaM](https://github.com/OlaoluwaM))
- [@PiQx](https://github.com/PiQx)


## v7.7.2 (2021-06-01)

#### :bug: Bug Fix
* `wdio-utils`
  * [#6958](https://github.com/webdriverio/webdriverio/pull/6958) Fix for isW3C ([@Oleksandr-Antonkin-epam](https://github.com/Oleksandr-Antonkin-epam))

#### Committers: 1
- Oleksandr Antonkin  ([@Oleksandr-Antonkin-epam](https://github.com/Oleksandr-Antonkin-epam))


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
