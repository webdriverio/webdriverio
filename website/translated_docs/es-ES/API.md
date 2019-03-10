---
id: api
title: Documentos API
---
Bienvenido a la página de documentación para WebdriverIO. Estas páginas contienen materiales de referencia para todas las implementaciones de los comandos y enlaces de Selenium. WebdriverIO tiene todos los commandos del [protocolo de JSONWire](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) implementados y también soporta enlaces especiales para [Appium](http://appium.io).

> **Nota** Esta documentación es para la última version de WebdriverIO (v5.0.0). Si usted está utilizando v4 u otra version anterior, por favor diríjase a [v4.webdriverio.io](http://v4.webdriverio.io)!

## Ejemplos

Cada documentación de comandos generalmente viene con un ejemplo que demuestra cómo se utiliza ejecutando sus comandos de forma sincronizada a través del 'testrunner' de WebdriverIO. Si ejecuta WebdriverIO en modo independiente, todavía puede usar todos los comandos pero necesita asegurarse de manejar el orden de ejecución correctamente, encadenando los comandos y resolviendo la cadena de promesas. Así que en lugar de asignar el valor directamente a una variable, tal cómo el 'testrunner' wdio lo permite:

```js
it('can handle commands synchronously', () => {
    var value = $('#input').getValue();
    console.log(value); // outputs: some value
});
```

necesita retornar la promesa del comando para que se resuelva correctamente y poder acceder al valor cuando la promesa se resuelva:

```js
it('handles commands as promises', ()  =>{
    return $('#input').getValue().then((value) => {
        console.log(value); // outputs: some value
    });
});
```

Of course you can use Node.JS latest [async/await](https://github.com/yortus/asyncawait) functionality to bring synchronous syntax into your testflow like:

```js
it('can handle commands using async/await', async function () {
    var value = await $('#input').getValue();
    console.log(value); // outputs: some value
});
```

However it is recommended to use the testrunner to scale up your test suite as it comes with a lot of useful add ons like the [Sauce Service](_sauce-service.md) that helps you to avoid writing a lot of boilerplate code by yourself.

## Contribuir

If you feel like you have a good example for a command, don't hesitate to open a PR and submit it. Just click on the orange button on the top right with the label *"Improve this doc"*. Make sure you understand the way we write these docs by checking the [Contribute](https://github.com/webdriverio/webdriverio/blob/master/CONTRIBUTING.md) section.