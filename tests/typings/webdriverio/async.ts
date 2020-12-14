import allure from '@wdio/allure-reporter'
import { remote, multiremote, MockOverwriteFunction, SevereServiceError } from 'webdriverio'

// An example of adding command within ts file to WebdriverIO (async)
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

    multiremote({
        myBrowserInstance: {
            browserName: 'chrome'
        }
    }).then(() => {}, () => {})

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
    remote({ capabilities: { browserName: 'chrome' } }).then(
        () => {}, () => {})
    const rElem = await r.$('')
    await rElem.click()

    ////////////////////////////////////////////////////////////////////////////////

    // browser
    await browser.pause(1)
    await browser.newWindow('https://webdriver.io', {
        windowName: 'some name',
        windowFeatures: 'some features'
    })

    await browser.createWindow('tab')
    await browser.createWindow('window')

    const waitUntil: boolean = await browser.waitUntil(
        () => Promise.resolve(true),
        {
            timeout: 1,
            timeoutMsg: '',
            interval: 1
        }
    )
    await browser.getCookies()
    await browser.getCookies('foobar')
    await browser.getCookies(['foobar'])
    await browser.setCookies({
        name: '',
        value: ''
    })
    await browser.setCookies([{
        name: '',
        value: '',
        domain: '',
        path: '',
        expiry: 1,
        sameSite: 'Lax',
        secure: true,
        httpOnly: true
    }])
    await browser.deleteCookies('foobar')
    await browser.deleteCookies(['foobar'])

    const executeResult = await browser.execute(function (x: number) {
        return x
    }, 4)
    executeResult.toFixed(2)

    const callResult = <number>await browser.call(() =>
        new Promise(resolve => setTimeout(() => resolve(4), 1))
    )
    callResult.toFixed(2)

    // printPage
    await browser.savePDF('./packages/bar.pdf', {
        orientation: 'landscape',
        background: true,
        width: 24.5,
        height: 26.9,
        top: 10,
        bottom: 10,
        left: 5,
        right: 5,
        shrinkToFit: true,
        pageRanges: [{}]
    })

    await browser.savePDF('./packages/bar.pdf')

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

    // $
    const el1 = await $('')
    const strFunction = (str: string) => str
    strFunction(el1.selector)
    strFunction(el1.elementId)
    const el2 = await el1.$('')
    const el3 = await el2.$('')
    await el1.getCSSProperty('style')
    await el2.click()
    await el1.moveTo({ xOffset: 0, yOffset: 0 })
    const elementExists: boolean = await el2.waitForExist({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    })
    const elementDisplayed: boolean = await el2.waitForDisplayed({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    })
    const elementEnabled: boolean = await el2.waitForEnabled({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    })
    const elementClickable: boolean = await el2.waitForClickable({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    })
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
    const parent$$: WebdriverIO.Element | WebdriverIO.BrowserObject = elems.parent

    // shadow$ shadow$$
    const el6 = await $('')
    const shadowElem = await el6.shadow$('')
    await shadowElem.click()
    const shadowElems = await el6.shadow$$('')
    await shadowElems[0].click()

    // react$ react$$
    const reactWrapper = await browser.react$('')
    const reactWrapperWithOptions = await browser.react$('', {
        props: {},
        state: true
    })
    const reactElement = await reactWrapper.react$('')
    const reactElementWithOptions = await reactWrapper.react$('', {
        props: {},
        state: true
    })
    await reactElement.click()
    const reactElements = await reactWrapper.react$$('')
    const reactElementsWithOptions = await reactWrapper.react$$('', {
        props: {},
        state: true
    })
    await reactElements[0].click()

    // touchAction
    const ele = await $('')
    const touchAction: WebdriverIO.TouchAction = {
        action: "longPress",
        element: await $(''),
        ms: 0,
        x: 0,
        y: 0
    }
    await ele.touchAction(touchAction)
    await browser.touchAction(touchAction)

    // dragAndDrop
    await ele.dragAndDrop(ele, { duration: 0 })
    await ele.dragAndDrop({ x: 1, y: 2 })

    // addLocatorStrategy
    browser.addLocatorStrategy('myStrat', () => document.body)
    browser.addLocatorStrategy('myStrat', () => document.querySelectorAll('div'))

    // test access to base client properties
    browser.sessionId
    browser.capabilities.browserName
    browser.requestedCapabilities.browserName
    browser.isMobile
    browser.isAndroid
    browser.isIOS

    // network mocking
    browser.throttle('Regular2G')
    browser.throttle({
        offline: false,
        downloadThroughput: 50 * 1024 / 8,
        uploadThroughput: 20 * 1024 / 8,
        latency: 500
    })
    browser.mock('**/image.jpg')
    const mock = await browser.mock('**/image.jpg', {
        method: 'get',
        headers: { foo: 'bar' }
    })
    mock.abort('Aborted')
    mock.abortOnce('AccessDenied')
    mock.clear()
    mock.respond('/other/resource.jpg')
    mock.respond('/other/resource.jpg', {
        statusCode: 100,
        headers: { foo: 'bar' }
    })
    const res: MockOverwriteFunction = async function (req, client) {
        const url:string = req.url
        await client.send('foo', { bar: 1 })
        return url
    }
    mock.respond(res)
    mock.respond(async (req, client) => {
        const url:string = req.url
        await client.send('foo', { bar: 1 })
        return true
    })
    mock.respondOnce('/other/resource.jpg')
    mock.respondOnce('/other/resource.jpg', {
        statusCode: 100,
        headers: { foo: 'bar' }
    })
    mock.restore()
    const match = mock.calls[0]
    match.body
    match.headers
}

function testSevereServiceError_noParameters() {
    throw new SevereServiceError();
}

function testSevereServiceError_stringParameter() {
    throw new SevereServiceError("Something happened.");
}

// addCommand

// element
browser.addCommand('getClass', async function () {
    return this.getAttribute('class').catch()
}, true)

// browser
browser.addCommand('sleep', async function (ms: number) {
    return this.pause(ms).catch()
}, false)

browser.addCommand('sleep', async function (ms: number) {
    return this.pause(ms).catch()
})

// overwriteCommand

// element
type ClickOptionsExtended = WebdriverIO.ClickOptions & { wait?: boolean }
browser.overwriteCommand('click', async function (clickFn, opts: ClickOptionsExtended = {}) {
    if (opts.wait) {
        await this.waitForClickable().catch()
    }
    return clickFn(opts).catch()
}, true)

// browser
browser.overwriteCommand('pause', async function (pause, ms = 1000) {
    return pause(ms).catch()
}, false)

browser.overwriteCommand('pause', async function (pause, ms = 1000) {
    return pause(ms).catch()
})

// allure-reporter
allure.addFeature('')

export default {}
