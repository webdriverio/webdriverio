import { describe, it, expect, vi } from 'vitest'
import { RuleTester } from 'eslint'
import rule from '../src/rules/await-expect.js'
import { MATCHERS } from '../src/constants.js'

const ruleTester = new RuleTester({})

const errors = [{ messageId : 'missingAwait' }]

describe('await-expect', () => {
    it('passes rule tester', () => {
        ruleTester.run('await-expect-check', rule, {
            valid: [
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
                // Snapshot matchers validation
                'it(`bar`, async () => { await expect($(`.foo`)).toMatchSnapshot(); });',
                'it(`bar`, async () => { await expect($(`.foo`)).toMatchInlineSnapshot(); });',
                'it(`bar`, async () => { expect(someObject).toMatchSnapshot(); });',
                'it(`bar`, async () => { expect(123).toMatchInlineSnapshot(); });',
            ],
            invalid: [
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
                    code : 'expect($$(`.foo`)).toBeElementsArrayOfSize(1)',
                    errors,
                },
                // Snapshot matchers invalidation
                {
                    code : 'expect($(`.foo`)).toMatchSnapshot()',
                    errors,
                },
                {
                    code : 'expect($(`.foo`)).toMatchInlineSnapshot()',
                    errors,
                },
                {
                    code : 'expect($$(`.foo`)).toMatchSnapshot()',
                    errors,
                },
                {
                    code : 'expect(browser.$(`.foo`)).toMatchSnapshot()',
                    errors,
                },
            ],
        })
    })

    it('All epxect-webdriverio matchers are covered', async () => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports
        const expectWebdriverio = await vi.importActual<typeof import('expect-webdriverio')>('expect-webdriverio')
        const matchers = Array.from(expectWebdriverio.matchers.keys())
            .filter((matcher) => !['toMatchSnapshot', 'toMatchInlineSnapshot'].includes(matcher))
        console.log('matchers', matchers)

        expect(MATCHERS.sort()).toEqual(matchers.sort())
    })
})
