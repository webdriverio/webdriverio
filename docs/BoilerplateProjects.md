---
id: boilerplate
title: Boilerplate Projects
---

Over the time our community has developed a bunch of boilerplate projects that can be used as inspiration to set up your own test suite. __Note:__ WebdriverIO recently

## v5 Boilerplate Projects

### [amiya-pattnaik/webdriverIO-with-jasmineBDD](https://github.com/amiya-pattnaik/webdriverIO-with-jasmineBDD)

- Framework: Jasmine (v3.x)
- Features:
    - Page Objects Model uses with ES6 style class base approach and fully ES6 - ES8 support through Babel
    - Task manage through Grunt
    - Multiple reporting (Spec, Junit, Allure), plus local view of Junit report (.html) format
    - Jasmine Spec examples with assert module & jasmine specific assertion using demo app http://www.phptravels.net
    - Examples of headless browser execution using - Chrome & Firefox and Integration with BrowserStack & SauceLabs
    - Examples of read/write data from MS-Excel for easy test data management from external data sources
    - Examples of DB connect to any RDBMS (Oracle, MySql, TeraData, Vertica etc.), any query execution / fetching result set
    
  ### [amiya-pattnaik/webdriverIO-with-mochaBDD](https://github.com/amiya-pattnaik/webdriverIO-with-mochaBDD)

- Framework: Mocha (v5.x)
- Features:
    - Page Objects Model uses with ES6 style class base approach and fully ES6 - ES8 support through Babel
    - Task manage through Grunt
    - Multiple reporting (Spec, Junit, Allure), plus local view of Junit report (.html) format
    - Mocha Spec examples with assert module & jasmine specific assertion using demo app http://www.phptravels.net
    - Examples of headless browser execution using - Chrome & Firefox and Integration with BrowserStack & SauceLabs
    - Examples of read/write data from MS-Excel for easy test data management from external data sources
    - Examples of DB connect to any RDBMS (Oracle, MySql, TeraData, Vertica etc.), any query execution / fetching result set
    
### [jpolley/WebdriverIO_v5_TypeScript](https://github.com/jpolley/WebdriverIO_v5_TypeScript)

The boilerplate holds the following things

- Framework: Mocha
- Features:
    - TypeScript Setup
    - Page Object Pattern
    - Chai Integration
    - CI examples (CircleCI, Travis CI, Jenkins)
    - Allure reporter

### [DaleNguyen/WebdriverIO-TypeScript-Boilerplate](https://github.com/dalenguyen/WebdriverIO-TypeScript-Boilerplate)

This project creates a powerful boilerplate for UI Automation Testing with WebdriverIO, TypeScript, Mocha, Chai and Allure report.

- Framework: WebdriverIO (v5x), TypeScript(v3x), @Types/Mocha (v5x), Chai (v5x), @Wdio/Allure (v5x), Axe-core(v3x)
- Features:
    - Accessibility test with Axe-core
    - TypeScript Page Object Models
    - TypesScript Models
    - Code Prettier
    - HTML report with Allure
    - Single test case for development purpose

### [webdriverio/appium-boilerplate](https://github.com/webdriverio/appium-boilerplate/)

Boilerplate project to run Appium tests together with WebdriverIO for:

- iOS/Android Native Apps
- iOS/Android Hybrid Apps
- Android Chrome and iOS Safari browser

The boilerplate holds the following things
- Framework: Jasmine
- Features:
    - Configs for:
        - iOS and Android app
        - iOS and Android browsers
    - Helpers for:
        - WebView
        - Gestures
        - Native alerts
        - Pickers
     - Tests examples for:
        - WebView
        - Login
        - Forms
        - Swipe
        - Browsers

### [blueimp/wdio](https://github.com/blueimp/wdio)

Docker setup for WebdriverIO with automatic screenshots, image diffing and screen recording support for containerized versions of Chrome and Firefox. Also includes MacOS host configs to test an app running in Docker with Safari Desktop as well as Safari Mobile and Chrome Mobile via Appium.

