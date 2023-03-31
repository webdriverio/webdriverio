import assert from 'node:assert'

describe('Mocha smoke test', () => {
    const testJs = 'tests/mocha/test.ts:'

    it('has globals set up', async () => {
        expect(1).toBe(1) // has non wdio matcher support
        expect(global.browser).toBeDefined()
        expect(global.driver).toBeDefined()
        expect(global.$).toBeDefined()
        expect(global.$$).toBeDefined()
        expect(global.expect).toBeDefined()
    })

    it('should return sync value', async () => {
        await expect(browser).toHaveTitle('Mock Page Title')
    })

    let hasRun = false
    it('should retry', function (this: WebdriverIO.Browser) {
        if (!hasRun) {
            hasRun = true
            assert.equal(this.wdioRetries, 0)
            throw new Error('booom!')
        }

        assert.equal(this.wdioRetries, 1)
    }, 1)

    it('should chain properly', async () => {
        // @ts-expect-error custom command
        await browser.isExistingScenario()

        const el = browser.$('body')
        assert.equal(await el.$('.selector-1').isExisting(), true)
        assert.equal(await el.$('.selector-2').isExisting(), true)
    })

    it('should allow to use then/catch/finally', async () => {
        // @ts-expect-error custom command
        await browser.isExistingScenario()
        const val = await browser.$('body').$('.selector-1').then(() => 123)
        expect(val).toBe(123)

        // @ts-expect-error custom command
        await browser.isExistingScenario()
        let anotherVal
        const elem = await browser.$('body').$('.selector-1').finally(() => {
            anotherVal = 321
        })
        expect(elem.selector).toBe('.selector-1')
        expect(anotherVal).toBe(321)

        // @ts-expect-error custom command
        await browser.isNotExistingScenario()
        const errorVal = await browser.$('body').$('.fooobar').catch(() => 42)
        expect(errorVal).toBe(42)
    })

    it('should allow chaining of custom$', async () => {
        browser.addLocatorStrategy('someSelector', () => global.document.body)
        // @ts-expect-error custom command
        await browser.customSelectorScenario()
        const el = await browser.$('body').custom$('someSelector', 'foo').$('div#foobar')
        expect(el.selector).toBe('div#foobar')
    })

    it('should allow to chain custom commands', async () => {
        // @ts-expect-error custom command
        await browser.isExistingScenario()
        browser.addCommand(
            'foo',
            function (this: WebdriverIO.Element) {
                return Promise.resolve('foo').then((r) => `${r}_${this.selector}_bar`)
            },
            true
        )

        // @ts-expect-error invalid type assertion
        expect(browser.foo).not.toBeDefined()
        // @ts-expect-error invalid type assertion
        expect(await browser.$('body').$('.selector-1').foo()).toBe('foo_.selector-1_bar')
    })

    it('should allow to reload a session', async () => {
        const sessionIdBefore = browser.sessionId
        await browser.reloadSession()
        expect(sessionIdBefore).not.toBe(browser.sessionId)
    })

    it('should handle promises in waitUntil callback funciton using async code', async () => {
        const results: string[] = []
        const result = await browser.waitUntil(async () => {
            results.push(await browser.getUrl())
            return results.length > 1
        })
        assert.strictEqual(result, true)
        assert.deepEqual(results, ['https://mymockpage.com', 'https://mymockpage.com'])
    })

    it('should handle waitUntil timeout', async () => {
        // @ts-expect-error custom command
        await browser.staleElementRefetchScenario()
        const elem = await $('elem')
        try {
            await browser.waitUntil(async () => {
                await elem.click()
                return false
            }, { timeout: 1000 })
        } catch (err) {
            // ignored
        }
        assert.equal(JSON.stringify(await elem.getSize()), JSON.stringify({ width: 1, height: 2 }))
    })

    describe('isDisplayed', () => {
        it('should return false if element is never found', async () => {
            // @ts-expect-error custom command
            await browser.isNeverDisplayedScenario()
            const elem = await $('elem')

            assert.equal(await elem.isDisplayed(), false)
        })

        it('should reFetch the element once', async () => {
            // @ts-expect-error custom command
            await browser.isEventuallyDisplayedScenario()
            const elem = await $('elem')

            assert.equal(await elem.isDisplayed(), true)
        })
    })

    describe('add customCommands', () => {
        it('should allow to call nested custom commands', async () => {
            browser.addCommand('myCustomCommand', async function (param) {
                const result = {
                    url: await browser.getUrl(),
                    title: await browser.getTitle()
                }

                return { param, ...result }
            })

            assert.equal(
                // @ts-expect-error custom command
                JSON.stringify(await browser.myCustomCommand('foobar')),
                JSON.stringify({
                    param: 'foobar',
                    url: 'https://mymockpage.com',
                    title: 'Mock Page Title'
                })
            )
        })

        it('allows to create custom commands on elements', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            const elem = await $('elem')
            elem.addCommand('myCustomCommand', async function (this: WebdriverIO.Element, param) {
                const result = await this.getSize()
                return { selector: this.selector, result, param }
            })

            assert.equal(
                // @ts-expect-error custom command
                JSON.stringify(await elem.myCustomCommand('foobar')),
                JSON.stringify({
                    selector: 'elem',
                    result: { width: 1, height: 2 },
                    param: 'foobar'
                })
            )
        })

        it('should keep the scope', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            browser.addCommand('customFn', async function (this: WebdriverIO.Element, elem: WebdriverIO.Element) {
                return (await this.execute('1+1')) + '-' + elem.selector
            })

            // @ts-expect-error custom command
            assert.equal(await browser.customFn(await $('body')), '2-body')
        })

        it('should respect promises', async () => {
            browser.addCommand('customFn', () => {
                return Promise.resolve('foobar')
            })

            // @ts-expect-error custom command
            assert.equal(await browser.customFn(), 'foobar')
        })

        it('should throw if promise rejects', async () => {
            browser.addCommand('customFn', () => {
                return Promise.reject(new Error('Boom!'))
            })

            let err: Error | null = null
            try {
                // @ts-expect-error custom command
                await browser.customFn()
            } catch (e) {
                err = e as Error
            }
            assert.equal(err?.message, 'Boom!')
            assert.equal(err?.stack?.includes(testJs), true)
        })

        it('allows to create custom commands on elements that respects promises', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            browser.addCommand('myCustomPromiseCommand', function () {
                return Promise.resolve('foobar')
            }, true)
            const elem = await $('elem')

            // @ts-expect-error custom command
            assert.equal(await elem.myCustomPromiseCommand(), 'foobar')
        })
    })

    describe('overwrite native commands', () => {
        it('should allow to overwrite browser commands', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            browser.overwriteCommand('getTitle' as any, async function (origCommand, pre = '') {
                return pre + await origCommand()
            })

            // @ts-expect-error custom command
            assert.equal(await browser.getTitle('Foo '), 'Foo Mock Page Title')
        })

        it('should allow to overwrite element commands', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            browser.overwriteCommand('getSize', (async (origCommand: Function, ratio = 1) => {
                const { width, height } = await origCommand()
                return { width: width * ratio, height: height * ratio }
            }) as any, true)
            const elem = await $('elem')

            assert.equal(
                // @ts-expect-error custom command
                JSON.stringify(await elem.getSize(2)),
                JSON.stringify({ width: 2, height: 4 })
            )
        })

        it('should allow to invoke native command on different element', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            browser.overwriteCommand('getSize', (async function (origCommand: Function, ratio = 1) {
                const elemAlt = await $('elemAlt')
                const { width, height } = await origCommand.call(elemAlt)
                return { width: width * ratio, height: height * ratio }
            }) as any, true)
            const elem = await $('elem')

            assert.equal(
                // @ts-expect-error custom command
                JSON.stringify(await elem.getSize(2)),
                JSON.stringify({ width: 20, height: 40 })
            )
        })

        it('should keep the scope', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            browser.overwriteCommand('saveRecordingScreen', (async function (
                this: WebdriverIO.Browser,
                origCommand: Function,
                filepath: string,
                elem: WebdriverIO.Element
            ) {
                if (elem) {
                    return (await this.execute('1+1')) + '-' + elem.selector
                }
                return origCommand(filepath)
            }) as any)

            // @ts-expect-error custom command
            assert.equal(await browser.saveRecordingScreen(null, await $('body')), '2-body')
        })

        it('should respect promises - browser', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            browser.overwriteCommand('getUrl' as any, async function (origCommand, append = '') {
                return Promise.resolve((await origCommand()) + append)
            })

            // @ts-expect-error custom command
            assert.equal(await browser.getUrl('/foobar'), 'https://mymockpage.com/foobar')
        })

        it('should respect promises - element', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            browser.overwriteCommand('getHTML', async function (origCommand) {
                return Promise.resolve(await origCommand())
            }, true)
            const elem = await $('elem')

            assert.equal(await elem.getHTML(), '2')
        })

        it('should throw if promise rejects', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            browser.overwriteCommand('deleteCookies', (async (origCommand: Function, fail: boolean) => {
                const result = await origCommand()
                return fail ? Promise.reject(new Error(result)) : result
            }) as any)

            let err: Error | null = null
            try {
                // @ts-expect-error custom command
                await browser.deleteCookies(true)
            } catch (e) {
                err = e as Error
            }
            assert.equal(err?.message, 'deleteAllCookies')
            assert.equal(err?.stack?.includes(testJs), true)
        })

        it('should throw if promise rejects (async execution)', async () => {
            // @ts-expect-error custom command
            await browser.customCommandScenario()
            browser.overwriteCommand('deleteCookies', async (origCommand, fail) => {
                const result = (await origCommand()) as any as string
                return fail ? Promise.reject(new Error(result)) : result
            })

            let err: Error | null = null
            try {
                // @ts-expect-error custom command
                await browser.deleteCookies(true)
            } catch (e) {
                err = e as Error
            }
            assert.equal(err?.message, 'deleteAllCookies')
            assert.equal(err?.stack?.includes(testJs), true)
        })
    })
})
