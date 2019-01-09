import assert from 'assert'

describe('smoke test', () => {
    it('should return sync value', () => {
        assert.equal(browser.getTitle(), 'Mock Page Title')
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
    })
})
