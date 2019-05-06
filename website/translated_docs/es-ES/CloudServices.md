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

If you want to run tests against a server that is not accessible to the Internet (like on `localhost`), then you need to use Local Testing.

It is out of the scope of WebdriverIO to support this, so you must start it by yourself.

If you do use local, you should set `browserstack.local` to `true` in your capabilities.

If you are using the WDIO testrunner download and configure the [`wdio-browserstack-service`](https://github.com/itszero/wdio-browserstack-service) in your `wdio.conf.js`. It helps getting BrowserStack running and comes with additional features that better integrate your tests into the BrowserStack service.

### With Travis CI

If you want to add Local Testing in Travis you have to start it by yourself.

The following script will download and start it in the background. You should run this in Travis before starting the tests.

```bash
wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip
unzip BrowserStackLocal-linux-x64.zip
./BrowserStackLocal -v -onlyAutomate -forcelocal $BROWSERSTACK_ACCESS_KEY &
sleep 3
```

Also, you might wanna set the `build` to the Travis build number.

Example `desiredCapabilities`:

```javascript
browserName: 'chrome',
project: 'myApp',
version: '44.0',
build: 'myApp #' + process.env.TRAVIS_BUILD_NUMBER + '.' + process.env.TRAVIS_JOB_NUMBER,
'browserstack.local': 'true',
'browserstack.debug': 'true'
```

## [TestingBot](https://testingbot.com/)

The only requirement is to set the `user` and `key` in your config (either exported by `wdio.conf.js` or passed into `webdriverio.remote(...)`) to your TestingBot username and secret key.

You can also pass in any optional [supported capabilities](https://testingbot.com/support/other/test-options) as a key/value in the capabilities for any browser.

### [Local Testing](https://testingbot.com/support/other/tunnel)

If you want to run tests against a server that is not accessible to the Internet (like on `localhost`), then you need to use Local Testing. TestingBot provides a JAVA based tunnel to allow you to test websites not accessible from the internet.

Their tunnel support page contains the information necessary to get this up and running.

If you are using the WDIO testrunner download and configure the [`@wdio/testingbot-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-testingbot-service) in your `wdio.conf.js`. It helps getting TestingBot running and comes with additional features that better integrate your tests into the TestingBot service.