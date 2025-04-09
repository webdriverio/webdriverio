---
id: automationProtocols
title: Протоколи автоматизації
---

З WebdriverIO ви можете обирати між кількома технологіями автоматизації для виконання E2E тестів локально або у хмарі. By default, WebdriverIO will attempt to start a local automation session using the [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) protocol.

## WebDriver Bidi Protocol

The [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) is an automation protocol to automate browsers using bi-directional communication. It's the successor of the [WebDriver](https://w3c.github.io/webdriver/) protocol and enables a lot more introspection capabilities for various testing use cases.

This protocol is currently under development and new primitives might be added in the future. All browser vendors have committed to implementing this web standard and a lot of [primitives](https://wpt.fyi/results/webdriver/tests/bidi?label=experimental&label=master&aligned) have already been landed in browsers.

## WebDriver протокол

> [WebDriver](https://w3c.github.io/webdriver/) — це інтерфейс дистанційного керування, який дозволяє переглядати та контролювати віддалений браузер. Протокол декларує не пов'язаний із мовою та платформою інтерфейс як спосіб для позапроцесних програм дистанційно керувати поведінкою браузерів.

Протокол WebDriver розроблено для автоматизації браузера, щоб симулювати поведінку користувача, тобто все, що може робити користувач, ви можете автоматизувати у браузері. Надається набір стандартних команд, які абстрагують типові взаємодії з програмою (наприклад, навігація, клацання, або зчитування стану елемента). Since it is a web standard, it is well supported across all major browser vendors and also is being used as an underlying protocol for mobile automation using [Appium](http://appium.io).

Щоб використовувати цей протокол автоматизації, вам потрібен проксі-сервер, який перекладає всі команди та виконує їх у цільовому середовищі (тобто у браузері чи мобільному додатку).

Для автоматизації браузера проксі-сервер зазвичай є драйвером браузера. Доступні драйвери для всіх браузерів:

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

Для будь-якого типу мобільної автоматизації вам потрібно буде встановити та налаштувати [Appium](http://appium.io). Це дозволить вам автоматизувати мобільні (iOS/Android) або навіть настільні (macOS/Windows) програми, використовуючи ту саму конфігурацію із WebdriverIO.

Існує також багато сервісів, які надають послуги із запуску автоматизований тест у хмарі. Замість того, щоб налаштовувати всі ці драйвери локально, ви можете просто комунікувати із цим сервісами (наприклад [Sauce Labs](https://saucelabs.com)) у хмарі та перевіряти бачити результати на їхній платформі. Комунікація між тестом і середовищем автоматизації виглядатиме так:

![Налаштування WebDriver](/img/webdriver.png)
