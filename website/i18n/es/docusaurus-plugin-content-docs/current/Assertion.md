---
id: assertion
title: Aserciones
---

El testrunner [WDIO](https://webdriver.io/docs/clioptions) viene con una librería de aserción incorporada que le permite realizar poderosas afirmaciones sobre varios aspectos del navegador o elementos dentro de su aplicación (web). Extiende la funcionalidad de [Jests Matchers](https://jestjs.io/docs/en/using-matchers) con adicional, para las pruebas e2e optimizadas, matchers, por ejemplo:

```js
const $button = await $('button')
await expect($button).toBeDisplayed()
```

or

```js
const selectOptions = await $$('form select>option')

// make sure there is at least one option in select
await expect(selectOptions).toHaveChildren({ gte: 1 })
```

Para la lista completa, vea el documento de la API esperada [](/docs/api/expect-webdriverio).

## Migración desde Chai

[Chai](https://www.chaijs.com/) y [expect-webdriverio](https://github.com/webdriverio/expect-webdriverio#readme) pueden coexistir y con algunos ajustes menores se puede lograr una transición suave a expect-webdriverio. Si ha actualizado a WebdriverIO v6, entonces tendrá acceso por defecto a todas las afirmaciones de `expect-webdriverio` de serie. Esto significa que globalmente dondequiera que use `espere` llamaría a una afirmación de `expect-webdriverio`. Eso es, a menos que establezca [`injectGlobals`](/docs/configuration#injectglobals) a `false` o haya sobreescrito explícitamente el global `esperen` que utilice Chai. En este caso usted no tendría acceso a ninguna de las afirmaciones expect-webdriverio sin importar explícitamente el paquete expect-webdriverio donde lo necesite.

Esta guía mostrará ejemplos de cómo migrar desde Chai si ha sido anulada localmente y cómo migrar desde Chai si ha sido anulada a nivel global.

### Local

Supongamos que Chai se importó explícitamente en un archivo, por ejemplo:

```js
// myfile.js - original code
import { expect as expectChai } from 'chai'

describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        expectChai(await browser.getUrl()).to.include('/login')
    })
})
```

Para migrar este código, elimine la importación de Chai y use el nuevo método de verificación expect-webdriverio `toHaveUrl` en su lugar:

```js
// myfile.js - migrated code
describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        await expect(browser).toHaveUrl('/login') // new expect-webdriverio API method https://webdriver.io/docs/api/expect-webdriverio.html#tohaveurl
    });
});
```

Si desea utilizar tanto Chai como expect-webdriverio en el mismo archivo, mantendría la importación de Chai y `esperaría` por defecto para la afirmación expect-webdriverio, por ejemplo:

```js
// myfile.js
import { expect as expectChai } from 'chai'
import { expect as expectWDIO } from '@wdio/globals'

describe('Element', () => {
    it('should be displayed', async () => {
        const isDisplayed = await $("#element").isDisplayed()
        expectChai(isDisplayed).to.equal(true); // Chai assertion
    })
});

describe('Other element', () => {
    it('should not be displayed', async () => {
        await expectWDIO($("#element")).not.toBeDisplayed(); // expect-webdriverio assertion
    })
})
```

### Global

Supongamos que `espere` globalmente se sobreescribió para usar Chai. Para usar las afirmaciones expect-webdriverio necesitamos establecer globalmente una variable en el gancho "before", por ejemplo:

```js
// wdio.conf.js
before: async () => {
    await import('expect-webdriverio');
    global.wdioExpect = global.expect;
    const chai = await import('chai');
    global.expect = chai.expect;
}
```

Ahora Chai y expect-webdriverio pueden ser utilizados uno al otro. En su código usaría las afirmaciones de Chai y expect-webdriverio de la siguiente manera:

```js
// myfile.js
describe('Element', () => {
    it('should be displayed', async () => {
        const isDisplayed = await $("#element").isDisplayed()
        expect(isDisplayed).to.equal(true); // Chai assertion
    });
});

describe('Other element', () => {
    it('should not be displayed', async () => {
        await expectWdio($("#element")).not.toBeDisplayed(); // expect-webdriverio assertion
    });
});
```

Para migrar se movería lentamente cada afirmación de Chai para esperar-webdriverio. Una vez que todas las afirmaciones de Chai han sido reemplazadas a lo largo de la base de código, el gancho "antes" puede ser eliminado. Un hallazgo global y reemplazo para reemplazar todas las instancias de `wdioExpect` to `expect` entonces terminará de la migración
