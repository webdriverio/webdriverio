import { multiRemoteBrowser, expect } from '@wdio/globals'
import { setFeatureFlags } from 'expect-webdriverio'
import { some } from 'expect-webdriverio/api'

/**
 * Recommended by expect-webdriverio for multi-remote assertions, see
 * https://github.com/webdriverio/expect-webdriverio/blob/v7/docs/MultiRemote.md#requirements--configuration
 */
process.env.WDIO_ENABLE_MULTI_REMOTE_ELEMENT_ARRAY = 'true'
process.env.WDIO_ENABLE_MULTI_REMOTE_SELECT = 'true'

const FIRST_PAGE_URL = 'https://guinea-pig.webdriver.io/'
const SECOND_PAGE_URL = 'https://guinea-pig.webdriver.io/two.html'
const FIRST_PAGE_TITLE = 'WebdriverJS Testpage'
const SECOND_PAGE_TITLE = 'two'
const LOCALES = { browserA: 'en', browserB: 'fr', browserC: 'de' }
const WIDTHS = { browserA: 100, browserB: 200, browserC: 300 }

let browserA: WebdriverIO.Browser
let browserB: WebdriverIO.Browser
let browserC: WebdriverIO.Browser

describe('multi remote expect', () => {
    before(() => {
        browserA = multiRemoteBrowser.getInstance('browserA')
        browserB = multiRemoteBrowser.getInstance('browserB')
        browserC = multiRemoteBrowser.getInstance('browserC')

        // Required by `toHaveText` and `some()` on multi-remote elements
        setFeatureFlags({ useToHaveTextStrictMultiElementsCompareStrategy: true })
    })

    after(() => {
        setFeatureFlags({ useToHaveTextStrictMultiElementsCompareStrategy: false })
    })

    describe('same page on every instance', () => {
        beforeEach(async () => {
            await multiRemoteBrowser.url(FIRST_PAGE_URL)
        })

        it('should assert the browser with one expected value for every instance', async () => {
            await expect(multiRemoteBrowser).toHaveTitle(FIRST_PAGE_TITLE)
            await expect(multiRemoteBrowser).toHaveUrl(FIRST_PAGE_URL)
            await expect(multiRemoteBrowser).not.toHaveTitle(SECOND_PAGE_TITLE)
        })

        it('should assert an element with one expected value for every instance', async () => {
            const title = multiRemoteBrowser.$('header h1')

            await expect(title).toBeDisplayed()
            await expect(title).toHaveText(FIRST_PAGE_TITLE)
            await expect(multiRemoteBrowser.$('#purplebox')).toHaveAttribute('data-foundBy', 'id')
            await expect(multiRemoteBrowser.$('#purplebox')).toHaveElementClass('purple')
        })

        it('should assert elements with one expected value for every instance', async () => {
            const links = multiRemoteBrowser.$$('header a')

            await expect(links).toBeDisplayed()
            await expect(links).toBeElementsArrayOfSize(3)
            await expect(links).toHaveText(['3', '2', '1'])
            await expect(links).toHaveText(expect.arrayContaining(['2']))
            await expect(some(links)).toHaveText('2')
        })

        it('should pass on non existing elements with .not', async () => {
            const elements = multiRemoteBrowser.$$('.doesNotExist')

            await expect(elements).not.toExist()
            await expect(elements).toBeElementsArrayOfSize(0)
        })

        it('should match an inline snapshot that is the same on every instance', async () => {
            await expect(multiRemoteBrowser.$('header h1')).toMatchInlineSnapshot('"<h1>WebdriverJS Testpage</h1>"')
        })

        it('should assert the mocks of every instance', async () => {
            const mocks = await multiRemoteBrowser.mock('https://cdn.jsdelivr.net/npm/hammerjs@1.1.3/hammer.min.js', {
                method: 'get',
                statusCode: 200
            })

            await multiRemoteBrowser.url(FIRST_PAGE_URL)

            await expect(mocks).toBeRequested()
            await expect(mocks).toBeRequestedTimes({ gte: 1 })
            await expect(mocks).toBeRequestedWith({ method: 'GET', statusCode: 200 })

            // `multiRemoteBrowser.mockRestoreAll()` restores the same mocks from every instance at once, so restore each mock once
            for (const mock of mocks) {
                await mock.restore()
            }
        })
    })

    describe('different page per instance', () => {
        beforeEach(async () => {
            await Promise.all([
                browserA.url(FIRST_PAGE_URL),
                browserB.url(SECOND_PAGE_URL),
                browserC.url(FIRST_PAGE_URL)
            ])
        })

        it('should assert the browser with one expected value per instance', async () => {
            await expect(multiRemoteBrowser).toHaveTitle(expect.multiRemote({
                browserA: FIRST_PAGE_TITLE,
                browserB: SECOND_PAGE_TITLE,
                browserC: expect.stringContaining('Testpage')
            }))
            await expect(multiRemoteBrowser).toHaveUrl(expect.multiRemote({
                browserA: FIRST_PAGE_URL,
                browserB: SECOND_PAGE_URL,
                browserC: FIRST_PAGE_URL
            }))
        })

        it('should support the plain object shorthand for one expected value per instance', async () => {
            await expect(multiRemoteBrowser).toHaveTitle({
                browserA: FIRST_PAGE_TITLE,
                browserB: SECOND_PAGE_TITLE,
                browserC: FIRST_PAGE_TITLE
            })
        })

        it('should support expect.oneOf() for every instance', async () => {
            await expect(multiRemoteBrowser).toHaveTitle(expect.oneOf(FIRST_PAGE_TITLE, SECOND_PAGE_TITLE))
        })

        it('should fail when one instance does not match the single expected value', async () => {
            await expect(expect(multiRemoteBrowser).toHaveTitle(FIRST_PAGE_TITLE, { wait: 0 }))
                .rejects.toThrow(/browserB/)
        })

        it('should fail with .not when one instance matches', async () => {
            await expect(multiRemoteBrowser).not.toHaveTitle('Unknown title')
            await expect(expect(multiRemoteBrowser).not.toHaveTitle(SECOND_PAGE_TITLE, { wait: 0 }))
                .rejects.toThrow(/not to have title[\s\S]*"browserB": "two"/)
        })

        it('should fail when an instance is missing in expect.multiRemote()', async () => {
            await expect(expect(multiRemoteBrowser).toHaveTitle(expect.multiRemote({
                browserA: FIRST_PAGE_TITLE,
                browserB: SECOND_PAGE_TITLE
            }))).rejects.toThrow(/to have title[\s\S]*\+\s+"browserC": "WebdriverJS Testpage"/)
        })

        it('should assert only the selected instances', async () => {
            await expect(multiRemoteBrowser.select('browserA', 'browserC')).toHaveTitle(FIRST_PAGE_TITLE)
            await expect(multiRemoteBrowser.select('browserB')).toHaveTitle(SECOND_PAGE_TITLE)
            await expect(multiRemoteBrowser.select('browserA', 'browserC').$$('header a')).toBeElementsArrayOfSize(3)
            await expect(multiRemoteBrowser.$('.page').select('browserB')).toHaveText('Second page!')
        })

        it('should assert the elements of every instance with one expected value per instance', async () => {
            const links = multiRemoteBrowser.$$('header a')

            await expect(links).toBeElementsArrayOfSize(expect.multiRemote({
                browserA: 3,
                browserB: 2,
                browserC: { gte: 3 }
            }))
            await expect(links).toHaveText(expect.multiRemote({
                browserA: ['3', '2', '1'],
                browserB: ['2', '1'],
                browserC: ['3', '2', '1']
            }))
            await expect(links).toHaveText(expect.arrayContaining(['2', '1']))
        })

        it('should re-fetch the elements of every instance between retries', async () => {
            await browserB.execute(() => {
                setTimeout(() => {
                    const link = document.createElement('a')
                    link.textContent = '3'
                    document.querySelector('header')!.prepend(link)
                }, 500)
            })

            await expect(multiRemoteBrowser.$$('header a')).toHaveText(['3', '2', '1'])
        })

        it('should assert an element with one expected value per instance', async () => {
            await Promise.all(Object.entries(LOCALES).map(([instance, locale]) => (
                multiRemoteBrowser.getInstance(instance).execute((locale, width) => {
                    const title = document.querySelector('header h1') as HTMLElement
                    title.setAttribute('data-locale', locale)
                    title.style.width = `${width}px`
                }, locale, WIDTHS[instance as keyof typeof WIDTHS])
            )))

            const title = multiRemoteBrowser.$('header h1')

            await expect(title).toHaveText(FIRST_PAGE_TITLE)
            await expect(title).toHaveAttribute('data-locale', expect.multiRemote(LOCALES))
            await expect(title).toHaveWidth(expect.multiRemote(WIDTHS))
            await expect(title).toHaveWidth(expect.multiRemote({ ...WIDTHS, browserC: { gte: 250, lte: 350 } }))
        })

        it('should match an inline snapshot per instance when instances differ', async () => {
            await Promise.all(Object.entries(LOCALES).map(([instance, locale]) => (
                multiRemoteBrowser.getInstance(instance).execute((locale) => {
                    document.querySelector('header h1')!.setAttribute('data-locale', locale)
                }, locale)
            )))

            await expect(multiRemoteBrowser.$('header h1')).toMatchInlineSnapshot(`
              {
                "browserA": "<h1 data-locale="en">WebdriverJS Testpage</h1>",
                "browserB": "<h1 data-locale="fr">WebdriverJS Testpage</h1>",
                "browserC": "<h1 data-locale="de">WebdriverJS Testpage</h1>",
              }
            `)
        })

        it('should assert the local storage with one expected value per instance', async () => {
            await Promise.all(Object.entries(LOCALES).map(([instance, locale]) => (
                multiRemoteBrowser.getInstance(instance).execute((locale) => {
                    localStorage.setItem('locale', locale)
                }, locale)
            )))

            await expect(multiRemoteBrowser).toHaveLocalStorageItem('locale')
            await expect(multiRemoteBrowser).toHaveLocalStorageItem('locale', expect.multiRemote(LOCALES))
            await expect(multiRemoteBrowser).toHaveLocalStorageItem('locale', expect.oneOf('en', 'fr', 'de'))

            await multiRemoteBrowser.execute(() => localStorage.clear())
        })
    })
})
