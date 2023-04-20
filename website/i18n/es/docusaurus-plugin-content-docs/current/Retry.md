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

### Rerun full suites in Cucumber

For cucumber >=6 you can provide the [`retry`](https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md#retry-failing-tests) configuration option along with a `retryTagFilter` optional parameter to have all or some of your failing scenarios get additional retries until succeeded. For this feature to work you need to set the `scenarioLevelReporter` to `true`.

### Rerun Step Definitions in Cucumber

To define a rerun rate for a certain step definitions just apply a retry option to it, like:

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

Reruns can only be defined in your step definitions file, never in your feature file.

## Add retries on a per-specfile basis

Previously, only test- and suite-level retries were available, which are fine in most cases.

But in any tests which involve state (such as on a server or in a database) the state may be left invalid after the first test failure. Any subsequent retries may have no chance of passing, due to the invalid state they would start with.

A new `browser` instance is created for each specfile, which makes this an ideal place to hook and setup any other states (server, databases). Retries on this level mean that the whole setup process will simply be repeated, just as if it were for a new specfile.

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

## Run a specific test multiple times

This is to help prevent flaky tests from being introduced in a codebase. By adding the `--multi-run` cli option it will run the specified test(s) or suite(s) x number of times. When using this cli flag the `--spec` or `--suite` flag must also be specified.

When adding new tests to a codebase, espically through a CI/CD process the tests could pass and get merged but become flakly later on. This flakiness could come from a number of things like network issues, server load, database size, etc. Using the `--multi-run` flag in your CD/CD process can help catch these flaky tests before they get merged to a main codebase.

One strategy to use is run your tests like regular in your CI/CD process but if you're introducing a new test you can then run another set of tests with the new spec specifed in `--spec` along with `--multi-run` so it runs the new test x number of times. If the test fails any of those times then the test will not get merged and will need to be looked at why it failed.

```sh
# This will run the example.e2e.js spec 5 times
npx wdio run ./wdio.conf.js --spec example.e2e.js --multi-run 5
```