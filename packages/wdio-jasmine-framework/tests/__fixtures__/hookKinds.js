/**
 * Used by `hookKind.test.ts`: all-hooks at the top level, in an outer and in a nested suite
 */
beforeAll(() => {})
afterAll(() => {})

describe('outer suite', () => {
    beforeAll(() => {})
    beforeEach(() => {})
    afterEach(() => {})
    afterAll(() => {})

    describe('inner suite', () => {
        beforeAll(() => {})
        afterAll(() => {
            throw new Error('inner afterAll failed')
        })

        it('passes', () => {
            expect(1).toBe(1)
        })
    })
})
