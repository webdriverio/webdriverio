import assert from 'node:assert'

describe('smoke test multiremote', () => {
    it('should return sync value', () => {
        assert.equal(
            JSON.stringify(browser.getTitle()),
            JSON.stringify(['Mock Page Title', 'Mock Page Title']))
        assert.equal(browser.browserB.getTitle(), 'Mock Page Title')
        assert.equal(browser.browserA.getTitle(), 'Mock Page Title')
    })

    it('should return async value', async () => {
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
        it('should respect promises', () => {
            browser.addCommand('customFn', () => {
                let start = Date.now() - 1
                browser.pause(30)
                return Promise.all([
                    Promise.resolve(Date.now() - start),
                    Promise.resolve(Date.now() - start)
                ])
            })

            const results = browser.customFn()

            assert.strictEqual(results[0] >= 30, true, `First of [${results}] is less than 30`)
        })

        it('should respect promises if command was added to single browser', () => {
            browser.customCommandScenario(Object.keys(browser.instances).length)
            global.browserA.addCommand('foobar', () => {
                const title = global.browserA.getTitle()
                return `Title: ${title}`
            })
            assert.strictEqual(global.browserA.foobar(), 'Title: Mock Page Title')
            assert.equal(typeof global.browserB.foobar, 'undefined')
        })

        it('should throw if promise rejects', () => {
            browser.addCommand('customFn', () => {
                return Promise.reject('Boom!')
            })

            let err = null
            try {
                browser.customFn()
            } catch (e) {
                err = e
            }
            assert.equal(err.message, 'Boom!')
        })

        it('allows to create custom commands on elements that respects promises', () => {
            browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.addCommand('myCustomPromiseCommand', function () {
                let start = Date.now() - 1
                browser.pause(30)
                return Promise.resolve(Date.now() - start)
            }, true)
            const elem = $('elem')
            const results = elem.myCustomPromiseCommand()

            assert.strictEqual(results[0] >= 30, true, `First of [${results}] is less than 30`)
        })
    })

    describe('overwrite native commands', () => {
        it('should allow to overwrite browser commands', () => {
            browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('getTitle', function (origCommand, pre = '') {
                return '' + origCommand().map(result => pre + result)
            })

            assert.equal(browser.getTitle('Foo '), 'Foo Mock Page Title,Foo Mock Page Title')
        })

        it('should allow to overwrite element commands of a single browser', () => {
            browser.customCommandScenario(Object.keys(browser.instances).length)
            global.browserA.overwriteCommand('getTitle', function (origCommand) {
                return `Title: ${origCommand()}`
            })
            assert.equal(global.browserA.getTitle(), 'Title: Mock Page Title')
            assert.equal(global.browserB.getTitle(), 'Mock Page Title')
        })

        it('should allow to overwrite element commands', () => {
            browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('getSize', function (origCommand, ratio = 1) {
                const { width, height } = origCommand()
                return { width: width * ratio, height: height * ratio }
            }, true)
            const elem = $('elem')

            assert.equal(
                JSON.stringify(elem.getSize(2)),
                JSON.stringify([{ width: 2, height: 4 }, { width: 2, height: 4 }])
            )
        })

        it('should keep the scope', () => {
            browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('saveRecordingScreen', function (origCommand, filepath, elem) {
                if (elem) {
                    return this.execute('1+1') + '-' + elem.instances.map(i => elem[i].selector)
                }
                return origCommand(filepath)
            })

            assert.equal(browser.saveRecordingScreen(null, $('body')), '2,2-body,body')
        })

        it('should respect promises - browser', () => {
            browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('getUrl', function (origCommand, append = '') {
                return Promise.resolve(origCommand().map(result => result + append))
            })

            assert.equal(browser.getUrl('/foobar'), 'https://mymockpage.com/foobar,https://mymockpage.com/foobar')
        })

        it('should respect promises - element', () => {
            browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('getHTML', function (origCommand) {
                return Promise.resolve('' + origCommand())
            }, true)
            const elem = $('elem')

            assert.equal(elem.getHTML(), '2,2')
        })

        it('should throw if promise rejects', () => {
            browser.customCommandScenario(Object.keys(browser.instances).length)
            browser.overwriteCommand('deleteCookies', (origCommand, fail) => {
                const result = origCommand()
                return fail ? Promise.reject(result) : result
            })

            let err = null
            try {
                browser.deleteCookies(true)
            } catch (e) {
                err = e
            }
            assert.equal(err.message, 'deleteAllCookies,deleteAllCookies')
        })
    })
})
