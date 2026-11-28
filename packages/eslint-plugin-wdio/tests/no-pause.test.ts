import { describe, it } from 'vitest'
import { RuleTester } from 'eslint'
import rule from '../src/rules/no-pause.js'

const ruleTester = new RuleTester({})
const errorsFor = (instance: string) => [{ messageId : 'unexpectedPause', data: { instance } }]

describe('no-pause', () => {
    it('should pass rule tester', () => {
        ruleTester.run('no-pause', rule, {
            valid: [
                'foo();',
                'browser.url();',
                'driver.url();',
                'it(`foo`, async () => { await browser.url(); });',
            ],
            invalid: [
                {
                    code : 'browser.pause();',
                    errors: errorsFor('browser')
                },
                {
                    code : 'driver.pause(500);',
                    errors: errorsFor('driver')
                },
                {
                    code : 'it(`foo`, async () => { await browser.pause(); });',
                    errors: errorsFor('browser')
                },
                {
                    code : 'it(`foo`, async () => { await driver.pause(500); });',
                    errors: errorsFor('driver')
                }
            ]
        })
    })

    it('reports the called instance in the message', () => {
        ruleTester.run('no-pause', rule, {
            valid: [],
            invalid: [
                {
                    code: 'driver.pause(500);',
                    errors: [{ message: 'Unexpected driver.pause() not allowed' }]
                },
                {
                    code: 'browser.pause(500);',
                    errors: [{ message: 'Unexpected browser.pause() not allowed' }]
                }
            ]
        })
    })

    it('support different browser instances', () => {
        ruleTester.run('no-pause', rule, {
            valid: [
                {
                    code: 'browser.pause();',
                    options: [{ instances: ['aa'] }],
                },
                {
                    code: 'driver.pause(500);',
                    options: [{ instances: ['aa'] }],
                },
            ],
            invalid: [
                {
                    code: 'aa.pause();',
                    options: [{ instances: ['aa'] }],
                    errors: [{ message: 'Unexpected aa.pause() not allowed' }]
                }
            ]
        })
    })
})
