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
el.addValue('Delete', { translateToUnicode: true })
el.addValue('Delete', { translateToUnicode: false })

// An examples of setValue command with enabled/disabled translation to Unicode
const elem1 = $('')
elem1.setValue('Delete', { translateToUnicode: true })
elem1.setValue('Delete', { translateToUnicode: false })

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
const reactElement = reactWrapper.react$('')
reactElement.click()
const reactElements = reactWrapper.react$$('')
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
ele.dragAndDrop(ele, 0)
ele.dragAndDrop({ x: 1, y: 2 })

// addLocatorStrategy
browser.addLocatorStrategy('myStrat', () => {})

// selenium-standalone-service
const config: WebdriverIO.Config = {
    skipSeleniumInstall: true
}

// shared-store-service
browser.sharedStore.get('foo')
browser.sharedStore.set('foo', ['q', 1, true, null, {'w' : {}, 'e': [] }, [{}]])

// allure-reporter
allure.addFeature('')

export default {}
