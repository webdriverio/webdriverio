import { describe, it } from 'vitest'
import { RuleTester } from 'eslint'
import rule from '../src/rules/no-pause.js'

const ruleTester = new RuleTester({})
const errors = [{ messageId : 'unexpectedPause' }]

describe('no-pause', () => {
    it('should pass rule tester', () => {
        ruleTester.run('no-pause', rule, {
            valid: [
                'foo();',
                'browser.url();',
                'it(`foo`, async () => { await browser.url(); });',
            ],
            invalid: [
                {
                    code : 'browser.pause();',
                    errors
                },
                {
                    code : 'it(`foo`, async () => { await browser.pause(); });',
                    errors
                }
            ]
        })
    })

    it('support different browser instances', () => {
        ruleTester.run('no-pause', rule, {
            valid: [],
            invalid: [
                {
                    code: 'aa.pause();',
                    options: [{ instances: ['aa'] }],
                    errors
                }
            ]
        })
    })
})
