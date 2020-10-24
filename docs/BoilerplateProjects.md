---
id: boilerplate
title: Boilerplate Projects
---

Over time, our community has developed several boilerplate projects that you can use as inspiration to set up your own test suite.

## v6 Boilerplate Projects

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

### [webdriverio/cucumber-boilerplate](https://github.com/webdriverio/cucumber-boilerplate)

Our very own boilerplate for Cucumber test suites. We created over 150 predefined step definitions for you, so you can start writing feature files in your project right away.

- Framework: Cucumber
- Features:
    - Over 150 predefined steps that cover almost everything you need
    - Integrates WebdriverIO’s Multiremote functionality
    - Own demo app

### [webdriverio/jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate)
Boilerplate project to run WebdriverIO tests with Jasmine using Babel features and the page objects pattern.

- Frameworks
  - WebdriverIO (v6)
  - Jasmine (v3)
- Features
  - Page Object Pattern
  - Sauce Labs integration

### [amiya-pattnaik/webdriverIO-with-cucumberBDD](https://github.com/amiya-pattnaik/webdriverIO-with-cucumberBDD)

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

### [amiya-pattnaik/webdriverIO-with-mochaBDD](https://github.com/amiya-pattnaik/webdriverIO-with-mochaBDD)

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

### [amiya-pattnaik/webdriverIO-with-jasmineBDD](https://github.com/amiya-pattnaik/webdriverIO-with-jasmineBDD)

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

### [serhatbolsu/webdriverio-mocha-uiautomation-boiler](https://github.com/serhatbolsu/webdriverio-mocha-uiautomation-boiler)
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

### [migalons/angular-wdio6-builder-demo](https://github.com/migalons/angular-wdio6-builder-demo)
Build your angular e2e test with wdio. This project uses a new angular cli builder for replacing protractor with wdio.

- Frameworks:
  - Webdriverio (v6)
  - Angular (v9)
- Features:
  - Replaces protractor with wdio as e2e runner
  - Completely integrated into angular workspace (angular.json)
  - Allows execution through angular cli (`ng e2e ...`). This allows to build, serve and run wdio test synchronously.

### [WarleyGabriel/demo-webdriverio-cucumber](https://github.com/WarleyGabriel/demo-webdriverio-cucumber)

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

### [WarleyGabriel/demo-webdriverio-mocha](https://github.com/WarleyGabriel/demo-webdriverio-mocha)

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

### [SimitTomar/webdriverio-cucumber-pom-boilerplate](https://github.com/SimitTomar/webdriverio-cucumber-pom-boilerplate)

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

### [tamil777selvan/wdioV6-Perfecto-Boilerplate](https://github.com/tamil777selvan/wdioV6-Perfecto-Boilerplate.git)

Boilerplate project to run WebdriverIO tests in Perfecto Cloud ([https://www.perfecto.io/]()) using Cucumber features, and the page objects pattern.

- Frameworks:
    - webdriverIO (v6)
    - cucumber (v6)

- Features:
    - Cloud integration with [Perfecto](https://www.perfecto.io/)
    - Supports Page Object Model
    - Contains sample Scenarios written in Declarative style of BDD

### [pako88/wdio-mocha-typescript](https://github.com/pako88/wdio-mocha-typescript)
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

### [Arjun-Ar91/WebdriverIO-V6-appium-cucumber-boilerplate](https://github.com/Arjun-Ar91/WebdriverIO-V6-appium-cucumber-boilerplate.git)

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

### [AdarshKumarGM/WebDriverIO-with-CucumberJS](https://github.com/AdarshKumarGM/WebDriverIO-with-CucumberJS)
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
   
### [Arjun-Ar91/WebdriverIO-V6-appium-mocha-boilerplate](https://github.com/Arjun-Ar91/WebdriverIO-V6-appium-mocha-boilerplate.git)

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
    - Integration with BrowserStack, Sauce Labs
    - Support of reading and writing from MS-Excel documents for easy test data management from external data sources with examples
    - Database support for any RDBMS (Oracle, MySql, TeraData, Vertica etc.), executing queries, fetching result sets, and so on. Includes examples of E2E testing.
    - Multiple reporting (Spec, Junit, Allure, JSON), plus local view of JUnit report(`.html`) format
    - Task manage through Grunt
    - Examples with demo app https://search.yahoo.com and http://www.phptravels.net, Chai assertion library (`expect`, `assert`, `should`)
    - Appium-specific `.config` file for playback on mobile device. For one-click Appium setup, refer to: [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX)


### [amiya-pattnaik/webdriverIO-with-jasmineBDD](https://github.com/amiya-pattnaik/webdriverIO-with-jasmineBDD)

- Framework: Jasmine (v3.x)
- Features:
    - [Page Object](PageObjects.md)s Model used with ES6 style class-based approach, and full ES6–ES8 support through Babel
    - Task manage through Grunt
    - Multiple reporting (Spec, Junit, Allure), plus local view of JUnit report (`.html`) format
    - Jasmine Spec examples with assert module and Jasmine-specific assertions using demo app http://www.phptravels.net
    - Examples of headless browser execution using Chrome and Firefox and Integration with BrowserStack and Sauce Labs
    - Examples of reading and writing from MS-Excel documents for easy test data management from external data sources
    - Examples of DB connect to any RDBMS (Oracle, MySql, TeraData, Vertica etc.), query execution, and fetching result sets


### [amiya-pattnaik/webdriverIO-with-mochaBDD](https://github.com/amiya-pattnaik/webdriverIO-with-mochaBDD)

- Framework: Mocha (v5.x)
- Features:
    - [Page Object](PageObjects.md)s Model used with ES6 style class-based approach, and full ES6–ES8 support through Babel
    - Task management through Grunt
    - Multiple reporting (Spec, Junit, Allure), plus local view of Junit report (`.html`) format
    - Mocha Spec examples with `assert` module and Mocha-specific assertions using demo app http://www.phptravels.net
    - Examples of headless browser execution using Chrome and Firefox and Integration with BrowserStack & Sauce Labs
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

### [Schveitzer/webdriverio-appium-cucumber-boilerplate](https://github.com/Schveitzer/webdriverio-appium-cucumber-boilerplate)

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

### [saucelabs-sample-test-frameworks/JS-Mocha-WebdriverIO-Selenium](https://github.com/saucelabs-sample-test-frameworks/JS-Mocha-WebdriverIO-Selenium)

Simple boilerplate project that runs multiple browsers on [Sauce Labs](https://saucelabs.com) in parallel.

- Framework: Mocha
- Features:
    - [Page Object](PageObjects.md) usage
    - Integration with [Sauce Labs](https://saucelabs.com)

### [migalons/angular-wdio-builder-demo](https://github.com/migalons/angular-wdio-builder-demo)
Build your angular e2e test with wdio. This project uses a new angular cli builder for replacing protractor with wdio.

- Frameworks:
  - Webdriverio (v5)
  - Angular (v9)
- Features:
  - Replaces protractor with wdio as e2e runner
  - Completely integrated into angular workspace (angular.json)
  - Allows execution through angular cli (`ng e2e ...`). This allows to build, serve and run wdio test synchronously.
