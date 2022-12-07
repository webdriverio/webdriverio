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
