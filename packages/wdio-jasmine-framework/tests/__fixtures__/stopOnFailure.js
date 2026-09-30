/**
 * Used by `real-jasmine.test.ts`: with `oneFailurePerSpec`, the statement after
 * a failed sync `expect` must not run, and the next spec must still run.
 */
globalThis.__wdioStopOnFailure = []

describe('oneFailurePerSpec', () => {
    it('stops after a failed sync expect', () => {
        globalThis.__wdioStopOnFailure.push('before')
        expect(1).toBe(2)
        globalThis.__wdioStopOnFailure.push('after')
    })

    it('runs the next spec', () => {
        globalThis.__wdioStopOnFailure.push('next')
        expect(1).toBe(1)
    })
})