Sample app demonstrates a simple Email application with email test automation support via [MailHog](https://github.com/mailhog/MailHog).

The only project requirement is Docker. Since WebdriverIO is also containerized, not even NodeJS is required.

- Framework: Mocha (v5.x)
- Features:
    - Configs for:
        - Dockerized Google Chrome
        - Dockerized Mozilla Firefox
        - Safari Desktop
        - Safari Mobile via Appium
        - Chrome Mobile via Appium
    - Helpers for:
        - Automatic screenshots based on test failure/success (part of [wdio-screen-commands](https://github.com/blueimp/wdio-screen-commands))
        - Screenshot image diffing via [node-ffmpeg-image-diff](https://github.com/blueimp/node-ffmpeg-image-diff)
        - Screen recording support for Chrome+Firefox via [record-screen](https://github.com/blueimp/record-screen)
        - Email test automation support via [mailhog-node](https://github.com/blueimp/mailhog-node)
    - Test examples for:
        - Email form submission
        - Email reception success

### [jonyet/webdriverio-boilerplate](https://github.com/jonyet/webdriverio-boilerplate)

Designed to be quick to get you started without getting terribly complex.

- Framework: Mocha
- Features:
    - cloud integration with [BrowserStack](https://www.browserstack.com/)
    - Page Objects usage
    - additional approach that is component specific rather than page, allowing for a split e2e and integration test writing approach
    - introduces extension of config files for readability and flexibility, in the event that you have multiple teams/projects working out of the same project repository

## v4 Boilerplate Projects

### [amiya-pattnaik/webdriverIO-with-cucumberBDD](https://github.com/amiya-pattnaik/webdriverIO-with-cucumberBDD/tree/wdio-v4)

- Framework: Cucumber (v3.x)
- Features:
    - Page Objects Model uses with ES6 style class base approach and fully ES6 - ES8 support through Babel
    - Examples of multi selector option to query element with more than one selector at a time
    - Examples of headless browser execution using - PhantomJS and Chrome
    - Integration with BrowserStack
    - Support of read/write data from MS-Excel for easy test data management from external data sources with examples
    - Database support to any RDBMS (Oracle, MySql, TeraData, Vertica etc.), executing any queries / fetching result set etc. with examples for E2E testing
    - Multiple reporting (Spec, Junit, Allure, JSON), plus local view of Junit report(.html) format
    - Task manage through Grunt
    - Examples with demo app https://search.yahoo.com/  and http://www.phptravels.net, Chai assertion liberary (expect, assert, should)
    - Appium specific .config file for playback on mobile device. For one click Appium setup refer [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX)


### [webdriverio/cucumber-boilerplate](https://github.com/webdriverio/cucumber-boilerplate)

Our very own boilerplate for Cucumber test suites. We created over 150 predefined step definitions for you so that you can start write feature files for your project right away.

- Framework: Cucumber
- Features:
    - over 150 predefined steps that cover almost everything you need
    - integration of WebdriverIO's Multiremote functionality
    - own demo app

### [saucelabs-sample-test-frameworks/JS-Mocha-WebdriverIO-Selenium](https://github.com/saucelabs-sample-test-frameworks/JS-Mocha-WebdriverIO-Selenium)

Simple boilerplate project that runs multiple browser on [SauceLabs](https://saucelabs.com/) in parallel.

- Framework: Mocha
- Features:
    - Page Object usage
    - Integration with [SauceLabs](https://saucelabs.com/)

### [cognitom/webdriverio-examples](https://github.com/cognitom/webdriverio-examples)

Project with various examples to setup WebdriverIO with an internal grid and PhantomJS or using cloud services like [TestingBot](https://testingbot.com/).

- Framework: Mocha
- Features:
    - examples for the tunneling feature from TestingBot
    - standalone examples
    - simple demonstration of how to integrate PhantomJS as a service so no that no Java is required

### [michaelguild13/Selenium-WebdriverIO-Mocha-Chai-Sinon-Boilerplate](https://github.com/michaelguild13/Selenium-WebdriverIO-Mocha-Chai-Sinon-Boilerplate)

Enhance testing stack demonstration with Mocha and Chai allows you to write simple assertion using the [Chai](http://chaijs.com/) assertion library.

- Framework: Mocha
- Features:
    - Chai integration
    - Babel setup

### [dcypherthis/wdio-boilerplate-cucumber](https://github.com/dcypherthis/wdio-boilerplate-cucumber)

This project is an example of how to get started with WebdriverIO for Selenium testing in Node.js. It makes use of the Cucumber BDD framework and works with dot, junit, and allure reporters. It is ES6 friendly (via babel-register) and uses Grunt to manage tasks.

- Framework: Cucumber
- Features:
    - detailed documentation
    - runs tests in a [Docker](https://www.docker.com/) container
    - Babel setup

### [WillLuce/WebdriverIO_Typescript](https://github.com/WillLuce/WebdriverIO_Typescript)

This directory contains the WebdriverIO page object example written using TypeScript.

- Framework: Mocha
- Features:
    - examples of Page Object Model implementation
    - Intellisense

### [klamping/wdio-starter-kit](https://github.com/klamping/wdio-starter-kit)

Boilerplate repo for quick set up of WebdriverIO test scripts with TravisCI, Sauce Labs and Visual Regression Testing

- Framework: Mocha, Chai
- Features:
    - Login & Registration Tests, with Page Objects
    - Mocha
    - Chai with expect global
    - Chai WebdriverIO
    - Sauce Labs integration
    - Visual Regression Tests
    - Local notifications
    - ESLint using Semistandard style
    - WebdriverIO tuned Gitignore file
