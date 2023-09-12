---
id: boilerplates
title: Boilerplate-Projekte
---

Im Laufe der Zeit hat unsere Community mehrere Projekte entwickelt, die Sie als Inspiration für die Einrichtung Ihrer eigenen Testsuite verwenden können.

# v8 Boilerplate-Projekte

## [webdriverio/cucumber-boilerplate](https://github.com/webdriverio/cucumber-boilerplate)

Unser ganz eigenes Boilerplate für Cucumber-Testsuiten. Wir haben über 150 vordefinierte Schrittdefinitionen für Sie erstellt, sodass Sie sofort mit dem Schreiben von Feature-Dateien in Ihrem Projekt beginnen können.

- Framework:
    - Cucumber (v8)
    - WebdriverIO (v8)
- Features:
    - Über 150 vordefinierte Schritte, die fast alles abdecken, was Sie brauchen
    - Integriert die Multiremote-Funktionalität von WebdriverIO
    - Eigene Demo-App

## [webdriverio/jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate)
Boilerplate-Projekt zum Ausführen von WebdriverIO-Tests mit Jasmine unter Verwendung von Babel-Funktionen und des Page Objektes.

- Frameworks
    - WebdriverIO (v8)
    - Jasmine (v4)
- Features
    - Seiten-Objekt-Muster
    - Sauce Labs-Integration

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

- Framework: WDIO-V8 mit Cucumber (V8x).
- Features:
    - Page Objects Model verwendet mit ES6/ES7-Style-Class-Basisansatz und TypeScript-Unterstützung
    - Beispiele für Mehrfachauswahloptionen zum Abfragen von Elementen mit mehr als einem Selektor gleichzeitig
    - Beispiele für die Ausführung mehrerer Browser und Headless-Browser mit - Chrome und Firefox
    - Cloud-Testing-Integration mit BrowserStack, Sauce Labs, LambdaTest
    - Beispiele für Lese-/Schreibdaten aus MS-Excel zur einfachen Testdatenverwaltung aus externen Datenquellen mit Beispielen
    - Datenbankunterstützung für jedes RDBMS (Oracle, MySql, TeraData, Vertica usw.), Ausführen beliebiger Abfragen / Abrufen von Ergebnismengen usw. mit Beispielen für E2E-Tests
    - Multiple Reporting (Spec, Xunit/Junit, Allure, JSON) und Hosting von Allure und Xunit/Junit Reporting auf WebServer.
    - Beispiele mit Demo-App https://search.yahoo.com/ und http://the-internet.herokuapp.com.
    - BrowserStack-, Sauce Labs-, LambdaTest- und Appium-spezifische `.config` Datei (für die Wiedergabe auf Mobilgeräten). Informationen zum Appium-Setup mit einem Klick auf einem lokalen Computer für iOS und Android finden Sie unter [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX).

## [amiya-pattnaik/webdriverIO-with-mochaBDD](https://github.com/amiya-pattnaik/webdriverIO-with-mochaBDD)

- Framework: WDIO-V8 mit Mocha (V10x).
- Features:
    -  Page Objects Model verwendet mit ES6/ES7-Style-Class-Basisansatz und TypeScript-Unterstützung
    -  Beispiele mit Demo-App https://search.yahoo.com/ und http://the-internet.herokuapp.com
    -  Beispiele für die Ausführung mehrerer Browser und Headless-Browser mit - Chrome und Firefox
    -  Cloud-Testing-Integration mit BrowserStack, Sauce Labs, LambdaTest
    -  Multiple Reporting (Spec, Xunit/Junit, Allure, JSON) und Hosting von Allure und Xunit/Junit Reporting auf WebServer.
    -  Beispiele für Lese-/Schreibdaten aus MS-Excel zur einfachen Testdatenverwaltung aus externen Datenquellen mit Beispielen
    -  Beispiele für DB-Verbindungen zu beliebigen RDBMS (Oracle, MySql, TeraData, Vertica usw.), jeder Abfrageausführung / Abrufen von Ergebnismengen usw. mit Beispielen für E2E-Tests
    -  BrowserStack-, Sauce Labs-, LambdaTest- und Appium-spezifische `.config` Datei (für die Wiedergabe auf Mobilgeräten). Informationen zum Appium-Setup mit einem Klick auf einem lokalen Computer für iOS und Android finden Sie unter [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX).

## [amiya-pattnaik/webdriverIO-with-jasmineBDD](https://github.com/amiya-pattnaik/webdriverIO-with-jasmineBDD)

