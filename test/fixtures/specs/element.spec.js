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

    it('should allow to call waitForExist on elements result', function () {
        let element = browser.elements('//div[text()="Sorry, I\'m late!"]')
        let start = new Date().getTime()
        element.waitForExist(10000)
        expect((new Date().getTime()) - start).to.be.above(1500)
        expect(element.getText()).to.be.equal('Sorry, I\'m late!')
        expect(element.getTagName()).to.be.equal('div')
    })
})
