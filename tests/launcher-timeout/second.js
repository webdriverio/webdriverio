import { appendFileSync } from 'node:fs'

describe('second serial spec', () => {
    it('must not start after the overall deadline', () => {
        appendFileSync(process.env.WDIO_TIMEOUT_EVENTS, JSON.stringify({ event: 'body', index: 1 }) + '\n')
    })
})
