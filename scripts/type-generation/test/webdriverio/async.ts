import allure from '@wdio/allure-reporter'

async function bar() {
    // browser
    await browser.pause(1)
    await browser.waitUntil(() => true, 1, '', 1)
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
}

// selenium-standalone-service
// ToDo: how to use selenium-standalone-service with webdriverio async?
// const config: WebdriverIO.Config = {
//     skipSeleniumInstall: true
// }

// mocha-framework and jasmine-framework
const suite: WebdriverIO.Suite = {
    // mocha
    file: '',
    title: '',
    parent: '',
    fullTitle: '',
    pending: true,

    // jasmine
    // ToDo: unable to resolve `Cannot find type definition file for <reference types="jasmine"/>`
    // fullName: ''
}

// allure-reporter
allure.addFeature('')
