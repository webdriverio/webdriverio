---
id: automationProtocols
title: Automation Protocols
---

С помощью WebdriverIO вы можете выбирать из нескольких технологий автоматизации при запуске своих E2E тестов локально или в облаке. By default, WebdriverIO will attempt to start a local automation session using the [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) protocol.

## WebDriver Bidi Protocol

The [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) is an automation protocol to automate browsers using bi-directional communication. It's the successor of the [WebDriver](https://w3c.github.io/webdriver/) protocol and enables a lot more introspection capabilities for various testing use cases.

This protocol is currently under development and new primitives might be added in the future. All browser vendors have committed to implementing this web standard and a lot of [primitives](https://wpt.fyi/results/webdriver/tests/bidi?label=experimental&label=master&aligned) have already been landed in browsers.

## Протокол WebDriver

> [WebDriver](https://w3c.github.io/webdriver/) - это интерфейс удаленного управления браузером, который позволяет получать информацию о нем и управлять его действиями через программный интерфейс. Он предоставляет независимый от платформы и языка протокол, позволяющий внешним программам удаленно управлять поведением веб-браузеров.

Протокол WebDriver был разработан для автоматизации браузера с точки зрения пользователя, что означает, что все, что пользователь может сделать в браузере, можно сделать и при помощи автоматизации. WebDriver предоставляет набор команд, которые абстрагируют общие взаимодействия с приложением (например, навигация, клики или чтение состояния элемента). Since it is a web standard, it is well supported across all major browser vendors and also is being used as an underlying protocol for mobile automation using [Appium](http://appium.io).

Чтобы использовать этот протокол автоматизации, нужен прокси-сервер, который переводит все команды и выполняет их в целевой среде (то есть в браузере или мобильном приложении).

Для автоматизации браузера прокси-сервером обычно является драйвер браузера. Драйвера доступны для всех браузеров:

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

Для любого вида мобильной автоматизации вам потребуется установить и настроить [Appium](http://appium.io). Это позволит вам автоматизировать мобильные (iOS/Android) или даже настольные (macOS/Windows) приложения, используя ту же настройку WebdriverIO.

Также существует множество сервисов, позволяющих запускать ваши тесты в облаке и у вас будет возможность быстрой масштабируемости. Вместо того чтобы устанавливать все эти драйверы локально, вы можете просто обратиться к этим службам (например [Sauce Labs](https://saucelabs.com)) в облаке и проверить результаты на их платформе. Общение между тестами и средой автоматизации будет выглядеть следующим образом:

![Настройка веб-драйвера](/img/webdriver.png)
