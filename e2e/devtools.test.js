import DevTools from '../packages/devtools/src/index'
import { ELEMENT_KEY } from '../packages/devtools/src/constants'

let browser

beforeAll(async () => {
    browser = await DevTools.newSession({
        outputDir: __dirname,
        capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': {
                headless: true
            }
        }
    })
})

it('should navigate to a page and get page info', async () => {
    await browser.navigateTo('http://guinea-pig.webdriver.io')
    expect(await browser.getTitle()).toBe('WebdriverJS Testpage')
    expect(await browser.getUrl()).toContain('http://guinea-pig.webdriver.io')
    expect(await browser.getPageSource()).toContain('WebdriverJS Testpage')
})

describe('timeouts', () => {
    beforeAll(async () => {
        await browser.navigateTo('http://guinea-pig.webdriver.io')
    })

    it('getTimeouts', async () => {
        expect(await browser.getTimeouts()).toEqual({
            implicit: 0,
            pageLoad: 300000,
            script: 30000
        })
    })

    it('setTimeouts', async () => {
        await browser.setTimeouts(1, 2, 3)
        expect(await browser.getTimeouts()).toEqual({
            implicit: 1,
            pageLoad: 2,
            script: 3
        })
    })

    it('test script timeout', async () => {
        expect.assertions(2)

        const asyncCommand = () => browser.executeAsyncScript(
            'return setTimeout(() => arguments[2](document.title + \' \' + arguments[0] + arguments[1]), 100)',
            ['Test', '!'])

        try {
            await asyncCommand()
        } catch (e) {
            expect(e.message).toBe('Evaluation failed: script timeout')
        }

        await browser.setTimeouts(0, 1000, 300)
        expect(await asyncCommand()).toBe('WebdriverJS Testpage Test!')
    })

    afterAll(async () => {
        await browser.setTimeouts(0, 300000, 300000)
    })
})

describe('elements', () => {
    beforeAll(async () => {
        await browser.navigateTo('http://guinea-pig.webdriver.io')
    })

    it('findElement with css selector', async () => {
        const yellowBox = await browser.findElement('css selector', '.yellow')
        expect(yellowBox).toEqual({ [ELEMENT_KEY]: 'ELEMENT-1' })
        const redBox = await browser.findElement('css selector', '.red')
        expect(redBox).toEqual({ [ELEMENT_KEY]: 'ELEMENT-2' })
    })

    it('find nested element with css selector', async () => {
        const nested = await browser.findElement('css selector', '.nested')
        const header = await browser.findElementFromElement(nested[ELEMENT_KEY], 'css selector', '.findme')
        expect(header).toEqual({ [ELEMENT_KEY]: 'ELEMENT-4' })
    })

    it('findElement with xPath', async () => {
        const xPathElement = await browser.findElement('xpath', '//*[@id="newWindow"]')
        expect(xPathElement).toEqual({ [ELEMENT_KEY]: 'ELEMENT-5' })
    })

    it('findElements with css selector', async () => {
        const boxes = await browser.findElements('css selector', '.box')
        expect(boxes).toHaveLength(5)
    })

    it('find nested elements with css selector', async () => {
        const nested = await browser.findElement('css selector', '.nested')
        const spans = await browser.findElementsFromElement(nested[ELEMENT_KEY], 'css selector', 'span')
        expect(spans).toHaveLength(2)
    })

    it('can click and go back and forward', async () => {
        const link = await browser.findElement('css selector', '#secondPageLink')
        await browser.elementClick(link[ELEMENT_KEY])
        expect(await browser.getTitle()).toBe('two')
        await browser.back()
        expect(await browser.getTitle()).toBe('WebdriverJS Testpage')
        await browser.forward()
        expect(await browser.getTitle()).toBe('two')
    })

    it('element properties', async () => {
        await browser.navigateTo('http://guinea-pig.webdriver.io')
        const link = await browser.findElement('css selector', '#secondPageLink')
        expect(await browser.getElementText(link[ELEMENT_KEY])).toBe('two')
        expect(await browser.getElementAttribute(link[ELEMENT_KEY], 'href')).toBe('./two.html')
        expect(await browser.getElementProperty(link[ELEMENT_KEY], 'tagName')).toBe('A')
        expect(await browser.getElementTagName(link[ELEMENT_KEY])).toBe('a')
        expect(await browser.getElementCSSValue(link[ELEMENT_KEY], 'color')).toBe('rgb(0, 136, 204)')

        const rect = await browser.getElementRect(link[ELEMENT_KEY])
        expect(rect.height).toBe(16)
        expect(rect.width > 21 && rect.width < 24) // changes depending where it is run
        expect(rect.x).toBe(15)
        expect(rect.y).toBe(142)

        const selectedCheckbox = await browser.findElement('css selector', '.checkbox_selected')
        expect(await browser.isElementSelected(selectedCheckbox[ELEMENT_KEY])).toBe(true)
        const notSelectedCheckbox = await browser.findElement('css selector', '.checkbox_notselected')
        expect(await browser.isElementSelected(notSelectedCheckbox[ELEMENT_KEY])).toBe(false)

        const disabledInput = await browser.findElement('css selector', 'input[value="d"]')
        expect(await browser.isElementEnabled(disabledInput[ELEMENT_KEY])).toBe(false)
        const enabledInput = await browser.findElement('css selector', 'input[value="a"]')
        expect(await browser.isElementEnabled(enabledInput[ELEMENT_KEY])).toBe(true)
    })

    it('visibility', async () => {
        await browser.navigateTo('http://guinea-pig.webdriver.io')
        const notVisible = await browser.findElement('css selector', '.notVisible')
        expect(await browser.isElementDisplayed(notVisible[ELEMENT_KEY])).toBe(false)
        const notInViewport = await browser.findElement('css selector', '.notInViewport')
        expect(await browser.isElementDisplayed(notInViewport[ELEMENT_KEY])).toBe(false)
        const body = await browser.findElement('css selector', 'body')
        expect(await browser.isElementDisplayed(body[ELEMENT_KEY])).toBe(true)
    })

    it('getActiveElement', async () => {
        const textarea = await browser.findElement('css selector', 'textarea')
        await browser.elementClick(textarea[ELEMENT_KEY])

        const activeElement = await browser.getActiveElement()
        expect(await browser.getElementTagName(activeElement[ELEMENT_KEY])).toBe('textarea')
    })

    it('elementSendKeys', async () => {
        const textarea = await browser.findElement('css selector', 'textarea')
        await browser.elementSendKeys(textarea[ELEMENT_KEY], 'foobar')
        expect(await browser.getElementProperty(textarea[ELEMENT_KEY], 'value')).toBe('foobar')
    })

    it('elementClear', async () => {
        const textarea = await browser.findElement('css selector', 'textarea')
        await browser.elementClear(textarea[ELEMENT_KEY])
        expect(await browser.getElementProperty(textarea[ELEMENT_KEY], 'value')).toBe('')
    })

    it('link text', async () => {
        const link = await browser.findElement('link text', 'two')
        expect(await browser.getElementText(link[ELEMENT_KEY])).toBe('two')
    })

    it('partial link text', async () => {
        const link = await browser.findElement('partial link text', 'new tab')
        expect(await browser.getElementText(link[ELEMENT_KEY])).toBe('open new tab')
    })
})

