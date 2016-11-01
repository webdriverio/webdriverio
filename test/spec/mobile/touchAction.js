const webview = '//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]'

let WEBVIEW_CONTEXT

describe('touchAction', () => {
    before(async function () {
        /**
         * it takes a while for android to initialise webview
         */
        if (this.client.isAndroid) {
            await new Promise((resolve) => setTimeout(resolve, 5000))
        }

        const contexts = await this.client.contexts()
        WEBVIEW_CONTEXT = contexts.value.filter((c) => c.indexOf('WEBVIEW') > -1)[0]
        await this.client.context(WEBVIEW_CONTEXT)
    })

    beforeEach(async function () {
        await this.client.click('=2')
        await this.client.context('NATIVE_APP')
    })

    it('should tap', async function () {
        await this.client.touchAction(webview, 'tap')
        await this.client.context(WEBVIEW_CONTEXT)

        const activatedStates = await this.client.getText('.active')
        expect(activatedStates).to.contain('touch')
        expect(activatedStates).to.contain('release')
        expect(activatedStates).to.contain('tap')
    })

    it('should longPress', async function () {
        await this.client.touchAction(webview, 'longPress')
        await this.client.context(WEBVIEW_CONTEXT)

        const activatedStates = await this.client.getText('.active')
        expect(activatedStates).to.contain('touch')
        expect(activatedStates).to.contain('release')
        expect(activatedStates).to.contain('hold')
    })

    it('should drag down', async function () {
        await this.client.touchAction(webview, [
            'press',
            { action: 'moveTo', x: 0, y: 20 },
            'release'
        ])
        await this.client.context(WEBVIEW_CONTEXT)

        const activatedStates = await this.client.getText('.active')
        expect(activatedStates).to.contain('dragstart')
        expect(activatedStates).to.contain('drag')
        expect(activatedStates).to.contain('dragdown')
        expect(activatedStates).to.contain('dragend')
    })

    it('should drag up', async function () {
        await this.client.touchAction(webview, [
            'press',
            { action: 'moveTo', x: 0, y: -20 },
            'release'
        ])
        await this.client.context(WEBVIEW_CONTEXT)

        const activatedStates = await this.client.getText('.active')
        expect(activatedStates).to.contain('dragstart')
        expect(activatedStates).to.contain('drag')
        expect(activatedStates).to.contain('dragup')
        expect(activatedStates).to.contain('dragend')
    })

    it('should drag right', async function () {
        await this.client.touchAction(webview, [
            'press',
            { action: 'moveTo', x: 20, y: 0 },
            'release'
        ])
        await this.client.context(WEBVIEW_CONTEXT)

        const activatedStates = await this.client.getText('.active')
        expect(activatedStates).to.contain('dragstart')
        expect(activatedStates).to.contain('drag')
        expect(activatedStates).to.contain('dragright')
        expect(activatedStates).to.contain('dragend')
    })

    it('should drag left', async function () {
        await this.client.touchAction(webview, [
            'press',
            { action: 'moveTo', x: -20, y: 0 },
            'release'
        ])
        await this.client.context(WEBVIEW_CONTEXT)

        const activatedStates = await this.client.getText('.active')
        expect(activatedStates).to.contain('dragstart')
        expect(activatedStates).to.contain('drag')
        expect(activatedStates).to.contain('dragleft')
        expect(activatedStates).to.contain('dragend')
    })
})
