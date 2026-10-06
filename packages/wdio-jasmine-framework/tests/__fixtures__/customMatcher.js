/**
 * Used by `real-jasmine.test.ts`: a matcher added with `expect.extend()` after
 * the spec files are loaded, as the `before` hook does, must be available, also
 * in a top-level `beforeAll` of a spec file.
 */
beforeAll(async () => {
    await expect('foo').toBeFoo()
})

describe('expect.extend()', () => {
    it('uses the custom matcher', async () => {
        await expect('foo').toBeFoo()
        await expect('bar').not.toBeFoo()
    })
})
