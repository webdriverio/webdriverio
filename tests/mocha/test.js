import assert from 'assert'
import os from 'os'
import sync from '../../packages/wdio-sync'
import { remote } from '../../packages/webdriverio'

describe('Mocha smoke test', () => {
    let testJs = 'tests/mocha/test.js:'

    before(() => {
        if (os.platform() === 'win32') {
            testJs = testJs.split('/').join('\\')
        }
    })

    it('should return sync value', () => {
        expect(browser).toHaveTitle('Mock Page Title')
    })

    let hasRun = false
    it('should retry', function () {
        if (!hasRun) {
            hasRun = true
            assert.equal(this.wdioRetries, 0)
            throw new Error('booom!')
        }

        assert.equal(this.wdioRetries, 1)
    }, 1)

    it('should work fine after catching an error', () => {
        browser.clickScenario()

        let err
        try {
            browser.getAlertText()
        } catch (e) {
            err = e
        }

        $('elem').click()

        assert.equal(err.stack.includes(testJs), true)
    })

    it('should chain properly', () => {
        browser.isExistingScenario()

        const el = browser.$('body')
        assert.equal(el.$('.selector-1').isExisting(), true)
        assert.equal(el.$('.selector-2').isExisting(), true)
    })

    it('should allow to reload a session', () => {
        const sessionIdBefore = browser.sessionId
        browser.reloadSession()
        expect(sessionIdBefore).not.toBe(browser.sessionId)
    })

    it('should handle promises in waitUntil callback funciton', () => {
        const results = []
        const result = browser.waitUntil(() => {
            results.push(browser.getUrl())
            return results.length > 1
        })
        assert.strictEqual(result, true)
        assert.deepEqual(results, ['https://mymockpage.com', 'https://mymockpage.com'])
    })

    it('should handle waitUntil timeout', () => {
        browser.staleElementRefetchScenario()
        const elem = $('elem')
        try {
            browser.waitUntil(() => {
                elem.click()
                return false
            }, { timeout: 1000 })
        } catch (err) {
            // ignored
        }
        assert.equal(JSON.stringify(elem.getSize()), JSON.stringify({ width: 1, height: 2 }))
    })

    it('should allow to run standalone mode synchronously', () => {
        browser.clickScenario()

        return remote({
            runner: true,
            hostname: 'localhost',
            port: 4444,
            path: '/',
            capabilities: {
                browserName: 'chrome'
            }
        }).then((remoteBrowser) => sync(() => {
            assert.equal(remoteBrowser.getTitle(), 'Mock Page Title')
        }))
    })

    describe('isDisplayed', () => {
        it('should return false if element is never found', () => {
            browser.isNeverDisplayedScenario()
            const elem = $('elem')

            assert.equal(elem.isDisplayed(), false)
        })

        it('should reFetch the element once', () => {
            browser.isEventuallyDisplayedScenario()
            const elem = $('elem')

            assert.equal(elem.isDisplayed(), true)
        })
    })

    describe('add customCommands', () => {
        it('should allow to call nested custom commands', () => {
            browser.addCommand('myCustomCommand', function (param) {
                const result = {
                    url: browser.getUrl(),
                    title: browser.getTitle()
                }

                return { param, ...result }
            })

            assert.equal(
                JSON.stringify(browser.myCustomCommand('foobar')),
                JSON.stringify({
                    param: 'foobar',
                    url: 'https://mymockpage.com',
                    title: 'Mock Page Title'
                })
            )
        })

        it('allows to create custom commands on elements', () => {
            browser.customCommandScenario()
            const elem = $('elem')
            elem.addCommand('myCustomCommand', function (param) {
                const result = this.getSize()
                return { selector: this.selector, result, param }
            })

            assert.equal(
                JSON.stringify(elem.myCustomCommand('foobar')),
                JSON.stringify({
                    selector: 'elem',
                    result: { width: 1, height: 2 },
                    param: 'foobar'
                })
            )
        })

        it('should keep the scope', () => {
            browser.customCommandScenario()
            browser.addCommand('customFn', function (elem) {
                return this.execute('1+1') + '-' + elem.selector
            })

            assert.equal(browser.customFn($('body')), '2-body')
        })

        it('should respect promises', () => {
            browser.addCommand('customFn', () => {
                return Promise.resolve('foobar')
            })

            assert.equal(browser.customFn(), 'foobar')
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
            assert.equal(err.stack.includes(testJs), true)
        })

        it('allows to create custom commands on elements that respects promises', () => {
            browser.customCommandScenario()
            browser.addCommand('myCustomPromiseCommand', function () {
                return Promise.resolve('foobar')
            }, true)
            const elem = $('elem')

            assert.equal(elem.myCustomPromiseCommand(), 'foobar')
        })
    })

    describe('overwrite native commands', () => {
        it('should allow to overwrite browser commands', () => {
            browser.customCommandScenario()
            browser.overwriteCommand('getTitle', function (origCommand, pre = '') {
                return pre + origCommand()
            })

            assert.equal(browser.getTitle('Foo '), 'Foo Mock Page Title')
        })

        it('should allow to overwrite element commands', () => {
            browser.customCommandScenario()
            browser.overwriteCommand('getSize', function (origCommand, ratio = 1) {
                const { width, height } = origCommand()
                return { width: width * ratio, height: height * ratio }
            }, true)
            const elem = $('elem')

            assert.equal(
                JSON.stringify(elem.getSize(2)),
                JSON.stringify({ width: 2, height: 4 })
            )
        })

        it('should allow to invoke native command on different element', () => {
            browser.customCommandScenario()
            browser.overwriteCommand('getSize', function (origCommand, ratio = 1) {
                const elemAlt = $('elemAlt')
                const { width, height } = origCommand.call(elemAlt)
                return { width: width * ratio, height: height * ratio }
            }, true)
            const elem = $('elem')

            assert.equal(
                JSON.stringify(elem.getSize(2)),
                JSON.stringify({ width: 20, height: 40 })
            )
        })

        it('should keep the scope', () => {
            browser.customCommandScenario()
            browser.overwriteCommand('saveRecordingScreen', function (origCommand, filepath, elem) {
                if (elem) {
                    return this.execute('1+1') + '-' + elem.selector
                }
                return origCommand(filepath)
            })

            assert.equal(browser.saveRecordingScreen(null, $('body')), '2-body')
        })

        it('should respect promises - browser', () => {
            browser.customCommandScenario()
            browser.overwriteCommand('getUrl', function (origCommand, append = '') {
                return Promise.resolve(origCommand() + append)
            })

            assert.equal(browser.getUrl('/foobar'), 'https://mymockpage.com/foobar')
        })

        it('should respect promises - element', () => {
            browser.customCommandScenario()
            browser.overwriteCommand('getHTML', function (origCommand) {
                return Promise.resolve(origCommand())
            }, true)
            const elem = $('elem')

            assert.equal(elem.getHTML(), '2')
        })

        it('should throw if promise rejects', () => {
            browser.customCommandScenario()
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
            assert.equal(err.message, 'deleteAllCookies')
            assert.equal(err.stack.includes(testJs), true)
        })
    })
})
