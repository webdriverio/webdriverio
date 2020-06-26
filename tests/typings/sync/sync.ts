import allure from '@wdio/allure-reporter'

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

browser.overwriteCommand('click', function (origCommand) {
    origCommand()
}, true)

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
browser.network.throttle()
browser.network.mock('**/image.jpg')
const mock = browser.network.mock('**/image.jpg', {
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
mock.respondOnce('/other/resource.jpg')
mock.respondOnce('/other/resource.jpg', {
    statusCode: 100,
    headers: { foo: 'bar' }
})
mock.restore()

export default {}
