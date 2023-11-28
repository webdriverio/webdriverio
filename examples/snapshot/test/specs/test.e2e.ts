import { expect } from '@wdio/globals'

describe('My Login application', () => {
    it('should login with valid credentials', async () => {
        await browser.url('https://the-internet.herokuapp.com/login')

        await $('#username').setValue('tomsmith')
        await $('#password').setValue('SuperSecretPassword!')
        await $('button[type="submit"]').click()

        async function asyncFunction() {
            await new Promise(resolve => setTimeout(resolve, 1000))
            return { awaited: 'value' }
        }
        await expect(asyncFunction()).toMatchSnapshot()
        await expect({ a: 'a' }).toMatchSnapshot()
        await expect({ a2: 'a' }).toMatchSnapshot()
    })
})
