---
id: cloudservices
title: Servicios en la Nube
---

Utilizar servicios a la demanda como Sauce Labs, Browserstack, TestingBot, CrossBrowserTestin, LambdaTest o Perfecto con WebdriverIO es bastante simple. Todo lo que necesitas hacer es establecer el `usuario` y `clave` de tu servicio en tus opciones.

Opcionalmente, también puede parametrizar su prueba configurando capacidades específicas de la nube como `compilación`. Si sólo desea ejecutar servicios en la nube en Travis, puede utilizar la variable de entorno `CI` para verificar si está en Travis y modificar la configuración en consecuencia.

```js
// wdio.conf.js
export let config = {...}
if (process.env.CI) {
    config.user = process.env.SAUCE_USERNAME
    config.key = process.env.SAUCE_ACCESS_KEY
}
```

## Sauce Labs

Puede configurar sus pruebas para ejecutar remotamente en [Sauce Labs](https://saucelabs.com).

El único requisito es establecer la clave `usuario` y `` en su configuración (ya sea exportado por `wdio. onf.js` o pasado a `webdriverio.remote(...)`) al nombre de usuario y clave de acceso de Sauce Labs.

También puede pasar cualquier [opción opcional de configuración de prueba](https://docs.saucelabs.com/dev/test-configuration-options/) como clave / valor en las capacidades de cualquier navegador.

### Sauce Connect

Si desea ejecutar pruebas contra un servidor que no es accesible a Internet (como en `localhost`), entonces tienes que usar [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy).

Está fuera del alcance de WebdriverIO apoyar esto, por lo que tendrá que iniciarlo por sí mismo.

Si está utilizando el testrunner WDIO, descargue y configure la [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service) en su `wdio.conf.js`. Ayuda a que Sauce Connect esté funcionando y viene con características adicionales que integran mejor tus pruebas en el servicio de Sauce.

### Con Travis CI

Sin embargo, Travis CI, [tiene soporte](http://docs.travis-ci.com/user/sauce-connect/#Setting-up-Sauce-Connect) para iniciar Sauce Connect antes de cada prueba, así que seguir sus direcciones para que sea una opción.

Si lo hace, debe establecer la opción de configuración de prueba de `identificador de túnel` en las capacidades `del navegador`. Travis establece esto en la variable de entorno `TRAVIS_JOB_NUMBER` de forma predeterminada.

Además, si desea que Sauce Labs agrupe sus pruebas por número de compilación, puede establecer la compilación `` en `TRAVIS_BUILD_NUMBER`.

Finalmente, si establece `name`, esto cambia el nombre de esta prueba en Sauce Labs para esta compilación. Si está utilizando el testrunner WDIO combinado con el [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service), WebdriverIO automáticamente establece un nombre adecuado para la prueba.

Ejemplo `capacidades`:

```javascript
browserName: 'chrome',
version: '27.0',
platform: 'XP',
'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
name: 'integration',
build: process.env.TRAVIS_BUILD_NUMBER
```

### Tiempos de espera

Debido a que está ejecutando sus pruebas de forma remota, podría ser necesario aumentar algunos tiempos de espera.

Puede cambiar el tiempo de espera de [inactivo](https://docs.saucelabs.com/reference/test-configuration/#idle-test-timeout) pasando por `idle-timeout` como opción de configuración de prueba. Esto controla cuánto esperará Sauce entre comandos antes de cerrar la conexión.

## BrowserStack

WebdriverIO también tiene una integración de [Browserstack](https://www.browserstack.com) incorporada.

El único requisito es establecer el `user`y `key` en tu configuración (ya sea exportado por `wdio.conf.js` o pasado a `webdriverio.remote(...)`) con tu nombre de usuario de Sauce Labs y clave de acceso.

También puede pasar cualquier [capacidades compatibles](https://www.browserstack.com/automate/capabilities) opcional como clave/valor en las capacidades de cualquier navegador. Si establece `browserstack.debug` en `verdadero` grabará una captura de pantalla de la sesión, lo que podría ser útil.

### Pruebas locales

Si desea ejecutar pruebas contra un servidor que no es accesible a Internet (como en `localhost`), entonces necesita usar [Local Testing](https://www.browserstack.com/local-testing#command-line).

Está fuera del alcance de WebdriverIO para apoyar esto, por lo que usted debe empezar por sí mismo.

Si utiliza local, debe establecer `browserstack.local` a `verdadero` en sus capacidades.

Si está utilizando el testrunner WDIO, descargue y configure la [`@wdio/browserstack-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-browserstack-service) en su `wdio.conf.js`. Ayuda a que BrowserStack funcione, y viene con funciones adicionales que integran mejor sus pruebas al servicio BrowserStack.

### Con Travis CI

Si quiere añadir Testing Local en Travis, tiene que iniciarlo usted mismo.

El siguiente script lo descargará y comenzará en segundo plano. Debería ejecutarlo en Travis antes de comenzar las pruebas.

```sh
wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip
unzip BrowserStackLocal-linux-x64.zip
./BrowserStackLocal -v -onlyAutomate -forcelocal $BROWSERSTACK_ACCESS_KEY &
sleep 3
```

También, puede establecer la compilación `` al número de compilación de Travis.

Ejemplo `capacidades`:

```javascript
browserName: 'chrome',
project: 'myApp',
version: '44.0',
build: `myApp #${process.env.TRAVIS_BUILD_NUMBER}.${process.env.TRAVIS_JOB_NUMBER}`,
'browserstack.local': 'true',
'browserstack.debug': 'true'
```

## TestingBot

El único requisito es establecer la clave `usuario` y `` en su configuración (ya sea exportado por `wdio. onf.js` o pasado a `webdriverio.remote(...)`) al nombre de usuario y clave de acceso de Sauce Labs.

También puede pasar cualquier [capacidades compatibles](https://testingbot.com/support/other/test-options) opcional como clave/valor en las capacidades de cualquier navegador.

### Pruebas locales

Si desea ejecutar pruebas contra un servidor que no es accesible a Internet (como en `localhost`), entonces necesita usar [Local Testing](https://testingbot.com/support/other/tunnel). TestingBot proporciona un túnel basado en Java que le permite probar sitios web no accesibles desde Internet.

Su página de soporte del túnel contiene la información necesaria para ponerla en marcha y funcionar.

Si está utilizando el testrunner WDIO, descargue y configure la [`@wdio/testingbot-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-testingbot-service) en su `wdio.conf.js`. Ayudaa a que TestingBot funcione, y viene con funciones adicionales que integran mejor sus pruebas en el servicio TestingBot.

## CrossBrowserTesting

El único requisito es establecer la clave `usuario`y `` en su configuración (ya sea exportada por `wdio. seguida. s` o pasado a `webdriverio.remote(...)`) a su nombre de usuario y autentificación [CrossBrowserTesting](https://crossbrowsertesting.com/)

También puede pasar cualquier [capacidad compatible](https://help.crossbrowsertesting.com/selenium-testing/getting-started/crossbrowsertesting-automation-capabilities/) opcional como clave/valor en las capacidades de cualquier navegador.

### Pruebas locales

Si desea ejecutar pruebas contra un servidor que no es accesible a Internet (como en `localhost`), entonces necesita usar [Local Testing](https://help.crossbrowsertesting.com/local-connection/general/local-tunnel-overview/). CrossBrowserTesting proporciona un túnel que le permite probar sitios web que no son accesibles desde Internet.

Si está utilizando el testrunner WDIO, descargue y configure el [`@wdio/crossbrowsertesting-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-crossbrowsertesting-service) en su `wdio.conf.js`. Ayuda a ejecutar CrossBrowserTesting y viene con características adicionales que integran mejor sus pruebas en el servicio CrossBrowserTesting.

## Prueba de Lambda

La integración con [LambdaTest](https://www.lambdatest.com) también está incorporada.

El único requisito es establecer la clave `usuario` y `` en su configuración (ya sea exportada por `wdio. onf.js` o pasado a `webdriverio.remote(...)`) a su nombre de usuario y clave de acceso de su cuenta LambdaTest.

También puede pasar cualquier [capacidades soportadas](https://www.lambdatest.com/capabilities-generator/) opcional como clave/valor en las capacidades de cualquier navegador. Si establece `visual` a `verdadero` grabará una captura de pantalla de la sesión, lo que puede ser útil.

### Túnel para pruebas locales

Si desea ejecutar pruebas contra un servidor que no es accesible a Internet (como en `localhost`), entonces necesita usar [Local Testing](https://www.lambdatest.com/support/docs/testing-locally-hosted-pages/).

Está fuera del alcance de WebdriverIO para apoyar esto, por lo que usted debe empezar por sí mismo.

Si usa local, debería establecer `tunel` a `true` en sus capacidades.

Si está utilizando el testrunner WDIO, descargue y configure el [`wdio-lambdatest-service`](https://github.com/LambdaTest/wdio-lambdatest-service) en su `wdio.conf.js`. Ayuda a que LambdaTest funcione, y viene con funciones adicionales que integran mejor sus pruebas en el servicio LambdaTest.
### Con Travis CI

Si quieres añadir pruebas locales en Travis, tienes que iniciarlo tú mismo.

El siguiente script lo descargará y lo iniciará en segundo plano. Debería ejecutarlo en Travis antes de comenzar las pruebas.

```sh
wget http://downloads.lambdatest.com/tunnel/linux/64bit/LT_Linux.zip
unzip LT_Linux.zip
./LT -user $LT_USERNAME -key $LT_ACCESS_KEY -cui &
sleep 3
```

También, puede desear establecer la compilación `` al número de compilación de Travis.

Ejemplo `capacidades`:

```javascript
platform: 'Windows 10',
browserName: 'chrome',
version: '79.0',
build: `myApp #${process.env.TRAVIS_BUILD_NUMBER}.${process.env.TRAVIS_JOB_NUMBER}`,
'tunnel': 'true',
'visual': 'true'
```

## Perfecto

Cuando utilice wdio con [`Perfecto`](https://www.perfecto.io), deberá crear un token de seguridad para cada usuario y añadirlo en la estructura de capacidades (además de otras capacidades), como se indica a continuación:

```js
export const config = {
  capabilities: [{
    // ...
    securityToken: "your security token"
  }],
```

Además, necesita añadir la configuración de la nube, como sigue:

```js
  hostname: "your_cloud_name.perfectomobile.com",
  path: "/nexperience/perfectomobile/wd/hub",
  port: 443,
  protocol: "https",
```
