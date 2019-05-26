<p align="center">
    <a href="https://webdriver.io/">
        <img alt="WebdriverIO" src="http://www.christian-bromann.com/wdio.png" width="546">
    </a>
</p>

<p align="center">
    Next-gen WebDriver test automation framework for Node.js
</p>

<p align="center">
    <a href="https://travis-ci.org/webdriverio/webdriverio.svg?branch=master">
        <img alt="Build Status" src="https://travis-ci.org/webdriverio/webdriverio.svg?branch=master">
    </a>
    <a href="https://codecov.io/gh/webdriverio/webdriverio">
        <img alt="CodeCov" src="https://codecov.io/gh/webdriverio/webdriverio/branch/master/graph/badge.svg">
    </a>
    <a href="https://gitter.im/webdriverio/webdriverio">
        <img alt="Gitter" src="https://badges.gitter.im/webdriverio/webdriverio.svg">
    </a>
</p>

***

<p align="center">
    <a href="https://webdriver.io">Homepage</a> |
    <a href="https://webdriver.io/guide.html">Developer Guide</a> |
    <a href="https://webdriver.io/docs/api.html">API Reference</a> |
    <a href="https://github.com/webdriverio/webdriverio/blob/master/CONTRIBUTING.md">Contribute</a>
</p>

***

WebdriverIO is a test automation framework that allows you to run tests based on the [Webdriver](https://w3c.github.io/webdriver/webdriver-spec.html) protocol and [Appium](http://appium.io/) automation technology. It provides support for your favorite BDD/TDD test framework and will run your tests locally or in the cloud using Sauce Labs, BrowserStack or TestingBot.

## Contributing

[![Greenkeeper badge](https://badges.greenkeeper.io/webdriverio/webdriverio.svg)](https://greenkeeper.io/)

Check out our [CONTRIBUTING.md](CONTRIBUTING.md) to get started with setting up the repo.

If you're looking for issues to help out with, check out [the issues labelled "good first pick"](https://github.com/webdriverio/webdriverio/issues?q=is%3Aopen+is%3Aissue+label%3A"good+first+pick"). You can also reach out in our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) if you have question on where to start contributing.

## Packages

### Core

- [webdriver](https://github.com/webdriverio/webdriverio/tree/master/packages/webdriver) - A Node.js bindings implementation for the W3C WebDriver and Mobile JSONWire Protocol
- [webdriverio](https://github.com/webdriverio/webdriverio/blob/master/packages/webdriverio) - A next-gen WebDriver test automation framework for Node.js
- [@wdio/cli](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-cli) - A WebdriverIO testrunner command line interface

### Helper

- [@wdio/config](https://github.com/webdriverio/webdriverio/blob/master/packages/wdio-config) - A helper utility to parse and validate WebdriverIO options
- [@wdio/logger](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-logger) - A helper utility for logging of WebdriverIO packages
- [@wdio/reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-reporter) - A WebdriverIO utility to help reporting all events
- [@wdio/runner](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-runner) - A WebdriverIO service that runs tests in arbitrary environments
- [@wdio/sync](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sync) - A WebdriverIO plugin. Helper module to run WebdriverIO commands synchronously
- [@wdio/repl](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-repl) - A WDIO helper utility to provide a repl interface for WebdriverIO
- [@wdio/utils](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-utils) - A WDIO helper utility to provide several utility functions used across the project

### Reporter

- [@wdio/allure-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-allure-reporter) - A WebdriverIO reporter plugin to create Allure Test Reports
- [@wdio/concise-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-concise-reporter) - A WebdriverIO reporter plugin to create concise test reports
- [@wdio/dot-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-dot-reporter) - A WebdriverIO plugin to report in dot style
- [@wdio/spec-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-spec-reporter) - A WebdriverIO plugin to report in spec style
- [@wdio/sumologic-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sumologic-reporter) - A WebdriverIO reporter that sends test results to Sumologic for data analyses
- [@wdio/junit-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-junit-reporter) - A WebdriverIO reporter that creates test results in XML format

### Services

- [@wdio/appium-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-appium-service) - A WebdriverIO service to start & stop Appium Server
- [@wdio/applitools-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-applitools-service) - A WebdriverIO service for visual regression testing using Applitools
- [@wdio/devtools-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-devtools-service) - A WebdriverIO service that allows you to run Chrome DevTools commands in your tests
- [@wdio/firefox-profile-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-firefox-profile-service) - A WebdriverIO service that lets you define your Firefox profile in your wdio.conf.js
- [@wdio/sauce-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sauce-service) - A WebdriverIO service that provides a better integration into SauceLabs
- [@wdio/testingbot-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-testingbot-service) - A WebdriverIO service that provides a better integration into TestingBot
- [@wdio/selenium-standalone-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-selenium-standalone-service) - A WebdriverIO service that automatically sets up a selenium standalone server
- [@wdio/browserstack-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-browserstack-service) - A WebdriverIO service that provides a better integration into Browserstack
- [@wdio/crossbrowsertesting-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-crossbrowsertesting-service) - A WebdriverIO service that provides a better integration into CrossBrowserTesting

### Runner

- [@wdio/local-runner](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-local-runner) - A WebdriverIO runner to run tests locally
- [@wdio/lambda-runner](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-lambda-runner) - A WebdriverIO plugin that allows you to run tests on AWS using Lambda functions

### Framework Adapters

- [@wdio/mocha-framework](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-mocha-framework) - Adapter for [Mocha](https://mochajs.org/) testing framework.
- [@wdio/jasmine-framework](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-jasmine-framework) - Adapter for [Jasmine](https://jasmine.github.io/) testing framework

### Others

- [eslint-plugin-wdio](https://github.com/webdriverio/webdriverio/tree/master/packages/eslint-plugin-wdio) - Eslint rules for WebdriverIO
- [@wdio/webdriver-mock-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-webdriver-mock-service) - A WebdriverIO service to stub all endpoints for internal testing purposes
- [@wdio/smoke-test-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-smoke-test-service) - A WebdriverIO utility to smoke test services for internal testing purposes
