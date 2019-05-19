import allure from '@wdio/allure-reporter'

// browser
browser.pause(1)
const waitUntil: boolean = browser.waitUntil(() => true, 1, '', 1)
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

// shadow$ shadow$$
const el6 = $('')
const shadowElem = el6.shadow$('')
shadowElem.click()
const shadowElems = el6.shadow$$('')
shadowElems[0].click()
// react$ react$$
const reactWrapper = browser.react$('')
const reactElement = reactWrapper.react$('')
reactElement.click()
const reactElements = reactWrapper.react$$('')
reactElements[0].click()

// selenium-standalone-service
const config: WebdriverIO.Config = {
    skipSeleniumInstall: true
}

// allure-reporter
allure.addFeature('')

export default {}
