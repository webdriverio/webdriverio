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

    it('should be able to play with multiple element variables', () => {
        let textarea = browser.element('textarea')
        let headings = browser.elements('.findme')
        textarea.setValue(headings.getText().join(','))
        expect(textarea.getValue()).to.be.equal('Test CSS Attributes,NESTED ELEMENTS,MORE NESTED')
    })

    it('should be able to deal with nested element calls', () => {
        expect(browser.element('.moreNesting').element('.findme').getText()).to.be.equal('MORE NESTED')
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
})
