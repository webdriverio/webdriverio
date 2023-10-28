import os from 'node:os'

describe('main suite 1', () => {
    it('foobar test', async () => {
        const browserName = (browser.capabilities as WebdriverIO.Capabilities).browserName
        await browser.url('http://guinea-pig.webdriver.io/')
        await expect((await $('#useragent').getText()).toLowerCase()).toContain(browserName ? browserName.replace(' ', '') : browserName)
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
        await expect($('>>>ul[slot="my-text"] li:last-child')).toHaveText('In a list!')
    })

    it.skip('should be able to use async-iterators', async () => {
        await browser.url('https://webdriver.io')
        const contributeLink = await browser.$$('a.navbar__item.navbar__link').find<WebdriverIO.Element>(
            async (link) => await link.getText() === 'Contribute')
        await contributeLink.click()
        await expect(browser).toHaveTitle('Contribute | WebdriverIO')
    })

    /**
     * fails due to "Unable to identify the main resource"
     * https://github.com/webdriverio/webdriverio/issues/8541
     */
    it.skip('should allow to do performance tests', async () => {
        await browser.enablePerformanceAudits()
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

        browser.scroll(0, -y)
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
            await browser.url('http://guinea-pig.webdriver.io/')
            await browser.$('a[href="pointer.html"]').click()
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
            it(`moves to position x,y outside of iframe when passing the arguments ${JSON.stringify(input)}`, async () => {
                await browser.execute(() => {
                    const mouse = { x:0, y:0 }
                    document.onmousemove = function(e){ mouse.x = e.clientX, mouse.y = e.clientY }
                    //@ts-ignore
                    document.mouseMoveTo = mouse
                })
                await browser.$('#parent').moveTo()
                const rectBefore = await browser.execute('return document.mouseMoveTo') as {x: number, y: number}
                await browser.$('#parent').moveTo(input)
                const rectAfter = await browser.execute('return document.mouseMoveTo') as {x: number, y: number}
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
            it(`moves to position x,y inside of iframe when passing the arguments ${JSON.stringify(input)}`, async () => {
                await browser.execute(() => {
                    const mouse = { x:0, y:0 }
                    document.onmousemove = function(e){ mouse.x = e.clientX, mouse.y = e.clientY }
                    //@ts-ignore
                    document.mouseMoveTo = mouse
                })
                await browser.$('#parent').moveTo()
                const rectBefore = await browser.execute('return document.mouseMoveTo') as {x: number, y: number}
                await browser.$('#parent').moveTo(input)
                const rectAfter = await browser.execute('return document.mouseMoveTo') as {x: number, y: number}
                expect(rectBefore.x + (input && input?.xOffset ? input?.xOffset : 0)).toEqual(rectAfter.x)
                expect(rectBefore.y + (input && input?.yOffset ? input?.yOffset : 0)).toEqual(rectAfter.y)
            })
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

    it('can reload a session', async () => {
        const sessionId = browser.sessionId
        await browser.reloadSession()
        expect(browser.sessionId).not.toBe(sessionId)
    })
})
