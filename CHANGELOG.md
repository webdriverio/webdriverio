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
