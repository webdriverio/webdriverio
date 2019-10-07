beforeAll(() => {})
afterAll(() => {
    throw new Error('afterAll failure in root scope')
})
beforeEach(() => {})

describe('Jasmine smoke test', () => {
    beforeAll(() => {
        throw new Error('beforeAll failure in suite scope')
    })
    afterAll(() => {})
    afterEach(() => {})

    it('should return sync value', () => {
        expect(browser.getTitle()).toBe('Mock Page Title')
    })

    let hasRun = false
    it('should retry', () => {
        if(!hasRun) {
            hasRun = true
            throw new Error('booom!')
        }
    }, 1)
})
