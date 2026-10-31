import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

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

    it('saves a screenshot in its own context', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        await browser.url(`${PARALLEL_FIXTURE_ORIGIN}/checkboxes`)
        const filepath = path.join(os.tmpdir(), `wdio-parallel-${process.pid}-${Date.now()}.png`)
        try {
            await browser.saveScreenshot(filepath)
            const png = await fs.readFile(filepath)
            expect(png.subarray(1, 4).toString()).toBe('PNG')
        } finally {
            await fs.rm(filepath, { force: true })
        }
    })

    // the cookie commands use the jar of the test window: Chrome rejected the sourceOrigin (CHIPS) partition
    it('sets, reads and deletes a cookie in its own context', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        await browser.url(`${PARALLEL_FIXTURE_ORIGIN}/checkboxes`)
        const value = `v${Date.now()}`
        await browser.setCookies({ name: 'parallel-e2e', value })
        expect((await browser.getCookies({ name: 'parallel-e2e' })).map((cookie) => cookie.value)).toEqual([value])
        expect(await browser.execute(() => document.cookie)).toContain(`parallel-e2e=${value}`)

        await browser.deleteCookies({ name: 'parallel-e2e' })
        expect(await browser.getCookies({ name: 'parallel-e2e' })).toEqual([])
        expect(await browser.execute(() => document.cookie)).not.toContain('parallel-e2e=')
    })

    // the jar of the window holds the cookies of every host and path; the commands keep those of the page
    it('reads and deletes only the cookies that the page sees', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        const names = async (sourceOrigin?: null) => (await browser.getCookies(undefined, sourceOrigin))
            .map((cookie) => cookie.name).filter((name) => name.startsWith('scope-')).sort()
        await browser.url(`${PARALLEL_FIXTURE_ORIGIN.replace('127.0.0.1', 'localhost')}/checkboxes`)
        await browser.setCookies({ name: 'scope-other-host', value: '1' })
        await browser.url(`${PARALLEL_FIXTURE_ORIGIN}/checkboxes`)
        await browser.setCookies([
            { name: 'scope-page', value: '1', sameSite: 'Strict' },
            { name: 'scope-other-path', value: '1', path: '/login' }
        ])

        expect(await names()).toEqual(['scope-page'])
        expect((await browser.getCookies({ name: 'scope-page' }))[0].sameSite).toBe('strict')
        expect(await names(null)).toEqual(['scope-other-host', 'scope-other-path', 'scope-page'])

        await browser.deleteCookies(['scope-page', 'scope-other-path', 'scope-other-host'])
        expect(await names(null)).toEqual(['scope-other-host', 'scope-other-path'])

        await browser.url('about:blank')
        expect(await names()).toEqual([])
        await expect(browser.setCookies({ name: 'scope-blank', value: '1' })).rejects.toThrow('the page has no host')

        // a filter with a domain deletes the cookies of that domain whatever page is open
        await browser.deleteCookies([{ name: 'scope-other-host', domain: 'localhost' }, { name: 'scope-other-path', domain: '127.0.0.1' }])
        expect(await names(null)).toEqual([])
    })
})
