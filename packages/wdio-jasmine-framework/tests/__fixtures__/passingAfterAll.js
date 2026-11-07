/**
 * Used by `real-jasmine.test.ts`: the spec and the `afterAll` of its suite pass.
 */
describe('passing afterAll', () => {
    it('passes', () => {
        expect(1).toBe(1)
    })

    afterAll(() => {})
})
