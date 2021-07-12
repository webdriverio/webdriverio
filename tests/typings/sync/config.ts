const config: WebdriverIO.Config = {
    capabilities: [{}],

    specs: [
        'foobar.js',
        [
            'foo.js',
            'bar.js'
        ]
    ],

    beforeTest () {
        const size = browser.getWindowSize()
        size.height.toFixed(2)
    },

    async afterTest () {
        const size = await browser.getWindowSize()
        size.height.toFixed(2)
    }
}
