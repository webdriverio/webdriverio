import assert from 'node:assert'

before(async () => {
    await browser.pause(10)
})

describe('my feature 1', () => {
    it('should do stuff 1', async () => {
        assert.equal(await browser.getTitle(), 'Mock Page Title')
        assert.equal(global.WDIO_SERVICE_BEFORE_SUITE.title, 'my feature 1')
    })
})

describe('my feature 2', () => {
    beforeEach(async () => {
        await browser.pause(2)
    })

    describe('my story 2.1', () => {
        it('should do stuff 2.1.1', async () => {
            await browser.pause(2)
        })

        afterEach(async () => {
            assert.equal(global.WDIO_SERVICE_TEST_IT_PASSES, 2)
            await browser.pause(2)
        })
    })

    describe('my story 2.2', () => {
        it('should do stuff 2.2.1', async () => {
            await browser.pause(2)
        })

        it.skip('should skip 2.2.2', async () => {
            await browser.pause(2)
        })

        it.skip('should skip 2.2.3')

        after(async () => {
            await browser.pause(2)
        })
    })
})

after(() => {
    assert.equal(global.WDIO_SERVICE_TEST_IT_DURATION > 0, true)
    assert.equal(global.WDIO_SERVICE_TEST_IT_PASSES, 3)

    assert.equal(global.WDIO_SERVICE_TEST_HOOK_DURATION > 0, true)
    assert.equal(global.WDIO_SERVICE_TEST_HOOK_PASSES, 5)
})
