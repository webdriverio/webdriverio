import conf from '../../conf/index'

describe('multiremote', () => {
    it('should grab different titles', () => {
        browser.url('/')
        browserA.url('/two.html')

        browser.sync()
        let title = browser.getTitle()
        expect(title.browserA).to.be.equal('two')
        expect(title.browserB).to.be.equal(conf.testPage.title)
    })

    it('should run right browser', () => {
        expect(browserA.desiredCapabilities.browserName).to.be.equal('phantomjs')
        expect(browserB.desiredCapabilities.browserName).to.be.equal('phantomjs')
    })
})