describe('alerts', () => {
    let jsAlertBtn, alertConfirmBtn, alertPromptBtn

    beforeAll(async () => {
        await browser.navigateTo('https://the-internet.herokuapp.com/javascript_alerts')
        const buttons = await browser.findElements('css selector', '.example button')
        jsAlertBtn = buttons[0][ELEMENT_KEY]
        alertConfirmBtn = buttons[1][ELEMENT_KEY]
        alertPromptBtn = buttons[2][ELEMENT_KEY]
    })

    it('getAlertText', async () => {
        await browser.elementClick(jsAlertBtn)
        expect(await browser.getAlertText()).toBe('I am a JS Alert')
    })

    it('acceptAlert', async () => {
        expect.assertions(2)

        await browser.acceptAlert()

        const result = await browser.findElement('css selector', '#result')
        expect(await browser.getElementText(result[ELEMENT_KEY]))
            .toBe('You successfuly clicked an alert')

        try {
            await browser.getAlertText()
        } catch (e) {
            expect(e.message).toBe('no such alert')
        }
    })

    it('dismissAlert', async () => {
        await browser.elementClick(alertConfirmBtn)
        expect(await browser.getAlertText()).toBe('I am a JS Confirm')

        await browser.dismissAlert()
        const result = await browser.findElement('css selector', '#result')
        expect(await browser.getElementText(result[ELEMENT_KEY]))
            .toBe('You clicked: Cancel')

        try {
            await browser.getAlertText()
        } catch (e) {
            expect(e.message).toBe('no such alert')
        }
    })

    it('confirmAlert', async () => {
        await browser.elementClick(alertConfirmBtn)
        expect(await browser.getAlertText()).toBe('I am a JS Confirm')

        await browser.acceptAlert()
        const result = await browser.findElement('css selector', '#result')
        expect(await browser.getElementText(result[ELEMENT_KEY]))
            .toBe('You clicked: Ok')
    })

    it('sendAlertText', async () => {
        await browser.elementClick(alertPromptBtn)
        await browser.sendAlertText('foobar42')
        const result = await browser.findElement('css selector', '#result')
        expect(await browser.getElementText(result[ELEMENT_KEY]))
            .toBe('You entered: foobar42')

        await browser.elementClick(alertPromptBtn)
        await browser.dismissAlert()
        const resultDismiss = await browser.findElement('css selector', '#result')
        expect(await browser.getElementText(resultDismiss[ELEMENT_KEY]))
            .toBe('You entered: null')
    })
})

