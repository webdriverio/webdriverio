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

Los comandos personalizados le dan la oportunidad de agrupar una secuencia específica de comandos que se utilizan frecuentemente en una única llamada de comando. Puede definir comandos personalizados en cualquier momento de su suite de pruebas, sólo asegúrese de que el comando se define antes de que lo use primero (el hook "before" en su wdio.conf.js podría ser un buen punto para crearlos). Una vez definida puedes usarlos de la siguiente manera:

```js
it('should use my custom command', () => {
    browser.url('http://www.github.com');
    const result = browser.getUrlAndTitle('foobar');

    assert.strictEqual(result.url, 'https://github.com/');
    assert.strictEqual(result.title, 'GitHub · Where software is built');
    assert.strictEqual(result.customVar, 'foobar');
});
```

Tenga cuidado de no sobrecargar el alcance del objeto `browser` con comandos personalizados. Se recomienda en cambio, definir una lógica personalizada en los objetos de página para que estén vinculados a una página específica.

## Integrar bibliotecas de terceros

Si utiliza bibliotecas externas (por ejemplo, para hacer llamadas de base de datos) que soportan promesas, un enfoque para integrarlas fácilmente es envolver ciertos métodos API dentro de un comando personalizado. Al devolver la promesa, WebdriverIO asegura que no se continúe con el siguiente comando hasta que la promesa se haya resuelto. Si la promesa es rechazada, el comando arrojará un error.

```js
import request from 'request';

browser.addCommand('makeRequest', (url) => {
    return request.get(url).then((response) => response.body)
});
```

Luego, úsalo en tus specs de prueba de wdio síncronamente:

```js
it('execute external library in a sync way', () => {
    browser.url('...');
    const body = browser.makeRequest('http://...');
    console.log(body); // returns response body
});
```

Tenga en cuenta que el resultado de su comando personalizado será el resultado de la promesa que usted retorna. Es importante mencionar que no hay soporte para comandos sincronicos cuando se usa Wdio en modo independiente, por lo tanto en esos casos siempre se deben manejar comandos asíncronos usando promesas.