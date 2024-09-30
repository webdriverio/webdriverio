/// <reference types="@wdio/lighthouse-service" />
import { browser, $, expect } from '@wdio/globals'
import os from 'node:os'

describe('main suite 1', () => {
    afterEach(() => browser.setViewport({ width: 1200, height: 900 }))

    it('supports snapshot testing', async () => {
        await browser.url('http://guinea-pig.webdriver.io/')
        await expect($('.findme')).toMatchSnapshot()
        await expect($('.findme')).toMatchInlineSnapshot('"<h1 class="findme">Test CSS Attributes</h1>"')
    })

    it('should allow to check for PWA', async () => {
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

    it('should also detect non PWAs', async () => {
        await browser.url('https://json.org')
        expect((await browser.checkPWA()).passed).toBe(false)
    })

    it('can query shadow elements', async () => {
        await browser.url('https://the-internet.herokuapp.com/shadowdom')
        await $('h1').waitForDisplayed()
        await expect($('ul[slot="my-text"] li:last-child')).toHaveText('In a list!')
    })

    describe('async/iterators', () => {
        /**
         * this test requires the website to be rendered in mobile view
         */
        before(async () => {
            await browser.setViewport({ width: 900, height: 600 })
        })

        it('should be able to use async-iterators', async () => {
            await browser.url('https://webdriver.io')
            await browser.$('aria/Toggle navigation bar').click()
            const contributeLink = await browser.$$('.navbar-sidebar a.menu__link').find<WebdriverIO.Element>(
                async (link) => await link.getText() === 'Contribute')
            expect(contributeLink).toBeDefined()
            await contributeLink.click()
            await expect(browser).toHaveTitle('Contribute | WebdriverIO')
        })

        after(async () => {
            await browser.setViewport({ width: 900, height: 600 })
        })
    })

    describe('Lighthouse Service Performance Testing capabilities', () => {
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

    it('should be able to scroll up and down', async () => {
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

        before(async () => {
            await browser.url('http://guinea-pig.webdriver.io/pointer.html')
            await browser.$('#parent').waitForExist()
        })

        it('moveTo without iframe', async () => {
            await browser.$('#parent').moveTo()
            const value = await browser.$('#text').getValue()
            expect(value.endsWith('center\n')).toBe(true)
        })

        it('moveTo without iframe with 0 offsets', async () => {
            await browser.$('#parent').moveTo({ xOffset: 0, yOffset: 0 })
            const value = await browser.$('#text').getValue()
            expect(value.endsWith('center\n')).toBe(true)
        })

        inputs.forEach((input) => {
            it.skip(`moves to position x,y outside of iframe when passing the arguments ${JSON.stringify(input)}`, async () => {
                await browser.execute(() => {
                    const mouse = { x:0, y:0 }
                    document.onmousemove = function(e){ mouse.x = e.clientX, mouse.y = e.clientY }
                    //@ts-ignore
                    document.mouseMoveTo = mouse
                })
                await browser.$('#parent').moveTo()
                const rectBefore = await browser.execute(
                    // @ts-ignore
                    () => document.mouseMoveTo
                ) as {x: number, y: number}
                await browser.$('#parent').moveTo(input)
                const rectAfter = await browser.execute(
                    // @ts-ignore
                    () => document.mouseMoveTo
                ) as {x: number, y: number}
                expect(rectBefore.x + (input && input?.xOffset ? input?.xOffset : 0)).toEqual(rectAfter.x)
                expect(rectBefore.y + (input && input?.yOffset ? input?.yOffset : 0)).toEqual(rectAfter.y)
            })
        })

        it('moveTo in iframe', async () => {
            const iframe = await browser.$('iframe.code-tabs__result')
            await browser.switchToFrame(iframe)
            await browser.$('#parent').moveTo()
            const value = await browser.$('#text').getValue()
            expect(value.endsWith('center\n')).toBe(true)
        })

        it('moveTo in iframe with 0 offsets', async () => {
            await browser.$('#parent').moveTo({ xOffset: 0, yOffset: 0 })
            const value = await browser.$('#text').getValue()
            expect(value.endsWith('center\n')).toBe(true)
        })

        inputs.forEach((input) => {
            it.skip(`moves to position x,y inside of iframe when passing the arguments ${JSON.stringify(input)}`, async () => {
                await browser.execute(() => {
                    const mouse = { x: 0, y: 0 }
                    document.onmousemove = function(e){ mouse.x = e.clientX, mouse.y = e.clientY }
                    //@ts-ignore
                    document.mouseMoveTo = mouse
                })
                await browser.$('#parent').moveTo()
                const rectBefore = await browser.execute(
                    //@ts-ignore
                    () => document.mouseMoveTo
                ) as {x: number, y: number}
                await browser.$('#parent').moveTo(input)
                const rectAfter = await browser.execute(
                    //@ts-ignore
                    () => document.mouseMoveTo
                ) as {x: number, y: number}
                expect(rectBefore.x + (input && input?.xOffset ? input?.xOffset : 0)).toEqual(rectAfter.x)
                expect(rectBefore.y + (input && input?.yOffset ? input?.yOffset : 0)).toEqual(rectAfter.y)
            })
        })

        it('moveTo to parent frame with auto scrolling', async () => {
            await browser.setWindowSize(500, 500)
            await browser.switchToParentFrame()
            await browser.$('#parent').moveTo()
            const value = await browser.$('#text').getValue()
            expect(value.endsWith('center\n')).toBe(true)
        })

        it('moveTo to nested iframe with auto scrolling', async () => {
            const iframe = await browser.$('iframe.code-tabs__result')
            await browser.switchToFrame(iframe)
            await browser.$('#parent').moveTo()
            const value = await browser.$('#text').getValue()
            expect(value.endsWith('center\n')).toBe(true)
        })

        after(async () => {
            await browser.switchToParentFrame()
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
        beforeEach(async () => {
            await browser.url('http://guinea-pig.webdriver.io')
            await browser.setWindowSize(500, 500)
        })

        inputs.forEach(input => {
            const inputDescription = typeof input === 'boolean' ? input : JSON.stringify(input)
            it(`should vertically scroll like the native scrollIntoView when passing ${inputDescription} as argument`, async () => {
                const searchInput = await $('.searchinput')
                await searchInput.scrollIntoView(input as any)
                const wdioY = await browser.execute(() => window.scrollY)

                await browser.execute((elem, _params) => elem.scrollIntoView(_params), searchInput, input as any)
                const nativeY = await browser.execute(() => window.scrollY)

                expect(Math.floor(wdioY)).toEqual(Math.floor(nativeY))
            })

            it(`should horizontally scroll like the native scrollIntoView when passing ${inputDescription} as argument`, async () => {
                const searchInput = await $('.searchinput')
                await searchInput.scrollIntoView(input as any)
                const wdioX = await browser.execute(() => window.scrollX)

                await browser.execute((elem, _params) => elem.scrollIntoView(_params), searchInput, input as any)
                const nativeX = await browser.execute(() => window.scrollX)

                expect(Math.floor(wdioX)).toEqual(Math.floor(nativeX))
            })
        })
    })

    it('should be able to handle successive scrollIntoView', async () => {
        await browser.url('http://guinea-pig.webdriver.io')
        await browser.setWindowSize(500, 500)
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
            const request = await browser.url('http://guinea-pig.webdriver.io/')
            if (!request) {
                throw new Error('Request object is not defined')
            }
            expect(request.children!.length > 0).toBe(true)
            expect(Object.keys(request.response?.headers || {})).toContain('x-amz-request-id')
        })

        it('should not contain any children due to "none" wait property', async () => {
            const request = await browser.url('http://guinea-pig.webdriver.io/', {
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
            await browser.url('http://guinea-pig.webdriver.io')

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
        it.skip('should be able to handle dialogs', async () => {
            await browser.url('http://guinea-pig.webdriver.io')
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
        const now = new Date(2021, 3, 14)
        const getDateString = () => (new Date()).toString()

        it('should allow to mock the clock', async () => {
            await browser.emulate('clock', { now })
            expect(await browser.execute(getDateString))
                .toBe(now.toString())
            await browser.url('http://guinea-pig.webdriver.io')
            expect(await browser.execute(getDateString))
                .toBe(now.toString())
        })

        it('should allow to restore the clock', async () => {
            await browser.restore('clock')
            expect(await browser.execute(getDateString))
                .not.toBe(now.toString())
            await browser.url('http://guinea-pig.webdriver.io/pointer.html')
            expect(await browser.execute(getDateString))
                .not.toBe(now.toString())
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
})
