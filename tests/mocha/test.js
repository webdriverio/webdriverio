import assert from 'assert'

describe('smoke test', () => {
    it('should return sync value', () => {
        assert.equal(browser.getTitle(), 'Mock Page Title')
    })

    it('should be able to wait for an element', () => {
        browser.waitForDisplayedScenario()
        assert($('elem').waitForDisplayed(), true)
    })

    describe('middleware', () => {
        it('should wait for elements if not found immediately', () => {
            browser.waitForElementScenario()
            const elem = $('elem')
            //Element will be found
            assert.doesNotThrow(() => elem.click())
        })

        it('should refetch stale elements', () => {
            browser.staleElementRefetchScenario()

            const elem = $('elem')
            elem.click()
            // element becomes stale
            elem.click()
        })
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

    describe('customCommands', () => {
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
})
