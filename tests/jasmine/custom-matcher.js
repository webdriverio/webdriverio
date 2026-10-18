import { expect } from '@wdio/globals'

describe('expect.extend() in the before hook', () => {
    it('uses the custom matcher', async () => {
        await expect('foo').toBeFoo()
        await expect('bar').not.toBeFoo()
    })
})
