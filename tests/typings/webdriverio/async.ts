import allure from '@wdio/allure-reporter'
import { remote, multiremote } from 'webdriverio'

// An example of adding command withing ts file to WebdriverIO (async)
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

    // browser element command
    browser.getElementRect('elementId')

    // protocol command return mapped object value
    const { x, y, width, height } = await browser.getWindowRect()

    // protocol command return unmapped object
    const { foo, bar } = await browser.takeHeapSnapshot()

    // browser command return mapped object value
    const { x: x0, y: y0, width: w, height: h }  =  await browser.getWindowSize()

    // browser custom command
    await browser.browserCustomCommand(14)

    browser.overwriteCommand('click', function (origCommand) {
        return origCommand()
    })

    // $
    const el1 = await $('')
    const strFunction = (str: string) => str
    strFunction(el1.selector)
    strFunction(el1.elementId)
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

    // An examples of addValue command with enabled/disabled translation to Unicode
    const elem = await $('')
    await elem.addValue('Delete', { translateToUnicode: true })
    await elem.addValue('Delete', { translateToUnicode: false })

    // An examples of setValue command with enabled/disabled translation to Unicode
    const elem1 = await $('')
    elem1.setValue('Delete', { translateToUnicode: true })
    elem1.setValue('Delete', { translateToUnicode: false })

    const selector$$: string | Function = elems.selector
    const parent$$: WebdriverIOAsync.Element | WebdriverIOAsync.BrowserObject = elems.parent

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

    // touchAction
    const ele = await $('')
    const touchAction: WebdriverIOAsync.TouchAction = {
        action: "longPress",
        element: await $(''),
        ms: 0,
        x: 0,
        y: 0
    }
    await ele.touchAction(touchAction)
    await browser.touchAction(touchAction)

    // dragAndDrop
    await ele.dragAndDrop(ele, 0)
    await ele.dragAndDrop({ x: 1, y: 2 })

    // addLocatorStrategy
    browser.addLocatorStrategy('myStrat', () => {})
}

// selenium-standalone-service
const config: WebdriverIOAsync.Config = {
    skipSeleniumInstall: true,
    seleniumLogs: ''
}

// chrome configuration
const chromeConfig: WebdriverIO.Config = {
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            binary: 'path/to/chrome',
            args: ['--no-first-run', '--enable-automation'],
            prefs: {
                'profile.managed_default_content_settings.popups': 1,
                'profile.managed_default_content_settings.notifications': 1,
            }
        }
    }]
}

// firefox configuration
const firefoxConfig: WebdriverIO.Config = {
    capabilities: [{
        browserName: 'firefox',
        'moz:firefoxOptions': {
            binary: 'path/to/firefox',
            profile: 'path/to/profile',
            args: ['-headless'],
            prefs: {
                'browser.tabs.remote.autostart': false,
                'toolkit.telemetry.reportingpolicy.firstRun': false,
            },
            log: { level: 'error' }
        }
    }]
}

// allure-reporter
allure.addFeature('')

export default {}
