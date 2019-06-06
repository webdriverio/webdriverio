import allure from '@wdio/allure-reporter'
import { remote, multiremote } from 'webdriverio'

// An example of adding command withing ts file to WebdriverIOAsync
declare module "webdriverio" {
    interface Browser {
        browserCustomCommand: (arg: unknown) => Promise<void>
    }
}

async function bar() {
    // multiremote
    const mr = await multiremote({
        myBrowserInstance: {
            browserName: 'chrome'
        }
    })

    // interact with specific instance
    const mrSingleElem = await mr.myBrowserInstance.$('')
    await mrSingleElem.click()

    // interact with all instances
    const mrElem = await mr.$('')
    await mrElem.click()

    // instances array
    mr.instances[0].substr(0, 1)

    ////////////////////////////////////////////////////////////////////////////////

    // remote
    const r = await remote({ capabilities: { browserName: 'chrome' } })
    const rElem = await r.$('')
    await rElem.click()

    ////////////////////////////////////////////////////////////////////////////////

    // browser
    await browser.pause(1)
    const waitUntil: boolean = await browser.waitUntil(() => Promise.resolve(true), 1, '', 1)
    await browser.getCookies()

    const executeResult = await browser.execute(function (x: number) {
        return x
    }, 4)
    executeResult.toFixed(2)

    const callResult = <number>await browser.call(() =>
        new Promise(resolve => setTimeout(() => resolve(4), 1))
    )
    callResult.toFixed(2)

    // browser custom command
    await browser.browserCustomCommand(14)

    browser.overwriteCommand('click', function (origCommand) {
        return origCommand()
    })

    // $
    const el1 = await $('')
    const el2 = await el1.$('')
    const el3 = await el2.$('')
    await el1.getCSSProperty('style')
    await el2.click()
    // element custom command
    const el2result = await el3.elementCustomCommand(4)
    el2result.toFixed(2)

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
