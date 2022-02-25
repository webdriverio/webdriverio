import { expectType } from 'tsd'
import allure from '@wdio/allure-reporter'
import type { MockOverwriteFunction, ClickOptions, TouchAction, Selector } from 'webdriverio'

import { SevereServiceError } from 'webdriverio'

declare global {
    namespace WebdriverIO {
        interface Browser {
            browserCustomCommand: (variable: number) => void
        }
        interface Element {
            elementCustomCommand: (arg: unknown) => number
        }
        interface MultiRemoteBrowser {
            browserCustomCommand: (variable: number) => void
        }
    }
}

const nsBrowser: WebdriverIO.Browser = {} as any
nsBrowser.clearMockCalls('')
expectType<{ foo: boolean }>(nsBrowser.ambientCommand('foo'))

const nsElem: WebdriverIO.Element = {} as any
nsElem.click()

const nsElems: WebdriverIO.ElementArray = {} as any
expectType<string>(nsElems.foundWith)

// browser
browser.pause(1)
browser.newWindow('https://webdriver.io', {
    windowName: 'some name',
    windowFeatures: 'some features'
})
expectType<unknown>(
    browser.waitUntil(
        () => true,
        {
            timeout: 1,
            timeoutMsg: '',
            interval: 1
        }
    )
)
const c = browser.getCookies()
expectType<string>(c[0].name)
browser.getCookies('foobar')
browser.getCookies(['foobar'])
browser.setCookies({
    name: '',
    value: ''
})
browser.setCookies([{
    name: '',
    value: '',
    domain: '',
    path: '',
    expiry: 1,
    sameSite: 'Strict',
    secure: true,
    httpOnly: true
}])
browser.deleteCookies('foobar')
browser.deleteCookies(['foobar'])

browser.execute('return 123')
const executeResult = browser.execute(function (x: number) {
    return x
}, 4)
expectType<number>(executeResult)

expectType<number>(browser.call(async () => 4))
browser.executeAsync((arg: number, cb: (arg: number) => void) => {
    expectType<number>(arg)
    cb(123)
})

