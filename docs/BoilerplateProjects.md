---
id: boilerplate
title: Boilerplate Projects
---

Over time, our community has developed several boilerplate projects that you can use as inspiration to set up your own test suite.

## v5 Boilerplate Projects

### [labs42io/web-automation](https://github.com/labs42io/web-automation)
BDD tests with Cucumber, WebdriverIO and Docker Selenium.

- Frameworks
  - WebdriverIO (v5.x)
  - docker-selenium (v3.x)
  - TypeScript (v3.x)
  - Cucumber
- Features
  - Dockerized selenium grid and browsers
  - Configurable selenium and browser versions 
  - Over 150 predefined snippets for [Cucumber Gherkin Syntax](https://cucumber.io/docs/gherkin/)
  - Write custom snippets with TypeScript
  - Visually debug tests with *VNC viewier*
  - Detailed report generation
  - Automatic screenshots attached for failing tests
  - CI integration samples
  - ESLint
  
### [davidnguyen179/storybook-wdio](https://github.com/davidnguyen179/storybook-wdio)

The project creates the powerful component base boilerplate using Storybook, React, Typescript, Mocha, WebdriverIO and Selenium.

- Frameworks:
    - Storybook (v5.x)
    - React (v16.x)
    - WebdriverIO (v5.x)
    - TypeScript(v3.x)
    - @Types/Mocha (v5.x)
- Features:
    - Generate the stories of component via configurations
    - TypeScript [Page Object](PageObjects.md) Models
    - TypesScript Models
    - Code Prettier
    - Eslint
    - Git hook using `husky` and `lint-staged`
    - Support TravisCI, CircleCI and Github Actions
    - Allow running visual regression test in single component or all components
    - Support `Dockerfile` to deploy the `storybook`
    - Support `docker-compose.yml` to start the selenium chrome, firefox

### [amiya-pattnaik/webdriverIO-with-cucumberBDD](https://github.com/amiya-pattnaik/webdriverIO-with-cucumberBDD)

- Framework: Cucumber (v5.x)
- Features:
    - [Page Object](PageObjects.md) Models used with ES6 style class-based approach, and full ES6–ES8 support through Babel
    - Examples of multi-selector option to query elements with more than one selector at a time
    - Examples of headless browser execution, using PhantomJS and Chrome
    - Integration with BrowserStack, SauceLabs
    - Support of reading and writing from MS-Excel documents for easy test data management from external data sources with examples
    - Database support for any RDBMS (Oracle, MySql, TeraData, Vertica etc.), executing queries, fetching result sets, and so on. Includes examples of E2E testing.
    - Multiple reporting (Spec, Junit, Allure, JSON), plus local view of JUnit report(`.html`) format
    - Task manage through Grunt
    - Examples with demo app https://search.yahoo.com and http://www.phptravels.net, Chai assertion liberary (`expect`, `assert`, `should`)
    - Appium-specific `.config` file for playback on mobile device. For one-click Appium setup, refer to: [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX)


### [amiya-pattnaik/webdriverIO-with-jasmineBDD](https://github.com/amiya-pattnaik/webdriverIO-with-jasmineBDD)

- Framework: Jasmine (v3.x)
- Features:
    - [Page Object](PageObjects.md)s Model used with ES6 style class-based approach, and full ES6–ES8 support through Babel
    - Task manage through Grunt
    - Multiple reporting (Spec, Junit, Allure), plus local view of JUnit report (`.html`) format
    - Jasmine Spec examples with assert module and Jasmine-specific assertions using demo app http://www.phptravels.net
    - Examples of headless browser execution using Chrome and Firefox and Integration with BrowserStack and SauceLabs
    - Examples of reading and writing from MS-Excel documentsfor easy test data management from external data sources
    - Examples of DB connect to any RDBMS (Oracle, MySql, TeraData, Vertica etc.), query execution, and fetching result sets


### [amiya-pattnaik/webdriverIO-with-mochaBDD](https://github.com/amiya-pattnaik/webdriverIO-with-mochaBDD)

- Framework: Mocha (v5.x)
- Features:
    - [Page Object](PageObjects.md)s Model used with ES6 style class-based approach, and full ES6–ES8 support through Babel
    - Task management through Grunt
    - Multiple reporting (Spec, Junit, Allure), plus local view of Junit report (`.html`) format
    - Mocha Spec examples with `assert` module and Mocha-specific assertions using demo app http://www.phptravels.net
    - Examples of headless browser execution using Chrome and Firefox and Integration with BrowserStack & SauceLabs
    - Examples of reading and writing from MS-Excel documents for easy test data management from external data sources
    - Examples of DB connect to any RDBMS (Oracle, MySql, TeraData, Vertica, etc.), query execution, and fetching result sets


### [jpolley/WebdriverIO_v5_TypeScript](https://github.com/jpolley/WebdriverIO_v5_TypeScript)

This boilerplate uses the following:

- Framework: Mocha
- Features:
    - TypeScript Setup
    - [Page Object](PageObjects.md) Pattern
    - Chai integration
    - CI examples (CircleCI, Travis CI, Jenkins)
    - Allure reporter

### [DaleNguyen/WebdriverIO-TypeScript-Boilerplate](https://github.com/dalenguyen/WebdriverIO-TypeScript-Boilerplate)

This project creates a powerful boilerplate for UI Automation Testing with WebdriverIO, TypeScript, Mocha, Chai, and Allure reporting.

- Frameworks:
    - WebdriverIO (v5.x)
    - TypeScript(v3.x)
    - @Types/Mocha (v5.x)
    - Chai (v5.x)
    - @Wdio/Allure (v5.x)
    - Axe-core(v3.x)
- Features:
    - Accessibility testing with Axe-core
    - TypeScript [Page Object](PageObjects.md) Models
    - TypesScript Models
    - Code Prettier
    - HTML report with Allure
    - Single test case for development purposes

### [ssehmi/WebdriverIO-TypeScript-Cucumber-Boilerplate](https://github.com/ssehmi/e2e)

This is a boilerplate project to run E2E tests with CucumberJS tests with chai assertions written in typescript.

- Frameworks:
    - WebdriverIO (v5.x)
    - TypeScript(v3.x)
    - Chai (v5.x)
    - @Wdio/Allure (v5.x)
- Features:
    - TypeScript decorators for cucumber steps
    - Prettier
    - Allure Reporting

### [luuizeduardo/wdio-automation](https://github.com/luuizeduardo/wdio-automation)

A boilerplate to run E2E tests with Mocha and generate test reports gracefully.

- Framework: Mocha(v5.x)
- Features:
    - [Page Object](PageObjects.md) Pattern with Closure Functions (Factory Pattern)
    - Fake data generator (Faker.js)
    - Multiple Reports (Allure, Report Portal)
    - Docker compose to run your test suite on Selenium Grid
    - Dotenv module to hide your personal information
    - ESLint

### [WarleyGabriel/demo-webdriverio-mocha](https://github.com/WarleyGabriel/demo-webdriverio-mocha)

A powerful boilerplate to run E2E and visual regression tests with Mocha.

- Framework: Mocha (v5.x)
- Features:
    - [Page Object](PageObjects.md) Pattern
    - ES6 style class-based approach, and full ES6–ES8 support through Babel
    - Chai
    - Multiple reports (Spec, Dot, Allure, Timeline)
    - Visual regression tests (Image comparison service)
    - Code formatter (ESlint, Prettier)
    - Husky

### [WarleyGabriel/demo-webdriverio-cucumber](https://github.com/WarleyGabriel/demo-webdriverio-cucumber)

A powerful boilerplate project to run E2E tests with Cucumber.

- Framework: Cucumber (v5.x)
- Features:
    - [Page Object](PageObjects.md) Pattern
    - ES6 style class-based approach, and full ES6–ES8 support through Babel
    - Chai
    - Multiple reports (Spec, Dot, Allure, Timeline)
    - Code formatter (ESlint, Prettier)
    - Husky

### [webdriverio/appium-boilerplate](https://github.com/webdriverio/appium-boilerplate/)

Boilerplate project to run Appium tests with WebdriverIO for:

- iOS/Android Native Apps
- iOS/Android Hybrid Apps
- Android Chrome and iOS Safari browser

This boilerplate includes the following:

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
        
### [Schveitzer/webdriverio-appium-cucumber-boilerplate](/https://github.com/Schveitzer/webdriverio-appium-cucumber-boilerplate)

Boilerplate project to run Appium tests together with WebdriverIO and BDD with Cucumber for:

- iOS/Android Native Apps
- iOS/Android Hybrid Apps

This boilerplate includes the following:

- Frameworks:
    - WebdriverIO (v5.x)
    - Chai (v5.x)
    - @Wdio/Allure (v5.x)
    - Appium (1.16.x)
    - Cucumber (v5.x)
    
- Features:
    - Configs for:
        - iOS and Android app
    - Tests examples in english and portuguese for:
        - WebView
        - Login
        - Forms
        - Swipe
    - [Page Object](PageObjects.md) Pattern
    - ES6 style class-based approach, and full ES6–ES8 support through Babel
    - Chai
    - Reports with Allure (Print screen on fail)
    - Code formatter (ESlint, Prettier)
    - Git hook using `husky`
        
### [blueimp/wdio](https://github.com/blueimp/wdio)

Docker setup for WebdriverIO with automatic screenshots, image diffing, and screen recording support for containerized versions of Chrome and Firefox. Also includes macOS host configs to test an app running in Docker with Safari Desktop, as well as Safari Mobile and Chrome Mobile via Appium.

Sample app demonstrates a simple email application (with email test automation support via [MailHog](https://github.com/mailhog/MailHog)).

The only project requirement is Docker. (Since WebdriverIO is also containerized, not even NodeJS is required.)

- Framework: Mocha (v5.x)
- Features:
    - Configs for:
        - Dockerized Google Chrome
        - Dockerized Mozilla Firefox
        - Safari Desktop
        - Safari Mobile via Appium
        - Chrome Mobile via Appium
    - Helpers for:
        - Automatic screenshots based on test failure/success (part of [`wdio-screen-commands`](https://github.com/blueimp/wdio-screen-commands))
        - Screenshot image diffing via [`node-ffmpeg-image-diff`](https://github.com/blueimp/node-ffmpeg-image-diff)
        - Screen recording support for Chrome and Firefox via [`record-screen`](https://github.com/blueimp/record-screen)
        - Email test automation support via [`mailhog-node`](https://github.com/blueimp/mailhog-node)
    - Test examples for:
        - Email form submission
        - Email reception success

### [jonyet/webdriverio-boilerplate](https://github.com/jonyet/webdriverio-boilerplate)

Designed to be quick to get you started without getting terribly complex.

- Framework: Mocha
- Features:
    - Cloud integration with [BrowserStack](https://www.browserstack.com)
    - Uses [Page Objects](PageObjects.md)
    - An alternative component-specific (rather than page-specific) approach, allowing for a split E2E and integration test writing approach
    - Introduces config file extensions for readability and flexibility, in the event that you have multiple teams/projects working out of the same project repository

### [PerfectoMobileSA/webdriverio5-cucumber-perfecto-sample](https://github.com/PerfectoMobileSA/webdriverio5-cucumber-perfecto-sample)

This project is useful not only as an example of WebdriverIO v5 and integration with perfecto cloud (https://www.perfecto.io/), but it includes examples of the PageObject pattern, different locators files to run the same script on Android and iOS devices, and some practical examples for using WebdriverIO to build an automated test suite with Cucumber (v 5.x) BDD framework.

- Framework: Cucumber (v5.x)
- Features:
    - Cloud integration with [Perfecto](https://www.perfecto.io/)
    - Uses [Page Objects](PageObjects.md)
    - Examples of using Page Locators to run same script on Multiple Mobile Devices

----

## v4 Boilerplate Projects

### [webdriverio/cucumber-boilerplate](https://github.com/webdriverio/cucumber-boilerplate)

Our very own boilerplate for Cucumber test suites. We created over 150 predefined step definitions for you, so you can start writing feature files in your project right away.

- Framework: Cucumber
- Features:
    - Over 150 predefined steps that cover almost everything you need
    - Integrates WebdriverIO’s Multiremote functionality
    - Own demo app

### [saucelabs-sample-test-frameworks/JS-Mocha-WebdriverIO-Selenium](https://github.com/saucelabs-sample-test-frameworks/JS-Mocha-WebdriverIO-Selenium)

Simple boilerplate project that runs multiple browsers on [SauceLabs](https://saucelabs.com) in parallel.

- Framework: Mocha
- Features:
    - [Page Object](PageObjects.md) usage
    - Integration with [SauceLabs](https://saucelabs.com)

### [cognitom/webdriverio-examples](https://github.com/cognitom/webdriverio-examples)

Project with various examples to setup WebdriverIO with an internal grid and PhantomJS, or using cloud services like [TestingBot](https://testingbot.com).

- Framework: Mocha
- Features:
    - Examples for the tunneling feature from TestingBot
    - Standalone examples
    - Simple demo of how to integrate PhantomJS as a service (so that no Java is required!)

### [michaelguild13/Selenium-WebdriverIO-Mocha-Chai-Sinon-Boilerplate](https://github.com/michaelguild13/Selenium-WebdriverIO-Mocha-Chai-Sinon-Boilerplate)

Enhance testing stack demonstration with Mocha and Chai allows you to write simple assertion using the [Chai](http://chaijs.com) assertion library.

- Framework: Mocha
- Features:
    - Chai integration
    - Babel setup

### [dcypherthis/wdio-boilerplate-cucumber](https://github.com/dcypherthis/wdio-boilerplate-cucumber)

This project is an example of how to get started with WebdriverIO for Selenium testing in NodeJS. It makes use of the Cucumber BDD framework, and supports the dot, junit, and allure reporters. It is ES6 friendly (via `babel-register`) and uses Grunt to manage tasks.

- Framework: Cucumber
- Features:
    - Detailed documentation
    - Runs tests in a [Docker](https://www.docker.com) container
    - Babel setup

### [WillLuce/WebdriverIO_Typescript](https://github.com/WillLuce/WebdriverIO_Typescript)

This directory contains the WebdriverIO [page object](PageObjects.md) example, written in TypeScript.

- Framework: Mocha
- Features:
    - examples of [Page Object](PageObjects.md) Model implementation
    - Intellisense

### [klamping/wdio-starter-kit](https://github.com/klamping/wdio-starter-kit)

Boilerplate repo for quick setup of WebdriverIO test scripts with TravisCI, Sauce Labs, and Visual Regression Testing.

- Framework: Mocha, Chai
- Features:
    - Login and Registration Tests (with [Page Object](PageObjects.md)s)
    - Mocha
    - Chai with `expect` global
    - Chai WebdriverIO
    - Sauce Labs integration
    - Visual Regression Tests
    - Local notifications
    - ESLint using Semistandard style
    - WebdriverIO-tuned `.gitignore` file
