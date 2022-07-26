[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://vshymanskyy.github.io/StandWithUkraine)

<p align="center">
    <a href="https://webdriver.io/">
        <img alt="WebdriverIO" src="https://webdriver.io/assets/images/robot-3677788dd63849c56aa5cb3f332b12d5.svg" width="146">
    </a>
</p>

<p align="center">
    Next-gen browser and mobile automation test framework for Node.js.
</p>

<p align="center">
    <a href="https://github.com/webdriverio/webdriverio/actions/workflows/test.yml">
        <img alt="Build Status" src="https://github.com/webdriverio/webdriverio/actions/workflows/test.yml/badge.svg">
    </a>
    <a href="https://snyk.io/advisor/npm-package/webdriverio">
        <img alt="Package Health" src="https://snyk.io/advisor/npm-package/webdriverio/badge.svg">
    </a>
    <a href="https://bestpractices.coreinfrastructure.org/en/projects/5589">
        <img alt="OpenSSF Best Practices" src="https://bestpractices.coreinfrastructure.org/projects/5589/badge">
    </a>
    <a href="https://gitter.im/webdriverio/webdriverio">
        <img alt="Gitter" src="https://badges.gitter.im/webdriverio/webdriverio.svg">
    </a>
    <a href="https://github.com/webdriverio/webdriverio/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc">
        <img alt="Issue Resolution time" src="http://isitmaintained.com/badge/resolution/webdriverio/webdriverio.svg">
    </a>
    <a href="https://github.com/webdriverio/webdriverio/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc">
        <img alt="Open issues" src="http://isitmaintained.com/badge/open/webdriverio/webdriverio.svg">
    </a>
</p>

***

<p align="center">
    <a href="https://webdriver.io">Homepage</a> |
    <a href="https://webdriver.io/docs/gettingstarted.html">Developer Guide</a> |
    <a href="https://webdriver.io/docs/api.html">API Reference</a> |
    <a href="https://github.com/webdriverio/webdriverio/blob/main/CONTRIBUTING.md">Contribute</a> |
    <a href="https://github.com/webdriverio/webdriverio/blob/main/CHANGELOG.md">Changelog</a> |
    <a href="https://github.com/webdriverio/webdriverio/blob/main/ROADMAP.md">Roadmap</a>
</p>

***

WebdriverIO is a test automation framework that allows you to run tests based on the [Webdriver](https://w3c.github.io/webdriver/webdriver-spec.html) protocol and [Appium](http://appium.io/) automation technology. It provides support for your favorite BDD/TDD test framework and will run your tests locally or in the cloud using Sauce Labs, BrowserStack, TestingBot or LambdaTest.

## :woman_technologist: :man_technologist: Contributing

You like WebdriverIO and want to help making it better? Awesome! Have a look into our [Contributor Documentation](CONTRIBUTING.md) to get started or just click on:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/webdriverio/webdriverio)

If you're looking for issues to help out with, check out [the issues labelled "good first pick"](https://github.com/webdriverio/webdriverio/issues?q=is%3Aopen+is%3Aissue+label%3A"good+first+pick"). You can also reach out in our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) if you have question on where to start contributing.

## :office: WebdriverIO for Enterprise

Available as part of the Tidelift Subscription.

The maintainers of WebdriverIO and thousands of other packages are working with Tidelift to deliver commercial support and maintenance for the open source dependencies you use to build your applications. Save time, reduce risk, and improve code health, while paying the maintainers of the exact dependencies you use. [Learn more.](https://tidelift.com/subscription/pkg/npm-webdriverio?utm_source=npm-webdriverio&utm_medium=referral&utm_campaign=enterprise&utm_term=repo)

## :package: Packages

This repository contains some of the core packages of the WebdriverIO project. There are many wonderful [curated resources](https://github.com/webdriverio-community/awesome-webdriverio) the WebdriverIO community has put together.

__Did you build a WebdriverIO service or reporter?__ That's awesome! Please add it to our configuration wizard and docs (e.g. like in [this example commit](https://github.com/webdriverio/webdriverio/commit/3cb5937b968dfe93cf78871589019736a6c98d9e)) as well as to our [awesome-webdriverio](https://github.com/webdriverio-community/awesome-webdriverio) list. Thank you! 🙏 ❤️

### Core

- [webdriver](https://github.com/webdriverio/webdriverio/tree/main/packages/webdriver) - A Node.js bindings implementation for the W3C WebDriver and Mobile JSONWire Protocol
- [devtools](https://github.com/webdriverio/webdriverio/tree/main/packages/devtools) - A Chrome DevTools protocol binding that maps WebDriver commands into Chrome DevTools commands using Puppeteer
- [webdriverio](https://github.com/webdriverio/webdriverio/blob/main/packages/webdriverio) - Next-gen browser and mobile automation test framework for Node.js
- [@wdio/cli](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cli) - A WebdriverIO testrunner command line interface

### Helper

- [@wdio/config](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-config) - A helper utility to parse and validate WebdriverIO options
- [@wdio/logger](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-logger) - A helper utility for logging of WebdriverIO packages
- [@wdio/protocols](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols) - Utility package providing information about automation protocols
- [@wdio/repl](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-repl) - A WDIO helper utility to provide a repl interface for WebdriverIO
- [@wdio/reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-reporter) - A WebdriverIO utility to help reporting all events
- [@wdio/runner](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-runner) - A WebdriverIO service that runs tests in arbitrary environments
- [@wdio/utils](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-utils) - A WDIO helper utility to provide several utility functions used across the project

### Reporter

- [@wdio/allure-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-allure-reporter) - A WebdriverIO reporter plugin to create Allure Test Reports
- [@wdio/concise-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-concise-reporter) - A WebdriverIO reporter plugin to create concise test reports
- [@wdio/dot-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-dot-reporter) - A WebdriverIO plugin to report in dot style
- [@wdio/junit-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-junit-reporter) - A WebdriverIO reporter that creates test results in XML format
- [@wdio/spec-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-spec-reporter) - A WebdriverIO plugin to report in spec style
- [@wdio/sumologic-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sumologic-reporter) - A WebdriverIO reporter that sends test results to Sumologic for data analyses

### Services

- [@wdio/appium-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-appium-service) - A WebdriverIO service to start & stop Appium Server
- [@wdio/browserstack-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-browserstack-service) - A WebdriverIO service that provides a better integration into Browserstack
- [@wdio/crossbrowsertesting-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-crossbrowsertesting-service) - A WebdriverIO service that provides a better integration into CrossBrowserTesting
- [@wdio/devtools-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-devtools-service) - A WebdriverIO service that allows you to run Chrome DevTools commands in your tests
- [@wdio/firefox-profile-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-firefox-profile-service) - A WebdriverIO service that lets you define your Firefox profile in your wdio.conf.js
- [@wdio/sauce-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service) - A WebdriverIO service that provides a better integration into Sauce Labs
- [@wdio/selenium-standalone-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-selenium-standalone-service) - A WebdriverIO service that automatically sets up a selenium standalone server
- [@wdio/shared-store-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-shared-store-service) - A WebdriverIO service to exchange data across processes
- [@wdio/testingbot-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-testingbot-service) - A WebdriverIO service that provides a better integration into TestingBot

### Runner

- [@wdio/local-runner](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-local-runner) - A WebdriverIO runner to run tests locally

### Framework Adapters

- [@wdio/cucumber-framework](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework) - Adapter for [Cucumber](https://cucumber.io/) testing framework
- [@wdio/jasmine-framework](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-jasmine-framework) - Adapter for [Jasmine](https://jasmine.github.io/) testing framework
- [@wdio/mocha-framework](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-mocha-framework) - Adapter for [Mocha](https://mochajs.org/) testing framework.

### Others

- [eslint-plugin-wdio](https://github.com/webdriverio/webdriverio/tree/main/packages/eslint-plugin-wdio) - Eslint rules for WebdriverIO
- [@wdio/smoke-test-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-smoke-test-reporter) - A WebdriverIO utility to smoke test reporters for internal testing purposes
- [@wdio/smoke-test-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-smoke-test-service) - A WebdriverIO utility to smoke test services for internal testing purposes
- [@wdio/webdriver-mock-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-webdriver-mock-service) - A WebdriverIO service to stub all endpoints for internal testing purposes

## :handshake: Project Governance

This project is maintained by [awesome people](/AUTHORS.md) following a common [set of rules](/GOVERNANCE.md) and treating each other with [respect and appreciation](/CODE_OF_CONDUCT.md).

## :man_cook: :woman_cook: Backers

[Become a backer](https://opencollective.com/webdriverio) and show your support to our open source project.

<a href="https://opencollective.com/webdriverio"><img src="https://opencollective.com/webdriverio/tiers/baker.svg?avatarHeight=36&width=600"></a>

## :money_with_wings: Sponsors

Does your company use WebdriverIO? Ask your manager or marketing team if your company would be interested in supporting our project. Support will allow the maintainers to dedicate more time for maintenance and new features for everyone. Also, your company's logo will show [on GitHub](https://github.com/webdriverio/webdriverio#readme) - who doesn't want a little extra exposure? [Here's the info](https://opencollective.com/webdriverio).

<a href="https://opencollective.com/webdriverio"><img src="https://opencollective.com/webdriverio/tiers/gold-sponsor.svg?avatarHeight=36&width=600"></a>

## :page_facing_up: License

[MIT](/LICENSE-MIT)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fwebdriverio%2Fwebdriverio.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fwebdriverio%2Fwebdriverio?ref=badge_large)

## :beginner: Badge

Show the world you're using webdriver.io → [![tested with webdriverio](https://img.shields.io/badge/tested%20with-webdriver.io-%23ea5906)](https://webdriver.io/)

###### GitHub markup
```
[![tested with webdriver.io](https://img.shields.io/badge/tested%20with-webdriver.io-%23ea5906)](https://webdriver.io/)
```
###### HTML
```
<a href="https://webdriver.io/">
    <img alt="WebdriverIO" src="https://img.shields.io/badge/tested%20with-webdriver.io-%23ea5906">
</a>
```

## :clap:  Supporters
[![Stargazers repo roster for WebdriverIO](https://reporoster.com/stars/webdriverio/webdriverio)](https://github.com/webdriverio/webdriverio/stargazers)
[![Forkers repo roster for WebdriverIO](https://reporoster.com/forks/webdriverio/webdriverio)](https://github.com/webdriverio/webdriverio/network/members)
<p align="center"><a href="https://github.com/webdriverio/webdriverio#nastyox"><img src="http://randojs.com/images/barsSmall.gif" alt="Animated footer bars" width="100%"/></a></p>
<br/>
<p align="center"><a href="https://github.com/webdriverio/webdriverio#"><img src="http://randojs.com/images/backToTopButton.png" alt="Back to top" height="29"/></a></p>
