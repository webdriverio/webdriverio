---
id: boilerplates
title: Boilerplate Projects
---

Over time, our community has developed several projects that you can use as inspiration to set up your own test suite.

## [webdriverio/appium-boilerplate](https://github.com/webdriverio/appium-boilerplate/)

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

## [webdriverio/cucumber-boilerplate](https://github.com/webdriverio/cucumber-boilerplate)

Our very own boilerplate for Cucumber test suites. We created over 150 predefined step definitions for you, so you can start writing feature files in your project right away.

- Framework: Cucumber
- Features:
    - Over 150 predefined steps that cover almost everything you need
    - Integrates WebdriverIO’s Multiremote functionality
    - Own demo app

## [webdriverio/jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate)
Boilerplate project to run WebdriverIO tests with Jasmine using Babel features and the page objects pattern.

- Frameworks
  - WebdriverIO (v6)
  - Jasmine (v3)
- Features
  - Page Object Pattern
  - Sauce Labs integration

## [amiya-pattnaik/webdriverIO-with-cucumberBDD](https://github.com/amiya-pattnaik/webdriverIO-with-cucumberBDD)

- Framework: Cucumber (v5.x)
- Features:
    - Page Objects Model uses with ES6 style class base approach and fully ES6 - ES8 support through Babel
    - Examples of multi selector option to query element with more than one selector at a time
    - Examples of multi browser and headless browser execution using - Chrome and Firefox
    - Integration with BrowserStack, Sauce Labs
    - Support of read/write data from MS-Excel for easy test data management from external data sources with examples
    - Database support to any RDBMS (Oracle, MySql, TeraData, Vertica etc.), executing any queries / fetching result set etc. with examples for E2E testing
    - Multiple reporting (Spec, Junit, Allure, JSON), plus local view of Junit report(.html) format
    - Task manage through Grunt
    - Examples with demo app https://search.yahoo.com/  and http://the-internet.herokuapp.com, Chai assertion liberary (expect, assert, should)
    - `Appium specific .config file for playback on mobile device.` For one click Appium setup refer [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX)

## [amiya-pattnaik/webdriverIO-with-mochaBDD](https://github.com/amiya-pattnaik/webdriverIO-with-mochaBDD)

- Framework: Mocha (v5.x)
- Features:
    -  Page Objects Model uses with ES6 style class base approach and fully ES6 - ES8 support through Babel
    - Task manage through Grunt
    -  Examples with demo app https://search.yahoo.com  and http://the-internet.herokuapp.com
    -  Examples of multi browser and headless browser execution using - Chrome and Firefox
    -  Examples of Multiple reporting (Spec, Junit, Allure), plus local view of Junit report (.html) format
    -  Examples of read/write data from MS-Excel for easy test data management from external data sources with examples
    -  Examples of DB connect to any RDBMS (Oracle, MySql, TeraData, Vertica etc.), any query execution / fetching result set etc. with examples for E2E testing
    - `Appium specific .config file for playback on mobile device.` For one click Appium setup refer [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX)

## [amiya-pattnaik/webdriverIO-with-jasmineBDD](https://github.com/amiya-pattnaik/webdriverIO-with-jasmineBDD)

- Framework: Jasmine (v3.x)
- Features:
    -  Page Objects Model uses with ES6 style class base approach and fully ES6 - ES8 support through Babel
    -  Task manage through Grunt
    -  Examples with demo app https://search.yahoo.com  and http://the-internet.herokuapp.com
    -  Examples of multi browser and headless browser execution using - Chrome and Firefox
    -  Examples of Multiple reporting (Spec, Junit, Allure), plus local view of Junit report (.html) format
    -  Examples of read/write data from MS-Excel for easy test data management from external data sources with examples
    -  Examples of DB connect to any RDBMS (Oracle, MySql, TeraData, Vertica etc.), any query execution / fetching result set etc. with examples for E2E testing
     - `Appium specific .config file for playback on mobile device.` For one click Appium setup refer [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX)

