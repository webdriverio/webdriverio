import { expect } from '@wdio/globals'

describe('This test', () => {
    it('should be passed', async () => {
        await expect(1).toEqual(1)
    })
})