- Framework: WDIO-V8 mit Jasmine (V4x).
- Features:
    -  Page Objects Model verwendet mit ES6/ES7-Style-Class-Basisansatz und TypeScript-Unterstützung
    -  Beispiele mit Demo-App https://search.yahoo.com/ und http://the-internet.herokuapp.com
    -  Beispiele für die Ausführung mehrerer Browser und Headless-Browser mit - Chrome und Firefox
    -  Cloud-Testing-Integration mit BrowserStack, Sauce Labs, LambdaTest
    -  Multiple Reporting (Spec, Xunit/Junit, Allure, JSON) und Hosting von Allure und Xunit/Junit Reporting auf WebServer.
    -  Beispiele für Lese-/Schreibdaten aus MS-Excel zur einfachen Testdatenverwaltung aus externen Datenquellen mit Beispielen
    -  Beispiele für DB-Verbindungen zu beliebigen RDBMS (Oracle, MySql, TeraData, Vertica usw.), jeder Abfrageausführung / Abrufen von Ergebnismengen usw. mit Beispielen für E2E-Tests
    -  BrowserStack-, Sauce Labs-, LambdaTest- und Appium-spezifische `.config` Datei (für die Wiedergabe auf Mobilgeräten). Informationen zum Appium-Setup mit einem Klick auf einem lokalen Computer für iOS und Android finden Sie unter [appium-setup-made-easy-OSX](https://github.com/amiya-pattnaik/appium-setup-made-easy-OSX).

## [klassijs/klassi-js (cucumber-template)](https://github.com/klassijs/klassi-example-test-suite.git)

- Frameworks
    - WebdriverIO (v8)
    - Cucumber (v8)

- Features
    - Enthalten Beispieltestszenario in Cucumber
    - Integrated cucumber html reports with Embedded videos on failures
    - Integrated Lambdatest and CircleCI services
    - Integrated Visual, Accessibility and API testing
    - Integrated Email functionality
    - Integrated s3 bucket for test reports storage and retrieval

## [serenity-js/serenity-js-mocha-webdriverio-template/](https://github.com/serenity-js/serenity-js-mocha-webdriverio-template/)

[Serenity/JS](https://serenity-js.org?pk_campaign=wdio8&pk_source=webdriver.io) template project to help you get started with acceptance testing your web applications using the latest WebdriverIO, Mocha, and Serenity/JS.

- Frameworks
    - WebdriverIO (v8)
    - Mocha (v10)
    - Serenity/JS (v3)
    - Serenity BDD reporting

- Features
    - [Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io)
    - Automatic screenshots on test failure, embedded in reports
    - Continuous Integration (CI) setup using [GitHub Actions](https://github.com/serenity-js/serenity-js-mocha-webdriverio-template/blob/main/.github/workflows/main.yml)
    - [Demo Serenity BDD reports](https://serenity-js.github.io/serenity-js-mocha-webdriverio-template/) published to GitHub Pages
    - TypeScript
    - ESLint

## [serenity-js/serenity-js-cucumber-webdriverio-template/](https://github.com/serenity-js/serenity-js-cucumber-webdriverio-template/)

[Serenity/JS](https://serenity-js.org?pk_campaign=wdio8&pk_source=webdriver.io) template project to help you get started with acceptance testing your web applications using the latest WebdriverIO, Cucumber, and Serenity/JS.

- Frameworks
    - WebdriverIO (v8)
    - Cucumber (v9)
    - Serenity/JS (v3)
    - Serenity BDD reporting

- Features
    - [Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io)
    - Automatic screenshots on test failure, embedded in reports
    - Continuous Integration (CI) setup using [GitHub Actions](https://github.com/serenity-js/serenity-js-cucumber-webdriverio-template/blob/main/.github/workflows/main.yml)
    - [Demo Serenity BDD reports](https://serenity-js.github.io/serenity-js-mocha-webdriverio-template/) published to GitHub Pages
    - TypeScript
    - ESLint

## [Muralijc/wdio-headspin-boilerplate](https://github.com/Muralijc/Wdio-Headspin-boilerplate/)
Boilerplate project to run WebdriverIO tests in Headspin Cloud (https://www.headspin.io/) using Cucumber features, and the page objects pattern.
- Frameworks
    - WebdriverIO (v8)
    - Cucumber (v8)

- Features
    - Cloud integration with [Headspin](https://www.headspin.io/)
    - Supports Page Object Model
    - Contains sample Scenarios written in Declarative style of BDD
    - Integrated cucumber html reports

# v7 Boilerplate-Projekte

## [webdriverio/appium-boilerplate](https://github.com/webdriverio/appium-boilerplate/)

Boilerplate-Projekt zum Ausführen von Appium-Tests mit WebdriverIO für:

- Native Apps für iOS/Android
- iOS/Android-Hybrid-Apps
- Android Chrome und iOS Safari-Browser

Dieses Boilerplate beinhaltet folgendes:

- Framework: Mocha
- Features:
    - Konfigurationen für:
        - iOS und Android App
        - iOS und Android Browsers
    - Helfer für:
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

## [serhatbolsu/webdriverio-mocha-uiautomation-boiler](https://github.com/serhatbolsu/webdriverio-mocha-uiautomation-boiler)
ATDD WEB tests with Mocha, WebdriverIO v6 with PageObject

- Frameworks
  - WebdriverIO (v7)
  - Mocha
- Features
  - [Page Object](pageobjects) Model
  - Sauce Labs integration with [Sauce Service](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-sauce-service/README.md)
  - Allure Report
  - Automatic screenshots capture for failing tests
  - CircleCI example
  - ESLint

## [WarleyGabriel/demo-webdriverio-mocha](https://github.com/WarleyGabriel/demo-webdriverio-mocha)

Boilerplate Projekt um E2E Tests mit Mocha durchzuführen.

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

- Frameworks
    - WebdriverIO v7
    - Cucumber v7
    - Appium

- Features
    - Native Android and iOS apps
    - Android Chrome browser
    - iOS Safari browser
    - Page Object Model
    - Contains sample test scenarios in cucumber
    - Integrated with multiple cucumber html reports

## [praveendvd/webdriverIODockerBoilerplate/](https://github.com/praveendvd/webdriverIODockerBoilerplate)

This a template project to help you show how you can run webdriverio test from Web applications using the latest WebdriverIO, and Cucumber framework. This project intends to act as a baseline image that you can use to understand how to run WebdriverIO tests in docker

This project includes:

- DockerFile
- cucumber Project

Read more at: [Medium Blog](https://praveendavidmathew.medium.com/running-webdriverio-in-wsl2-windows-91d3a0dc7746)

## [praveendvd/WebdriverIO_electronAppAutomation_boilerplate/](https://github.com/praveendvd/WebdriverIO_electronAppAutomation_boilerplate)

This a template project to help you show how you can run electronJS tests using WebdriverIO. This project intends to act as a baseline image that you can use to understand how to run WebdriverIO electronJS tests.

This project include:

- Sample electronjs app
- Sample cucumber test scripts

Read more at: [Medium Blog](https://praveendavidmathew.medium.com/first-step-into-automation-of-electronjs-applications-ef89b7423ddd)

## [praveendvd/webdriverIO_winappdriver_boilerplate/](https://github.com/praveendvd/webdriverIO_winappdriver_boilerplate)

This a template project to help you show how you can run webdriverio multiremote capability with latest WebdriverIO, and Jasmine framework. This a template project to help you show how you can automate windows application using winappdriver and  WebdriverIO . This project intends to act as a baseline image that you can use to understand how to run windappdriver and WebdriverIO tests.

Read more at: [Medium Blog](https://praveendavidmathew.medium.com/winappdriver-first-step-into-windows-app-test-automation-using-webdriverio-and-winappdriver-46320d89570b)

## [praveendvd/appium-chromedriver-multiremote-wdio-boilerplate/](https://github.com/praveendvd/appium-chromedriver-multiremote-wdio-boilerplate)


This a template project to help you show how you can run webdriverio multiremote capability with latest WebdriverIO, and Jasmine framework. This a template project to help you show how you can automate windows application using winappdriver and  WebdriverIO . This project intends to act as a baseline image that you can use to understand how to run windappdriver and WebdriverIO tests.

This project uses:

     - chromedriver
     - jasmine
     - appium

## [webdriverio-roku-appium-boilerplate](https://github.com/AntonKostenko/webdriverIO-roku-appium)

Template project to run appium tests on real Roku devices using mocha with page object pattern.

- Frameworks
    - WebdriverIO Async v7
    - Appium 2.0
    - Mocha v7
    - Allure Reporting

- Features
    - Page Object Model
    - Typescript
    - Screenshot on failure
    - Example tests using a sample Roku channel

## [krishnapollu/wdio-cucumber-poc](https://github.com/krishnapollu/wdio-cucumber-poc)

PoC project for E2E Multiremote Cucumber tests as well as Data driven Mocha tests

- Framework:
    - Cucumber (v8)
    - WebdriverIO (v8)
    - Mocha (v8)

- Features:
    - Cucumber based E2E Tests
    - Mocha based Data Driven Tests
    - Web only Tests - in Local as well as cloud platforms
    - Mobile Only tests - local as well as remote cloud emulators (or devices)
    - Web + Mobile Tests - Multiremote - local as well as cloud platforms
    - Multiple Reports integrated including Allure
    - Test Data ( JSON / XLSX ) handled globally so as to write the data (created on the fly) to a file post test execution
    - Github workflow to run the test and upload the allure report


