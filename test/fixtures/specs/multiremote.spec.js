import conf from '../../conf/index'

describe('multiremote', () => {
    it('should grab different titles', () => {
        browser.url('/')
        browserA.url('/two.html')

        let title = browser.sync().getTitle()
        expect(title.browserA).to.be.equal('two')
        expect(title.browserB).to.be.equal(conf.testPage.title)
    })
})
