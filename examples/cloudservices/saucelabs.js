import { remote } from '../../packages/webdriverio/build/index.js'

(async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'chrome',
            version: 'latest',
            platform: 'Windows 10',
            tags: ['examples'],
            name: 'This is an example test',

            // If using Open Sauce (https://saucelabs.com/opensauce/),
            // capabilities must be tagged as "public" for the jobs's status
            // to update (failed/passed). If omitted on Open Sauce, the job's
            // status will only be marked "Finished." This property can be
            // be omitted for commercial (private) Sauce Labs accounts.
            // Also see https://support.saucelabs.com/customer/portal/articles/2005331-why-do-my-tests-say-%22finished%22-instead-of-%22passed%22-or-%22failed%22-how-do-i-set-the-status-
            'public': true
        },
        user: process.env.SAUCE_USERNAME,
        key: process.env.SAUCE_ACCESS_KEY,
        logLevel: 'trace'
    })

    await browser.url('https://webdriver.io')

    const searchInput = await browser.$('.ds-input')
    await searchInput.addValue('click')

    const resultLabel = await browser.$('.algolia-docsearch-suggestion--title')
    await resultLabel.click()

    await browser.pause(1000)

    const title = await browser.getTitle()
    // eslint-disable-next-line
    console.log(title) // returns "should return "WebdriverIO - click""

    await browser.deleteSession()
})()
