import { snapshotExpect } from '@wdio/snapshot-service'

describe('Level 1 suite', () => {
    it('test1 1', async () => {
        await browser.url('https://the-internet.herokuapp.com/login')

        await $('#username').setValue('tomsmith')
        await $('#password').setValue('SuperSecretPassword!')
        await $('button[type="submit"]').click()

        await expect($('#flash')).toBeDisplayed()

        await snapshotExpect({ a: 'a' }).toMatchSnapshot()
    })
    describe('Level 2 suite', () => {
        it('test2 2', async () => {
            await snapshotExpect({ a: 'a' }).toMatchSnapshot()
        })
        describe('Level 3 suite', () => {
            it('test 3', async () => {
                await snapshotExpect({ a: 'a' }).toMatchSnapshot()
                const element = await $('#flash')
                const html = await element.getHTML()
                await snapshotExpect(html).toMatchSnapshot()
                await snapshotExpect($('#flash')).toMatchElementSnapshot()
            })
        })
    })
})
