import { appendFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const scenario = JSON.parse(process.env.WDIO_TIMEOUT_SCENARIO)
describe('overall testrunner deadline', () => {
    it('records the first spec', async () => {
        appendFileSync(process.env.WDIO_TIMEOUT_EVENTS, JSON.stringify({ event: 'body', index: 0 }) + '\n')
        await new Promise(resolve => setTimeout(resolve, scenario.body || 0))
        assert.ok(!scenario.retry, 'synthetic retry control')
    })
})
