/**
 * Used by `real-jasmine.test.ts`: the spec passes, the `afterAll` of its suite fails.
 */
describe('failing afterAll', () => {
    it('passes', () => {
        expect(1).toBe(1)
    })

    afterAll(() => {
        throw new Error('afterAll failed')
    })
})
