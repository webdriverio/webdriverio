import { remote } from '../../packages/webdriverio/build/index.js'

/**
 * intiate browser
 * As we use this script in our dev environments which has no
 * browser driver nor xfvb set up we have to make sure to set
 * the headless flag for running with devtools
 */
const browser = await remote({
    capabilities: {
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            headless: true
        }
    }
})

/**
 * your test code here
 */
await browser.url('https://webdriver.io')
console.log(await browser.getUrl())

/**
 * tear down session
 */
await browser.deleteSession()
