import { RuleTester } from 'eslint'
import rule from '../src/rules/await-deep-selector.js'

const ruleTester = new RuleTester({
    parserOptions : {
        ecmaVersion : 'latest'
    }
})

const errors = [{ messageId : 'missingAwaitDeep' }]

ruleTester.run('await-deep-selector-check', rule, {
    valid : [
        'it(`bar`, async () => { await expect(await $(`>>>.foo`)).toBeDisplayed(); });',
        'it(`bar`, async () => { await expect(await $(`>>>.foo`)).toExist(); });',
        'it(`bar`, async () => { const foo = await $(`>>>.foo`)); });',
        'it(`bar`, async () => { const foo = $(`.foo`)); });',
        'it(`bar`, async () => { const foo = await $$(`>>>.foo`)); });',
        'it(`bar`, async () => { const foo = $$(`.foo`)); });',
        'it(`bar`, async () => { const foo = await browser.$$(`>>>.foo`)); });',
        'it(`bar`, async () => { const foo = await browser.$(`>>>.foo`)); });',
        'it(`bar`, async () => expect(`.foo`).toHaveTitle() );',
        'bar()',
    ],
    invalid : [
        {
            code : 'it(`foo`, async () => { await expect($(`>>>.foo`)).toBeDisplayed(); });',
            errors,
        },
        {
            code : 'const foo = $(`>>>.foo`)',
            errors,
        },
        {
            code : 'it(`foo`, async () => { const foo = $$(`>>>.foo`)); });',
            errors,
        },
        {
            code : 'it(`foo`, async () => { const foo = browser.$(`>>>.foo`)); });',
            errors,
        },
    ],
})
