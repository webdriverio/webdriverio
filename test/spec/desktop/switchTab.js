import conf from '../../conf/index'

describe('switchTab', () => {
    if (process.env._BROWSER === 'internet_explorer') {
        return
    }

    let openedTabs = []
    let myTab, newTab

    describe('should switch tabs', () => {
        it('by getting the current tab id first', async function () {
            myTab = await this.client.getCurrentTabId()
        })

        it('then by creating new windows', async function () {
            await this.client.newWindow(conf.testPage.subPage)
            await this.client.newWindow(conf.testPage.subPage)
            await this.client.newWindow(conf.testPage.subPage)
        })

        it('then should have a new tab id', async function () {
            const res = await this.client.getCurrentTabId()
            res.should.not.be.equal(myTab)
            newTab = res
        })

        it('then by changing to one of the new created window handles', async function () {
            openedTabs = await this.client.getTabIds()
            newTab.should.be.equal(openedTabs[openedTabs.length - 1])
            await this.client.switchTab(openedTabs[1])
        })

        it('it then should have the desired new tab id', async function () {
            const res = await this.client.getCurrentTabId()
            openedTabs[1].should.be.equal(res)
        })

        after(async function () {
            await this.client.switchTab(openedTabs[1])
            await this.client.close(openedTabs[2])
            await this.client.close(openedTabs[3])
            await this.client.close()
        })
    })
})
