import conf from '../../conf/index.js'

describe('element as first class citizen', () => {
    beforeEach(() => {
        browser.url(conf.testPage.start)
    })

    it('should be able to store elements in a variable to use at will', () => {
        let header = browser.element('header h1')
        expect(header.getTagName()).to.be.equal('h1')
        expect(header.getLocation('x')).to.be.equal(8)
        expect(header.getLocation('y')).to.be.equal(20)
    })

    it('should be able to use hasFocus on element', () => {
        let login = browser.element('[name=login]')
        expect(login.hasFocus()).to.be.true
    })

    it('should be able to play with multiple element variables', () => {
        let textarea = browser.element('textarea')
        let headings = browser.elements('.findme')
        textarea.setValue(headings.getText().join(','))
        expect(textarea.getValue()).to.be.equal('Test CSS Attributes,NESTED ELEMENTS,MORE NESTED')
    })

    it('should be able to deal with nested element calls', () => {
        expect(browser.element('.moreNesting').element('.findme').getText()).to.be.equal('MORE NESTED')
    })

    it('can lazy load elements but does not fail for isExisting and isVisible', () => {
        const elem = $('#notExisting')
        expect(elem.isExisting()).to.be.equal(false)
        expect(elem.isVisible()).to.be.equal(false)

        let message
        try {
            elem.click()
        } catch (e) {
            message = e.message
        }

        expect(message).to.be.equal(
            'An element could not be located on the page using the given search parameters ("#notExisting").'
        )
    })

    it('should allow to call waitForExist on elements result', () => {
        let element = browser.elements('//div[text()="Sorry, I\'m late!"]')
        let start = new Date().getTime()
        element.waitForExist(10000)
        expect((new Date().getTime()) - start).to.be.above(1500)
        expect(element.getText()).to.be.equal('Sorry, I\'m late!')
        expect(element.getTagName()).to.be.equal('div')
    })

    it('should allow to call waitForExist reverse on elements result', () => {
        let element = browser.element('.goAway')
        let start = new Date().getTime()
        element.waitForExist(10000, true)
        expect((new Date().getTime()) - start).to.be.above(1500)
        expect(browser.isExisting('.goAway')).to.be.false
    })

    it('should be able to execute selectBy commands', () => {
        let element = browser.element('#selectTest')
        element.selectByVisibleText('seis')
        expect(element.getValue()).to.be.equal('someValue6')
        element.selectByAttribute('value', 'someValue1')
        expect(element.getValue()).to.be.equal('someValue1')
        element.selectByAttribute('name', 'someName7')
        expect(element.getValue()).to.be.equal('someValue7')
        element.selectByIndex(3)
        expect(element.getValue()).to.be.equal('someValue4')
        element.selectByValue('someValue1')
        expect(element.getValue()).to.be.equal('someValue1')
    })

    it('should work with getHTML', () => {
        let element = browser.element('.moreNesting section')
        expect(element.getHTML()).to.be.equal('<section><span>bar</span></section>')
        expect(element.getHTML(false)).to.be.equal('<span>bar</span>')
    })

    it('should work with selectorExecute(Async)', () => {
        let body = browser.element('body')
        expect(body.selectorExecuteAsync((elems, ...args) => {
            var cb = args.pop()
            setTimeout(() => {
                cb(elems[0].tagName.toLowerCase() + args.join(' '))
            }, 2000)
        }, ' was', 'the', 'element')).to.be.equal('body was the element')

        expect(body.selectorExecute((elems, ...args) => {
            return elems[0].tagName.toLowerCase() + ' ' + args.join(' ').trim()
        }, 'was', 'the', 'element')).to.be.equal('body was the element')
    })

    describe('error code 7 messages always contain the selector', () => {
        const Page = Object.create({}, {
            elem: { get: () => browser.element('span=notExisting') },
            elems: { get: () => browser.elements('span=notExisting') }
        })

        const expectedError = 'An element could not be located on the page using the given search parameters ("span=notExisting").'
        let givenError = null

        beforeEach(() => (givenError = null))

        it('fetching elements the standard way', () => {
            try {
                browser.getValue('span=notExisting')
            } catch (e) {
                givenError = e.message
            }

            expect(givenError).to.be.equal(expectedError)
        })

        it('fetching element using PO pattern', () => {
            try {
                Page.elem.getValue()
            } catch (e) {
                givenError = e.message
            }

            expect(givenError).to.be.equal(expectedError)
        })

        it('fetching element using PO pattern', () => {
            try {
                Page.elems.getValue()
            } catch (e) {
                givenError = e.message
            }

            expect(givenError).to.be.equal(expectedError)
        })
    })

    it('element calls within wait commands should not influence following action calls', () => {
        browser.waitUntil(() => browser.element('body'))
        let hasThrown = false
        try {
            browser.getTagName()
        } catch (e) {
            hasThrown = true
        }
        expect(hasThrown).to.be.ok
    })

    it('propagates lastResult for custom commands', () => {
        browser.addCommand('myTagStructure', function () {
            const content = this.getText()
            const tagName = this.getTagName()
            return `<${tagName}>${content}</${tagName}>`
        })
        const header = $('header h1')
        expect(header.myTagStructure()).to.be.equal('<h1>WebdriverIO Testpage</h1>')
    })

    it('throws an error if user attempts to call an action on a not found element', () => {
        let result
        try {
            result = $('.nested').$('h1').getText()
        } catch (e) {
            result = e.message
        }

        expect(result).to.be.equal(
            'An element could not be located on the page using the given search parameters ("h1").'
        )
    })

    describe('can be used with waitFor commands without throwing an error while querying it', () => {
        it('can query an element without throwing an error', () => {
            let res = browser.element('#notExisting')
            expect(res.value).to.be.equal(null)
            expect(res.selector).to.be.equal('#notExisting')
            expect(res._status).to.be.equal(7)
            expect(res.state).to.be.equal('failure')
        })

        it('can use waitForExist', () => {
            let elem = browser.element('//div[text()="Sorry, I\'m late!"]')
            elem.waitForExist(10000)
        })

        it('can use waitForVisible', () => {
            let elem = browser.element('//*[contains(@class, "notVisible")]')
            elem.waitForExist(10000)
        })

        it('can not use waitForText because it requires and existing element', () => {
            let elem = browser.element('#notExisting')
            let error

            try {
                elem.waitForText(2000)
            } catch (e) {
                error = e
            }

            expect(error).to.be.not.equal(undefined)
            expect(error.message).to.be.equal(
                'An element could not be located on the page using the given search parameters ("#notExisting").'
            )
        })
    })

    describe('$ and $$ helper methods', () => {
        it('should provide helper method $ to fetch single element', () => {
            let header = $('header h1')
            expect(header.getTagName()).to.be.equal('h1')
            expect($('header h1').getTagName()).to.be.equal('h1')
        })

        /**
         * doesn't work on Travis
         */
        it.skip('should provide helper method $$ to fetch multiple elements', () => {
            const colors = ['#ff0000', '#008000', '#ffff00', '#000000', '#800080']
            $$('.box').forEach((box, i) => expect(box.getCssProperty('background').parsed.hex).to.be.equal(colors[i]))
            expect(browser.elements('.box').getCssProperty('background').map((c) => c.parsed.hex)).to.be.deep.equal(colors)
        })

        it('should be able to chain $ and $$', () => {
            expect($('body').$$('select')[1].$$('option')[3].getText()).to.be.equal('cuatro')
        })
    })
})
