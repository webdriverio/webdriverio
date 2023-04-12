---
id: autowait
title: Auto-espera
---

Una de las razones más comunes para las pruebas defectuosas son las interacciones con elementos que no existen en su aplicación en el momento en que quiera interactuar con ella. Las aplicaciones web modernas son muy dinámicas, aparecen y desaparecen los elementos. Como humano esperamos inconscientemente por elementos, pero en un script automatizado no lo consideramos una acción. Hay dos formas de esperar en un elemento para aparecer.

## Implícito vs. explícito

El protocolo WebDriver ofrece [tiempos de espera implícitos](https://w3c.github.io/webdriver/#timeouts) que permiten especificar cuánto tiempo se supone que el controlador espera a que se muestre un elemento, Por defecto, este tiempo de espera se establece en `0` y por lo tanto hace que el controlador devuelva con un `no tal elemento` inmediatamente error si un elemento no se pudo encontrar en la página Aumentar este tiempo de espera usando la [`setTimeout`](/docs/api/browser/setTimeout) haría que el controlador esperara e incrementaría las posibilidades de que el elemento aparezca eventualmente.

:::note

Lea más sobre los tiempos de espera relacionados con WebDriver y framework en la guía [de tiempos de espera](/docs/timeouts)

:::

Un enfoque diferente es utilizar la espera explícita que está incluida en el framework WebdriverIO en comandos como [`waitForExist`](/docs/api/element/waitForExist). Con esta técnica, el framework sondea el elemento llamando a múltiples comandos [`findElements`](/docs/api/webdriver#findelements) hasta que se alcance el tiempo de espera.

## Esperas incorporadas

Ambos mecanismos de espera son incompatibles entre sí y pueden causar un mayor tiempo de espera. Como las esperas implícitas son un ajuste global se aplica a todos los elementos que a veces no es el comportamiento deseado. Por lo tanto, WebdriverIO provee un mecanismo de espera integrado que automáticamente espera en el elemento antes de interactuar con él.

:::información Recomendación

Recomendamos __no__ usar esperas implícitas en absoluto y tener acciones de espera del elemento WebdriverIO.

:::

El uso de esperas implícitas también es problemático en los casos en que esté interesado en esperar hasta que desaparezca un elemento. WebdriverIO uses polls for the element until it receives an error. Having an implicit wait option set unnecessarily delays the execution of the command and can cause long test durations.

You can set a default value for WebdriverIOs automatic explicit waiting by setting a [`waitforTimeout`](/docs/configuration#waitfortimeout) option in your configuration.

## Limitations

WebdriverIO can only wait for elements when they are implicitly defined. This is always the case when using the [`$`](/docs/api/browser/$) to fetch an element. It however is not supported when fetching a set of elements like this:

```js
const divs = await $$('div')
await divs[2].click() // can throw "Cannot read property 'click' of undefined"
```

It is an absolute legitimate action to fetch a set of elements and click on the nth element of that set. However WebdriverIO doesn't know how many elements you are expecting to show up. As [`$$`](/docs/api/browser/$$) returns an [array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of WebdriverIO elements you have to manually check if the return value contains enough items. We recommend using [`waitUntil`](/docs/api/browser/waitUntil) for this, e.g.:

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
