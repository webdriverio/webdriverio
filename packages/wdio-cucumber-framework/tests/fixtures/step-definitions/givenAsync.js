import { Given } from 'cucumber'

Given('I go on the website {string}', async (url) => {
    await browser.url(url)
})

Given('I click on link {string}', async (selector) => {
    const elem = await browser.$(selector)
    await elem.click()
})
