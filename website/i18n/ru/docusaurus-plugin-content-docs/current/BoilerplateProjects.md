---
id: boilerplates
title: Boilerplate Projects
---

Over time, our community has developed several projects that you can use as inspiration to set up your own test suite.

# v8 Boilerplate Projects

## [webdriverio/cucumber-boilerplate](https://github.com/webdriverio/cucumber-boilerplate)

Our very own boilerplate for Cucumber test suites. We created over 150 predefined step definitions for you, so you can start writing feature files in your project right away.

- Framework:
    - Cucumber (v8)
    - WebdriverIO (v8)
- Features:
    - Over 150 predefined steps that cover almost everything you need
    - Integrates WebdriverIO's Multiremote functionality
    - Own demo app

## [webdriverio/jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate)
Boilerplate project to run WebdriverIO tests with Jasmine using Babel features and the page objects pattern.

- Frameworks
    - WebdriverIO (v8)
    - Jasmine (v4)
- Features
    - Page Object Pattern
    - Sauce Labs integration

## [syamphaneendra/webdriverio-web-mobile-boilerplate](https://github.com/syamphaneendra/webdriverio-web-mobile-boilerplate)

This boilerplate project has WebdriverIO 8 tests with cucumber and typescript, followed by the page objects pattern.

- Frameworks:
    - WebdriverIO v8
    - Cucumber v8

- Features:
    - Typescript v5
    - Page Object Pattern
    - Prettier
    - Multi browser support
      - Chrome
      - Firefox
      - Edge
      - Safari
      - Standalone
    - Crossbrowser parallel execution
    - Appium
    - Cloud testing Integration with BrowserStack & Sauce Labs
    - Docker service
    - Share data service
    - Separate config files for each service
    - Testdata management & read by user type
    - Reporting
      - Dot
      - Spec
      - Multiple cucumber html report with failure screenshots
    - Gitlab pipelines for Gitlab repository
    - Github actions for Github repository
    - Docker compose for setting up the docker hub

## [amiya-pattnaik/webdriverIO-with-cucumberBDD](https://github.com/amiya-pattnaik/webdriverIO-with-cucumberBDD)

- Framework: WDIO-V8 with Cucumber (V8x).
- Features:
    - Page Objects Model uses with ES6 /ES7 style class base approach and TypeScript support
    - Examples of multi selector option to query element with more than one selector at a time
    - Examples of multi browser and headless browser execution using - Chrome and Firefox
    - Cloud testing Integration with BrowserStack, Sauce Labs, LambdaTest
    - Examples of read/write data from MS-Excel for easy test data management from external data sources with examples
    - Database support to any RDBMS (Oracle, MySql, TeraData, Vertica etc.), executing any queries / fetching result set etc. with examples for E2E testing
    - Multiple reporting (Spec, Xunit/Junit, Allure, JSON) and Hosting Allure and Xunit/Junit reporting on WebServer.
    - Examples with demo app https://search.yahoo.com/  and http://the-internet.herokuapp.com.
    - BrowserStack, Sauce Labs, LambdaTest and Appium specific `.config` file (for playback on mobile device). For one click Appium setup on local machine for iOS and Android refer to [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX).

## [amiya-pattnaik/webdriverIO-with-mochaBDD](https://github.com/amiya-pattnaik/webdriverIO-with-mochaBDD)

- Framework: WDIO-V8 with Mocha (V10x).
- Features:
    -  Page Objects Model uses with ES6 /ES7 style class base approach and TypeScript support
    -  Examples with demo app https://search.yahoo.com  and http://the-internet.herokuapp.com
    -  Examples of multi browser and headless browser execution using - Chrome and Firefox
    -  Cloud testing Integration with BrowserStack, Sauce Labs, LambdaTest
    -  Multiple reporting (Spec, Xunit/Junit, Allure, JSON) and Hosting Allure and Xunit/Junit reporting on WebServer.
    -  Examples of read/write data from MS-Excel for easy test data management from external data sources with examples
    -  Examples of DB connect to any RDBMS (Oracle, MySql, TeraData, Vertica etc.), any query execution / fetching result set etc. with examples for E2E testing
    -  BrowserStack, Sauce Labs, LambdaTest and Appium specific `.config` file (for playback on mobile device). For one click Appium setup on local machine for iOS and Android refer to [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX).

## [amiya-pattnaik/webdriverIO-with-jasmineBDD](https://github.com/amiya-pattnaik/webdriverIO-with-jasmineBDD)

