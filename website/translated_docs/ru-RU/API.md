---
id: api
title: Документация API
---
Добро пожаловать на страницу документации по WebdriverIO. Эта документация содержит справочные материалы для всех реализованных привязок (bindings) и команд для Selenium. WebdriverIO содержит все команды [JSONWire protocol](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol), а также поддерживает специальные [Appium](http://appium.io) привязки.

> **Примечание:** Эта документация для последней версии (v5.0.0) WebdriverIO. Если вы все еще используете v4 или более раннюю версию, пожалуйста, используйте сайт документации [v4.webdriver.io](http://v4.webdriver.io)!

## Примеры

Каждое описание команды обычно предоставляется вместе с примером использования, который демонстрируется синхронного WebdriverIO Testrunner. Если вы запускаете WebdriverIO в автономном режиме, вы все еще можете использовать все команды, но должны убедиться, что порядок выполнения обрабатывается должным образом, создавая цепочки команд (chaining) и завершая цепочки промисов (promise). Таким образом, вместо того, чтобы присвоить значение непосредственно переменной, как wdio testrunner позволяет:

```js
it('может обрабатывать команды синхронно', () => {
    var value = $('#input').getValue();
    console.log(value); // вывод: некоторое значение
});
```

вам нужно вернуть промис, чтобы он был решен, а также получить доступ к значению, когда промис получит решение:

```js
it('обрабатывает команды как промис', ()  =>{
    return $('#input').getValue().then((value) => {
        console.log(value); // вывод: некоторое значение
    });
});
```

Конечно можно использовать Node.JS [async/await](https://github.com/yortus/asyncawait) функциональность для приведения ваших тестов в вид:

```js
it('может обрабатывать команды используя async/await', async function () {
    var value = await $('#input').getValue();
    console.log(value); // вывод: некоторое значение
});
```

However it is recommended to use the testrunner to scale up your test suite as it comes with a lot of useful add ons like the [Sauce Service](_sauce-service.md) that helps you to avoid writing a lot of boilerplate code by yourself.

## Contribute

If you feel like you have a good example for a command, don't hesitate to open a PR and submit it. Just click on the orange button on the top right with the label *"Improve this doc"*. Make sure you understand the way we write these docs by checking the [Contribute](https://github.com/webdriverio/webdriverio/blob/master/CONTRIBUTING.md) section.