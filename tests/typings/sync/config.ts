import { expectType } from 'tsd'

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
        expectType<number>(size.height)
    },

    async afterTest () {
        const size = await browser.getWindowSize()
        expectType<number>(size.height)
    }
}
