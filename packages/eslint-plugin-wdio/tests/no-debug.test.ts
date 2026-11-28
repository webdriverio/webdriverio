import { describe, it } from 'vitest'
import { RuleTester } from 'eslint'
import rule from '../src/rules/no-debug.js'

const ruleTester = new RuleTester({})
const errorsFor = (instance: string) => [{ messageId : 'unexpectedDebug', data: { instance } }]

describe('no-debug', () => {
    it('should pass rule tester', () => {
        ruleTester.run('no-debug', rule, {
            valid: [
                'foo();',
                'browser.url();',
                'driver.url();',
                'it(`foo`, async () => { await browser.url(); });',
            ],
            invalid: [
                {
                    code : 'browser.debug();',
                    errors: errorsFor('browser')
                },
                {
                    code : 'driver.debug();',
                    errors: errorsFor('driver')
                },
                {
                    code : 'it(`foo`, async () => { await browser.debug(); });',
                    errors: errorsFor('browser')
                },
                {
                    code : 'it(`foo`, async () => { await driver.debug(); });',
                    errors: errorsFor('driver')
                }
            ]
        })
    })

    it('reports the called instance in the message', () => {
        ruleTester.run('no-debug', rule, {
            valid: [],
            invalid: [
                {
                    code: 'driver.debug();',
                    errors: [{ message: 'Unexpected driver.debug() not allowed' }]
                },
                {
                    code: 'browser.debug();',
                    errors: [{ message: 'Unexpected browser.debug() not allowed' }]
                }
            ]
        })
    })

    it('support different browser instances', () => {
        ruleTester.run('no-debug', rule, {
            valid: [
                {
                    code: 'browser.debug();',
                    options: [{ instances: ['aa'] }],
                },
                {
                    code: 'driver.debug();',
                    options: [{ instances: ['aa'] }],
                },
            ],
            invalid: [
                {
                    code: 'aa.debug();',
                    options: [{ instances: ['aa'] }],
                    errors: [{ message: 'Unexpected aa.debug() not allowed' }]
                }
            ]
        })
    })
})
