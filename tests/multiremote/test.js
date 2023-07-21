import assert from 'node:assert'

describe('smoke test multiremote', () => {
    it('should return value', async () => {
        assert.equal(
            JSON.stringify(await browser.getTitle()),
            JSON.stringify(['Mock Page Title', 'Mock Page Title']))
        assert.equal(await browser.browserB.getTitle(), 'Mock Page Title')
        assert.equal(await browser.browserA.getTitle(), 'Mock Page Title')
    })

    it('should allow to chain element calls', async () => {
        await browser.multiremoteFetch()
        const elem = await $('foo').$('bar')
        await elem.click()
    })

    describe('add customCommands', () => {
        it('should respect promises', async () => {
            browser.addCommand('customFn', async () => {
                const start = Date.now() - 1
                await browser.pause(30)
                return Promise.all([
                    Promise.resolve(Date.now() - start),
                    Promise.resolve(Date.now() - start)
                ])
            })

            const results = await browser.customFn()

            assert.strictEqual(results[0] >= 30, true, `First of [${results}] is less than 30`)
        })

        it('should respect promises if command was added to single browser', async () => {
            await browser.customCommandScenario(Object.keys(browser.instances).length)
            global.browserA.addCommand('foobar', async () => {
                const title = await global.browserA.getTitle()
                return `Title: ${title}`
            })
            assert.strictEqual(await global.browserA.foobar(), 'Title: Mock Page Title')
            assert.equal(typeof global.browserB.foobar, 'undefined')
        })

        it('should throw if promise rejects', async () => {
            browser.addCommand('customFn', () => {
                return Promise.reject(new Error('Boom!'))
            })

            let err = null
            try {
                await browser.customFn()
            } catch (e) {
                err = e
            }
            assert.equal(err.message, 'Boom!')
        })

        it('allows to create custom commands on elements that respects promises', async () => {
            await browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.addCommand('myCustomPromiseCommand', async () => {
                const start = Date.now() - 1
                await browser.pause(30)
                return Promise.resolve(Date.now() - start)
            }, true)
            const elem = await $('elem')
            const results = await elem.myCustomPromiseCommand()

            assert.strictEqual(results[0] >= 30, true, `First of [${results}] is less than 30`)
        })
    })

    describe('overwrite native commands', () => {
        it('should allow to overwrite browser commands', async () => {
            await browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('getTitle', async function (origCommand, pre = '') {
                return '' + (await origCommand()).map(result => pre + result)
            })

            assert.equal(await browser.getTitle('Foo '), 'Foo Mock Page Title,Foo Mock Page Title')
        })

        it('should allow to overwrite element commands of a single browser', async () => {
            await browser.customCommandScenario(Object.keys(browser.instances).length)
            global.browserA.overwriteCommand('getTitle', async function (origCommand) {
                return `Title: ${await origCommand()}`
            })
            assert.equal(await global.browserA.getTitle(), 'Title: Mock Page Title')
            assert.equal(await global.browserB.getTitle(), 'Mock Page Title')
        })

        it('should allow to overwrite element commands', async () => {
            await browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('getSize', async function (origCommand, ratio = 1) {
                const { width, height } = await origCommand()
                return { width: width * ratio, height: height * ratio }
            }, true)
            const elem = await $('elem')

            assert.equal(
                JSON.stringify(await elem.getSize(2)),
                JSON.stringify([{ width: 2, height: 4 }, { width: 2, height: 4 }])
            )
        })

        it('should keep the scope', async () => {
            await browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('saveRecordingScreen', async function (origCommand, filepath, elem) {
                if (elem) {
                    return await this.execute('1+1') + '-' + elem.instances.map(i => elem[i].selector)
                }
                return origCommand(filepath)
            })

            assert.equal(await browser.saveRecordingScreen(null, await $('body')), '2,2-body,body')
        })

        it('should respect promises - browser', async () => {
            await browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('getUrl', async function (origCommand, append = '') {
                return Promise.resolve((await origCommand()).map(result => result + append))
            })

            assert.equal(await browser.getUrl('/foobar'), 'https://mymockpage.com/foobar,https://mymockpage.com/foobar')
        })

        it('should respect promises - element', async () => {
            await browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('getHTML', async function (origCommand) {
                return Promise.resolve('' + await origCommand())
            }, true)
            const elem = await $('elem')

            assert.equal(await elem.getHTML(), '2,2')
        })

        it('should throw if promise rejects', async () => {
            await browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('deleteCookies', async (origCommand, fail) => {
                const result = await origCommand()
                return fail ? Promise.reject(new Error(result)) : result
            })

            let err = null
            try {
                await browser.deleteCookies(true)
            } catch (e) {
                err = e
            }
            assert.equal(err.message, 'deleteAllCookies,deleteAllCookies')
        })
    })
})
