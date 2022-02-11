const rules      = require('../../../lib/rules/no-pause').rules
const RuleTester = require('eslint').RuleTester

const ruleTester = new RuleTester({ parserOptions : {
    ecmaVersion : 'latest'
} })

const errors = [{ messageId : 'unexpectedPause' }]
const rule   = rules['no-pause']

ruleTester.run('type-check', rule, {
    valid : [
        'foo()',
        'browser.url()',
        'it(`foo`, async () => { await browser.url(); });'
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
