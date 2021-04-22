---
id: cloudservices
title: Añadir Servicio en la Nube
---

El uso de servicios como Sauce Labs, Browserstack o TestingBot con WebdriverIO es bastante sencillo. Todo lo que necesitas hacer es establecer las propiedades `user` y `key`, que el servicio de nube te provee, en tus opciones. Opcional también puede parametrizar su prueba configurando capacidades específicas para la nube como `build`. Si sólo quieres ejecutar los servicios en la nube en Travis, puedes usar la variable de entorno `CI` para comprobar si estás en Travis y modificar la configuración.

```js
// wdio.conf.js

var config = {...}
if (process.env.CI) {
    config.user = process.env.SAUCE_USERNAME;
    config.key = process.env.SAUCE_ACCESS_KEY;
}
exports.config = config
```

## [Sauce Labs](https://saucelabs.com/)

Es fácil configurar sus pruebas para funcionar remotamente en Sauce Labs.

El único requisito es establecer el `user`y `key` en tu configuración (ya sea exportado por `wdio.conf.js` o pasado a `webdriverio.remote(...)`) a tu nombre de usuario de Sauce Labs y clave de acceso.

También puede pasar cualquier [configuración opcional de prueba](https://docs.saucelabs.com/reference/test-configuration/#webdriver-api) como clave/valor en las capacidades de cualquier navegador.

### [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy)

Si quieres ejecutar pruebas contra un servidor que no es accesible a Internet (como en `localhost`), entonces necesitas usar Sauce Connect.

Esta functionalidad está fuera del alcance de WebdriverIO, así que usted debe empezar por usted mismo.

Si está usando el testrunner WDIO, descarga y configura el [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sauce-service) en su `wdio.conf.js`. Ayuda a que Sauce Connect funcione y viene con características adicionales que integran mejor sus pruebas en el servicio de Sauce.

### Con Travis CI

Sin embargo, Travis CI [tiene soporte](http://docs.travis-ci.com/user/sauce-connect/#Setting-up-Sauce-Connect) para iniciar Sauce Connect antes de cada prueba, así que siga sus direcciones para eso si está interesado.

Si lo haces, debes establecer la opción de configuración de prueba `tunnel-identifier` en las capacidades de cada navegador. Travis lo establece en la variable de entorno `TRAVIS_JOB_NUMBER` por defecto.

También si quieres tener el grupo de Sauce Labs de tus pruebas mediante número de compilación, puedes establecer el `build` a `TRAVIS_BUILD_NUMBER`.

Por último, si establece el `name`, esto cambia el nombre de esta prueba en Sauce Labs para esta construcción. Si está usando el testrunner WDIO combinado con el [`@wdio/sauce-service`](https://github. com/webdriverio/webdriverio/tree/master/packages/wdio-sauce-service) WebdriverIO automáticamente establece un nombre apropiado para la prueba.

Ejemplo `desiredCapabilities`:

```javascript
browserName: 'chrome',
version: '27.0',
platform: 'XP',
'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
name: 'integration',
build: process.env.TRAVIS_BUILD_NUMBER
```

### Plazos

Puesto que está ejecutando sus pruebas remotamente, puede ser necesario aumentar algunos plazos.

Puede cambiar el tiempo de espera de [inactivo](https://docs.saucelabs.com/reference/test-configuration/#idle-test-timeout) pasando por `idle-timeout` como opción de configuración de prueba. Esto controla cuánto tiempo esperará Sauce entre comandos antes de cerrar la conexión.

## [BrowserStack](https://www.browserstack.com/)

Browserstack también es compatible con facilidad.

El único requisito es establecer el `user`y `key` en tu configuración (ya sea exportado por `wdio.conf.js` o pasado a `webdriverio.remote(...)`) con tu nombre de usuario de Sauce Labs y clave de acceso.

También puede pasar cualquier [configuración opcional de prueba](https://www.browserstack.com/automate/capabilities) como clave/valor en las capacidades de cualquier navegador. Si establece `browserstack.debug` a `true`, grabará la ejecución de la sesión, lo que podría ser útil.

### [Pruebas locales](https://www.browserstack.com/local-testing#command-line)

Si quieres ejecutar pruebas contra un servidor que no es accesible a Internet (como en `localhost`), entonces necesitas usar Testing Local.

Esta functionalidad está fuera del alcance de WebdriverIO, así que usted debe iniciarlo manualmente.

Si usas local, deberías establecer `browserstack.local` a `true` en tus capacidades.

Si está usando el testrunner WDIO, descarga y configura el [`@wdio/sauce-service`](https://github.com/itszero/wdio-browserstack-service) en su archivo `wdio.conf.js`. Ayuda a que BrowserStack se ejecute y viene con características adicionales para integrar sus pruebas de una mejor forma al servicio de BrowserStack.

### Con Travis CI

Si quieres añadir Pruebas Locales en Travis, tienes que iniciarlo por tu cuenta.

El siguiente script lo descargará y lo iniciará en segundo plano. Debes ejecutar esto en Travis antes de iniciar las pruebas.

```bash
wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip
unzip BrowserStackLocal-linux-x64.zip
./BrowserStackLocal -v -onlyAutomate -forcelocal $BROWSERSTACK_ACCESS_KEY &
sleep 3
```

También, puedes definir el número de `build` para usarlo en Travis.

Ejemplo `desiredCapabilities`:

```javascript
browserName: 'chrome',
project: 'myApp',
version: '44.0',
build: 'myApp #' + process.env.TRAVIS_BUILD_NUMBER + '.' + process.env.TRAVIS_JOB_NUMBER,
'browserstack.local': 'true',
'browserstack.debug': 'true'
```

## [TestingBot](https://testingbot.com/)

El único requisito es establecer el usuario `` y ` clave` en tu configuración (ya sea exportado por `wdio.conf.js` o pasado a `webdriverio.remote(...)`) a tu nombre de usuario y clave secreta de TestingBot.

También puede pasar cualquier [capacidad soportada](https://testingbot.com/support/other/test-options) como clave/valor en las capacidades de cualquier navegador.

### [Pruebas locales](https://testingbot.com/support/other/tunnel)

Si quieres ejecutar pruebas contra un servidor que no es accesible mediante Internet (como en `localhost`), entonces necesitas usar Testing Local. TestingBot proporciona un túnel basado en JAVA para permitirle probar sitios web no accesibles desde Internet.

Su página de soporte de túneles contiene la información necesaria para configurar esto.

Si está usando el testrunner WDIO descargue y configure el [`@wdio/testingbot-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-testingbot-service) en su archivo `wdio.conf.js`. Ayuda a ejecutar TestingBot y viene con características adicionales que integran mejor sus pruebas en el servicio TestingBot.