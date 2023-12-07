import { expect, browser, $ } from '@wdio/globals'

describe('WDIO Element matchers', () => {
    it('should able to use WDIO element matchers', async () => {
        await browser.url('https://the-internet.herokuapp.com/login')

        await $('#username').setValue('tomsmith')
        await $('#password').setValue('SuperSecretPassword!')
        await $('button[type="submit"]').click()
        await expect($('#flash')).toBeDisplayed()

        const element = await $('#flash')
        const html = await element.getHTML()
        await expect(html).toMatchSnapshot()
        await expect($('#flash')).toMatchElementSnapshot()
        await expect($('#flash')).toMatchElementSnapshot('snapshot flash')
        await expect($('#flash')).toMatchElementInlineSnapshot()

        // snapshot browser object
        await expect(await browser.getAllCookies()).toMatchSnapshot()
        // snapshot elements directly
        await expect(element).toMatchElementSnapshot()
    })
})
