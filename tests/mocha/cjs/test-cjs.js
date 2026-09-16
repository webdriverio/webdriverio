const assert = require('node:assert')
const path = require('node:path')

const logger = require('@wdio/logger').default

describe('a cjs test file', () => {
    it('should pass', () => {
        assert.equal(path.basename(__filename), 'test-cjs.js')
    })

    it('should be able to use logger', async () => {
        const user = {
            name: 'tomsmith',
            password: 'SuperSecretPassword!'
        }

        const log = logger('cjs-logging-test')
        log.info('logging', user)
    })
})

