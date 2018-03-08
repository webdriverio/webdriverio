<p align="center">
    <a href="http://webdriver.io/">
        <img alt="WebdriverIO" src="http://www.christian-bromann.com/wdio.png" width="546">
    </a>
</p>

<p align="center">
    Next-gen WebDriver test automation framework for Node.js
</p>

<p align="center">
    <a href="https://travis-ci.org/webdriverio/v5.svg?branch=master">
        <img alt="Build Status" src="https://travis-ci.org/webdriverio/v5.svg?branch=master">
    </a>
    <a href="https://codecov.io/gh/webdriverio/v5">
        <img alt="CodeCov" src="https://codecov.io/gh/webdriverio/v5/branch/master/graph/badge.svg">
    </a>
    <a href="https://gitter.im/webdriverio/v5">
        <img alt="Gitter" src="https://badges.gitter.im/webdriverio/v5.svg">
    </a>
</p>

***

<p align="center">
    <a href="http://webdriver.io">Homepage</a> |
    <a href="http://webdriver.io/guide.html">Developer Guide</a> |
    <a href="http://webdriver.io/api.html">API Reference</a> |
    <a href="http://webdriver.io/contribute.html">Contribute</a>
</p>

***

WebdriverIO is a test automation framework that allows you to run tests based on the [Webdriver](https://w3c.github.io/webdriver/webdriver-spec.html) protocol and [Appium](http://appium.io/) automation technology. It provides support for your favorite BDD/TDD test framework and will run your tests locally or in the cloud using Sauce Labs, BrowserStack or TestingBot.

> NOTE: This is a temporary repository for the development efforts for v5 of WebdriverIO. Once it is in a stable state it will replace the main repository (https://github.com/webdriverio/webdriverio). More details on this will come shortly. Stay tuned!

## Contributing

Check out our [CONTRIBUTING.md](CONTRIBUTING.md) to get started with setting up the repo. This repository is a development repository for the new version.

We are trying to put up a proper roadmap for the beta release. Until then please reach out in our [Gitter Channel](https://gitter.im/webdriverio/v5) if you have question on where to start contributing.

## Packages

### Core

- [webdriver](https://github.com/webdriverio/v5/tree/master/packages/webdriver) - A Node.js bindings implementation for the W3C WebDriver and Mobile JSONWire Protocol
- [webdriverio](https://github.com/webdriverio/v5/blob/master/packages/webdriverio) - Next-gen WebDriver test automation framework for Node.js
- [wdio-cli](https://github.com/webdriverio/v5/tree/master/packages/wdio-cli) - WebdriverIO testrunner command line interface

### Helper

- [wdio-config](https://github.com/webdriverio/v5/blob/master/packages/wdio-config) - A helper utility to parse and validate WebdriverIO options
- [wdio-interface](https://github.com/webdriverio/v5/tree/master/packages/wdio-interface) - A WDIO helper utility to provide a cli interface for the testrunner
- [wdio-logger](https://github.com/webdriverio/v5/tree/master/packages/wdio-logger) - A helper utility for logging of WebdriverIO packages
- [wdio-reporter](https://github.com/webdriverio/v5/tree/master/packages/wdio-reporter) - A WebdriverIO utility to help reporting all events
- [wdio-runner](https://github.com/webdriverio/v5/tree/master/packages/wdio-runner) - A WebdriverIO service that runs tests in arbitrary environments
- [wdio-sync](https://github.com/webdriverio/v5/tree/master/packages/wdio-sync) - A WebdriverIO plugin. Helper module to run WebdriverIO commands synchronously

### Reporter

- [wdio-allure-reporter](https://github.com/webdriverio/v5/tree/master/packages/wdio-allure-reporter) - A WebdriverIO reporter plugin to create Allure Test Reports
- [wdio-concise-reporter](https://github.com/webdriverio/v5/tree/master/packages/wdio-concise-reporter) - A WebdriverIO reporter plugin to create concise test reports
- [wdio-dot-reporter](https://github.com/webdriverio/v5/tree/master/packages/wdio-dot-reporter) - A WebdriverIO plugin to report in dot style
- [wdio-sumologic-reporter](https://github.com/webdriverio/v5/tree/master/packages/wdio-sumologic-reporter) - A WebdriverIO reporter that sends test results to Sumologic for data analyses
- [wdio-xml-reporter](https://github.com/webdriverio/v5/tree/master/packages/wdio-xml-reporter) - A WebdriverIO reporter that creates test results in XML format

### Services

- [wdio-devtools-service](https://github.com/webdriverio/v5/tree/master/packages/wdio-devtools-service) - A WebdriverIO service that allows you to run Chrome DevTools commands in your tests
- [wdio-firefox-profile-service](https://github.com/webdriverio/v5/tree/master/packages/wdio-firefox-profile-service) - WebdriverIO service that lets you define your Firefox profile in your wdio.conf.js
- [wdio-sauce-service](https://github.com/webdriverio/v5/tree/master/packages/wdio-sauce-service) - WebdriverIO service that provides a better integration into SauceLabs
