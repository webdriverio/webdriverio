/**
 * Used by `real-jasmine.test.ts`: the spec passes, a top level `afterAll` fails.
 */
describe('passing suite', () => {
    it('passes', () => {
        expect(1).toBe(1)
    })
})

afterAll(() => {
    throw new Error('top level afterAll failed')
})
