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
})
