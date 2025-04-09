---
id: writing-tests
title: Escrevendo Testes
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Suporte à Estrutura Testrunner

`@wdio/visual-service` é agnostico framework de test-runner, o que significa que você pode usá-lo com todos os frameworks WebdriverIO suportes como:

- [`Mocha`](https://webdriver.io/docs/frameworks#using-mocha)
- [`Jasmine`](https://webdriver.io/docs/frameworks#using-jasmine)
- [`CucumberJS`](https://webdriver.io/docs/frameworks#using-cucumber)

Within your tests, you can _save_ screenshots or match the current visual state of your application under test with a baseline. Para isso, o serviço fornece [custom matcher](/docs/api/expect-webdriverio#visual-matcher), bem como métodos _check_:

<Tabs
defaultValue="mocha"
values={[
{label: 'Mocha', value: 'mocha'},
{label: 'Jasmine', value: 'jasmine'},
{label: 'CucumberJS', value: 'cucumberjs'},
]}

>

<TabItem value="mocha">

```ts
describe('Mocha Example', () => {
    beforeEach(async () => {
        await browser.url('https://webdriver.io')
    })

    it('using visual matchers to assert against baseline', async () => {
        // Check screen to exactly match with baseline
        await expect(browser).toMatchScreenSnapshot('partialPage')
        // check an element to have a mismatch percentage of 5% with the baseline
        await expect(browser).toMatchScreenSnapshot('partialPage', 5)
        // check an element with options for `saveScreen` command
        await expect(browser).toMatchScreenSnapshot('partialPage', {
            /* some options */
        })

        // Check an element to exactly match with baseline
        await expect($('#element-id')).toMatchElementSnapshot('firstButtonElement')
        // check an element to have a mismatch percentage of 5% with the baseline
        await expect($('#element-id')).toMatchElementSnapshot('firstButtonElement', 5)
        // check an element with options for `saveElement` command
        await expect($('#element-id')).toMatchElementSnapshot('firstButtonElement', {
            /* some options */
        })

        // Check a full page screenshot match with baseline
        await expect(browser).toMatchFullPageSnapshot('fullPage')
        // Check a full page screenshot to have a mismatch percentage of 5% with the baseline
        await expect(browser).toMatchFullPageSnapshot('fullPage', 5)
        // Check a full page screenshot with options for `checkFullPageScreen` command
        await expect(browser).toMatchFullPageSnapshot('fullPage', {
            /* some options */
        })

        // Check a full page screenshot with all tab executions
        await expect(browser).toMatchTabbablePageSnapshot('check-tabbable')
        // Check a full page screenshot to have a mismatch percentage of 5% with the baseline
        await expect(browser).toMatchTabbablePageSnapshot('check-tabbable', 5)
        // Check a full page screenshot with options for `checkTabbablePage` command
        await expect(browser).toMatchTabbablePageSnapshot('check-tabbable', {
            /* some options */
        })
    })

    it('should save some screenshots', async () => {
        // Save a screen
        await browser.saveScreen('examplePage', {
            /* some options */
        })

        // Save an element
        await browser.saveElement(
            await $('#element-id'),
            'firstButtonElement',
            {
                /* some options */
            }
        )

        // Salvar uma captura de tela de página inteira
        await browser.saveFullPageScreen('fullPage', {
            /* some options */
        })

       // Salve uma captura de tela de página inteira com todas as execuções de guias
        await browser.saveTabbablePage('save-tabbable', {
            /* some options, use the same options as for saveFullPageScreen */
        })
    })

    it('should compare successful with a baseline', async () => {
        // Check a screen
        await expect(
            await browser.checkScreen('examplePage', {
                /* some options */
            })
        ).toEqual(0)

        // Check an element
        await expect(
            await browser.checkElement(
                await $('#element-id'),
                'firstButtonElement',
                {
                    /* some options */
                }
            )
        ).toEqual(0)

       // Verifique uma captura de tela da página inteira
        await expect(
            await browser.checkFullPageScreen('fullPage', {
                /* some options */
            })
        ).toEqual(0)

        // Verifique uma captura de tela de página inteira com todas as execuções de guias
        await expect(
            await browser.checkTabbablePage('check-tabbable', {
                /* some options, use the same options as for checkFullPageScreen */
            })
        ).toEqual(0)
    })
})
```

</TabItem>
<TabItem value="jasmine">

```ts
describe('Jasmine Example', () => {
    beforeEach(async () => {
        await browser.url('https://webdriver.io')
    })

    it('using visual matchers to assert against baseline', async () => {
        // Check screen to exactly match with baseline
        await expect(browser).toMatchScreenSnapshot('partialPage')
        // check an element to have a mismatch percentage of 5% with the baseline
        await expect(browser).toMatchScreenSnapshot('partialPage', 5)
        // check an element with options for `saveScreen` command
        await expect(browser).toMatchScreenSnapshot('partialPage', {
            /* some options */
        })

        // Check an element to exactly match with baseline
        await expect($('#element-id')).toMatchElementSnapshot('firstButtonElement')
        // check an element to have a mismatch percentage of 5% with the baseline
        await expect($('#element-id')).toMatchElementSnapshot('firstButtonElement', 5)
        // check an element with options for `saveElement` command
        await expect($('#element-id')).toMatchElementSnapshot('firstButtonElement', {
            /* some options */
        })

        // Check a full page screenshot match with baseline
        await expect(browser).toMatchFullPageSnapshot('fullPage')
        // Check a full page screenshot to have a mismatch percentage of 5% with the baseline
        await expect(browser).toMatchFullPageSnapshot('fullPage', 5)
        // Check a full page screenshot with options for `checkFullPageScreen` command
        await expect(browser).toMatchFullPageSnapshot('fullPage', {
            /* some options */
        })

        // Check a full page screenshot with all tab executions
        await expect(browser).toMatchTabbablePageSnapshot('check-tabbable')
        // Check a full page screenshot to have a mismatch percentage of 5% with the baseline
        await expect(browser).toMatchTabbablePageSnapshot('check-tabbable', 5)
        // Check a full page screenshot with options for `checkTabbablePage` command
        await expect(browser).toMatchTabbablePageSnapshot('check-tabbable', {
            /* some options */
        })
    })

    it('should save some screenshots', async () => {
        // Save a screen
        await browser.saveScreen('examplePage', {
            /* some options */
        })

        // Save an element
        await browser.saveElement(
            await $('#element-id'),
            'firstButtonElement',
            {
                /* some options */
            }
        )

        // Save a full page screenshot
        await browser.saveFullPageScreen('fullPage', {
            /* some options */
        })

        // Save a full page screenshot with all tab executions
        await browser.saveTabbablePage('save-tabbable', {
            /* some options, use the same options as for saveFullPageScreen */
        })
    })

    it('should compare successful with a baseline', async () => {
        // Check a screen
        await expect(
            await browser.checkScreen('examplePage', {
                /* some options */
            })
        ).toEqual(0)

        // Check an element
        await expect(
            await browser.checkElement(
                await $('#element-id'),
                'firstButtonElement',
                {
                    /* some options */
                }
            )
        ).toEqual(0)

        // Check a full page screenshot
        await expect(
            await browser.checkFullPageScreen('fullPage', {
                /* some options */
            })
        ).toEqual(0)

        // Check a full page screenshot with all tab executions
        await expect(
            await browser.checkTabbablePage('check-tabbable', {
                /* some options, use the same options as for checkFullPageScreen */
            })
        ).toEqual(0)
    })
})
```

</TabItem>
<TabItem value="cucumberjs">

```ts
import { When, Then } from '@wdio/cucumber-framework'

When('I save some screenshots', async function () {
    // Save a screen
    await browser.saveScreen('examplePage', {
        /* some options */
    })

    // Save an element
    await browser.saveElement(await $('#element-id'), 'firstButtonElement', {
        /* some options */
    })

    // Save a full page screenshot
    await browser.saveFullPageScreen('fullPage', {
        /* some options */
    })

    // Save a full page screenshot with all tab executions
    await browser.saveTabbablePage('save-tabbable', {
        /* some options, use the same options as for saveFullPageScreen */
    })
})

Then('I should be able to match some screenshots with a baseline', async function () {
    // Check screen to exactly match with baseline
    await expect(browser).toMatchScreenSnapshot('partialPage')
    // check an element to have a mismatch percentage of 5% with the baseline
    await expect(browser).toMatchScreenSnapshot('partialPage', 5)
    // check an element with options for `saveScreen` command
    await expect(browser).toMatchScreenSnapshot('partialPage', {
        /* some options */
    })

    // Check an element to exactly match with baseline
    await expect($('#element-id')).toMatchElementSnapshot('firstButtonElement')
    // check an element to have a mismatch percentage of 5% with the baseline
    await expect($('#element-id')).toMatchElementSnapshot('firstButtonElement', 5)
    // check an element with options for `saveElement` command
    await expect($('#element-id')).toMatchElementSnapshot('firstButtonElement', {
        /* some options */
    })

    // Check a full page screenshot match with baseline
    await expect(browser).toMatchFullPageSnapshot('fullPage')
    // Check a full page screenshot to have a mismatch percentage of 5% with the baseline
    await expect(browser).toMatchFullPageSnapshot('fullPage', 5)
    // Check a full page screenshot with options for `checkFullPageScreen` command
    await expect(browser).toMatchFullPageSnapshot('fullPage', {
        /* some options */
    })

    // Check a full page screenshot with all tab executions
    await expect(browser).toMatchTabbablePageSnapshot('check-tabbable')
    // Check a full page screenshot to have a mismatch percentage of 5% with the baseline
    await expect(browser).toMatchTabbablePageSnapshot('check-tabbable', 5)
    // Check a full page screenshot with options for `checkTabbablePage` command
    await expect(browser).toMatchTabbablePageSnapshot('check-tabbable', {
        /* some options */
    })
})

Then('I should be able to compare some screenshots with a baseline', async function () {
    // Check a screen
    await expect(
        await browser.checkScreen('examplePage', {
            /* some options */
        })
    ).toEqual(0)

    // Check an element
    await expect(
        await browser.checkElement(
            await $('#element-id'),
            'firstButtonElement',
            {
                /* some options */
            }
        )
    ).toEqual(0)

    // Check a full page screenshot
    await expect(
        await browser.checkFullPageScreen('fullPage', {
            /* some options */
        })
    ).toEqual(0)

    // Check a full page screenshot with all tab executions
    await expect(
        await browser.checkTabbablePage('check-tabbable', {
            /* some options, use the same options as for checkFullPageScreen */
        })
    ).toEqual(0)
})
```

</TabItem>
</Tabs>

:::note IMPORTANTE

Este serviço fornece os métodos `save` e `check`. Se você executar seus testes pela primeira vez, **NÃO DEVE** combinar os métodos `save` e `compare`, os métodos `check` criarão automaticamente uma imagem de base para você

```sh
######################################################################################
INFORMAÇÕES:
A imagem foi salva automaticamente em
/Users/wswebcreation/sample/baselineFolder/desktop_chrome/examplePage-chrome-latest-1366x768.png
# ...
```

Quando você [desabilitar o salvamento automático de imagens de base](service-options#autosavebaseline), a Promessa será rejeitada com o seguinte aviso.

```sh
#####################################################################################
 Baseline image not found, save the actual image manually to the baseline.
 The image can be found here:
 /Users/wswebcreation/sample/.tmp/actual/desktop_chrome/examplePage-chrome-latest-1366x768.png
#####################################################################################
```

Isso significa que a captura de tela atual é salva na pasta real e você **precisa copiá-la manualmente para sua linha de base**. Se você instanciar `@wdio/visual-service` com [`autoSaveBaseline: true`](./service-options#autosavebaseline), a imagem será salva automaticamente na pasta de base.

:::
