import { describe, it } from 'vitest'
import { RuleTester } from 'eslint'
import rule from '../src/rules/no-debug.js'

const ruleTester = new RuleTester({})
const errors = [{ messageId : 'unexpectedDebug' }]

describe('no-debug', () => {
    it('should pass rule tester', () => {
        ruleTester.run('no-debug', rule, {
            valid: [
                'foo();',
                'browser.url();',
                'it(`foo`, async () => { await browser.url(); });',
            ],
            invalid: [
                {
                    code : 'browser.debug();',
                    errors
                },
                {
                    code : 'it(`foo`, async () => { await browser.debug(); });',
                    errors
                }
            ]
        })
    })

    it('support different browser instances', () => {
        ruleTester.run('no-debug', rule, {
            valid: [],
            invalid: [
                {
                    code: 'aa.debug();',
                    options: [{ instances: ['aa'] }],
                    errors
                }
            ]
        })
    })
})
