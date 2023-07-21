---
id: timeouts
title: Tiempos de espera
---

Cada comando en WebdriverIO es una operación asíncrona. Se lanza una solicitud al servidor de Selenium (o un servicio en la nube como [Sauce Labs](https://saucelabs.com)), y su respuesta contiene el resultado una vez que la acción ha finalizado o fallado.

Por lo tanto, el tiempo es un componente crucial en todo el proceso de prueba. Cuando una acción determinada depende del estado de una acción diferente, es necesario asegurarse de que se ejecutan en el orden correcto. Los tiempos de espera desempeñan un papel importante a la hora de abordar estas cuestiones.

## Tiempos de espera de Selenium

### Tiempo de espera de actividad de sesión

Una sesión tiene un tiempo de espera de secuencia de comandos asociado que especifica un tiempo para esperar a que se ejecuten scripts asíncronos. A menos que se indique lo contrario, es de 30 segundos. Puede establecer este tiempo de espera así:

```js
await browser.setTimeout({ 'script': 60000 })
await browser.executeAsync((done) => {
    console.log('this should not fail')
    setTimeout(done, 59000)
})
```

### Tiempo de espera de carga de página de sesión

Una sesión tiene un tiempo de espera de secuencia de comandos asociado que especifica un tiempo para esperar a que se ejecuten scripts asíncronos. A menos que se indique lo contrario, es de 300,000 segundos.

Puede establecer este tiempo de espera así:

```js
await browser.setTimeout({ 'pageLoad': 10000 })
```

> La palabra clave `pageLoad` es parte de la especificación oficial de WebDriver [](https://www.w3.org/TR/webdriver/#set-timeouts), pero podría no ser [soportado](https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/687) para su navegador (el nombre anterior es `carga de página`).

### Tiempo de espera de sesión implícita

Una sesión tiene una sesión asociada de espera implícita. Esto especifica el tiempo para esperar a la estrategia de ubicación implícita del elemento al localizar elementos usando los comandos [`findElement`](/docs/api/webdriver#findelement) o [`findElements`](/docs/api/webdriver#findelements) ([`$`](/docs/api/browser/$) o [`$$`](/docs/api/browser/$$), respectivamente, al ejecutar WebdriverIO con o sin el testrunner WDIO). A menos que se indique lo contrario, es de 0 segundos.

Puede establecer este tiempo de espera así:

```js
await browser.setTimeout({ 'implicit': 5000 })
```

## Tiempo de espera relacionado con WebdriverIO

### `Espera*` tiempo de espera

WebdriverIO proporciona múltiples comandos para esperar en elementos para alcanzar un cierto estado (por ejemplo, habilitado, visible, existente). Estos comandos toman un argumento de selector y un número de tiempo de espera, que determina cuánto debe esperar la instancia a que ese elemento llegue al estado. La opción `waitforTimeout` le permite establecer el tiempo de espera global para todos los comandos `waitFor*`, así que no necesita establecer el mismo tiempo de espera una y otra vez. _(Observe la minúscula `f`!)_

```js
// wdio.conf.js
export const config = {
    // ...
    waitforTimeout: 5000,
    // ...
}
```

En sus pruebas, ahora puede hacer esto:

```js
const myElem = await $('#myElem')
await myElem.waitForDisplayed()

// you can also overwrite the default timeout if needed
await myElem.waitForDisplayed({ timeout: 10000 })
```

## Tiempo de espera del framework

El framework de pruebas que está utilizando con WebdriverIO tiene que hacer frente a los tiempos de espera, especialmente porque todo es asíncrono. Esto asegura que el proceso de prueba no se atasca si algo sale mal.

Por defecto, el tiempo de espera es de 10 segundos, lo que significa que una sola prueba no debe demorar más de eso.

Una única prueba en Mocha se ve como:

```js
it('should login into the application', () => {
    await browser.url('/login')

    const form = await $('form')
    const username = await $('#username')
    const password = await $('#password')

    await username.setValue('userXY')
    await password.setValue('******')
    await form.submit()

    expect(await browser.getTitle()).to.be.equal('Admin Area')
})
```

En Cucumber, el tiempo de espera se aplica a una definición de un solo paso. Sin embargo, si desea aumentar el tiempo de espera porque su prueba toma más tiempo que el valor predeterminado, necesita configurarlo en las opciones del framework.

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 {label: 'Cucumber', value: 'cucumber'}
 ]
}>
<TabItem value="mocha">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'mocha',
    mochaOpts: {
        timeout: 20000
    },
    // ...
}
```

</TabItem>
<TabItem value="jasmine">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'jasmine',
    jasmineOpts: {
        defaultTimeoutInterval: 20000
    },
    // ...
}
```

</TabItem>
<TabItem value="cucumber">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'cucumber',
    cucumberOpts: {
        timeout: 20000
    },
    // ...
}
```

</TabItem>
</Tabs>
