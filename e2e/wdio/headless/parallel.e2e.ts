import { browser, $, $$, expect } from '@wdio/globals'
import { PARALLEL_FIXTURE_ORIGIN } from '../parallelFixtureServer.js'

describe('parallel mode e2e test', () => {
    it('navigates the checkboxes page in its own context', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        const url = `${PARALLEL_FIXTURE_ORIGIN}/checkboxes`
        await browser.url(url)
        expect(await browser.getUrl()).toBe(url)
        await expect(browser).toHaveTitle('The Internet')

        const checkboxes = await $$('#checkboxes input')
        expect(await checkboxes[1].isSelected()).toBe(true)
        await checkboxes[0].click()
        expect(await checkboxes[0].isSelected()).toBe(true)
    })

    it('logs in on the login page in its own context', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        const url = `${PARALLEL_FIXTURE_ORIGIN}/login`
        await browser.url(url)
        expect(await browser.getUrl()).toBe(url)
        await expect($('h2')).toHaveText('Login Page')

        await $('#username').addValue('tomsmith')
        await $('#password').addValue('SuperSecretPassword!')
        expect(await $('#username').getValue()).toBe('tomsmith')
        expect(await $('#password').getValue()).toBe('SuperSecretPassword!')

        await $('button[type="submit"]').click()
        await expect(browser).toHaveUrl(`${PARALLEL_FIXTURE_ORIGIN}/secure`)
        await expect($('h2')).toHaveText('Secure Area')
    })

    it('selects a dropdown option in its own context', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        const url = `${PARALLEL_FIXTURE_ORIGIN}/dropdown`
        await browser.url(url)
        expect(await browser.getUrl()).toBe(url)

        const dropdown = await $('#dropdown')
        await dropdown.selectByAttribute('value', '2')
        expect(await dropdown.getValue()).toBe('2')
    })

    it('adds and removes elements in its own context', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        const url = `${PARALLEL_FIXTURE_ORIGIN}/add_remove_elements/`
        await browser.url(url)
        expect(await browser.getUrl()).toBe(url)

        await $('button').click()
        const addedButton = await $('.added-manually')
        await addedButton.waitForExist()
        expect(await addedButton.getText()).toBe('Delete')
        await addedButton.click()
        expect(await $('.added-manually').isExisting()).toBe(false)
    })

    it('types into the inputs page in its own context', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        const url = `${PARALLEL_FIXTURE_ORIGIN}/inputs`
        await browser.url(url)
        expect(await browser.getUrl()).toBe(url)

        const input = await $('input')
        await input.addValue('42')
        expect(await input.getValue()).toBe('42')
    })

    it('reads table cell text in its own context', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        const url = `${PARALLEL_FIXTURE_ORIGIN}/tables`
        await browser.url(url)
        expect(await browser.getUrl()).toBe(url)

        const firstNameCell = await $('#table1 tbody tr:nth-child(1) td:nth-child(2)')
        expect(await firstNameCell.getText()).toBe('John')
    })
})
