/* eslint-disable no-undef */
describe('test1', function() {

    it('retry', async function() {
        this.retries(5)
        let elem
        await browser.url(
            'https://unlimited-elements.com/list-marquee-widget-for-elementor/#'
        )
        // console.log('curretn_retry', this._runnable._currentRetry)
        elem = await $(
            '//a[@href="https://unlimited-lements.com/card-carousel-widget-for-elementor"]'
        )
        // if (this._runnable._currentRetry === 4) {
        //     elem = await $(
        //         '//a[@href="https://unlimited-elements.com/card-carousel-widget-for-elementor"]'
        //     )
        // }
        await expect(elem).toBeClickable()
    })
    it('no retry', async function () {
        await browser.url(
            'https://unlimited-elements.com/list-marquee-widget-for-elementor/#'
        )
        console.log('curretn_retry', this._runnable._currentRetry)
        let elem = await $(
            '//a[@href="https://unlimited-elements.com/card-carousel-widget-for-elementor"]'
        )
        await expect(elem).toBeClickable()
    })

    it('no retry but failure', async function () {
        await browser.url(
            'https://unlimited-elements.com/list-marquee-widget-for-elementor/#'
        )
        console.log('curretn_retry', this._runnable._currentRetry)
        let elem = await $(
            '//a[@href="https://unlimited-elemnts.com/card-carousel-widget-for-elementor"]'
        )
        await expect(elem).toBeClickable()
    })

})
