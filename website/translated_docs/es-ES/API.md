---
id: api
title: Documentos API
---

Bienvenido a la página de documentación para WebdriverIO. Estas páginas contienen materiales de referencia para todas las implementaciones de los comandos y enlaces de Selenium. WebdriverIO tiene todos los commandos del [protocolo de JSONWire](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) implementados y también soporta enlaces especiales para [Appium](http://appium.io).

> **Nota** Esta documentación es para la última version de WebdriverIO (v5.0.0). Si usted está utilizando v4 u otra version anterior, por favor diríjase a [v4.webdriverio.io](http://v4.webdriverio.io)!

## Ejemplos

Cada documentación de comandos generalmente viene con un ejemplo que demuestra cómo se utiliza ejecutando sus comandos de forma sincronizada a través del 'testrunner' de WebdriverIO. Si ejecuta WebdriverIO en modo independiente, todavía puede usar todos los comandos pero necesita asegurarse de manejar el orden de ejecución correctamente, encadenando los comandos y resolviendo la cadena de promesas. Así que en lugar de asignar el valor directamente a una variable, tal cómo el 'testrunner' wdio lo permite:

```js
it('puede manejar comandos de manera sincrónica', () => {
    var value = $('#input').getValue();
    console.log(value); // salidas: algún valor
});
```

necesita retornar la promesa del comando para que se resuelva correctamente y poder acceder al valor cuando la promesa se resuelva:

```js
it('maneja comandos como promesas', () => {
    return $('#input').getValue().then((value) => {
        console.log(value); // salidas: algún valor
    });
});
```

Por supuesto puede utilizar Node.JS última functionalidad de [async/await](https://github.com/yortus/asyncawait) para llevar una sintaxis sincrónica a sus pruebas:

```js
it('puede manejar comandos usando async/wait', async function () {
    var value = wait $('#input').getValue();
    console.log(value); // salidas: algún valor
});
```

Sin embargo, se recomienda usar el testrunner para escalar su suite de pruebas, ya que viene con muchos complementos útiles como el [Servicio de Sauce](_sauce-service.md) que te ayuda a evitar escribir un montón de código boilerplate por ti mismo.

## Contribuir

Si sientes que tienes un buen ejemplo de un comando, no dude en abrir un PR y presentarlo. Haga clic en el botón naranja en la parte superior derecha con la etiqueta *"Mejorar a este doc"*. Asegúrese de entender la forma en que escribimos estos documentos leyendo la sección [Contribuye](https://github.com/webdriverio/webdriverio/blob/master/CONTRIBUTING.md).