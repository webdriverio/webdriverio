import { expect, browser, $ } from '@wdio/globals'

describe('My Login application 3', () => {
    it('should login with valid credentials 3', async () => {
        await browser.url('https://the-internet.herokuapp.com/login')

        await $('#username').setValue('tomsmith')
        await $('#password').setValue('SuperSecretPassword!')
        await $('button[type="submit"]').click()

        await expect($('#flash')).toBeDisplayed()

        await expect({ a: 'a' }).toMatchSnapshot()
    })
    describe('My Login application 3 - 2', () => {
        it('should login with valid credentials 3-2', async () => {
            await expect({ a: 'a' }).toMatchSnapshot()
        })
        describe('My Login application 5 - 6', () => {
            it('should login with valid credentials 5-6', async () => {
                await expect({ a: 'a' }).toMatchSnapshot()
                const element = await $('#flash')
                const html = await element.getHTML()
                await expect(html).toMatchSnapshot()
            })
        })
    })
})
