import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { Given } from '@wdio/cucumber-framework'
import logger from '@wdio/logger'

Given('this spec file logs its attempt and passes on the third attempt', () => {
    const counter = process.env.WDIO_RETRY_LOG_COUNTER
    const attempt = fs.existsSync(counter) ? Number(fs.readFileSync(counter, 'utf8')) + 1 : 1
    fs.writeFileSync(counter, String(attempt))
    logger('retry-logs').info(`CUCUMBER_LOG_ATTEMPT_${attempt}`)
    assert.equal(process.env.WDIO_WORKER_ID, '0-0')
    // A previous worker has exited before this new attempt starts.
    for (let prior = 1; prior < attempt; prior++) {
        const suffix = prior > 1 ? `-${prior - 1}` : ''
        const filename = path.join(path.dirname(counter), `retry-0-0${suffix}.log`)
        const bytes = fs.readFileSync(filename)
        assert.ok(bytes.includes(`CUCUMBER_LOG_ATTEMPT_${prior}`))
        if (fs.existsSync(`${filename}.closed`)) {
            assert.deepEqual(bytes, fs.readFileSync(`${filename}.closed`))
        } else {
            fs.writeFileSync(`${filename}.closed`, bytes)
        }
    }
    assert.equal(attempt, 3, 'controlled spec-file retry')
})
