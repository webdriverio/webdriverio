const assert = require('assert')

describe('Jasmine smoke test', () => {
    it('should return sync value', () => {
        expect(browser).toHaveTitle('Mock Page Title')
    })

    let hasRun = false
    it('should retry', function () {
        if (!hasRun) {
            hasRun = true
            assert.equal(this.wdioRetries, 0)
            throw new Error('booom!')
        }

        expect(this.wdioRetries).toBe(1)
    }, 1)
})
