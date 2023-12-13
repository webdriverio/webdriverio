import { snapshotExpect } from '@wdio/snapshot-service'

describe('WDIO Element matchers', () => {
    it('should able to use WDIO element matchers', async () => {
        await browser.url('https://the-internet.herokuapp.com/login')

        await $('#username').setValue('tomsmith')
        await $('#password').setValue('SuperSecretPassword!')
        await $('button[type="submit"]').click()
        await expect($('#flash')).toBeDisplayed()

        const element = await $('#flash')
        const html = await element.getHTML()
        await snapshotExpect(html).toMatchSnapshot()
        await snapshotExpect($('#flash')).toMatchElementSnapshot()
        await snapshotExpect($('#flash')).toMatchElementSnapshot('snapshot flash')
        await snapshotExpect($('#flash')).toMatchElementInlineSnapshot()
    })
})
