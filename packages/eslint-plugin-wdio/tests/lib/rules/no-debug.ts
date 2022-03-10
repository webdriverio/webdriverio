import rule from '../../../lib/rules/no-debug'
import { RuleTester } from 'eslint'

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
