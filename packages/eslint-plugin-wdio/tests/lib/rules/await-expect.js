const rules      = require('../../../lib/rules/await-expect').rules
const RuleTester = require('eslint').RuleTester

const ruleTester = new RuleTester({ parserOptions : {
    ecmaVersion : 'latest'
} })

const errors = [{ messageId : 'missingAwait' }]
const rule   = rules['await-expect']

ruleTester.run('type-check', rule, {
    valid : [
        'it(`foo`, async () => { await expect(1).toBe(1); })',
        'it(`bar`, async () => { await expect(await $(`.foo`).getValue()).toBe(1); })',
        'foo()',
    ],
    invalid : [
        {
            code : 'expect(1).toBe()',
            errors,
        },
        {
            code : 'it(`foo`, async () => { expect(await $(`.foo`).getValue()).toBe(1); })',
            errors,
        },
    ],
})
