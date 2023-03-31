import { RuleTester } from 'eslint'
import rule from '../src/rules/no-debug.js'

const ruleTester = new RuleTester({
    parserOptions : {
        ecmaVersion : 'latest'
    }
})

const errors = [{ messageId : 'unexpectedDebug' }]

ruleTester.run('no-debug', rule, {
    valid : [
        'foo();',
        'browser.url();',
        'it(`foo`, async () => { await browser.url(); });',
    ],
    invalid : [
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
