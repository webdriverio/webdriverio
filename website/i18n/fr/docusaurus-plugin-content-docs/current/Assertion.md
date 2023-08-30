---
id: assertion
title: Problèmes
---

Le testeur [WDIO](https://webdriver.io/docs/clioptions) est fourni avec une bibliothèque d'assertions intégrée qui vous permet de faire de puissantes assertions sur différents aspects du navigateur ou des éléments de votre application (web). Il étend la fonctionnalité [Jests Matchers](https://jestjs.io/docs/en/using-matchers) avec supplémentaire, pour les tests optimisés e2e, les matchers, par exemple.:

```js
const $button = attendre $('button')
attendent expect($button).toBeDisplayed()
```

ou

```js
const selectOptions = wait $$('form select>option')

// assurez-vous qu'il y a au moins une option dans select
wait expect(selectOptions).toHaveChildren({ gte: 1 })
```

Pour la liste complète, consultez la documentation [expect API doc](/docs/api/expect-webdriverio).

## Migration à partir de Canary

[Chai](https://www.chaijs.com/) et [expect-webdriverio](https://github.com/webdriverio/expect-webdriverio#readme) peuvent coexister, et avec quelques ajustements mineurs, une transition en douceur vers expect-webdriverio peut être réalisée. Si vous avez mis à niveau vers WebdriverIO v6, alors par défaut, vous aurez accès à toutes les assertions de `expect-webdriverio` hors de la boîte. Cela signifie que partout où vous utilisez `vous attendez` vous appellerez une assertion `expect-webdriverio`. C'est-à-dire, à moins que vous ne définissiez [`injectGlobals`](/docs/configuration#injectglobals) à `false` ou que vous n'ayez explicitement outrepassé le global `attendent` d'utiliser Chai. Dans ce cas, vous n'auriez accès à aucune des assertions expect-webdriverio sans importer explicitement le paquet expect-webdriverio où vous en avez besoin.

Ce guide montrera des exemples de migration depuis Chai si elle a été remplacée localement et comment migrer depuis Chai si elle a été remplacée dans le monde entier.

### Locale

Assume Chai a été importé explicitement dans un fichier, par exemple:

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

Pour migrer ce code, supprimez l'importation de Chai et utilisez la nouvelle méthode d'assertion 'expect-webdriverio' `toHaveUrl` à la place :

```js
// myfile.js - migrated code
describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        await expect(browser).toHaveUrl('/login') // new expect-webdriverio API method https://webdriver.io/docs/api/expect-webdriverio.html#tohaveurl
    });
});
```

Si vous voulez utiliser à la fois Chai et expect-webdriverio dans le même fichier, vous conserverez l'import de Chai et `vous attendez` par défaut à l'assertion expect-webdriverio, par exemple:

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

Supposons que `s'attendent à` a été remplacée globalement pour utiliser Chai. Afin d'utiliser les assertions webdriverio attendues, nous devons définir globalement une variable dans le crochet "avant", par exemple:

```js
// wdio.conf.js
before: async () => {
    await import('expect-webdriverio');
    global.wdioExpect = global.expect;
    const chai = await import('chai');
    global.expect = chai.expect;
}
```

Maintenant Chai et expect-webdriverio peuvent être utilisés les uns avec les autres. Dans votre code, vous utiliseriez les assertions Chai et expect-webdriverio comme suit:

```js
// myfile.jsdescribe('Element  from 'chai'import  from '@wdio/globals'


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
});
```

Pour migrer vous déplaceriez lentement chaque assertion Chai vers expect-webdriverio. Une fois que toutes les assertions Chai ont été remplacées tout au long de la base de code, le crochet "avant" peut être supprimé. Une recherche globale et un remplacement pour remplacer toutes les instances de `wdioExpect` à `attendre` se terminera alors la migration.