// printPage
const buffer = browser.savePDF('./packages/bar.pdf', {
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
expectType<number>(buffer.byteLength)

browser.savePDF('./packages/bar.pdf')

// browser element command
browser.getElementRect('elementId')

// protocol command return mapped object value
const { x, y, width, height } = browser.getWindowRect()
expectType<number>(x)
expectType<number>(y)
expectType<number>(width)
expectType<number>(height)

// protocol command return unmapped object
const snapshot = browser.takeHeapSnapshot()
expectType<any>(snapshot.foo)

// browser command return mapped object value
const size = browser.getWindowSize()
expectType<number>(size.height)
const { width: w, height: h } = browser.getWindowSize()
expectType<number>(w)
expectType<number>(h)

// browser custom command
browser.browserCustomCommand(5)

// $
const el1 = $('')
const strFunction = (str: string) => str
strFunction(el1.selector as string)
strFunction(el1.elementId)
const el2 = el1.$('')
const el3 = el2.$('')
el1.getCSSProperty('style')
el2.click()
el1.moveTo({ xOffset: 0, yOffset: 0 })
expectType<boolean>(
    el2.waitForExist({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    })
)
expectType<boolean>(
    el2.waitForDisplayed({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    })
)
expectType<boolean>(
    el2.waitForEnabled({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    })
)
expectType<boolean>(
    el2.waitForClickable({
        timeout: 1,
        timeoutMsg: '',
        interval: 1,
        reverse: true
    })
)

expectType<number>(el1.getLocation('x'))
expectType<number>(el1.getLocation().y) // as Location

expectType<number>(el1.getSize('y'))
expectType<number>(el1.getSize('width'))
expectType<number>(el1.getSize().height) // as Size

// element custom command
const el2result = el3.elementCustomCommand(4)
expectType<number>(el2result)

// $$
const elems = $$('')
const el4 = elems[0]
const el5 = el4.$('')
el4.getAttribute('class')
el5.scrollIntoView(false)

// An examples of addValue command with enabled/disabled translation to Unicode
const el = $('')
el.addValue('Delete')
el.addValue('Delete', { translateToUnicode: false })

// scroll into view
el.scrollIntoView(true)
const scrollOptions: ScrollIntoViewOptions = {
    block: 'center',
    // @ts-expect-error
    foo: 'bar'
}
el.scrollIntoView(scrollOptions)

// An examples of setValue command with enabled/disabled translation to Unicode
const elem1 = $('')
elem1.setValue('Delete', { translateToUnicode: true })
elem1.setValue('Delete')

expectType<Selector>(elems.selector)
expectType<WebdriverIO.Element | WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser>(elems.parent)

// shadow$ shadow$$
const el6 = $('')
const shadowElem = el6.shadow$('')
shadowElem.click()
const shadowElems = el6.shadow$$('')
shadowElems[0].click()
// react$ react$$
const reactWrapper = browser.react$('')
expectType<WebdriverIO.Element>(
    browser.react$('', {
        props: {},
        state: true
    })
)
const reactElement = reactWrapper.react$('')
const reactElementWithOptions = reactWrapper.react$('', {
    props: {},
    state: true
})
reactElement.click()
const reactElements = reactWrapper.react$$('')
const reactElementsWithOptions = reactWrapper.react$$('', {
    props: {},
    state: true
})
reactElements[0].click()

// touchAction
const ele = $('')
const touchAction: TouchAction = {
    action: 'press' as const,
    element: $(''),
    ms: 0,
    x: 0,
    y: 0
}
ele.touchAction(touchAction)
browser.touchAction(touchAction)
browser.touchAction([
    { action: 'press', x: 200, y: 200 },
    { action: 'moveTo', x: 200, y: 300 },
    'release'
])

// dragAndDrop
ele.dragAndDrop(ele, { duration: 0 })
ele.dragAndDrop({ x: 1, y: 2 })

// addLocatorStrategy
browser.addLocatorStrategy('myStrat', () => document.body)
browser.addLocatorStrategy('myStrat', () => document.querySelectorAll('div'))
browser.addLocatorStrategy('myStrat', (selector, root) => {
    expectType<String>(selector)
    expectType<HTMLElement>(root)
    return root
})

// shared-store-service
browser.sharedStore.get('foo')
browser.sharedStore.set('foo', ['q', 1, true, null, {'w' : {}, 'e': [] }, [{}]])

// test access to base client properties
expectType<string>(browser.sessionId)
expectType<string>((browser.capabilities as WebDriver.Capabilities).browserName)
expectType<string>((browser.requestedCapabilities as WebDriver.Capabilities).browserName)
expectType<boolean>(browser.isMobile)
expectType<boolean>(browser.isAndroid)
expectType<boolean>(browser.isIOS)

// allure-reporter
allure.addFeature('')

// network mocking
browser.throttle('Regular2G')
browser.throttle({
    offline: false,
    downloadThroughput: 50 * 1024 / 8,
    uploadThroughput: 20 * 1024 / 8,
    latency: 500
})
browser.mock('**/image.jpg')
const mock = browser.mock('**/image.jpg', {
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
    await client.send('Debugger.disable')
    // @ts-expect-error
    await client.send('Debugger.continueToLocation', { wrong: 'param' })
    return url
}
mock.respond(res)
mock.respond(async (req, client) => {
    const url:string = req.url
    await client.send('Debugger.disable')
    // @ts-expect-error
    await client.send('Debugger.continueToLocation', { wrong: 'param' })
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

// addCommand

// element
browser.addCommand('getClass', function () {
    return this.getAttribute('class')
}, true)

// browser
browser.addCommand('sleep', function (ms: number) {
    this.pause(ms)
}, false)

browser.addCommand('sleep', function (ms: number) {
    this.pause(ms)
})

// overwriteCommand

// element
type ClickOptionsExtended = Partial<ClickOptions> & { wait?: boolean }
browser.overwriteCommand('click', function (clickFn, opts: ClickOptionsExtended = {}): any {
    if (opts.wait) {
        this.waitForClickable()
    }
    clickFn.bind(this, opts)
}, true)

// browser
browser.overwriteCommand('pause', function (pause, ms = 1000): any {
    pause.bind(this, ms)
}, false)

browser.overwriteCommand('pause', function (pause, ms = 1000): any {
    pause.bind(this, ms)
})

function testSevereServiceError_noParameters() {
    throw new SevereServiceError();
}

function testSevereServiceError_stringParameter() {
    throw new SevereServiceError("Something happened.");
}

/**
 * Multiremote
 */
const mBrowser: WebdriverIO.MultiRemoteBrowser = {} as any
const rect = mBrowser.getWindowRect()
expectType<number>(rect[0].x)

const mElem = mBrowser.$('foobar')
const location = mElem.getLocation('x')
expectType<number>(location[0] as number)

const url = multiremotebrowser.getUrl()
url.pop()

// async chain API
expectType<WebdriverIO.Element>(
    browser.$('foo').$('bar').$$('loo')[2].$('foo').$('bar'))
expectType<Selector>(
    browser.$('foo').$('bar').selector)
expectType<Error>(
    browser.$('foo').$('bar').error)
expectType<string>(
    browser.$('foo').$('bar').elementId)
expectType<WebdriverIO.Browser | WebdriverIO.Element>(
    browser.$('foo').$('bar').parent)
expectType<number>(
    browser.$('foo').$('bar').$$('loo').length)
expectType<Selector>(
    browser.$('foo').$('bar').$$('loo').selector)
expectType<WebdriverIO.Browser | WebdriverIO.Element | WebdriverIO.MultiRemoteBrowser>(
    browser.$('foo').$('bar').$$('loo').parent)

expectType<void>(
    browser.$$('foo').forEach(() => true)
)
expectType<string[]>(
    browser.$('foo').$$('bar').map((el) => {
        expectType<WebdriverIO.Element>(el)
        return el.getText()
    })
)
expectType<WebdriverIO.Element>(
    browser.$$('foo').find(() => true)
)
expectType<WebdriverIO.Element>(
    browser.$$('foo').find(async () => true)
)
expectType<number>(
    browser.$$('foo').findIndex(() => true)
)
expectType<boolean>(
    browser.$$('foo').some(async () => true)
)
expectType<boolean>(
    browser.$$('foo').every(async () => true)
)
expectType<WebdriverIO.Element[]>(
    browser.$$('foo').filter(async () => true)
)
type Random = {
    foo: WebdriverIO.Element
    bar: WebdriverIO.Browser
}
expectType<Random>(
    browser.$$('foo').reduce((acc, curr) => {
        acc = {
            foo: curr,
            bar: browser
        }
        return acc
    }, {} as Random)
)

export default {}
