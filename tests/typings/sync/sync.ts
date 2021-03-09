import allure from '@wdio/allure-reporter'
import type { MockOverwriteFunction, ClickOptions, TouchAction } from 'webdriverio'

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

const nsElem: WebdriverIO.Element = {} as any
nsElem.click()

const nsElems: WebdriverIO.ElementArray = {} as any
nsElems.foundWith.toUpperCase()

// browser
browser.pause(1)
browser.newWindow('https://webdriver.io', {
    windowName: 'some name',
    windowFeatures: 'some features'
})
const waitUntil: boolean = browser.waitUntil(
    () => true,
    {
        timeout: 1,
        timeoutMsg: '',
        interval: 1
    }
)
const c = browser.getCookies()
c[0].name.toLowerCase()
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
executeResult.toFixed(2)

const callResult = <number>browser.call(() =>
    new Promise(resolve => setTimeout(() => resolve(4), 1))
)
callResult.toFixed(2)
browser.executeAsync((arg: number, cb: (arg: number) => void) => {
    arg.toFixed()
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
buffer.byteLength.toFixed(2)

browser.savePDF('./packages/bar.pdf')

// browser element command
browser.getElementRect('elementId')

// protocol command return mapped object value
const { x, y, width, height } = browser.getWindowRect()
x.toFixed(2)
y.toFixed(2)
width.toFixed(2)
height.toFixed(2)

// protocol command return unmapped object
const snapshot = browser.takeHeapSnapshot()

// browser command return mapped object value
const size = browser.getWindowSize()
size.height.toFixed(2)
const { width: w, height: h } = browser.getWindowSize()
w.toFixed(2)
h.toFixed(2)

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
const elementExists: boolean = el2.waitForExist({
    timeout: 1,
    timeoutMsg: '',
    interval: 1,
    reverse: true
})
const elementDisplayed: boolean = el2.waitForDisplayed({
    timeout: 1,
    timeoutMsg: '',
    interval: 1,
    reverse: true
})
const elementEnabled: boolean = el2.waitForEnabled({
    timeout: 1,
    timeoutMsg: '',
    interval: 1,
    reverse: true
})
const elementClickable: boolean = el2.waitForClickable({
    timeout: 1,
    timeoutMsg: '',
    interval: 1,
    reverse: true
})

el1.getLocation('x').toFixed() // as number
el1.getLocation().y // as Location

el1.getSize('y').toFixed() // as number
el1.getSize('width').toFixed() // as number
el1.getSize().height // as Size

// element custom command
const el2result = el3.elementCustomCommand(4)
el2result.toFixed(2)

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

const selector$$ = elems.selector as string
const selector2$$ = elems.selector as Function
const parent$$: WebdriverIO.Element | WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser = elems.parent

// shadow$ shadow$$
const el6 = $('')
const shadowElem = el6.shadow$('')
shadowElem.click()
const shadowElems = el6.shadow$$('')
shadowElems[0].click()
// react$ react$$
const reactWrapper = browser.react$('')
const reactWrapperWithOptions = browser.react$('', {
    props: {},
    state: true
})
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

// dragAndDrop
ele.dragAndDrop(ele, { duration: 0 })
ele.dragAndDrop({ x: 1, y: 2 })

// addLocatorStrategy
browser.addLocatorStrategy('myStrat', () => document.body)
browser.addLocatorStrategy('myStrat', () => document.querySelectorAll('div'))

// shared-store-service
browser.sharedStore.get('foo')
browser.sharedStore.set('foo', ['q', 1, true, null, {'w' : {}, 'e': [] }, [{}]])

// test access to base client properties
browser.sessionId
;(browser.capabilities as WebDriver.Capabilities).browserName
;(browser.requestedCapabilities as WebDriver.Capabilities).browserName
browser.isMobile
browser.isAndroid
browser.isIOS

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
rect[0].x.toFixed(2)

const mElem = mBrowser.$('foobar')
const location = mElem.getLocation('x')
;(location[0] as number).toFixed()

const url = multiremotebrowser.getUrl()
url.pop()

export default {}
