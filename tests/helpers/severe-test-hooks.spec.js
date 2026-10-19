import { appendFileSync } from 'node:fs'
import assert from 'node:assert'

const record = (event) => appendFileSync(process.env.WDIO_SEVERE_TEST_HOOKS_OUTPUT, JSON.stringify(event) + '\n')

describe('SevereServiceError in test hooks', () => {
    it('target test', () => {
        record({ event: 'body', title: 'target test' })
        if (process.env.WDIO_SEVERE_TEST_HOOKS_CASE === 'after-severe-body-failure') {
            if (browser.options.framework === 'jasmine') {
                expect(false).toBe(true)
            } else {
                assert.fail('original body failure')
            }
        }
    })

    it('following test', () => {
        record({ event: 'body', title: 'following test' })
    })
})
