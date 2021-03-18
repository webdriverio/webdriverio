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
