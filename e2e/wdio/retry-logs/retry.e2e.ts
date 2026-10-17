import assert from 'node:assert/strict'
import fs from 'node:fs'

describe('spec-file retry log preservation', () => {
    it('keeps the failed attempt when the next attempt succeeds', async () => {
        const counter = process.env.WDIO_RETRY_LOG_COUNTER!
        const attempt = fs.existsSync(counter) ? Number(fs.readFileSync(counter, 'utf8')) + 1 : 1
        fs.writeFileSync(counter, String(attempt))
        const marker = `REAL_DRIVER_LOG_ATTEMPT_${attempt}`
        console.log(marker)
        await browser.url(`data:text/html;charset=utf-8,${encodeURIComponent(`<title>${marker}</title>`)}`)
        assert.equal(await browser.getTitle(), marker)
        assert.notEqual(attempt, 1, 'controlled initial spec-file failure')
    })
})
