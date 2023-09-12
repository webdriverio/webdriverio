---
id: async-migration
title: De Sync a Async
---

Debido a cambios en V8, el equipo de WebdriverIO [anunció](https://webdriver.io/blog/2021/07/28/sync-api-deprecation) desaprobar la ejecución de comandos sincrónicos para abril de 2023. El equipo ha estado trabajando para hacer la transición lo más fácil posible. En esta guía explicamos cómo puedes migrar lentamente tu suite de pruebas de sincronización a asíncrona. Como un proyecto de ejemplo utilizamos el [Cupino Boilerplate](https://github.com/webdriverio/cucumber-boilerplate), pero el enfoque es el mismo con todos los demás proyectos.

## Promesas en JavaScript

La razón por la que la ejecución sincrónica era popular en WebdriverIO es porque elimina la complejidad del tratamiento de las promesas. Particularmente si usted viene de otros idiomas donde este concepto no existe de esta manera, puede ser confuso al principio. Sin embargo, las promesas son una herramienta muy poderosa para tratar con código asíncrono y el JavaScript de hoy en día hace que sea realmente fácil abordarlo. Si nunca trabajó con Promises, Recomendamos revisar la [guía de referencia MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) a la misma, ya que estaría fuera de ámbito explicarla aquí.

## Transición de Async

El testrunner WebdriverIO puede manejar la ejecución asíncrona y sincronizada dentro de la misma suite de pruebas. Esto significa que usted puede migrar lentamente sus pruebas y PageObjects paso a paso. Por ejemplo, el Boilerplate de Cucumber ha definido [un gran conjunto de definición de paso](https://github.com/webdriverio/cucumber-boilerplate/tree/main/src/support/action) para que pueda copiar en su proyecto. Podemos seguir adelante y migrar una definición de paso o un archivo a la vez.

:::tip

WebdriverIO ofrece un [código de código](https://github.com/webdriverio/codemod) que permite transformar su código de sincronización en código asíncrono casi completo automáticamente. Ejecute primero el código tal y como se describe en la documentación y utilice esta guía para la migración manual si es necesario.

:::

En muchos casos todo lo que es necesario hacer es hacer que la función en la que se llama a los comandos WebdriverIO `async` y añadir un `await` en frente de cada comando. Mirando el primer archivo `clearInputField.ts` para transformar en el proyecto boilerplate nos transformamos de:

```ts
export default (selector: Selector) => {
    $(selector).clearValue();
};
```

para:

```ts
export default async (selector: Selector) => {
    await $(selector).clearValue();
};
```

Eso es todo. Puede ver el commit completo con todos los ejemplos de reescritura aquí:

#### Commits:

- _transpila definiciones de pasos_ [[af6625f]](https://github.com/webdriverio/cucumber-boilerplate/pull/481/commits/af6625fcd01dc087479e84562f237ecf38b3537d)

:::info
Esta transición es independiente de si utiliza TypeScript o no. Si usa TypeScript, asegúrese de cambiar eventualmente la propiedad `tipos` en su `tsconfig.json` de `webdriverio/sync` a `@wdio/globals/types`. También asegúrese de que su objetivo de compilación está establecido en al menos `ES2018`.
:::

## Casos especiales

Por supuesto, siempre hay casos especiales en los que hay que prestar un poco más de atención.

### ForEach Loops

Si tienes un bucle `forEach`, p.e. para iterar sobre los elementos, es necesario asegurarse de que el callback del iterador se maneja correctamente de forma asíncrona, por ejemplo.:

```js
const elems = $$('div')
elems.forEach((elem) => {
    elem.click()
})
```

La función que pasamos a `forEach` es una función de iteración. En un mundo sincrónico haría clic en todos los elementos antes de avanzar. Si transformamos esto en código asíncrono, tenemos que asegurarnos de esperar a que cada función iteradora finalice la ejecución. Al añadir `async`/`espera` estas funciones del iterador devolverán una promesa que necesitamos resolver. Ahora, `forEach` no es ideal para iterar sobre los elementos ya que no devuelve el resultado de la función iterador, la promesa que tenemos que esperar. Por lo tanto necesitamos reemplazar `por cada` por `mapa` que devuelve esa promesa. The `map` as well as all other iterator methods of Arrays like `find`, `every`, `reduce` and more are implemented so that they respect promises within the iterator functions and are therefor simplified for using them in an async context. El ejemplo anterior se ve transformado así:

```js
const elems = await $$('div')
await elems.forEach((elem) => {
    return elem.click()
})
```

Por ejemplo, para obtener todos los elementos `<h3 />` y obtener su contenido de texto, puedes ejecutar:

```js
await browser.url('https://webdriver.io')

const h3Texts = await browser.$$('h3').map((img) => img.getText())
console.log(h3Texts);
/**
 * returns:
 * [
 *   'Extendable',
 *   'Compatible',
 *   'Feature Rich',
 *   'Who is using WebdriverIO?',
 *   'Support for Modern Web and Mobile Frameworks',
 *   'Google Lighthouse Integration',
 *   'Watch Talks about WebdriverIO',
 *   'Get Started With WebdriverIO within Minutes'
 * ]
 */
```

Si esto parece demasiado complicado, puede que quiera considerar el uso simple para bucles, por ejemplo.:

```js
const elems = await $$('div')
for (const elem of elems) {
    await elem.click()
}
```

### Asserciones WebdriverIO

Si utiliza el ayudante de aserción WebdriverIO [`expect-webdriverio`](https://webdriver.io/docs/api/expect-webdriverio) asegúrese de establecer una `espera` delante de cada `espera` llamada, ej.:

```ts
expect($('input')).toHaveAttributeContaining('class', 'form')
```

necesita ser transformado en:

```ts
await expect($('input')).toHaveAttributeContaining('class', 'form')
```

### Sincronizar métodos de PageObject y pruebas de sincronización

Si ha estado escribiendo PageObjects en su suite de pruebas de una manera sincrónica, ya no podrá utilizarlos en pruebas asincrónicas. Si necesita utilizar un método PageObject en pruebas de sincronización y asíncrona, recomendamos duplicar el método y ofrecerlos para ambos entornos, ej.:

```js
class MyPageObject extends Page {
    /**
     * define elements
     */
    get btnStart () { return $('button=Start') }
    get loadedPage () { return $('#finish') }

    someMethod () {
        // sync code
    }

    someMethodAsync () {
        // async version of MyPageObject.someMethod()
    }
}
```

Una vez que haya finalizado la migración, puede eliminar los métodos sincrónicos de PageObject y limpiar el nombre.

Si no desea mantener dos versiones diferentes de un método PageObject también puede migrar todo el PageObject a asíncrona y utilizar [`browser. all`](https://webdriver.io/docs/api/browser/call) to execute the method in a synchronous environment, e.g.:

```js
// before:
// MyPageObject.someMethod()
// after:
browser.call(() => MyPageObject.someMethod())
```

El comando `call` se asegurará de que el asincrónico `someMethod` se resuelva antes de pasar al siguiente comando.

## Conclusión

Como puedes ver en la [reescritura PR resultante](https://github.com/webdriverio/cucumber-boilerplate/pull/481/files) la complejidad de esta reescritura es bastante fácil. Recuerda que puedes reescribir una definición de paso en ese momento. WebdriverIO es perfectamente capaz de manejar la ejecución sincronizada y asíncrona en un único framework.
