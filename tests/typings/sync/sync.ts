import allure from '@wdio/allure-reporter'
import { MockOverwrite, MockOverwriteFunction } from '@wdio/sync'

// An example of adding command withing ts file with @wdio/sync
declare module "@wdio/sync" {
    interface Element {
        elementCustomCommand: (arg: unknown) => number
    }
}

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
browser.getCookies()
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

const executeResult = browser.execute(function (x: number) {
    return x
}, 4)
executeResult.toFixed(2)

const callResult = <number>browser.call(() =>
    new Promise(resolve => setTimeout(() => resolve(4), 1))
)
callResult.toFixed(2)

// browser element command
browser.getElementRect('elementId')

// protocol command return mapped object value
const { x, y, width, height } = browser.getWindowRect()

// protocol command return unmapped object
const { foo, bar } = browser.takeHeapSnapshot()

// browser command return mapped object value
const { x: x0, y: y0, width: w, height: h } = browser.getWindowSize()

// browser custom command
browser.browserCustomCommand(5)

// $
const el1 = $('')
const strFunction = (str: string) => str
strFunction(el1.selector)
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

// An examples of setValue command with enabled/disabled translation to Unicode
const elem1 = $('')
elem1.setValue('Delete', { translateToUnicode: true })
elem1.setValue('Delete')

const selector$$: string | Function = elems.selector
const parent$$: WebdriverIO.Element | WebdriverIO.BrowserObject = elems.parent

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
const touchAction: WebdriverIO.TouchAction = {
    action: "longPress",
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
browser.addLocatorStrategy('myStrat', () => {})

// shared-store-service
browser.sharedStore.get('foo')
browser.sharedStore.set('foo', ['q', 1, true, null, {'w' : {}, 'e': [] }, [{}]])

// test access to base client properties
browser.sessionId
browser.capabilities.browserName
browser.requestedCapabilities.browserName
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
type ClickOptionsExtended = WebdriverIO.ClickOptions & { wait?: boolean }
browser.overwriteCommand('click', function (clickFn, opts: ClickOptionsExtended = {}) {
    if (opts.wait) {
        this.waitForClickable()
    }
    clickFn(opts)
}, true)

// browser
browser.overwriteCommand('pause', function (pause, ms = 1000) {
    pause(ms)
}, false)

browser.overwriteCommand('pause', function (pause, ms = 1000) {
    pause(ms)
})

export default {}
