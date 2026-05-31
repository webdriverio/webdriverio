const assert = require('node:assert')
const path = require('node:path')

import logger from '@wdio/logger'

describe('a cjs test file', () => {
    it('should pass', () => {
        assert.equal(path.basename(__filename), 'test-cjs.js')
    })

    it('should be able to use logger', async () => {
        const user = {
            name: 'tomsmith',
            password: 'SuperSecretPassword!'
        }

        // logging as per https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-logger:
        const log = logger('My Login Test')
        log.info('logging in with user:', user)
    })
})

