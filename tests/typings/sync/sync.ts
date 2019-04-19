import allure from '@wdio/allure-reporter'

// browser
browser.pause(1)
browser.waitUntil(() => true, 1, '', 1)
browser.getCookies()
let res = browser.execute(function (x: number) {
    return x
}, 4)
res.toFixed(2)

// $
const el1 = $('')
const el2 = el1.$('')
const el3 = el2.$('')
el1.getCSSProperty('style')
el2.click()
el3.waitForDisplayed()

// $$
const elems = $$('')
const el4 = elems[0]
const el5 = el4.$('')
el4.getAttribute('class')
el5.scrollIntoView(false)

// selenium-standalone-service
const config: WebdriverIO.Config = {
    skipSeleniumInstall: true
}

// allure-reporter
allure.addFeature('')

export default {}
