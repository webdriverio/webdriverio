/// <reference types="@wdio/lighthouse-service" />

import fs from 'node:fs/promises'
import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import { browser, $, expect } from '@wdio/globals'

import { imageSize } from 'image-size'
import type { InputOptions } from 'webdriverio'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

describe('main suite 1', () => {
    it('supports snapshot testing', async () => {
        await browser.url('https://guinea-pig.webdriver.io/')
        await expect($('.findme')).toMatchSnapshot()
        await expect($('.findme')).toMatchInlineSnapshot('"<h1 class="findme">Test CSS Attributes</h1>"')
    })

    it('should support input value with sensitive information', async () => {
        await browser.url('https://guinea-pig.webdriver.io/')

        const firstInput = await $('input')
        await firstInput.setValue('mySecretPassword', { mask: true } satisfies InputOptions)

        // Note: Doing the below will expose the password in the logs, check to support this command one day!
        const inputValue = await firstInput.getValue()
        expect(inputValue).toBe('mySecretPassword')
    })

    it('should support custom element command on non-existing elements', async () => {
        await browser.url('https://guinea-pig.webdriver.io/')
        browser.addCommand('myElementCustomCommand', async function () {
            return 'myElementCommandResult'
        }, {
            attachToElement: true,
            disableElementImplicitWait: true
        })

        // @ts-expect-error
        const result = await $('nonExistingElement').myElementCustomCommand()

        expect(result).toBe('myElementCommandResult')
    })

    it.skip('should allow to check for PWA', async () => {
        await browser.url('https://webdriver.io')
        // eslint-disable-next-line wdio/no-pause
        await browser.pause(100)
        expect((await browser.checkPWA([
            'isInstallable',
            'splashScreen',
            'themedOmnibox',
            'contentWith',
            'viewport',
            'appleTouchIcon',
            'maskableIcon'
        ])).passed).toBe(true)
    })

    it.skip('should also detect non PWAs', async () => {
        await browser.url('https://json.org')
        expect((await browser.checkPWA()).passed).toBe(false)
    })

    it('can query shadow elements', async () => {
        await browser.url('https://the-internet.herokuapp.com/shadowdom')
        await $('h1').waitForDisplayed()
        await expect($('ul[slot="my-text"] li:last-child')).toHaveText('In a list!')
    })

    describe('async/iterators', () => {
        let viewport: { width: number, height: number } | undefined

        /**
         * this test requires the website to be rendered in mobile view
         */
        before(async () => {
            viewport = await browser.getWindowSize()
            await browser.setViewport({ width: 900, height: 600 })
        })

        it('should be able to use async-iterators', async () => {
            await browser.url('https://webdriver.io')
            await browser.$('aria/Toggle navigation bar').click()
            const contributeLink = await browser.waitUntil(async () => {
                const contributeLink = await browser.$$('.navbar-sidebar a.menu__link').find<WebdriverIO.Element>(
                    async (link) => await link.getText() === 'Contribute')
                expect(contributeLink).toBeDefined()
                return contributeLink
            })
            await contributeLink.click()
            await expect(browser).toHaveTitle('Contribute | WebdriverIO')
        })

        after(async () => {
            if (!viewport) {
                return
            }

            await browser.setViewport(viewport)
        })
    })

    describe.skip('Lighthouse Service Performance Testing capabilities', () => {
        before(() => browser.enablePerformanceAudits())

        it('should allow to do performance tests', async () => {
            await browser.url('http://json.org')
            const metrics = await browser.getMetrics()
            expect(typeof metrics.serverResponseTime).toBe('number')
            expect(typeof metrics.domContentLoaded).toBe('number')
            expect(typeof metrics.firstVisualChange).toBe('number')
            expect(typeof metrics.firstPaint).toBe('number')
            expect(typeof metrics.firstContentfulPaint).toBe('number')
            expect(typeof metrics.firstMeaningfulPaint).toBe('number')
            expect(typeof metrics.largestContentfulPaint).toBe('number')
            expect(typeof metrics.lastVisualChange).toBe('number')
            expect(typeof metrics.interactive).toBe('number')
            expect(typeof metrics.load).toBe('number')
            expect(typeof metrics.speedIndex).toBe('number')
            expect(typeof metrics.totalBlockingTime).toBe('number')
            expect(typeof metrics.maxPotentialFID).toBe('number')
            expect(typeof metrics.cumulativeLayoutShift).toBe('number')
            const score = await browser.getPerformanceScore()
            expect(typeof score).toBe('number')
        })

        after(() => browser.disablePerformanceAudits())
    })

    it.skip('should be able to scroll up and down', async () => {
        if (os.platform() === 'win32') {
            console.warn('Skipping scroll tests on Windows')
            return
        }

        await browser.url('https://webdriver.io/')
        const currentScrollPosition = await browser.execute(() => [
            window.scrollX, window.scrollY
        ])
        expect(currentScrollPosition).toEqual([0, 0])
        await $('footer').scrollIntoView()
        const [x, y] = await browser.execute(() => [
            window.scrollX, window.scrollY
        ])
        expect(y).toBeGreaterThan(100)

        // should scroll relative to current position
        await browser.scroll(0, 0)
        const sameScrollPosition = await browser.execute(() => [
            window.scrollX, window.scrollY
        ])
        expect(sameScrollPosition).toEqual([x, y])

        await browser.scroll(0, Math.floor(-y))
        const oldScrollPosition = await browser.execute(() => [
            window.scrollX, window.scrollY
        ])
        expect(oldScrollPosition).toEqual([x, y])
    })

    describe('moveTo tests', () => {
        const inputs = [
            undefined,
            { xOffset: 10 },
            { yOffset: 10 },
            { xOffset: 25, yOffset: 25 },
        ]

        beforeEach(async () => {
            await browser.url('https://guinea-pig.webdriver.io/pointer.html')
            await browser.$('#parent').waitForExist()
        })

        it('moveTo without iframe', async () => {
            await browser.$('#parent').moveTo()
            await expect(browser.$('#text')).toHaveValue('center')
        })

        it('moveTo without iframe with 0 offsets', async () => {
            await browser.$('#parent').moveTo({ xOffset: 0, yOffset: 0 })
            await expect(browser.$('#text')).toHaveValue('center')
        })

        inputs.forEach((input) => {
            it(`moves to position x,y outside of iframe when passing the arguments ${JSON.stringify(input)}`, async () => {
                await browser.execute(() => {
                    const mouse = { x:0, y:0 }
                    document.onmousemove = (e) => {
                        mouse.x = e.clientX
                        mouse.y = e.clientY
                    }
                    //@ts-ignore
                    document.mouseMoveTo = mouse
                })
                await browser.$('#parent').moveTo()
                const rectBefore = await browser.execute(
                    // @ts-ignore
                    () => document.mouseMoveTo
                ) as {  x: number, y: number }
                await browser.$('#parent').moveTo(input)
                const rectAfter = await browser.execute(
                    // @ts-ignore
                    () => document.mouseMoveTo
                ) as {  x: number, y: number }
                expect(rectBefore.x + (input && input?.xOffset ? input?.xOffset : 0)).toEqual(rectAfter.x)
                expect(rectBefore.y + (input && input?.yOffset ? input?.yOffset : 0)).toEqual(rectAfter.y)
            })
        })

        /**
         * test started to fail for unclear reason and block release
         */
        it.skip('moveTo in iframe', async () => {
            const iframe = await browser.$('iframe.code-tabs__result')
            await browser.switchFrame(iframe)
            await browser.$('#parent').moveTo()
            await expect(browser.$('#text')).toHaveValue('center')
        })

        it('moveTo in iframe with 0 offsets', async () => {
            await browser.$('#parent').moveTo({ xOffset: 0, yOffset: 0 })
            await expect(browser.$('#text')).toHaveValue('center')
        })

        it('moveTo to parent frame with auto scrolling', async () => {
            await browser.setWindowSize(500, 500)
            await browser.switchToParentFrame()
            await browser.$('#parent').moveTo()
            await expect(browser.$('#text')).toHaveValue('center')
        })

        it('moveTo to nested iframe with auto scrolling', async () => {
            const iframe = await browser.$('iframe.code-tabs__result')
            await browser.switchFrame(iframe)
            await browser.$('#parent').moveTo()
            await expect(browser.$('#text')).toHaveValue('center')
        })

        inputs.forEach((input) => {
            it(`moves to position x,y inside of iframe when passing the arguments ${JSON.stringify(input)}`, async () => {
                await browser.execute(() => {
                    const mouse = { x: 0, y: 0 }
                    document.onmousemove = (e) => {
                        mouse.x = e.clientX
                        mouse.y = e.clientY
                    }
                    //@ts-ignore
                    document.mouseMoveTo = mouse
                })
                await browser.$('#parent').moveTo()
                const rectBefore = await browser.execute(
                    //@ts-ignore
                    () => document.mouseMoveTo
                ) as {  x: number, y: number }
                await browser.$('#parent').moveTo(input)
                const rectAfter = await browser.execute(
                    //@ts-ignore
                    () => document.mouseMoveTo
                ) as {  x: number, y: number }
                expect(rectBefore.x + (input && input?.xOffset ? input?.xOffset : 0)).toEqual(rectAfter.x)
                expect(rectBefore.y + (input && input?.yOffset ? input?.yOffset : 0)).toEqual(rectAfter.y)
            })
        })

        after(async () => {
            await browser.switchFrame(null)
        })
    })

    const inputs: (ScrollIntoViewOptions | boolean | undefined)[] = [
        undefined,
        true,
        false,
        { block: 'start', inline: 'start' },
        { block: 'start', inline: 'center' },
        { block: 'start', inline: 'end' },
        { block: 'start', inline: 'nearest' },
        { block: 'center', inline: 'start' },
        { block: 'center', inline: 'center' },
        { block: 'center', inline: 'end' },
        { block: 'center', inline: 'nearest' },
        { block: 'end', inline: 'start' },
        { block: 'end', inline: 'center' },
        { block: 'end', inline: 'end' },
        { block: 'end', inline: 'nearest' },
        { block: 'nearest', inline: 'start' },
        { block: 'nearest', inline: 'center' },
        { block: 'nearest', inline: 'end' },
        { block: 'nearest', inline: 'nearest' },
    ]

    describe('wdio scrollIntoView behaves like native scrollIntoView', () => {
        let viewport: { width: number, height: number } | undefined
        before(async () => {
            viewport = await browser.getWindowSize()
        })

        beforeEach(async () => {
            await browser.url('https://guinea-pig.webdriver.io')
            await browser.setWindowSize(500, 500)
        })

        inputs.forEach(input => {
            const inputDescription = typeof input === 'boolean' ? input : JSON.stringify(input)
            it(`should vertically scroll like the native scrollIntoView when passing ${inputDescription} as argument`, async () => {
                const searchInput = await $('.searchinput')
                await searchInput.scrollIntoView(input)
                const wdioY = await browser.execute(() => window.scrollY)

                await browser.execute((elem, _params) => elem.scrollIntoView(_params), searchInput, input)
                const nativeY = await browser.execute(() => window.scrollY)

                expect(Math.floor(wdioY)).toEqual(Math.floor(nativeY))
            })

            it(`should horizontally scroll like the native scrollIntoView when passing ${inputDescription} as argument`, async () => {
                const searchInput = await $('.searchinput')
                await searchInput.scrollIntoView(input)
                const wdioX = await browser.execute(() => window.scrollX)

                await browser.execute((elem, _params) => elem.scrollIntoView(_params), searchInput, input)
                const nativeX = await browser.execute(() => window.scrollX)

                expect(Math.floor(wdioX)).toEqual(Math.floor(nativeX))
            })
        })

        it('should be able to handle successive scrollIntoView', async () => {
            const searchInput = await $('.searchinput')

            const scrollAndCheck = async (params?: ScrollIntoViewOptions | boolean) => {
                await searchInput.scrollIntoView(params)
                const [wdioX, wdioY] = await browser.execute(() => [
                    window.scrollX, window.scrollY
                ])

                await browser.execute((elem, _params) => elem.scrollIntoView(_params), searchInput, params)
                const [windowX, windowY] = await browser.execute(() => [
                    window.scrollX, window.scrollY
                ])

                expect(Math.abs(wdioX - windowX)).toEqual(0)
                expect(Math.abs(wdioY - windowY)).toEqual(0)
            }

            for (const input of inputs) {
                await scrollAndCheck(input)
            }
        })

        after(async () => {
            if (!viewport) {
                return
            }
            return browser.setViewport(viewport)
        })
    })

    describe('url command', () => {
        it('supports basic auth', async () => {
            await browser.url('https://the-internet.herokuapp.com/basic_auth', {
                auth: {
                    user: 'admin',
                    pass: 'admin'

                }
            })
            await expect($('p=Congratulations! You must have the proper credentials.')).toBeDisplayed()
        })

        it('should return a request object', async () => {
            const request = await browser.url('https://guinea-pig.webdriver.io/')
            if (!request) {
                throw new Error('Request object is not defined')
            }
            expect(request.children!.length > 0).toBe(true)
            expect(Object.keys(request.response?.headers || {})).toContain('x-amz-version-id')
        })

        it('should not contain any children due to "none" wait property', async () => {
            const request = await browser.url('https://guinea-pig.webdriver.io/', {
                wait: 'none'
            })

            if (!request) {
                throw new Error('Request object is not defined')
            }
            expect(request.children!.length).toBe(0)
        })

        it('should allow to load a script before loading the page', async () => {
            await browser.url('https://webdriver.io', {
                onBeforeLoad: () => {
                    Math.random = () => 42
                }
            })
            expect(await browser.execute(() => Math.random())).toBe(42)

            await browser.url('https://webdriver.io')
            expect(await browser.execute(() => Math.random())).not.toBe(42)
        })
    })

    describe('dialog handling', () => {
        it('should automatically accept alerts', async () => {
            await browser.url('https://guinea-pig.webdriver.io')

            await browser.execute(() => alert('123'))

            /**
             * in case the alert is not automatically accepted
             * the following line would time out
             */
            await browser.$('div').click()
        })

        /**
         * fails due to https://github.com/GoogleChromeLabs/chromium-bidi/issues/2556
         */
        it('should be able to handle dialogs', async () => {
            await browser.url('https://guinea-pig.webdriver.io')
            browser.execute(() => alert('123'))
            const dialog = await new Promise<WebdriverIO.Dialog>((resolve) => browser.on('dialog', resolve))

            expect(dialog.type()).toBe('alert')
            expect(dialog.message()).toBe('123')
            await dialog.dismiss()
        })
    })

    describe('addInitScript', () => {
        it('should allow to add an init script', async () => {
            const script = await browser.addInitScript((seed) => {
                Math.random = () => seed
            }, 42)

            await browser.url('https://webdriver.io')
            expect(await browser.execute(() => Math.random())).toBe(42)

            await script.remove()
            await browser.url('https://webdriver.io')
            expect(await browser.execute(() => Math.random())).not.toBe(42)
        })

        it('should escape the init script', async () => {
            type WindowWithHello = Window & {
                sayHello?: (name: string) => string;
            }
            const script = await browser.addInitScript(() => {
                (window as WindowWithHello).sayHello = (name) =>
                    `Hello ${name}`
            })

            await browser.url('https://webdriver.io')
            expect(
                await browser.execute(() =>
                    (window as WindowWithHello).sayHello!('there'),
                ),
            ).toBe('Hello there')

            await script.remove()
        })

        it('passed on callback function', async () => {
            const script = await browser.addInitScript((num, str, bool, emit) => {
                setTimeout(() => emit(JSON.stringify([num, str, bool])), 500)
            }, 1, '2', true)
            browser.url('https://webdriver.io')
            const data = await new Promise<string[]>((resolve) => {
                script.on('data', (data) => resolve(data as string[]))
            })
            expect(data).toBe('[1,"2",true]')
        })
    })

    describe('emulate clock', () => {
        const now = new Date(Date.UTC(2021, 3, 14))
        const getDateString = () => new Date()
        const mockedDateString = now.toLocaleString('en-GB', { timeZone: 'UTC' })

        it('should allow to mock the clock', async () => {
            await browser.emulate('clock', { now })
            expect((await browser.execute(getDateString)).toLocaleString('en-GB', { timeZone: 'UTC' }))
                .toBe(mockedDateString)
            await browser.url('https://guinea-pig.webdriver.io')
            expect((await browser.execute(getDateString)).toLocaleString('en-GB', { timeZone: 'UTC' }))
                .toBe(mockedDateString)
        })

        it('should allow to restore the clock', async () => {
            await browser.restore('clock')
            expect((await browser.execute(getDateString)).toLocaleString('en-GB', { timeZone: 'UTC' }))
                .not.toBe(mockedDateString)
            await browser.url('https://guinea-pig.webdriver.io/pointer.html')
            expect((await browser.execute(getDateString)).toLocaleString('en-GB', { timeZone: 'UTC' }))
                .not.toBe(mockedDateString)
        })
    })

    describe('shadow root piercing', () => {
        it('recognises new shadow root ids when page refreshes', async () => {
            await browser.url('https://todomvc.com/examples/lit/dist/')
            await expect($('.new-todo')).toBePresent()
            await browser.refresh()
            await expect($('.new-todo')).toBePresent()
        })
    })

    describe('context management', () => {
        const closeAllWindowsButFirst = async () => {
            const allHandles = await browser.getWindowHandles()

            if (allHandles.length < 2) {return}
            for (const windowHandle of allHandles.slice(1)) {
                await browser.switchToWindow(windowHandle)
                await browser.closeWindow()
            }
            await browser.switchToWindow(allHandles[0])
        }

        it('should allow user to switch between contexts', async () => {
            await browser.url('https://guinea-pig.webdriver.io/')

            await browser.newWindow('https://webdriver.io')
            await expect($('.hero__subtitle')).toBePresent()
            await expect($('.red')).not.toBePresent()

            await browser.switchWindow('guinea-pig.webdriver.io')
            await expect($('.red')).toBePresent()
            await expect($('.hero__subtitle')).not.toBePresent()

            await browser.switchWindow('Next-gen browser and mobile automation test framework for Node.js')
            await expect($('.hero__subtitle')).toBePresent()
            await expect($('.red')).not.toBePresent()
        })

        it.skip('should not switch window if requested window was not found', async () => {
            await closeAllWindowsButFirst()
            await browser.navigateTo('https://guinea-pig.webdriver.io/')
            const firstWindowHandle = await browser.getWindowHandle()

            await browser.newWindow('https://webdriver.io')

            await browser.switchWindow('guinea-pig.webdriver.io')
            expect(await browser.getWindowHandle()).toBe(firstWindowHandle)

            const err = await browser.switchWindow('not-existing-window').catch((err) => err)
            expect(err.message).toContain('No window')

            expect(await browser.getWindowHandle()).toBe(firstWindowHandle)
        })

        it('Should update BiDi browsingContext when performing switchToWindow in WebDriver Classic', async () => {
            await closeAllWindowsButFirst()
            await browser.url('https://guinea-pig.webdriver.io/')
            await $('#newWindow').click()

            const handles = await browser.getWindowHandles()
            await browser.switchToWindow(handles[1])

            // Verify element text to ensure the browsing context has changed and can interact with elements
            await expect($('.page')).toHaveText('Second page!')
        })

        it('should see that content is no longer displayed when window is closed', async () => {
            await browser.url('https://the-internet.herokuapp.com/iframe')
            const elementalSeleniumLink = await $('/html/body/div[3]/div/div/a')
            await elementalSeleniumLink.waitForDisplayed()
            await elementalSeleniumLink.click()
            await browser.waitUntil(async () => (await browser.getWindowHandles()).length === 3)
            await browser.switchWindow('https://elementalselenium.com/')
            await $('#__docusaurus_skipToContent_fallback').waitForDisplayed()
            await browser.closeWindow()
            await $('#__docusaurus_skipToContent_fallback').waitForDisplayed({ reverse: true })
            await browser.waitUntil(async () => (await browser.getWindowHandles()).length === 2)
            await browser.switchWindow('https://the-internet.herokuapp.com/iframe')
        })
    })

    describe('switchFrame', () => {
        afterEach(async () => {
            await browser.switchFrame(null)
        })

        it('can switch to a frame via url', async () => {
            await browser.url('https://guinea-pig.webdriver.io/iframe.html')
            await browser.switchFrame('https://guinea-pig.webdriver.io/iframeA2.html')
            expect(await browser.execute(() => [document.title, document.URL]))
                .toEqual(['IFrame A2', 'https://guinea-pig.webdriver.io/iframeA2.html'])
        })

        it('can switch to a frame via element', async () => {
            await browser.url('https://the-internet.herokuapp.com/nested_frames')
            await browser.switchFrame($('frame'))
            expect(await browser.execute(() => document.URL))
                .toBe('https://the-internet.herokuapp.com/frame_top')
        })

        it('can switch to a frame via function', async () => {
            await browser.url('https://the-internet.herokuapp.com/nested_frames')
            await browser.switchFrame(() => document.URL.includes('frame_right'))
            expect(await browser.execute(() => document.URL))
                .toBe('https://the-internet.herokuapp.com/frame_right')
        })

        it('should reset the frame when the page is reloaded', async () => {
            await browser.url('https://the-internet.herokuapp.com/iframe')
            await expect($('#tinymce')).not.toBePresent()
            await browser.switchFrame($('iframe'))
            await expect($('#tinymce')).toBePresent()
            await browser.refresh()
            await expect($('#tinymce')).not.toBePresent()
            await browser.switchFrame($('iframe'))
            await expect($('#tinymce')).toBePresent()
        })

        it('allows expect after switching to non-children', async () => {
            await browser.url('https://guinea-pig.webdriver.io/iframe.html')
            await expect($('h1,h2,h3')).toHaveText('Frame Demo')

            await browser.switchFrame($('#A')) // child
            await expect($('h1,h2,h3')).toHaveText('IFrame A')

            // child, we use this to proof switch frame with a function works
            await browser.switchFrame(() => window.location.href === 'https://guinea-pig.webdriver.io/iframeA1.html')
            await expect($('h1,h2,h3')).toHaveText('IFrame A1')

            // sibling
            await browser.switchFrame(() => window.location.href === 'https://guinea-pig.webdriver.io/iframeA2.html')
            await expect($('h1,h2,h3')).toHaveText('IFrame A2') // FAILS "no such element"
        })

        describe('switchToParentFrame', () => {
            it('switches to parent (not top-level)', async () => {
                await browser.url('https://guinea-pig.webdriver.io/iframe.html')
                await expect($('h1')).toHaveText('Frame Demo')
                await expect($('h2')).not.toExist()
                await expect($('h3')).not.toExist()

                await browser.switchFrame($('#A'))
                await expect($('h1')).not.toExist()
                await expect($('h2')).toHaveText('IFrame A')
                await expect($('h3')).not.toExist()

                await browser.switchFrame($('#A2'))
                await expect($('h1')).not.toExist()
                await expect($('h2')).not.toExist()
                await expect($('h3')).toHaveText('IFrame A2')

                await browser.switchToParentFrame()
                await expect($('h1')).not.toExist()
                await expect($('h2')).toHaveText('IFrame A')
                await expect($('h3')).not.toExist()
            })

            after(() => browser.switchFrame(null))
        })

        describe('taking screenshots', () => {
            it('should take a screenshot of the iframe', async () => {
                await browser.url('https://guinea-pig.webdriver.io/iframe.html')
                await browser.switchFrame($('#A'))
                await browser.switchFrame($('#A2'))

                const screenshotPath = path.resolve(__dirname, 'iframe.png')
                await browser.saveScreenshot(screenshotPath)
                const image = await fs.readFile(screenshotPath)
                const dimensions = imageSize(image) as { width: number, height: number }
                console.log(`Screenshot dimensions: ${JSON.stringify(dimensions)}`)

                expect(dimensions.width).toBeGreaterThanOrEqual(170)
                expect(dimensions.width).toBeLessThanOrEqual(190)
                expect(dimensions.height).toBeGreaterThanOrEqual(80)
                expect(dimensions.height).toBeLessThanOrEqual(90)
            })

            after(() => browser.switchFrame(null))
        })

        describe('iframe navigations', () => {
            beforeEach(async () => {
                await browser.url('https://guinea-pig.webdriver.io/iframeNavigation.html')
            })

            describe('ability to catch navigation event within iframe', () => {
                it('should work by using a link with target=_top', async () => {
                    await browser.switchFrame('iframeNavigationInner.html')
                    await $('a').click()
                    await expect($('h1')).toHaveText('Iframe Target')
                })

                it('should work by setting the location', async () => {
                    await browser.switchFrame('iframeNavigationInner.html')
                    await $('button').click()
                    await expect($('h1')).toHaveText('Iframe Target')
                })
            })
        })

        describe('switchFrame with iframe in shadow DOM', () => {
            beforeEach(async () => {
                await browser.url('https://guinea-pig.webdriver.io/iframeInShadowDom.html')
            })

            it('should switch to iframe inside shadow root via element', async () => {
                const host = await browser.$('#wrapper')
                const iframe = await host.shadow$('iframe')

                // Switch to the iframe inside the shadow DOM
                await browser.switchFrame(await browser.$(iframe))

                const [title, url] = await browser.execute(() => [document.title, document.URL])
                expect(title).toBe('Iframe Target')
                expect(url).toContain('iframeTarget.html')
            })

            it('should work when using the url', async () => {
                await browser.switchFrame('https://guinea-pig.webdriver.io/iframeTarget.html')
                await expect($('h1')).toHaveText('Iframe Target')
            })
        })

    })

    describe('open resources with different protocols', () => {
        it('http', async () => {
            browser.url('https://guinea-pig.webdriver.io/')
            await expect(browser).toHaveUrl('https://guinea-pig.webdriver.io/')
        })

        it('https', async () => {
            await browser.url('https://webdriver.io/')
            await expect(browser).toHaveUrl('https://webdriver.io/')
        })

        it('data', async () => {
            await browser.url('data:text/html,<h1>Test</h1>')
            await expect($('h1')).toHaveText('Test')
        })

        it('file', async () => {
            const resource = path.resolve(__dirname, '__fixtures__', 'test.html')
            await browser.url(url.pathToFileURL(resource).href)
            await expect($('h1')).toHaveText('Hello World')
        })

        it.skip('chrome', async () => {
            await browser.url('chrome://about/')
            await expect($('li=chrome://accessibility')).toExist()
        })
    })

    it.only('should be able to save PDF with pageRanges', async () => {
        await browser.url('https://guinea-pig.webdriver.io/')

        const pdf = await browser.savePDF(path.join(os.tmpdir(), 'page-ranges.pdf'), {
            pageRanges: ['1', 2]
        })

        expect(pdf.length).toBeGreaterThan(0)
    })

    it.only('should be able to create and update a mock sensor', async () => {
        await browser.createMockSensor('gravity', true, 10, 2)
        const reading1 = await browser.getMockSensor('gravity')
        expect(reading1).toEqual({ requestedSamplingFrequency: 0 })

        await browser.updateMockSensor('gravity', { x: 1, y: 2, z: 3, minRequestedSamplingFrequency: 2, maxRequestedSamplingFrequency: 10 })
        const reading2 = await browser.getMockSensor('gravity')
        expect(reading2).toEqual({ requestedSamplingFrequency: 0 })
    })

    describe('reloading applications with different strategies', () => {
        const scenarios = {
            nothing: ['', '1'],
            query: ['?foo=bar', '1'],
            hash: ['#reloadCounter', '0']
        }
        for (const [name, [value, expected]] of Object.entries(scenarios)) {
            it(`reloads with ${name}`, async () => {
                const url = `https://guinea-pig.webdriver.io/reloadCounter.html${value}`
                await browser.url(url)
                await $('#reset').click()
                await expect($('#counter')).toHaveValue('0')
                await browser.url(url)
                await expect($('#counter')).toHaveValue('0')
                await browser.url(url)
                await expect($('#counter')).toHaveValue(expected)
            })
        }
    })

    describe('selectBy*', () => {
        const scenarios = [
            ['selectByVisibleText', ['Option 2']],
            ['selectByIndex', [1]],
            ['selectByAttribute', ['value', 'someValue1']]
        ] as const

        for (const [command, args] of scenarios) {
            it(`${command}: should wait for the option to be present`, async () => {
                const newOption = 'Option 2'
                await browser.url('https://guinea-pig.webdriver.io/two.html')

                await browser.execute((newOption) => {
                    const select = document.createElement('select')
                    select.innerHTML = '<option value="someValue0">Option 1</option>'
                    document.body.insertAdjacentElement('beforeend', select)
                    setTimeout(() => select.innerHTML += `<option value="someValue1">${newOption}</option>`, 2000)
                }, newOption)

                const $select = browser.$('select')
                // @ts-expect-error
                await $select[command](...args)
                await expect($select).toHaveValue('someValue1')
            })
        }
    })

})
