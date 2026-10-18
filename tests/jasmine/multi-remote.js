import { expect as globalsExpect } from '@wdio/globals'

describe('expect.multiRemote() with Jasmine', () => {
    it('gives one expected value per instance on the global expect', async () => {
        await expect(browser).toHaveTitle(expect.multiRemote({ browserA: 'Mock Page Title', browserB: 'Mock Page Title' }))
        await expect(browser).not.toHaveTitle(expect.multiRemote({ browserA: 'Other', browserB: 'Other' }))
    })

    it('gives one expected value per instance on the expect of @wdio/globals', async () => {
        await globalsExpect(browser).toHaveTitle(globalsExpect.multiRemote({ browserA: 'Mock Page Title', browserB: 'Mock Page Title' }))
    })
})