describe('cookies', () => {
    beforeAll(async () => {
        await browser.navigateTo('http://guinea-pig.webdriver.io')
    })

    it('should have no cookies in the beginning', async () => {
        expect(await browser.getAllCookies()).toEqual([])
    })

    it('should add a cookie', async () => {
        await browser.addCookie({
            name: 'foobar',
            value: 42
        })
        await browser.navigateTo('http://guinea-pig.webdriver.io')
        expect(await browser.getAllCookies()).toHaveLength(1)

        await browser.navigateTo('https://google.com')
        const cookies = await browser.getAllCookies()
        const ourCookie = cookies.find((cookie) => cookie.name ==='foobar' && cookie.value === '42')
        expect(ourCookie).toBe(undefined)
    })

    it('deleteCookie', async () => {
        await browser.navigateTo('http://guinea-pig.webdriver.io')
        const cookie = await browser.getNamedCookie('foobar')
        expect(cookie.value).toBe('42')

        await browser.deleteCookie('foobar')
        await browser.navigateTo('http://guinea-pig.webdriver.io')
        expect(await browser.getAllCookies()).toEqual([])
    })
})

describe('window handling', () => {
    beforeAll(async () => {
        await browser.navigateTo('http://guinea-pig.webdriver.io')
    })

    it('should have a single window handle in the beginning', async () => {
        const handle = await browser.getWindowHandle()
        expect(typeof handle).toBe('string')

        const handles = await browser.getWindowHandles()
        expect(handles).toEqual([handle])
    })

    it('createWindow', async () => {
        expect(await browser.getTitle()).toBe('WebdriverJS Testpage')

        await browser.createWindow('tab')
        const handles = await browser.getWindowHandles()
        expect(handles).toHaveLength(2)
    })

    it('switchToWindow', async () => {
        await browser.navigateTo('https://the-internet.herokuapp.com')
        expect(await browser.getTitle()).toBe('The Internet')

        const handles = await browser.getWindowHandles()
        await browser.switchToWindow(handles[0])
        expect(await browser.getTitle()).toBe('WebdriverJS Testpage')
    })

    it('closeWindow', async () => {
        await browser.closeWindow()
        expect(await browser.getTitle()).toBe('The Internet')
    })
})

describe('frames', () => {
    beforeAll(async () => {
        await browser.navigateTo('https://the-internet.herokuapp.com/iframe')
    })

    it('switchToFrame', async () => {
        const getDocumentText = () => browser.executeScript(
            'return document.documentElement.outerText',
            []
        )

        expect(await getDocumentText())
            .toContain('An iFrame containing the TinyMCE WYSIWYG Editor')
        const iframe = await browser.findElement('css selector', 'iframe')
        await browser.switchToFrame(iframe)

        expect(await getDocumentText())
            .toContain('Your content goes here.')
    })

    it('parentFrame', async () => {
        await browser.switchToParentFrame()
        expect(await browser.getTitle()).toBe('The Internet')
    })
})

describe('executeScript', () => {
    beforeAll(async () => {
        await browser.navigateTo('http://guinea-pig.webdriver.io')
    })

    it('sync', async () => {
        expect(await browser.executeScript(
            'return document.title + \' \' + arguments[0] + arguments[1]',
            ['Test', '!'])
        ).toBe('WebdriverJS Testpage Test!')
    })

    it('async', async () => {
        expect(await browser.executeAsyncScript(
            'return setTimeout(() => arguments[2](document.title + \' \' + arguments[0] + arguments[1]), 500)',
            ['Test2', '!'])
        ).toBe('WebdriverJS Testpage Test2!')
    })

    it('respects promises', async () => {
        expect(await browser.executeScript(
            'return new Promise((resolve) => setTimeout(() => resolve(document.title + \' \' + arguments[0] + arguments[1]), 500))',
            ['Test3', '!'])
        ).toBe('WebdriverJS Testpage Test3!')
    })

    it('refresh', async () => {
        await browser.executeScript('window.foobar = 42', [])
        expect(await browser.executeScript('return window.foobar', [])).toBe(42)
        await browser.refresh()
        expect(await browser.executeScript('return window.foobar', [])).toBe(undefined)
    })
})

afterAll(async () => {
    await browser.deleteSession()
})
