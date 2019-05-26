import allure from '@wdio/allure-reporter'

async function bar() {
    // browser
    await browser.pause(1)
    const waitUntil: boolean = await browser.waitUntil(() => Promise.resolve(true), 1, '', 1)
    await browser.getCookies()

    // ToDo fix typing for `execute` and `call`
    // let res = browser.execute(function (x: number) {
    //     return x
    // }, 4)
    // res.toFixed(2)

    // $
    const el1 = await $('')
    const el2 = await el1.$('')
    const el3 = await el2.$('')
    await el1.getCSSProperty('style')
    await el2.click()
    await el3.waitForDisplayed()

    // $$
    const elems = await $$('')
    const el4 = elems[0]
    const el5 = await el4.$('')
    await el4.getAttribute('class')
    await el5.scrollIntoView(false)

    // shadow$ shadow$$
    const el6 = await $('')
    const shadowElem = await el6.shadow$('')
    await shadowElem.click()
    const shadowElems = await el6.shadow$$('')
    await shadowElems[0].click()

    // react$ react$$
    const reactWrapper = await browser.react$('')
    const reactElement = await reactWrapper.react$('')
    await reactElement.click()
    const reactElements = await reactWrapper.react$$('')
    await reactElements[0].click()
}

// selenium-standalone-service
const config: WebdriverIOAsync.Config = {
    skipSeleniumInstall: true,
    seleniumLogs: ''
}

// allure-reporter
allure.addFeature('')

export default {}
