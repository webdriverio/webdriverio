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

    it('find nested elements with xPath', async () => {
        const nested = await browser.findElement('css selector', '.nested')
        const spans = await browser.findElementsFromElement(nested[ELEMENT_KEY], 'xpath', './/div')
        expect(spans).toHaveLength(1)
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

    it('elementSendKeys for file-type input', async () => {
        const fileInput = await browser.findElement('css selector', '#upload-test')
        await browser.elementSendKeys(fileInput[ELEMENT_KEY], 'README.md')
        expect(await browser.getElementProperty(fileInput[ELEMENT_KEY], 'value')).toBe('C:\\fakepath\\README.md')
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

    it('should be able to do a drag&drop', async () => {
        await browser.executeScript('window.scrollTo(0, 0)', [])
        await browser.performActions([{
            type: 'pointer',
            id: 'finger1',
            parameters: {
                pointerType: 'mouse'
            },
            actions: [{
                type: 'pointerMove',
                duration: 0,
                x: 65,
                y: 544
            }, {
                type: 'pointerDown',
                button: 0
            }, {
                type: 'pause',
                duration: 10
            }, {
                type: 'pointerMove',
                duration: 100,
                origin: 'pointer',
                x: 1,
                y: -251
            }, {
                type: 'pointerUp',
                button: 0
            }]
        }])

        const elem = await browser.findElement('css selector', '.searchinput')
        expect(await browser.getElementProperty(elem[ELEMENT_KEY], 'value'))
            .toBe('Dropped!')
    })

    it('should be able to use keys command', async () => {
        const textarea = await browser.findElement('css selector', 'textarea')
        await browser.elementClick(textarea[ELEMENT_KEY])
        await browser.performActions([{
            type: 'key',
            id: 'keyboard',
            actions: [
                { type: 'keyDown', value: 'f' },
                { type: 'keyDown', value: 'o' },
                { type: 'keyDown', value: 'o' },
                { type: 'keyDown', value: 'b' },
                { type: 'keyDown', value: 'a' },
                { type: 'keyDown', value: 'r' },
                { type: 'keyDown', value: '😉' },
                { type: 'keyUp', value: 'f' },
                { type: 'keyUp', value: 'o' },
                { type: 'keyUp', value: 'o' },
                { type: 'keyUp', value: 'b' },
                { type: 'keyUp', value: 'a' },
                { type: 'keyUp', value: 'r' },
                { type: 'keyUp', value: '😉' }
            ]
        }])
        expect(await browser.getElementProperty(textarea[ELEMENT_KEY], 'value'))
            .toBe('foobar😉')
    })

    it('should allow to click relative to the center of an element', async () => {
        const message = await browser.findElement('css selector', '.btn1_right_clicked')
        const btn2 = await browser.findElement('css selector', '.btn2')

        expect(await browser.getElementCSSValue(message[ELEMENT_KEY], 'display'))
            .toBe('none')
        await browser.performActions([{
            type: 'pointer',
            id: 'pointer1',
            parameters: { pointerType: 'mouse' },
            actions: [{
                type: 'pointerMove',
                origin: {
                    [ELEMENT_KEY]: btn2[ELEMENT_KEY]
                },
                x: -50,
                y: 0
            }, {
                type: 'pointerDown',
                button: 2
            }, {
                type: 'pointerUp',
                button: 2
            }]
        }])
        await new Promise((r) => setTimeout(r, 3000))
        expect(await browser.getElementCSSValue(message[ELEMENT_KEY], 'display'))
            .toBe('block')
    })
})

afterAll(async () => {
    await browser.deleteSession()
})
