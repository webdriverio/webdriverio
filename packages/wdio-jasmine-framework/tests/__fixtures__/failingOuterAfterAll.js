/**
 * Used by `real-jasmine.test.ts`: the outer suite has no specs of its own, only a
 * nested suite with a passing spec, and its `afterAll` fails.
 */
describe('outer suite', () => {
    describe('inner suite', () => {
        it('passes', () => {
            expect(1).toBe(1)
        })
    })

    afterAll(() => {
        throw new Error('outer afterAll failed')
    })
})
