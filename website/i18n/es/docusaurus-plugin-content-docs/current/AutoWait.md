---
id: autowait
title: Auto-espera
---

Una de las razones más comunes para las pruebas defectuosas son las interacciones con elementos que no existen en su aplicación en el momento en que quiera interactuar con ella. Las aplicaciones web modernas son muy dinámicas, aparecen y desaparecen los elementos. Como humano esperamos inconscientemente por elementos, pero en un script automatizado no lo consideramos una acción. Hay dos formas de esperar en un elemento para aparecer.

## Implícito vs. explícito

El protocolo WebDriver ofrece [tiempos de espera implícitos](https://w3c.github.io/webdriver/#timeouts) que permiten especificar cuánto tiempo se supone que el controlador espera a que se muestre un elemento, Por defecto, este tiempo de espera se establece en `0` y por lo tanto hace que el controlador devuelva con un `no tal elemento` inmediatamente error si un elemento no se pudo encontrar en la página Aumentar este tiempo de espera usando la [`setTimeout`](/docs/api/browser/setTimeout) haría que el controlador esperara e incrementaría las posibilidades de que el elemento aparezca eventualmente. Por defecto, este tiempo de espera se establece en `0` y por lo tanto hace que el controlador devuelva con un `no tal elemento` inmediatamente error si un elemento no se pudo encontrar en la página Aumentar este tiempo de espera usando la [`setTimeout`](/docs/api/browser/setTimeout) haría que el controlador esperara e incrementaría las posibilidades de que el elemento aparezca eventualmente.

:::note

Lea más sobre los tiempos de espera relacionados con WebDriver y framework en la guía [de tiempos de espera](/docs/timeouts)

:::

Un enfoque diferente es utilizar la espera explícita que está incluida en el framework WebdriverIO en comandos como [`waitForExist`](/docs/api/element/waitForExist). Con esta técnica, el framework sondea el elemento llamando a múltiples comandos [`findElements`](/docs/api/webdriver#findelements) hasta que se alcance el tiempo de espera.

## Esperas incorporadas

Ambos mecanismos de espera son incompatibles entre sí y pueden causar un mayor tiempo de espera. Como las esperas implícitas son un ajuste global se aplica a todos los elementos que a veces no es el comportamiento deseado. Por lo tanto, WebdriverIO provee un mecanismo de espera integrado que automáticamente espera en el elemento antes de interactuar con él.

:::información Recomendación

Recomendamos __no__ usar esperas implícitas en absoluto y tener acciones de espera del elemento WebdriverIO.

:::

El uso de esperas implícitas también es problemático en los casos en que esté interesado en esperar hasta que desaparezca un elemento. WebdriverIO utiliza encuestas para el elemento hasta que reciba un error. Tener una opción de espera implícita establece innecesariamente retrasa la ejecución del comando y puede causar largas duraciones de la prueba.

Puede establecer un valor predeterminado para espera automática de WebdriverIOs estableciendo una opción [`waitforTimeout`](/docs/configuration#waitfortimeout) en su configuración.

## Limitaciones

WebdriverIO sólo puede esperar elementos cuando se definen implícitamente. Este es siempre el caso cuando se utiliza la [`$`](/docs/api/browser/$) para obtener un elemento. Sin embargo, no está soportado cuando se obtiene un conjunto de elementos como este:

```js
const divs = await $$('div')
await divs[2].click() // can throw "Cannot read property 'click' of undefined"
```

Es una acción absolutamente legítima buscar un conjunto de elementos y hacer clic en el elemento nº. de ese conjunto. Sin embargo, WebdriverIO no sabe cuántos elementos usted espera que aparezcan. Como [`$$`](/docs/api/browser/$$) devuelve un [array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) de elementos WebdriverIO que tiene que comprobar manualmente si el valor de retorno contiene suficientes artículos. Recomendamos usar [`esperar hasta`](/docs/api/browser/waitUntil) para esto, por ejemplo:

```js
const div = await browser.waitUntil(async () => {
    const elems = await $$('div')
    if (elems.length !== 2) {
        return false
    }

    return elems[2]
}, {
    timeoutMsg: 'Never found enough div elements'
})
await div.click()
```
