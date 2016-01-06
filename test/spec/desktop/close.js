import conf from '../../conf/index'

describe('close', () => {
    it('should close the current window', async function () {
        /**
         * safari doenst support `newWindow`
         */
        if (this.client.desiredCapabilities.browserName === 'safari') {
            return
        }

        // get current tab id
        const openTab = (await this.client.getTabIds())[0]

        // open new tab
        await this.client.newWindow(conf.testPage.subPage).pause(1000);

        // ensure that there are two tabs open
        (await this.client.getTabIds()).should.have.length(2)

        // close window
        await this.client.close().pause(1000);
        (await this.client.getTabIds()).should.have.length(1);

        // test if there is only one tab open
        (await this.client.windowHandle()).value.should.be.equal(openTab)
    })
})
