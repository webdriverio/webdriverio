---
id: retry
title: Reintentar pruebas Flaky
---

importar pestañas desde '@theme/Tabs'; importar TabItem desde '@theme/TabItem';

Puede volver a ejecutar ciertas pruebas con el testrunner WebdriverIO que resultan ser inestables debido a cosas como una red defectuosa o condiciones de carrera. (Sin embargo, no se recomienda simplemente aumentar la tasa de reejecución si las pruebas se vuelven inestables!)

## Volver a ejecutar suites en Mocha

Desde la versión 3 de Mocha, puedes volver a ejecutar suites de prueba completas (todo dentro de un bloque `describir`). Si usa Mocha, debe favorecer este mecanismo de reintento en lugar de la implementación de WebdriverIO que solo le permite volver a ejecutar ciertos bloques de prueba (todo dentro de un bloque `it`). Para utilizar el `esto. metodo etries()`, el bloque suite `describe` debe usar una función unbound `function(){}` en lugar de una función flecha gorda `() => {}`, según se describe en [Mocha docs](https://mochajs.org/#arrow-functions). Utilizando Mocha también puede establecer un recuento de reintentos para todas las especificaciones usando `mochaOpts.retries` en su `wdio.conf.js`.

Aquí hay un ejemplo:

```js
describe('retries', function () {
    // Retry all tests in this suite up to 4 times
    this.retries(4)

    beforeEach(async () => {
        await browser.url('http://www.yahoo.com')
    })

    it('should succeed on the 3rd try', async function () {
        // Specify this test to only retry up to 2 times
        this.retries(2)
        console.log('run')
        await expect($('.foo')).toBeDisplayed()
    })
})
```

## Reiniciar pruebas individuales en Jasmine o Mocha

Para volver a ejecutar un determinado bloque de prueba sólo puedes aplicar el número de reinicios como último parámetro después de la función de bloque de prueba:

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 ]
}>
<TabItem value="mocha">

```js
describe('my flaky app', () => {
    /**
     * spec that runs max 4 times (1 actual run + 3 reruns)
     */
    it('should rerun a test at least 3 times', async function () {
        console.log(this.wdioRetries) // returns number of retries
        // ...
    }, 3)
})
```

The same works for hooks too:

```js
describe('my flaky app', () => {
    /**
     * hook that runs max 2 times (1 actual run + 1 rerun)
     */
    beforeEach(async () => {
        // ...
    }, 1)

    // ...
})
```

</TabItem>
<TabItem value="jasmine">

```js
describe('my flaky app', () => {
    /**
     * spec that runs max 4 times (1 actual run + 3 reruns)
     */
    it('should rerun a test at least 3 times', async function () {
        console.log(this.wdioRetries) // returns number of retries
        // ...
    }, jasmine.DEFAULT_TIMEOUT_INTERVAL, 3)
})
```

The same works for hooks too:

```js
describe('my flaky app', () => {
    /**
     * hook that runs max 2 times (1 actual run + 1 rerun)
     */
    beforeEach(async () => {
        // ...
    }, jasmine.DEFAULT_TIMEOUT_INTERVAL, 1)

    // ...
})
```

Si está usando Jasmine, el segundo parámetro está reservado para el tiempo de espera. Para aplicar un parámetro de reintento, necesita establecer el tiempo de espera a su valor predeterminado `jasmine.DEFAULT_TIMEOUT_INTERVAL` y luego aplicar su contador de reintento.

</TabItem>
</Tabs>

Este mecanismo de reintento sólo permite reintentar ganchos individuales o bloques de prueba. Si su prueba va acompañada de un gancho para configurar su aplicación, este gancho no se está ejecutando. [Mocha ofrece](https://mochajs.org/#retry-tests) reintentos de prueba nativos que proporcionan este comportamiento mientras Jazmín no lo hace. Puede acceder al número de reintentos ejecutados en el gancho `afterTest`.

## Volver a utilizar Cucumber

### Vuelva a ejecutar suites completas en Cucumber

Para Cucumber >=6 puede proporcionar la opción [`reintentar`](https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md#retry-failing-tests) configuración junto con un parámetro opcional `retryTagFilter` para que todos o algunos de sus escenarios fallidos obtengan reintentos adicionales hasta que tengan éxito. Para que esta función funcione es necesario establecer el `escenarioLevelReporter` en `verdadero`.

### Ejecutar definiciones de paso en Cucumber

Para definir una tasa de repetición para ciertas definiciones de pasos simplemente aplique una opción de reintento, como:

```js
module.exports = function () {
    /**
     * step definition that runs max 3 times (1 actual run + 2 reruns)
     */
    this.Given(/^some step definition$/, { wrapperOptions: { retry: 2 } }, async () => {
        // ...
    })
    // ...
})
```

Las ejecuciones sólo se pueden definir en el archivo de definiciones de pasos, nunca en el archivo de características.

## Añadir reintentos sobre una base por especímenes

Anteriormente, sólo se disponían de reintentos de prueba y de nivel suite, que en la mayoría de los casos son correctos.

Pero en cualquier prueba que involucre estado (como en un servidor o en una base de datos) el estado puede ser inválido después del primer fallo de prueba. Cualquier retención posterior puede no tener posibilidad de pasar, debido al estado no válido con el que comenzarían.

Se crea una nueva instancia de `navegador` para cada específico, lo que hace que este sea un lugar ideal para enganchar y configurar cualquier otro estado (servidor, bases de datos). Las reintentos en este nivel significan que todo el proceso de configuración será simplemente repetido, como si fuera para un nuevo specfile.

```js
module.exports = function () {
    /**
     * The number of times to retry the entire specfile when it fails as a whole
     */
    specFileRetries: 1,
    /**
     * Delay in seconds between the spec file retry attempts
     */
    specFileRetriesDelay: 0,
    /**
     * Retried specfiles are inserted at the beginning of the queue and retried immediately
     */
    specFileRetriesDeferred: false
}
```

## Ejecutar una prueba específica varias veces

Se trata de ayudar a evitar que se introduzcan pruebas falsas en una base de código. Añadiendo la opción de cli `--multi-run` ejecutará la(s) prueba(s) especificada(s) o suite(s) x número de veces. Al usar esta bandera cli la bandera `--spec` o `--suite` también debe ser especificada.

Cuando se añaden nuevas pruebas a una base de código, espáticamente a través de un proceso de CI/CD las pruebas podrían pasar y ser fusionadas pero se vuelven flakly más adelante. Este error podría provenir de una serie de asuntos como problemas de red, carga del servidor, tamaño de la base de datos, etc. Utilizando la bandera `--multi-run` en su proceso de CD/CD puede ayudar a capturar estas pruebas defectuosas antes de que se fusionen en una base de código principal.

Una estrategia a utilizar es ejecutar sus pruebas como de costumbre en su proceso de CI/CD, pero si está introduciendo una nueva prueba, puede ejecutar otro conjunto de pruebas con la nueva especificación especificada en `--spec` junto con `--multi -ejecutar` para que ejecute la nueva prueba x número de veces. Si la prueba falla cualquiera de esas veces, la prueba no se fusionará y tendrá que ser examinada por qué falló.

```sh
# This will run the example.e2e.js spec 5 times
npx wdio run ./wdio.conf.js --spec example.e2e.js --multi-run 5
```