import { multiRemoteBrowser, expect } from '@wdio/globals'
import type { ElementArray } from 'webdriverio'
import { Key, multiremote } from 'webdriverio'

let browserA: WebdriverIO.Browser
let browserB: WebdriverIO.Browser

process.env.WDIO_ENABLE_MULTI_REMOTE_SELECT = 'true'

describe('multi remote test', () => {
    before(() => {
        browserA = multiRemoteBrowser.getInstance('browserA')
        browserB = multiRemoteBrowser.getInstance('browserB')
    })

    it.skip('should also detect non PWAs', async () => {
        await browserA.url('https://json.org')
        await browserB.url('https://webdriver.io')

        await multiRemoteBrowser.pause(1000)

        /**
         * Unfortunately we don't know which result is from which browser
         */
        const results = (await multiRemoteBrowser.checkPWA() as unknown as []).map((result: { passed: boolean }) => result.passed)
        expect(typeof results[0]).toBe('boolean')
        expect(typeof results[1]).toBe('boolean')
        expect(results[0] !== results[1]).toBeTruthy()
    })

    describe('chat test', () => {
        it('should open chat application', async () => {
            browserA = await multiRemoteBrowser.getInstance('browserA')
            browserB = await multiRemoteBrowser.getInstance('browserB')
            await multiRemoteBrowser.url('https://socketio-chat-h9jt.herokuapp.com/')
        })

        it.skip('should login the browser A', async () => {
            const nameInput = await browserA.$('.usernameInput')
            await nameInput.addValue('Browser A')
            await browserA.keys(Key.Enter)
            await expect(browserA.$('.inputMessage')).toHaveAttribute('placeHolder', 'Type here...')
        })

        it.skip('should login the browser B', async () => {
            const nameInput = await browserB.$('.usernameInput')
            await nameInput.addValue('Browser B')
            await browserB.keys(Key.Enter)
            await expect(browserB.$('.inputMessage')).toHaveAttribute('placeHolder', 'Type here...')
        })

        it('can access shared store', async () => {
            expect(await browser.sharedStore.get('foo')).toBe('bar')
            expect(await browserA.sharedStore.get('foo')).toBe('bar')
            expect(await browserB.sharedStore.get('foo')).toBe('bar')
        })
    })

    it('can add a locator strategy', async () => {
        multiRemoteBrowser.addLocatorStrategy('selectHeader', (selector: any) => document.querySelector(selector) as HTMLElement)

        expect(multiRemoteBrowser.addLocatorStrategy).toBeDefined()
    })

    describe('Multi-remote instance', () => {
        it('should have 3 browser titles', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

            const titles = await multiRemoteBrowser.getTitle()

            expect(titles).toEqual([
                'WebdriverJS Testpage',
                'WebdriverJS Testpage',
                'WebdriverJS Testpage'
            ])
            expect(await multiRemoteBrowser.$('header').$('h1').isExisting()).toEqual([true, true, true])
            expect(await multiRemoteBrowser.$('header').$('h1').getText()).toEqual([
                'WebdriverJS Testpage',
                'WebdriverJS Testpage',
                'WebdriverJS Testpage'
            ])
        })

        describe('select', () => {
            it('should be able to select one specific instance on multi-remote element', async () => {
                await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

                const title = multiRemoteBrowser.$('header').$('h1')
                const browserAHeader = title.unstable_select('browserA')

                expect(await browserAHeader.instances).toEqual(['browserA'])
                expect(await browserAHeader.isExisting()).toEqual([true])

                const browserAText = await browserAHeader.getText()
                expect(browserAText).toEqual(['WebdriverJS Testpage'])
            })

            it('should be able to select two specific instance on multi-remote element', async () => {
                await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

                const title = multiRemoteBrowser.$('header').$('h1')
                const browserAHeader = title.unstable_select('browserA', 'browserC')

                expect(await browserAHeader.instances).toEqual(['browserA', 'browserC'])
                expect(await browserAHeader.isExisting()).toEqual([true, true])

                const browserAText = await browserAHeader.getText()
                expect(browserAText).toEqual(['WebdriverJS Testpage', 'WebdriverJS Testpage'])
            })

            it('should be able to select multiple instances with a non existing one', async () => {
                await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

                const title = multiRemoteBrowser.$('header').$('h1')
                const browserAHeader = title.unstable_select('browserA', 'browserC', 'non-existing')

                expect(await browserAHeader.instances).toEqual(['browserA', 'browserC'])
                expect(await browserAHeader.isExisting()).toEqual([true, true])

                const browserAText = await browserAHeader.getText()
                expect(browserAText).toEqual(['WebdriverJS Testpage', 'WebdriverJS Testpage'])
            })

            it('should throws if no valid instances are selected', async () => {
                await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

                const title = multiRemoteBrowser.$('header').$('h1')
                // @ts-expect-error: rejects seems missing...
                await expect(() => title.unstable_select('non-existing').instances).rejects.toThrow('None of the following requested instances are valid: non-existing')
            })

            it('should be able to select 1 instance on the multi-remote browser', async () => {
                await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')
                await browserB.url('about:blank')

                // Select only browserA, so browserB's missing element shouldn't matter
                const header = await multiRemoteBrowser.unstable_select('browserA').$('header')

                expect(await header.instances).toEqual(['browserA'])
                expect(await header.isExisting()).toEqual([true])
            })

            it('should be able to select 2 instances on the multi-remote browser', async () => {
                await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')
                await browserB.url('about:blank')

                const header = await multiRemoteBrowser.unstable_select('browserA', 'browserB').$('header')

                expect(await header.instances).toEqual(expect.arrayContaining(['browserA', 'browserB']))
                expect(await header.isExisting()).toEqual([true, false])
            })

            it('should be able to select 2 instances on the multi-remote browser and a non-existing one', async () => {
                await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')
                await browserB.url('about:blank')

                const header = await multiRemoteBrowser.unstable_select('browserA', 'browserB', 'non-existing').$('header')

                expect(await header.instances).toEqual(expect.arrayContaining(['browserA', 'browserB']))
                expect(await header.isExisting()).toEqual([true, false])
            })

            it('should throw when no valid instances are selected', async () => {
                await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')
                await browserB.url('about:blank')

                // @ts-expect-error: rejects seems missing...
                await expect(async () => multiRemoteBrowser.unstable_select('non-existing')).rejects.toThrow('None of the following requested instances are valid: non-existing')
            })

            it('should allow chaining select with 1 browser on element query', async () => {
                await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

                const header = await multiRemoteBrowser.unstable_select('browserA').$('header').$('h1').getText()

                expect(header).toEqual(['WebdriverJS Testpage'])
            })

            it('should allow chaining select with 2 browser on element query', async () => {
                await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

                const header = await multiRemoteBrowser.unstable_select('browserA', 'browserC').$('header').$('h1').getText()

                expect(header).toEqual(['WebdriverJS Testpage', 'WebdriverJS Testpage'])
            })

            it('should keep instance scope when using select on a chained $ from an element', async () => {
                await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

                expect(await browserA.$('header').$('h1').getText()).toEqual('WebdriverJS Testpage')

                // On browser, using select we do keep the selected instance scope, so we can chain $ and get the element from the selected browser
                const browserChainedText = await multiRemoteBrowser.unstable_select('browserA').$('header').$('h1').getText()
                expect(browserChainedText).toEqual(['WebdriverJS Testpage'])

                // Selecting only for value it works!
                const elementTextFromChainedSelected = await multiRemoteBrowser.$('header').$('h1').unstable_select('browserA').getText()
                expect(elementTextFromChainedSelected).toEqual(['WebdriverJS Testpage'])

                // However, should we do the same when selecting on a element and chaining $()?
                const elementTextFromChainedParentSelected = await multiRemoteBrowser.$('header').unstable_select('browserA').$('h1').getText()
                expect(elementTextFromChainedParentSelected).toEqual(['WebdriverJS Testpage'])
            })

            describe('Dynamically created multiremote browser', () => {
                let customMultiRemoteBrowser: WebdriverIO.MultiRemoteBrowser
                before(async () => {
                    customMultiRemoteBrowser = await multiremote({
                        browserA: {
                            capabilities: {
                                browserName: 'chrome',
                                browserVersion: 'stable',
                                'goog:chromeOptions': {
                                    args: ['headless', 'disable-gpu']
                                }
                            } },
                        browserB: {
                            capabilities: {
                                browserName: 'firefox',
                                browserVersion: 'stable',
                                'moz:firefoxOptions': {
                                    args: ['-headless']
                                }
                            } }
                    })
                })

                it('should be able to select 2 instances on the browser', async () => {
                    const selected = await customMultiRemoteBrowser.unstable_select('browserA', 'browserB')

                    expect(selected.instances).toEqual(['browserA', 'browserB'])
                    expect(selected.getInstance('browserA')).toBeDefined()
                    expect(selected.getInstance('browserB')).toBeDefined()
                })

                it('should be able to select 2 instances on the element', async () => {
                    const selected = await customMultiRemoteBrowser.$('h1').unstable_select('browserA', 'browserB')

                    expect(selected.instances).toEqual(['browserA', 'browserB'])
                    expect(selected.getInstance('browserA')).toBeDefined()
                    expect(selected.getInstance('browserB')).toBeDefined()
                    expect(() => selected.getInstance('browserC')).toThrow('Multiremote object has no instance named "browserC"')
                })

                it('should be able to chain select', async () => {
                    const selected = await customMultiRemoteBrowser.$('h1').unstable_select('browserA', 'browserB').unstable_select('browserA')

                    expect(selected.instances).toEqual(['browserA'])
                    expect(selected.getInstance('browserA')).toBeDefined()
                    expect(() => selected.getInstance('browserB')).toThrow('Multiremote object has no instance named "browserB"')
                })

                it('should be able to select 2 instances on the element', async () => {
                    const selected = await customMultiRemoteBrowser.$('h1')

                    expect(selected.getInstance('browserA')).toBeDefined()
                })

            })

            describe('should preserve custom commands, capabilities and more', () => {
                before(async () => {
                    await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')
                    multiRemoteBrowser.addCommand(
                        'customCommand',
                        async function (this: WebdriverIO.Browser) {
                            return this.getTitle()
                        }
                    )
                    multiRemoteBrowser.addCommand(
                        'customElementCommand',
                        async function (this: WebdriverIO.Element) {
                            return this.getText()
                        },
                        { attachToElement: true }
                    )
                })

                it('should have custom commands on multiRemoteBrowser ', async () => {
                    // @ts-expect-error custom element command is not part of the default type
                    expect(await multiRemoteBrowser.customCommand()).toEqual(['WebdriverJS Testpage', 'WebdriverJS Testpage', 'WebdriverJS Testpage'])
                })

                it('should have custom commands on queried element from original multiRemoteBrowser', async () => {
                    const selectedElement = await multiRemoteBrowser.$('h1')

                    // @ts-expect-error custom element command is not part of the default type
                    expect(await selectedElement.customElementCommand()).toEqual(['WebdriverJS Testpage', 'WebdriverJS Testpage', 'WebdriverJS Testpage'])
                })

                it('should preserve custom commands when selecting browser', async () => {
                    const selectedBrowser = multiRemoteBrowser.unstable_select('browserA', 'browserB')

                    // @ts-expect-error custom element command is not part of the default type
                    expect(await selectedBrowser.customCommand()).toEqual(['WebdriverJS Testpage', 'WebdriverJS Testpage'])
                })

                it('preserve overridden commands on multiRemoteBrowser', async () => {
                    multiRemoteBrowser.overwriteCommand('getCookies', async function (_originalCommand) {
                        return 'getCookies (overwritten)'
                    })

                    expect(await multiRemoteBrowser.getCookies()).toBe('getCookies (overwritten)')
                    expect(await multiRemoteBrowser.unstable_select('browserA', 'browserB').getCookies()).toBe('getCookies (overwritten)')
                })

                it('preserve overridden elements commands on multiRemoteBrowser', async () => {
                    multiRemoteBrowser.overwriteCommand('getValue', async function (_originalCommand) {
                        return 'getValue (overwritten)'
                    }, true)

                    expect(await multiRemoteBrowser.$('header').$('h1').getValue()).toEqual(['getValue (overwritten)', 'getValue (overwritten)', 'getValue (overwritten)'])
                    expect(await multiRemoteBrowser.unstable_select('browserA', 'browserB').$('header').$('h1').getValue()).toEqual(['getValue (overwritten)', 'getValue (overwritten)'])
                    expect(await multiRemoteBrowser.$('header').$('h1').unstable_select('browserA', 'browserB').getValue()).toEqual(['getValue (overwritten)', 'getValue (overwritten)'])
                })

                it('should preserve custom commands when selecting element', async () => {

                    const selectedHeaderOnBrowser = await multiRemoteBrowser.unstable_select('browserA', 'browserB').$('header').$('h1')
                    const selectedHeaderOnElement = await multiRemoteBrowser.$('header').$('h1').unstable_select('browserA', 'browserB')

                    // @ts-expect-error custom element command is not part of the default type
                    expect(await selectedHeaderOnBrowser.customElementCommand()).toEqual(['WebdriverJS Testpage', 'WebdriverJS Testpage'])
                    // @ts-expect-error custom element command is not part of the default type
                    expect(await selectedHeaderOnElement.customElementCommand()).toEqual(['WebdriverJS Testpage', 'WebdriverJS Testpage'])
                })

                it('should preserved addLocatorStrategy', async () => {
                    multiRemoteBrowser.addLocatorStrategy('staticStrategy', (_selector: any) => ({ elementId: 'static' }) as unknown as HTMLElement)
                    const selected = multiRemoteBrowser.unstable_select('browserA')

                    expect(multiRemoteBrowser.addLocatorStrategy).toBeDefined()
                    expect(selected.addLocatorStrategy).toBeDefined()
                })

                it('should preserve non-command properties when selecting a browser', async () => {

                    const selected = multiRemoteBrowser.unstable_select('browserA', 'browserB')

                    expect(browserA.strategies).toBeInstanceOf(Map)
                    expect(browserA.isW3C).toBe(true)
                    expect(browserA.isMobile).toBe(false)
                    expect(browserA.isIOS).toBe(false)
                    expect(browserA.isAndroid).toBe(false)
                    expect(browserA.isFirefox).toBe(false)
                    expect(browserA.isSauce).toBe(false)
                    expect(browserA.isSeleniumStandalone).toBe(false)
                    expect(browserA.isBidi).toBe(true)
                    expect(browserA.isChromium).toBe(true)
                    expect(browserA.isWindowsApp).toBe(false)
                    expect(browserA.isMacApp).toBe(false)
                    expect(browserA.puppeteer).toBeDefined()
                    expect(browserA.isNativeContext).toBe(false)
                    expect(browserA.mobileContext).toBe(undefined)
                    expect(browserA.isMultiremote).toBe(undefined)

                    expect(multiRemoteBrowser.strategies).toBeInstanceOf(Map)
                    expect(multiRemoteBrowser.isW3C).toBe(true)
                    expect(multiRemoteBrowser.isMobile).toBe(false)
                    expect(multiRemoteBrowser.isIOS).toBe(false)
                    expect(multiRemoteBrowser.isAndroid).toBe(false)
                    expect(multiRemoteBrowser.isFirefox).toBe(false)
                    expect(multiRemoteBrowser.isSauce).toBe(false)
                    expect(multiRemoteBrowser.isSeleniumStandalone).toBe(false)
                    expect(multiRemoteBrowser.isBidi).toBe(false)
                    expect(multiRemoteBrowser.isChromium).toBe(false)
                    expect(multiRemoteBrowser.isWindowsApp).toBe(false)
                    expect(multiRemoteBrowser.isMacApp).toBe(false)
                    expect(multiRemoteBrowser.puppeteer).toBeDefined()
                    expect(multiRemoteBrowser.isNativeContext).toBe(false)
                    expect(multiRemoteBrowser.mobileContext).toBe(undefined)
                    expect(multiRemoteBrowser.isMultiremote).toBe(true)

                    expect(selected.strategies).toEqual(multiRemoteBrowser.strategies)
                    expect(selected.isW3C).toBe(multiRemoteBrowser.isW3C)
                    expect(selected.isMobile).toBe(multiRemoteBrowser.isMobile)
                    expect(selected.isIOS).toBe(multiRemoteBrowser.isIOS)
                    expect(selected.isAndroid).toBe(multiRemoteBrowser.isAndroid)
                    expect(selected.isFirefox).toBe(multiRemoteBrowser.isFirefox)
                    expect(selected.isSauce).toBe(multiRemoteBrowser.isSauce)
                    expect(selected.isSeleniumStandalone).toBe(multiRemoteBrowser.isSeleniumStandalone)
                    expect(selected.isBidi).toBe(multiRemoteBrowser.isBidi)
                    expect(selected.isChromium).toBe(multiRemoteBrowser.isChromium)
                    expect(selected.isWindowsApp).toBe(multiRemoteBrowser.isWindowsApp)
                    expect(selected.isMacApp).toBe(multiRemoteBrowser.isMacApp)
                    expect(selected.puppeteer).toBe(multiRemoteBrowser.puppeteer)
                    expect(selected.isNativeContext).toBe(multiRemoteBrowser.isNativeContext)
                    expect(selected.mobileContext).toBe(multiRemoteBrowser.mobileContext)
                    expect(selected.isMultiremote).toBe(multiRemoteBrowser.isMultiremote)
                })
            })
        })

        it('should always have selector for MultiRemoteElement[] when some browsers have no matching elements', async () => {

            await multiRemoteBrowser.getInstance('browserA').url('about:blank')
            await multiRemoteBrowser.getInstance('browserB').url('about:blank')
            await multiRemoteBrowser.getInstance('browserC').url('https://guinea-pig.webdriver.io/')

            const elements = await multiRemoteBrowser.$$('h1')

            expect(elements).toHaveLength(2)
            expect(elements[0].selector).toBe('h1')
            expect(elements[1].selector).toBe('h1')
        })

        describe('when enabling process.env.WDIO_ENABLE_MULTI_REMOTE_ELEMENT_ARRAY', () => {
            before(() => {
                process.env.WDIO_ENABLE_MULTI_REMOTE_ELEMENT_ARRAY = 'true'
            })

            after(() => {
                process.env.WDIO_ENABLE_MULTI_REMOTE_ELEMENT_ARRAY = 'false'
            })

            it('should return an ElementArray at runtime', async () => {
                await multiRemoteBrowser.getInstance('browserA').url('about:blank')
                await multiRemoteBrowser.getInstance('browserB').url('about:blank')
                await multiRemoteBrowser.getInstance('browserC').url('about:blank')

                const elements = await multiRemoteBrowser.$$('h1')

                expect(elements).toHaveLength(0)
                expect(elements).toHaveProperty('selector')
                expect((elements as unknown as ElementArray).selector).toBe('h1')
                expect((elements as unknown as ElementArray).foundWith).toBe('$$')
                expect((elements as unknown as ElementArray).parent).toBeDefined()
                expect((elements as unknown as ElementArray).getElements).toBeDefined()
                expect(Array.isArray(elements)).toBe(true)
            })
        })

        it('should be able to query isDisplayed on element no longer existing', async () => {
            await multiRemoteBrowser.url('https://guinea-pig.webdriver.io/')

            const h1 = multiRemoteBrowser.$('h1')
            const browserAH1 = multiRemoteBrowser.getInstance('browserA').$('h1')
            const browserBH1 = multiRemoteBrowser.getInstance('browserB').$('h1')
            const browserCH1 = multiRemoteBrowser.getInstance('browserC').$('h1')
            await multiRemoteBrowser.getInstance('browserA').url('about:blank')

            expect(await browserAH1.isDisplayed()).toBe(false)
            expect(await browserBH1.isDisplayed()).toBe(true)
            expect(await browserCH1.isDisplayed()).toBe(true)
            expect(await h1.isDisplayed()).toEqual(expect.arrayContaining([false, true, true]))
        })
    })
})
