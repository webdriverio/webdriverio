---
id: setuptypes
title: Tipos de configuración
---

WebdriverIO puede ser utilizado para varios propósitos. Implementa la API del protocolo WebDriver y puede ejecutar un navegador de forma automática. El framework está diseñado para trabajar en cualquier entorno arbitrario y para cualquier tipo de tarea. Es independiente de cualquier marco de trabajo de terceros y solo requiere Node.js para ejecutarse.

## Enlaces de protocolo

Para interacciones básicas con el WebDriver y otros protocolos de automatización, WebdriverIO utiliza sus propios enlaces de protocolo basados en el [`webdriver`](https://www.npmjs.com/package/webdriver) paquete NPM:

<Tabs
  defaultValue="webdriver"
  values={[
    {label: 'WebDriver', value: 'webdriver'},
 {label: 'Chrome DevTools', value: 'devtools'},
 ]
}>
<TabItem value="webdriver">

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/webdriver.js#L5-L20
```

</TabItem>
<TabItem value="devtools">

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/devtools.js#L2-L17
```

</TabItem>
</Tabs>

Todos los comandos de protocolo [](api/webdriver) devuelven la respuesta cruda del controlador de automatización. El paquete es muy ligero y no hay __ninguna__ lógica inteligente como auto-espera para simplificar la interacción con el uso del protocolo.

Los comandos de protocolo aplicados a la instancia dependen de la respuesta inicial de sesión del controlador. Por ejemplo, si la respuesta indica que una sesión móvil fue iniciada, el paquete aplica todos los comandos de protocolo Appium y Mobile JSON Wire al prototipo de la instancia.

Puede ejecutar el mismo conjunto de comandos (excepto los móviles) utilizando el protocolo de Chrome DevTools al importar el paquete [`devtools`](https://www.npmjs.com/package/devtools) NPM. Tiene la misma interfaz que el paquete `webdriver` pero ejecuta su automatización basado en [Puppeteer](https://pptr.dev/).

Para obtener más información sobre estas interfaces de paquete, consulte [Modules API](/docs/api/modules).

## Modo independiente

Para simplificar la interacción con el protocolo WebDriver el paquete `webdriverio` implementa una variedad de comandos además del protocolo (e.g. el comando [`dragAndDrop`](api/element/dragAndDrop) y conceptos básicos como [selectores inteligentes](selectors) o [auto-espera](autowait). El ejemplo de arriba puede ser simplificado de la siguiente forma:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/standalone.js#L2-L19
```

El uso de WebdriverIO en modo independiente todavía le da acceso a todos los comandos de protocolo, pero proporciona un súper conjunto de comandos adicionales que proporcionan una interacción de mayor nivel con el navegador. Le permite integrar esta herramienta de automatización en su propio proyecto (prueba) para crear una nueva biblioteca de automatización. Ejemplos populares incluyen [Espectron](https://www.electronjs.org/spectron) o [CodeceptJS](http://codecept.io). También puede escribir scripts simples de Node para eliminar la web por contenido (o cualquier otra cosa que requiera un navegador en ejecución).

If no specific options are set WebdriverIO will always attempt to download at setup the browser driver that matches `browserName` property in your capabilities. In case of Chrome it might also install [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) depending on whether it can find a browser on the machine.

Para obtener más información sobre estas interfaces de paquete, consulte [Modules API](/docs/api/modules).

## El Testrunner WDIO

El objetivo principal de WebdriverIO, sin embargo, es la prueba de extremo a extremo a gran escala. Por lo tanto, implementamos un corredor de pruebas que le ayude a construir una suite de pruebas fiable que sea fácil de leer y mantener.

El corredor de pruebas se encarga de muchos problemas que son comunes cuando trabaja con bibliotecas de automatización simple. Por un lado, organiza la ejecución de la prueba y divide las especificaciones de la prueba para que las pruebas se puedan ejecutar con la máxima concurrencia. También maneja la gestión de sesiones y proporciona un montón de características para ayudarle a depurar problemas y encontrar errores en sus pruebas.

Este es el mismo ejemplo de arriba, escrito como una especificación de prueba y ejecutado por WDIO:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/testrunner.js
```

El corredor de pruebas es una abstracción de marcos de prueba populares como Mocha, Jasmine, o Cucumber. Para ejecutar tus pruebas usando el corredor de pruebas WDIO, revisa la sección [Iniciando](gettingstarted) para más información.

Para obtener más información sobre estas interfaces de paquete, consulte [Modules API](/docs/api/modules).