- Framework: WDIO-V8 with Jasmine (V4x).
- Features:
    -  Page Objects Model uses with ES6 /ES7 style class base approach and TypeScript support
    -  Examples with demo app https://search.yahoo.com  and http://the-internet.herokuapp.com
    -  Examples of multi browser and headless browser execution using - Chrome and Firefox
    -  Cloud testing Integration with BrowserStack, Sauce Labs, LambdaTest
    -  Multiple reporting (Spec, Xunit/Junit, Allure, JSON) and Hosting Allure and Xunit/Junit reporting on WebServer.
    -  Examples of read/write data from MS-Excel for easy test data management from external data sources with examples
    -  Examples of DB connect to any RDBMS (Oracle, MySql, TeraData, Vertica etc.), any query execution / fetching result set etc. with examples for E2E testing
    -  BrowserStack, Sauce Labs, LambdaTest and Appium specific `.config` file ( for playback on mobile device). For one click Appium setup on local machine for iOS and Android refer to [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX).

## [webdriverio/klassijs-boilerplate](https://github.com/klassijs/klassi-example-test-suite.git)

- Frameworks
    - WebdriverIO (v8)
    - Cucumber (v8)

- Features
    - Contain sample test scenario in cucumber
    - Integrates cucumber html reports with Embedded videos on failures
    - Integrates Lambdatest and CircleCI services
    - Integrates Visual, Accessibility and API testing
    - Integrates Email functionality
    - Integrates s3 bucket for test reports storage and retrieval

## [serenity-js/serenity-js-mocha-webdriverio-template/](https://github.com/serenity-js/serenity-js-mocha-webdriverio-template/)

