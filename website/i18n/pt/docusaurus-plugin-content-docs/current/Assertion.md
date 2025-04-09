---
id: assertion
title: Assertion
---

O [WDIO testrunner](https://webdriver.io/docs/clioptions) vem com uma biblioteca de asserções integrada que permite que você faça asserções poderosas sobre vários aspectos do navegador ou elementos dentro do seu aplicativo (web). Ele estende a funcionalidade [Jests Matchers](https://jestjs.io/docs/en/using-matchers) com comparadores adicionais otimizados para testes e2e, por exemplo:

```js
const $button = await $('button')
await expect($button).toBeDisplayed()
```

ou

```js
const selectOptions = await $$('form select>option')

// make sure there is at least one option in select
await expect(selectOptions).toHaveChildren({ gte: 1 })
```

Para a lista completa, consulte o [documento da API expect](/docs/api/expect-webdriverio).

## Migrando de Chai

[Chai](https://www.chaijs.com/) e [expect-webdriverio](https://github.com/webdriverio/expect-webdriverio#readme) podem coexistir e, com alguns pequenos ajustes, uma transição suave para expect-webdriverio pode ser alcançada. Se você atualizou para o WebdriverIO v6, por padrão você terá acesso a todas as asserções do `expect-webdriverio` imediatamente. Isso significa que globalmente, onde quer que você use `expect`, você chamaria uma asserção `expect-webdriverio`. Isto é, a menos que você defina [`injectGlobals`](/docs/configuration#injectglobals) como `false` ou tenha substituído explicitamente o `expect` global para usar Chai. Nesse caso, você não teria acesso a nenhuma das asserções expect-webdriverio sem importar explicitamente o pacote expect-webdriverio onde for necessário.

Este guia mostrará exemplos de como migrar do Chai se ele tiver sido substituído localmente e como migrar do Chai se ele tiver sido substituído globalmente.

### Local

Suponha que o Chai foi importado explicitamente em um arquivo, por exemplo:

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

Para migrar este código, remova a importação Chai e use o novo método de asserção expect-webdriverio `toHaveUrl`:

```js
// myfile.js - migrated code
describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        await expect(browser).toHaveUrl('/login') // new expect-webdriverio API method https://webdriver.io/docs/api/expect-webdriverio.html#tohaveurl
    });
});
```

Se você quisesse usar Chai e expect-webdriverio no mesmo arquivo, você manteria a importação Chai e `expect` usaria como padrão a asserção expect-webdriverio, por exemplo:

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

Suponha que `expect` foi substituído globalmente para usar Chai. Para usar as asserções expect-webdriverio, precisamos definir globalmente uma variável no gancho "before", por exemplo:

```js
// wdio.conf.js
before: async () => {
    await import('expect-webdriverio');
    global.wdioExpect = global.expect;
    const chai = await import('chai');
    global.expect = chai.expect;
}
```

Agora Chai e expect-webdriverio podem ser usados ​​juntos. No seu código, você usaria as asserções Chai e expect-webdriverio da seguinte forma, por exemplo:

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

Para migrar, você moveria lentamente cada asserção Chai para expect-webdriverio. Depois que todas as asserções Chai forem substituídas em toda a base de código, o gancho "before" pode ser excluído. Uma localização e substituição global para substituir todas as instâncias de `wdioExpect` para `expect` finalizará a migração.