## [serhatbolsu/webdriverio-mocha-uiautomation-boiler](https://github.com/serhatbolsu/webdriverio-mocha-uiautomation-boiler)
ATDD WEB tests with Mocha, WebdriverIO v6 with PageObject

- Frameworks
  - WebdriverIO (v6)
  - Mocha
- Features
  - [Page Object](PageObjects.md) Model
  - Sauce Labs integration with [Sauce Service](https://github.com/webdriverio/webdriverio/blob/master/packages/wdio-sauce-service/README.md)
  - Allure Report
  - Automatic screenshots capture for failing tests
  - CircleCI example
  - ESLint

## [migalons/angular-wdio6-builder-demo](https://github.com/migalons/angular-wdio6-builder-demo)
Build your angular e2e test with wdio. This project uses a new angular cli builder for replacing protractor with wdio.

- Frameworks:
  - Webdriverio (v6)
  - Angular (v9)
- Features:
  - Replaces protractor with wdio as e2e runner
  - Completely integrated into angular workspace (angular.json)
  - Allows execution through angular cli (`ng e2e ...`). This allows to build, serve and run wdio test synchronously.

## [WarleyGabriel/demo-webdriverio-cucumber](https://github.com/WarleyGabriel/demo-webdriverio-cucumber)

Boilerplate project to run E2E tests with Cucumber.

- Frameworks:
    - WebdriverIO (v6)
    - Cucumber
- Features:
    - TypeScript
    - [Expect-webdriverio](https://github.com/webdriverio/expect-webdriverio)
    - [Page Object](PageObjects.md) Pattern
    - [Gherkin lint](https://github.com/vsiakka/gherkin-lint)
    - Scripts to check undefined and unused steps on step/feature files
    - [Commit lint](https://github.com/conventional-changelog/commitlint) and [Commitizen](https://github.com/commitizen/cz-cli#making-your-repo-commitizen-friendly)
    - ESlint
    - Prettier
    - Husky
    - Github Actions example
    - Allure report (screenshots on failure) and Timeline report

## [WarleyGabriel/demo-webdriverio-mocha](https://github.com/WarleyGabriel/demo-webdriverio-mocha)

Boilerplate project to run E2E tests with Mocha.

- Frameworks:
    - WebdriverIO (v6)
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

## [SimitTomar/webdriverio-cucumber-pom-boilerplate](https://github.com/SimitTomar/webdriverio-cucumber-pom-boilerplate)

A WebdriverIO & Cucumber Boilerplate based on Page Object Model!

- Frameworks:
    - webdriverIO (v6)
    - cucumber (v6)

- Features:
    - Supports Page Object Model
    - Compatible with Nodejs Versions 8.x to 13.x
    - Contains sample Scenarios written in Declarative style of BDD
    - Supports Data externalisation
    - Integrated with [eslint](https://www.npmjs.com/package/eslint) for identifying and reporting on code patterns.
    - Integrated with [cucumber-html-reporter](https://www.npmjs.com/package/cucumber-html-reporter) for intuitive & detailed HTML reporting
    - Embeds screenshots on failure
    - Integrated with [wdio-cucumber-parallel-execution](https://www.npmjs.com/package/wdio-cucumber-parallel-execution) module for parallel execution

## [tamil777selvan/wdioV6-Perfecto-Boilerplate](https://github.com/tamil777selvan/wdioV6-Perfecto-Boilerplate.git)

Boilerplate project to run WebdriverIO tests in [Perfecto Cloud](https://www.perfecto.io/) using Cucumber features, and the page objects pattern.

- Frameworks:
    - webdriverIO (v6)
    - cucumber (v6)

- Features:
    - Cloud integration with [Perfecto](https://www.perfecto.io/)
    - Supports Page Object Model
    - Contains sample Scenarios written in Declarative style of BDD

## [pako88/wdio-mocha-typescript](https://github.com/pako88/wdio-mocha-typescript)
Boilerplate with WebdriverIO v6, Mocha, TypeScript, ESLint

- Frameworks
  - WebdriverIO (v6)
  - Mocha
- Features
  - Page Object Pattern
  - TypeScript
  - ESLint
  - VSCode
  - GitHub Actions
  - Sauce Labs integration
  - Chromedriver Config
  - Devtools Config
  - many example tests

## [Arjun-Ar91/WebdriverIO-V6-appium-cucumber-boilerplate](https://github.com/Arjun-Ar91/WebdriverIO-V6-appium-cucumber-boilerplate.git)

Boilerplate project to run appium tests for native and mobile browser using cucumber v6 and webdriverIO v6 with page object pattern.

- Frameworks
    - WebdriverIO v6
    - Cucumber v6
    - Appium

- Features
    - Native Android and iOS apps
    - Android Chrome browser
    - iOS Safari browser
    - Page Object Model
    - Contains sample test scenarios in cucumber
    - Integrated with multiple cucumber html reports

## [AdarshKumarGM/WebDriverIO-with-CucumberJS](https://github.com/AdarshKumarGM/WebDriverIO-with-CucumberJS)
Boilerplate for bulding cucumberJS with webdriverIO framework.

- Framework:
   - WebdriverIO (v6.x)
   - CucumberJS (v6.x)
   - Node (v12.x)

- Features:
   - Capability for desktop browser
   - Multiple cucumber html reporting
   - Eslint
   - Folder structure containing support files to kick start

## [Arjun-Ar91/WebdriverIO-V6-appium-mocha-boilerplate](https://github.com/Arjun-Ar91/WebdriverIO-V6-appium-mocha-boilerplate.git)

Boilerplate project to run appium tests for native and mobile browser using mocha v6 and webdriverIO v6 with page object pattern.

- Frameworks
    - WebdriverIO v6
    - Mocha v6
    - Appium

- Features
    - Native Android and iOS apps
    - Android Chrome browser
    - iOS Safari browser
    - Page Object Model
    - Contains sample test scenarios in mocha
    - Integrated with eslint and allure reporting

## [osmolyar/page-object-structure-with-cucumber](https://github.com/osmolyar/page-object-structure)

Boilerplate project for WebdriverIO with Cucumber.  Navigation modeling, advanced page object structure, Cucumber world context, business options, cucumber step data parsing methods.

- Frameworks:
  - WebdriverIO v6
  - @wdio/cucumber-framework
  - Typescript
- Features:
  - Increased modularization
      - Page object structure leveraging return of landing page instances on navigation to pages
        - Isolates step definition files and page object classes from dependencies on downstream pages.
        - No need to import each page class that will be navigated to.
        - Increases the modularity of the framework and enforces guardrails on methods defined within a page
        - Implicitly validates having landed on the correct page inside each page's constructor
          - Calls a method to validate some page indicator (e.g., title).
            - Parametrized with validation parameter to prevent page validation at compile time
          - Further enforces expected navigation results prior to interacting with a page's elements
        - Allows the framework to model the navigation structure of the application
        - Steps can traverse multiple pages using a single method.
      - Page Ui services separate from page objects
        - Model higher-level business logic
        - Page objects contain only DOM-level logic
        - Ui services import those of downstream pages and define relationships among pages
      - Separation of validation and navigation logic
        - Collect artifacts for validation during navigation
        - Capture in validationOptions business option objects
        - Compare to expected values using subsequent validation steps
  - Use of Cucumber 'world' object with custom World constructor
    - Initialize functionality-specific business option objects
    - Populate business options with step definitions
    - Step definitions pass only required business options, validation options to ui Service methods
    - Step definitions examples using various Cucumber data-tables methods
      - (https://github.com/cucumber/cucumber-js/blob/master/features/data_tables.feature)
  - Custom browser and element commands
    - With color logging and parameterized wait and trailing wait options
  - Generic utilities
  - Spec, Allure and custom reporters
