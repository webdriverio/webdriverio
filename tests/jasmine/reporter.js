beforeAll(() => { })
afterAll(() => { })

// ignored in repoter: https://github.com/webdriverio/webdriverio/issues/4582
it('root level test', () => {})

describe('Jasmine reporter', () => {
    beforeAll(() => { })

    // not shown in reporter
    beforeEach(() => {})

    // not shown in reporter
    afterEach(() => {})

    it('should pass', async () => {
        expect(await browser.getTitle()).toBe('Mock Page Title')
    })

    it('should fail', async () => {
        expect(await browser.getTitle()).toBe('Oh, no!')
    })

    describe('Jasmine nested suite', () => {
        afterAll(() => { })

        // not shown in reporter but fails the test
        beforeEach(() => {
            throw new Error('beforeEach failure in nested suite')
        })

        // not shown in reporter but fails the test
        afterEach(() => {
            throw new Error('afterEach failure in nested suite')
        })

        it('nested test failed by each hooks', () => {})
    })
})
