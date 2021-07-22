import { expectType } from 'tsd'

import allure from '@wdio/allure-reporter'
import { remote, multiremote, SevereServiceError } from 'webdriverio'
import type { MockOverwriteFunction, ClickOptions, TouchAction, Selector } from 'webdriverio'

declare global {
    namespace WebdriverIO {
        interface Browser {
            browserCustomCommand: (arg: unknown) => Promise<void>
        }

        interface MultiRemoteBrowser {
            browserCustomCommand: (arg: unknown) => Promise<void>
        }

        interface Element {
            elementCustomCommand: (arg: unknown) => Promise<number>
        }
    }
}

async function bar() {
    // multiremote
    const mr = await multiremote({
        myBrowserInstance: {
            capabilities: { browserName: 'chrome' }
        }
    })

    const rect = await mr.getWindowRect()
    expectType<number>(rect[0].x)

    const mElem = await mr.$('foobar')
    const location = await mElem.getLocation('x')
    expectType<number[]>(location)

    const url = await multiremotebrowser.getUrl()
    expectType<string[]>(url)

    multiremote({
        myBrowserInstance: {
            capabilities: { browserName: 'chrome' }
        }
    }).then(() => {}, () => {})

    // interact with specific instance
    // const mrSingleElem = await mr.myBrowserInstance.$('')
    // await mrSingleElem.click()

    // interact with all instances
    const mrElem = await mr.$('')
    await mrElem.click()

    // instances array
    expectType<string[]>(mr.instances)

    const nsElems: WebdriverIO.ElementArray = {} as any
    expectType<string>(nsElems.foundWith)

    ////////////////////////////////////////////////////////////////////////////////

    // remote
    const remoteBrowser = await remote({ capabilities: { browserName: 'chrome' } })
    remote({ capabilities: { browserName: 'chrome' } }).then(
        () => {}, () => {})
    const rElem = await browser.$('')
    await rElem.click()

    ////////////////////////////////////////////////////////////////////////////////

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
    type ClickOptionsExtended = ClickOptions & { wait?: boolean }
    browser.overwriteCommand('click', async function (clickFn, opts: Partial<ClickOptionsExtended> = {}) {
        if (opts.wait) {
            await this.waitForClickable().catch()
        }
        return clickFn.call(this, opts).catch()
    }, true)

    // browser
    browser.overwriteCommand('pause', async function (pause: Function, ms = 1000) {
        return pause(ms).catch()
    }, false)

    browser.overwriteCommand('pause', async function (pause: Function, ms = 1000) {
        return pause(ms).catch()
    })

    ////////////////////////////////////////////////////////////////////////////////

    // browser
    await browser.pause(1)
    await browser.newWindow('https://webdriver.io', {
        windowName: 'some name',
        windowFeatures: 'some features'
    })

    await browser.createWindow('tab')
    await browser.createWindow('window')

    const waitUntil = await browser.waitUntil(
        () => Promise.resolve(true),
        {
            timeout: 1,
            timeoutMsg: '',
            interval: 1
        }
    )
    expectType<true | void>(waitUntil)

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
    expectType<number>(executeResult)

    expectType<number>(
        await browser.executeAsync((arg: number, cb: (arg: number) => void) => {
            arg.toFixed()
            cb(123)
        }, 456)
    )

    const callResult = <number>await browser.call(() =>
        new Promise(resolve => setTimeout(() => resolve(4), 1))
    )
    expectType<number>(callResult)

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
    expectType<number>(x)
    expectType<number>(y)
    expectType<number>(width)
    expectType<number>(height)

    // protocol command return unmapped object
    const { foo, bar } = await browser.takeHeapSnapshot()
    expect<any>(foo)

    // browser command return mapped object value
    const { width: w, height: h }  =  await browser.getWindowSize()
    expectType<number>(w)
    expectType<number>(h)

    // browser custom command
    await browser.browserCustomCommand(14)
    const ambientResult = await browser.ambientCommand(123)
    expectType<number>(ambientResult)

    // $
    const el1 = await $('')
    const strFunction = (str: string) => str
    strFunction(el1.selector as string)
    strFunction(el1.elementId)
    const el2 = await el1.$('')
    const el3 = await el2.$('')
    await el1.getCSSProperty('style')
    await el2.click()
    await el1.moveTo({ xOffset: 0, yOffset: 0 })
    const elementExists: true | void = await el2.waitForExist({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    })
    expectType<true | void>(elementExists)
    const elementDisplayed: true | void = await el2.waitForDisplayed({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    })
    expectType<true | void>(elementDisplayed)
    const elementEnabled: true | void = await el2.waitForEnabled({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    })
    expectType<true | void>(elementEnabled)
    const elementClickable: true | void = await el2.waitForClickable({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    });
    expectType<true | void>(elementClickable)

    expectType<number>(await el1.getLocation('x')) // as number
    expectType<number>((await el1.getLocation()).y) // as Location

    expectType<number>(await el1.getSize('y')) // as number
    expectType<number>(await el1.getSize('width')) // as number
    expectType<number>((await el1.getSize()).height) // as Size

    // element custom command
    const el2result = await el3.elementCustomCommand(4)
    expectType<number>(el2result)

    // $$
    const elems = await $$('')
    const el4 = elems[0]
    const el5 = await el4.$('')
    expectType<string>(await el4.getAttribute('class'))
    expectType<void>(await el5.scrollIntoView(false))

    // An examples of addValue command with enabled/disabled translation to Unicode
    const elem = await $('')
    await elem.addValue('Delete', { translateToUnicode: true })
    await elem.addValue('Delete', { translateToUnicode: false })

    // scroll into view
    await elem.scrollIntoView(true)
    const scrollOptions: ScrollIntoViewOptions = {
        block: 'center',
        // @ts-expect-error
        foo: 'bar'
    }
    await elem.scrollIntoView(scrollOptions)

    // An examples of setValue command with enabled/disabled translation to Unicode
    const elem1 = await $('')
    elem1.setValue('Delete', { translateToUnicode: true })
    elem1.setValue('Delete', { translateToUnicode: false })

    const selector$$: string | Function | Record<'element-6066-11e4-a52e-4f735466cecf', string> = elems.selector
    ;(elems.parent as WebdriverIO.Element).click()
    ;(elems.parent as WebdriverIO.Browser).url('')
    ;(elems.parent as WebdriverIO.MultiRemoteBrowser).url('')
    // @ts-expect-error
    ;(elems.parent as WebdriverIO.Browser).click()

    // test access to base client properties
    expectType<string>(browser.sessionId)
    expectType<string>((browser.capabilities as WebDriver.Capabilities).browserName)
    expectType<string>((browser.requestedCapabilities as WebDriver.Capabilities).browserName)
    expectType<boolean>(browser.isMobile)
    expectType<boolean>(browser.isAndroid)
    expectType<boolean>(browser.isIOS)
    expectType<boolean>(browser.isDevTools)
    expectType<boolean>(browser.isMobile)

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
    const touchAction: TouchAction = {
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
        await client.send('Console.clearMessages')
        return url
    }
    mock.respond(res)
    mock.respond(async (req, client) => {
        const url:string = req.url
        await client.send('Console.clearMessages')
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

    // async chain API
    expectType<WebdriverIO.Element>(
        await browser.$('foo').$('bar').$$('loo')[2].$('foo').$('bar'))
    expectType<Selector>(
        await browser.$('foo').$('bar').selector)
    expectType<Error>(
        await browser.$('foo').$('bar').error)
    expectType<string>(
        await browser.$('foo').$('bar').elementId)
    expectType<WebdriverIO.Browser | WebdriverIO.Element | WebdriverIO.MultiRemoteBrowser>(
        await browser.$('foo').$('bar').parent)
    expectType<number>(
        await browser.$('foo').$('bar').$$('loo').length)
    expectType<Selector>(
        await browser.$('foo').$('bar').$$('loo').selector)
    expectType<WebdriverIO.Browser | WebdriverIO.Element | WebdriverIO.MultiRemoteBrowser>(
        await browser.$('foo').$('bar').$$('loo').parent)

    expectType<void>(
        await browser.$$('foo').forEach(() => true)
    )
    expectType<string[]>(
        await browser.$('foo').$$('bar').map((el) => {
            expectType<WebdriverIO.Element>(el)
            return browser.call(() => true).then(() => el.getText())
        })
    )
    expectType<WebdriverIO.Element>(
        await browser.$$('foo').find(() => true)
    )
    expectType<WebdriverIO.Element>(
        await browser.$$('foo').find(async () => true)
    )
    expectType<number>(
        await browser.$$('foo').findIndex(() => true)
    )
    expectType<boolean>(
        await browser.$$('foo').some(async () => true)
    )
    expectType<boolean>(
        await browser.$$('foo').every(async () => true)
    )
    expectType<WebdriverIO.Element[]>(
        await browser.$$('foo').filter(async () => true)
    )
    type Random = {
        foo: WebdriverIO.Element
        bar: WebdriverIO.Browser
    }
    expect<Random>(
        await browser.$$('foo').reduce((acc, curr) => {
            acc = {
                foo: curr,
                bar: browser
            }
            return browser.call(() => {}).then(() => acc)
        }, {} as Random)
    )
}

function testSevereServiceError_noParameters() {
    throw new SevereServiceError();
}

function testSevereServiceError_stringParameter() {
    throw new SevereServiceError("Something happened.");
}

// allure-reporter
allure.addFeature('')
// @ts-expect-error
allure.addDescription('with wrong param:', 123)

export default {}
