import { beforeAll, beforeEach, afterAll, describe, it, expect } from 'vitest'
import DevTools from '../packages/devtools/build/index.js'
import { ELEMENT_KEY } from '../packages/devtools/build/constants.js'
import type { Client } from '../packages/devtools/build/index.js'

let browser: Client

beforeAll(async () => {
    browser = await DevTools.newSession({
        outputDir: __dirname,
        capabilities: {
            browserName: 'chrome',
            'wdio:devtoolsOptions': {
                headless: true
            }
        }
    })
})

describe('elements', () => {
    beforeEach(async () => {
        await browser.navigateTo('http://guinea-pig.webdriver.io')
    })

    it('should be able to do a drag&drop', async () => {
        const drag = await browser.findElement('css selector', '.ui-draggable')
        const dragPosition = await browser.getElementRect(drag[ELEMENT_KEY])
        const drop = await browser.findElement('css selector', '.ui-droppable')
        const dropPosition = await browser.getElementRect(drop[ELEMENT_KEY])
        const dragStart = {
            x: dragPosition.x + (dragPosition.width / 2),
            y: dragPosition.y + (dragPosition.height / 2)
        }
        const dropEnd = {
            x: (dropPosition.x + (dropPosition.width / 2) - dragStart.x),
            y: (dropPosition.y + (dropPosition.height / 2) - dragStart.y)
        }

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
                ...dragStart
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
                ...dropEnd
            }, {
                type: 'pointerUp',
                button: 0
            }]
        }])

        const elem = await browser.findElement('css selector', '.searchinput')
        expect(await browser.getElementProperty(elem[ELEMENT_KEY], 'value'))
            .toBe('Dropped!')
    })

    it('findElement with css selector', async () => {
        const yellowBox = await browser.findElement('css selector', '.yellow')
        expect(yellowBox).toEqual({ [ELEMENT_KEY]: 'ELEMENT-4' })
        const redBox = await browser.findElement('css selector', '.red')
        expect(redBox).toEqual({ [ELEMENT_KEY]: 'ELEMENT-5' })
    })

    it('find nested element with css selector', async () => {
        const nested = await browser.findElement('css selector', '.nested')
        const header = await browser.findElementFromElement(nested[ELEMENT_KEY], 'css selector', '.findme')
        expect(header).toEqual({ [ELEMENT_KEY]: 'ELEMENT-7' })
    })

    it('findElement with xPath', async () => {
        const xPathElement = await browser.findElement('xpath', '//*[@id="newWindow"]')
        expect(xPathElement).toEqual({ [ELEMENT_KEY]: 'ELEMENT-8' })
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

    it('is able to select an option', async () => {
        const option = await browser.findElement('css selector', 'option[value="someValue5"]')
        await browser.elementClick(option[ELEMENT_KEY])
        const selectedValue = await browser.findElement('css selector', '#selectedValue')
        expect(await browser.getElementText(selectedValue[ELEMENT_KEY])).toBe('someValue5')
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

    it('elementSendKeys can use special characters', async () => {
        await browser.navigateTo('https://todomvc.com/examples/vue/')
        const todoInput = await browser.findElement('css selector', '.new-todo')
        await browser.elementSendKeys(todoInput[ELEMENT_KEY], 'ToDo #1\uE007ToDo #2\uE007ToDo #3\uE007')
        const todoCountElem = await browser.findElement('css selector', '.todo-count strong')
        const todoCount = await browser.getElementText(todoCountElem[ELEMENT_KEY])
        expect(todoCount).toBe('3')
    })

    it('elementSendKeys can send unicode backspace', async () => {
        const textarea = await browser.findElement('css selector', 'textarea')
        await browser.elementSendKeys(textarea[ELEMENT_KEY], 'foobar')
        expect(await browser.getElementProperty(textarea[ELEMENT_KEY], 'value')).toBe('foobar')
        await browser.elementSendKeys(textarea[ELEMENT_KEY], '\uE003')
        expect(await browser.getElementProperty(textarea[ELEMENT_KEY], 'value')).toBe('fooba')
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
        await browser.executeScript('window.scrollTo(0, 0)', [])
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

    it('should allow to double click on an element', async () => {
        await browser.navigateTo('http://guinea-pig.webdriver.io/')
        const elem = await browser.findElement('css selector', '.btn1')
        const notifier = await browser.findElement('css selector', '.btn1_dblclicked')

        expect(await browser.getElementAttribute(notifier[ELEMENT_KEY], 'style'))
            .toBe(null)

        await browser.performActions([{
            type: 'pointer',
            id: 'pointer1',
            parameters: { pointerType: 'mouse' },
            actions: [
                { type: 'pointerMove', origin: elem, x: 0, y: 0 },
                { type: 'pointerDown', button: 0 },
                { type: 'pointerUp', button: 0 },
                { type: 'pause', duration: 10 },
                { type: 'pointerDown', button: 0 },
                { type: 'pointerUp', button: 0 }
            ]
        }])

        expect(await browser.getElementAttribute(notifier[ELEMENT_KEY], 'style'))
            .toBe('display: block;')
    })

    it('should support deep selectors', async () => {
        await browser.navigateTo('https://polymer-library.polymer-project.org/3.0/api/elements/array-selector')
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const headerSlot = await browser.findElement('shadow', 'section[anchor-id="elementBase-properties"]')
        expect(
            (await browser.getElementText(headerSlot[ELEMENT_KEY])).trim()
        ).toContain('Properties')
    })

    it('can fetch shadow elements', async () => {
        await browser.navigateTo('https://polymer-library.polymer-project.org/3.0/api/elements/array-selector')
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const element = await browser.findElement('tag name', 'pw-footer')
        const shadowRoot = await browser.getElementShadowRoot(
            element['element-6066-11e4-a52e-4f735466cecf']
        )
        const elementRef = await browser.findElementFromShadowRoot(
            shadowRoot['shadow-6066-11e4-a52e-4f735466cecf'],
            'css selector',
            '.copyright'
        )
        expect(await browser.getElementText(elementRef[ELEMENT_KEY]))
            .toContain('Brought to you by The Polymer Project')
    })
})

afterAll(async () => {
    await browser.deleteSession()
})
