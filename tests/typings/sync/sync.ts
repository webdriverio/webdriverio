import allure from '@wdio/allure-reporter'

// An example of adding command withing ts file with @wdio/sync
declare module "@wdio/sync" {
    interface Element {
        elementCustomCommand: (arg: unknown) => number
    }
}

// browser
browser.pause(1)
const waitUntil: boolean = browser.waitUntil(() => true, 1, '', 1)
browser.getCookies()

const executeResult = browser.execute(function (x: number) {
    return x
}, 4)
executeResult.toFixed(2)

const callResult = <number>browser.call(() =>
    new Promise(resolve => setTimeout(() => resolve(4), 1))
)
callResult.toFixed(2)

// browser custom command
browser.browserCustomCommand(5)

browser.overwriteCommand('click', function (origCommand) {
    origCommand()
}, true)

// $
const el1 = $('')
const el2 = el1.$('')
const el3 = el2.$('')
el1.getCSSProperty('style')
el2.click()
// element custom command
const el2result = el3.elementCustomCommand(4)
el2result.toFixed(2)

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
