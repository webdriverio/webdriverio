import { RuleTester } from 'eslint'
import rule from '../src/rules/no-pause.js'

const ruleTester = new RuleTester({
    parserOptions : {
        ecmaVersion : 'latest'
    }
})

const errors = [{ messageId : 'unexpectedPause' }]

ruleTester.run('no-pause', rule, {
    valid : [
        'foo();',
        'browser.url();',
        'it(`foo`, async () => { await browser.url(); });',
    ],
    invalid : [
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
