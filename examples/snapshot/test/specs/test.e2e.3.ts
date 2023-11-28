import { expect, browser, $ } from '@wdio/globals'

describe('My Login application', () => {
    it('should login with valid credentials', async () => {
        await browser.url('https://the-internet.herokuapp.com/login')

        await $('#username').setValue('tomsmith')
        await $('#password').setValue('SuperSecretPassword!')
        await $('button[type="submit"]').click()
        await expect($('#flash')).toBeDisplayed()

        const element = await $('#flash')
        const html = await element.getHTML()
        await expect(html).toMatchSnapshot()
    })
})
