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
  * Alongside with this change we also equipped the testrunner to auto-compile your configuration if TypeScript is detected, this allows to leverage type safety in your WDIO configuration without any additional setup (big thanks for this contribution goes to [@r4j4h](https://github.com/r4j4h))
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
