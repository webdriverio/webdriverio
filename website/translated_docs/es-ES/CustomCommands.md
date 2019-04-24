---
id: customcommands
title: Comandos Personalizados
---

Si quieres ampliar la instancia del navegador con tu propio conjunto de comandos, hay un método llamado `addCommand` disponible desde el objeto browser. Puede escribir su comando de una manera síncrona (por defecto) de la misma manera que en sus specs o de modo asíncrono (como cuando se usa WebdriverIO en modo independiente). El siguiente ejemplo muestra cómo agregar un nuevo comando que devuelva la url actual y el título como un resultado, usando sólo comandos síncronos:

```js
browser.addCommand("getUrlAndTitle", (customVar) => {
    return {
        url: this.getUrl(),
        title: this.getTitle(),
        customVar: customVar
    };
});
```

Custom commands give you the opportunity to bundle a specific sequence of commands that are used frequently in a handy single command call. You can define custom commands at any point in your test suite, just make sure that the command is defined before you first use it (the before hook in your wdio.conf.js might be a good point to create them). Once defined you can use them as follows:

```js
it('should use my custom command', () => {
    browser.url('http://www.github.com');
    const result = browser.getUrlAndTitle('foobar');

    assert.strictEqual(result.url, 'https://github.com/');
    assert.strictEqual(result.title, 'GitHub · Where software is built');
    assert.strictEqual(result.customVar, 'foobar');
});
```

Be careful to not overload the `browser` scope with custom commands. It is advised to rather define custom logic into page objects so they are bound to a specific page.

## Integrate 3rd party libraries

If you use external libraries (e.g. to do database calls) that support promises, a nice approach to easily integrate them is to wrap certain API methods within a custom command. When returning the promise, WebdriverIO ensures that it doesn't continue with the next command until the promise is resolved. If the promise gets rejected the command will throw an error.

```js
import request from 'request';

browser.addCommand('makeRequest', (url) => {
    return request.get(url).then((response) => response.body)
});
```

Then just use it in your wdio test specs synchronously:

```js
it('execute external library in a sync way', () => {
    browser.url('...');
    const body = browser.makeRequest('http://...');
    console.log(body); // returns response body
});
```

Note that the result of your custom command will be the result of the promise you return. Also there is no support for synchronous commands in standalone mode therefore you always have to handle asynchronous commands using promises.