import { browser, expect } from '@wdio/globals'

describe('inline snapshot callsites', () => {
    it('matches distinct snapshots without changing the spec', async () => {
        await browser.url('data:text/html,<h1>local-inline-alpha</h1>')
        await expect(browser.$('h1')).toMatchInlineSnapshot('"<h1>local-inline-alpha</h1>"')
        await expect('local-inline-beta').toMatchInlineSnapshot('"local-inline-beta"')
    })
})
