import { RuleTester } from 'eslint'
import rule from '../src/rules/await-expect.js'

const ruleTester = new RuleTester({
    parserOptions : {
        ecmaVersion : 'latest'
    }
})

const errors = [{ messageId : 'missingAwait' }]

ruleTester.run('await-expect-check', rule, {
    valid : [
        'it(`bar`, async () => { await expect($(`.foo`)).toBeDisplayed(); });',
        'it(`bar`, async () => { await expect($(`.foo`)).toExist(); });',
        'it(`bar`, async () => { await expect($(`.foo`)).toBeExisting(); });',
        'it(`bar`, async () => { await expect($(`.foo`)).toBeRequestedWith(); });',
        'it(`bar`, async () => { await expect($(`.foo`)).toHaveChildren(); });',
        'it(`bar`, async () => { await expect($(`.foo`)).toHaveTitle(); });',
        'it(`bar`, async () => { await expect($(`.foo`)).toBeElementsArrayOfSize(); });',
        'it(`bar`, async () => { expect(1).toBe(1) });',
        'it(`bar`, async () => expect(`.foo`).toHaveTitle() );',
        'it(`bar`, async () => { await Promise.all([ expect(`.foo`).toHaveTitle() ]) });',
        'bar()',
    ],
    invalid : [
        {
            code : 'it(`foo`, async () => { expect($(`.foo`)).toBeDisplayed(); });',
            errors,
        },
        {
            code : 'expect($(`.foo`)).toExist()',
            errors,
        },
        {
            code : 'expect($(`.foo`)).toBeExisting()',
            errors,
        },
        {
            code : 'expect($(`.foo`)).toBeRequestedWith()',
            errors,
        },
        {
            code : 'expect($(`.foo`)).toHaveChildren()',
            errors,
        },
        {
            code : 'expect($(`.foo`)).toHaveTitle()',
            errors,
        },
        {
            code : 'expect($(`.foo`)).toBeElementsArrayOfSize()',
            errors,
        }
    ],
})