[Serenity/JS](https://serenity-js.org?pk_campaign=wdio8&pk_source=webdriver.io) template project to help you get started with acceptance testing your web applications using the latest WebdriverIO, Mocha, and Serenity/JS.

- Frameworks
    - WebdriverIO (v8)
    - Mocha (v10)
    - Serenity/JS (v3)
    - Serenity BDD reporting

- Возможности
    - [Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io)
    - Automatic screenshots on test failure, embedded in reports
    - Continuous Integration (CI) setup using [GitHub Actions](https://github.com/serenity-js/serenity-js-mocha-webdriverio-template/blob/main/.github/workflows/main.yml)
    - [Demo Serenity BDD reports](https://serenity-js.github.io/serenity-js-mocha-webdriverio-template/) published to GitHub Pages
    - TypeScript
    - ESLint

## [serenity-js/serenity-js-cucumber-webdriverio-template/](https://github.com/serenity-js/serenity-js-cucumber-webdriverio-template/)

[Serenity/JS](https://serenity-js.org?pk_campaign=wdio8&pk_source=webdriver.io) template project to help you get started with acceptance testing your web applications using the latest WebdriverIO, Cucumber, and Serenity/JS.

- Фреймворки
    - WebdriverIO (v8)
    - Cucumber (v9)
    - Serenity/JS (v3)
    - Serenity BDD reporting

- Возможности
    - [Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io)
    - Automatic screenshots on test failure, embedded in reports
    - Continuous Integration (CI) setup using [GitHub Actions](https://github.com/serenity-js/serenity-js-cucumber-webdriverio-template/blob/main/.github/workflows/main.yml)
    - [Demo Serenity BDD reports](https://serenity-js.github.io/serenity-js-mocha-webdriverio-template/) published to GitHub Pages
    - TypeScript
    - ESLint

# v7 Boilerplate Projects

## [webdriverio/appium-boilerplate](https://github.com/webdriverio/appium-boilerplate/)

Boilerplate project to run Appium tests with WebdriverIO for:

- iOS/Android Native Apps
- iOS/Android Hybrid Apps
- Android Chrome and iOS Safari browser

This boilerplate includes the following:

- Framework: Mocha
- Features:
    - Configs for:
        - Приложение для iOS и Android
        - Браузеры iOS и Android
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
        - Браузеры

## [serhatbolsu/webdriverio-mocha-uiautomation-boiler](https://github.com/serhatbolsu/webdriverio-mocha-uiautomation-boiler)
ATDD WEB tests with Mocha, WebdriverIO v6 with PageObject

- Фреймворки
  - WebdriverIO (v7)
  - Mocha
- Возможности
  - [Page Object](pageobjects) Model
  - Sauce Labs integration with [Sauce Service](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-sauce-service/README.md)
  - Allure Report
  - Automatic screenshots capture for failing tests
  - CircleCI example
  - ESLint

## [WarleyGabriel/demo-webdriverio-mocha](https://github.com/WarleyGabriel/demo-webdriverio-mocha)

Boilerplate project to run E2E tests with Mocha.

- Frameworks:
    - WebdriverIO (v7)
    - Mocha
- Features:
    -   TypeScript
    -   [Expect-webdriverio](https://github.com/webdriverio/expect-webdriverio)
    -   [Visual regression tests](https://github.com/wswebcreation/wdio-image-comparison-service)
    -   Page Object Pattern
    -   [Commit lint](https://github.com/conventional-changelog/commitlint) and [Commitizen](https://github.com/commitizen/cz-cli#making-your-repo-commitizen-friendly)
    -   ESlint
    -   Prettier
    -   Husky
    -   Github Actions example
    -   Allure report (screenshots on failure)

## [17thSep/WebdriverIO_Master](https://github.com/17thSep/WebdriverIO_Master)

Boilerplate project to run **WebdriverIO v7** tests for the following:

[WDIO 7 scripts with TypeScript in Cucumber Framework](https://github.com/17thSep/WebdriverIO_Master/tree/master/TypeScript/Cucumber) [WDIO 7 scripts with TypeScript in Mocha Framework](https://github.com/17thSep/WebdriverIO_Master/tree/master/TypeScript/Mocha) [Run WDIO 7 script in Docker](https://github.com/17thSep/WebdriverIO_Master/tree/master/TypeScript/Docker) [Network logs](https://github.com/17thSep/MonitorNetworkLogs/)

Boiler plate project for:

- Capture Network Logs
- Capture all GET/POST calls or a specific REST API
- Assert Request parameters
- Assert Response parameters
- Store all the response in a separate file

## [Arjun-Ar91/Wdio7-appium-cucumber](https://github.com/Arjun-Ar91/Wdio7-appium-cucumber.git)

Boilerplate project to run appium tests for native and mobile browser using cucumber v7 and wdio v7 with page object pattern.

- Фреймворки
    - WebdriverIO v7
    - Cucumber v7
    - Appium

- Возможности
    - Нативные приложения для Android и iOS
    - Браузер Chrome для Android
    - Браузер Safari для iOS
    - Page Object Model
    - Contains sample test scenarios in cucumber
    - Integrated with multiple cucumber html reports

## [praveendvd/webdriverIODockerBoilerplate/](https://github.com/praveendvd/webdriverIODockerBoilerplate)

This a template project to help you show how you can run webdriverio test from Web applications using the latest WebdriverIO, and Cucumber framework. This project intends to act as a baseline image that you can use to understand how to run WebdriverIO tests in docker

Этот проект включает в себя:

- ФайлDocker
- cucumber Проект

Read more at: [Medium Blog](https://praveendavidmathew.medium.com/running-webdriverio-in-wsl2-windows-91d3a0dc7746)

## [praveendvd/WebdriverIO_electronAppAutomation_boilerplate/](https://github.com/praveendvd/WebdriverIO_electronAppAutomation_boilerplate)

This a template project to help you show how you can run electronJS tests using WebdriverIO. This project intends to act as a baseline image that you can use to understand how to run WebdriverIO electronJS tests.

Этот проект включает в себя:

- Sample electronjs app
- Sample cucumber test scripts

Read more at: [Medium Blog](https://praveendavidmathew.medium.com/first-step-into-automation-of-electronjs-applications-ef89b7423ddd)

## [praveendvd/webdriverIO_winappdriver_boilerplate/](https://github.com/praveendvd/webdriverIO_winappdriver_boilerplate)

This a template project to help you show how you can automate windows application using winappdriver and  WebdriverIO . This project intends to act as a baseline image that you can use to understand how to run windappdriver and WebdriverIO tests.

Read more at: [Medium Blog](https://praveendavidmathew.medium.com/winappdriver-first-step-into-windows-app-test-automation-using-webdriverio-and-winappdriver-46320d89570b)

## [praveendvd/appium-chromedriver-multiremote-wdio-boilerplate/](https://github.com/praveendvd/appium-chromedriver-multiremote-wdio-boilerplate)


This a template project to help you show how you can run webdriverio multiremote capability with latest WebdriverIO, and Jasmine framework. This project intends to act as a baseline image that you can use to understand how to run WebdriverIO tests in docker

This project uses:

     - chromedriver
     - jasmine
     - appium

## [webdriverio-roku-appium-boilerplate](https://github.com/AntonKostenko/webdriverIO-roku-appium)

Template project to run appium tests on real Roku devices using mocha with page object pattern.

- Фреймворки
    - WebdriverIO Async v7
    - Appium 2.0
    - Mocha v7
    - Отчеты Allure

- Возможности
    - Page Object Model
    - Typescript
    - Screenshot on failure
    - Example tests using a sample Roku channel
