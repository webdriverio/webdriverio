const rules      = require('../../../lib/rules/no-debug').rules
const RuleTester = require('eslint').RuleTester

const ruleTester = new RuleTester({ parserOptions : {
    ecmaVersion : 'latest'
} })

const errors = [{ messageId : 'unexpectedDebug' }]
const rule   = rules['no-debug']

ruleTester.run('type-check', rule, {
    valid : [
        'foo()',
        'browser.url()',
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
