import { inject, test } from 'vitest'

test('needs the Chrome banner check', async (context) => {
    context.skip(browser.capabilities.browserName !== 'chrome', 'Chrome only')
    await browser.url(inject('baseUrl'))
    await expect($('#todo-input')).toBeDisplayed()
})
