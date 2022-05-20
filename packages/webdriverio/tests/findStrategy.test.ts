import { findStrategy } from '../src/utils/findStrategy'
import fs from 'node:fs'

jest.mock('fs')

describe('selector strategies helper', () => {
    it('should find an element using "css selector" method', () => {
        const element = findStrategy('.red')
        expect(element.using).toBe('css selector')
        expect(element.value).toBe('.red')
    })

    it('should find an element using "id" method', () => {
        const element = findStrategy('#purplebox')
        expect(element.using).toBe('css selector')
        expect(element.value).toBe('#purplebox')
    })

    it('should find an element using "name" method through jsonwp', () => {
        const element = findStrategy('[name="searchinput"]', false)
        expect(element.using).toBe('name')
        expect(element.value).toBe('searchinput')
    })

    it('should find an element using "name" method through WC3', () => {
        const element = findStrategy('[name="searchinput"]', true)
        expect(element.using).toBe('css selector')
        expect(element.value).toBe('[name="searchinput"]')
    })

    it('should find an element using "name" method with a . in the name', () => {
        const element = findStrategy('[name="search.input"]')
        expect(element.using).toBe('name')
        expect(element.value).toBe('search.input')
    })

    it('should find an element using "name" method with an attribute', () => {
        const element = findStrategy('[name="searchinput[@isDisplayed=\'true\']"]')
        expect(element.using).toBe('name')
        expect(element.value).toBe('searchinput[@isDisplayed=\'true\']')
    })

    it('should find an element using "name" method by "name" strategy if isMobile is used even when w3c is used', () => {
        const element = findStrategy('[name="searchinput"]', true, true)
        expect(element.using).toBe('name')
        expect(element.value).toBe('searchinput')
    })

    it('should find an element using "link text" method', () => {
        const element = findStrategy('=GitHub Repo')
        expect(element.using).toBe('link text')
        expect(element.value).toBe('GitHub Repo')
    })

    it('should find an element using "partial link text" method', () => {
        const element = findStrategy('*=new')
        expect(element.using).toBe('partial link text')
        expect(element.value).toBe('new')
    })

    it('should find an element using "id" method', () => {
        const element = findStrategy('id=purplebox')
        expect(element.using).toBe('id')
        expect(element.value).toBe('purplebox')
    })

    it('should find an element using "tag name" method and tag format <XXX />', () => {
        const element = findStrategy('<textarea />')
        expect(element.using).toBe('tag name')
        expect(element.value).toBe('textarea')
    })

    it('should find an element using "tag name" method and tag format <XXX>', () => {
        const element = findStrategy('<textarea>')
        expect(element.using).toBe('tag name')
        expect(element.value).toBe('textarea')
        const heading = findStrategy('<h2>')
        expect(heading.using).toBe('tag name')
        expect(heading.value).toBe('h2')
    })

    it('should find an element using "xpath" method', () => {
        const element = findStrategy('//html/body/section/div[6]/div/span')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('//html/body/section/div[6]/div/span')
    })

    it('should find an element using "xpath" method for ParenthesizedExpressions', () => {
        const element = findStrategy('(//div)[7]/span')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('(//div)[7]/span')
    })

    it('should find an element by tag name + content', () => {
        const element = findStrategy('div=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//div[normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by tag name + id + similar content', () => {
        const element = findStrategy('h1=Christian')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//h1[normalize-space() = "Christian"]')
    })

    it('should find an element by tag name + similar content', () => {
        const element = findStrategy('div*=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//div[contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by tag name + class + content', () => {
        const element = findStrategy('div.some-class=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//div[contains(@class, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element class + content', () => {
        const element = findStrategy('.some-class=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//*[contains(@class, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by tag name + class + similar content', () => {
        const element = findStrategy('div.some-class*=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//div[contains(@class, "some-class") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by class + similar content', () => {
        const element = findStrategy('.some-class*=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//*[contains(@class, "some-class") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by tag name + id + content', () => {
        const element = findStrategy('div#some-class=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//div[contains(@id, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by id + content', () => {
        const element = findStrategy('#some-class=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//*[contains(@id, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by tag name + id + similar content', () => {
        const element = findStrategy('div#some-id*=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//div[contains(@id, "some-id") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by id + similar content', () => {
        const element = findStrategy('#some-id*=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//*[contains(@id, "some-id") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by id + similar content see #1494', () => {
        const element = findStrategy('#What-is-WebdriverIO*=What')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//*[contains(@id, "What-is-WebdriverIO") and contains(., "What")]')
    })

    it('should find an element by tag name + attribute + content', () => {
        const element = findStrategy('div[some-attribute="some-value"]=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//div[contains(@some-attribute, "some-value") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by attribute + content', () => {
        const element = findStrategy('[some-attribute="some-value"]=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//*[contains(@some-attribute, "some-value") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by attribute existence + content', () => {
        const element = findStrategy('[some-attribute]=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//*[@some-attribute and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by tag name + attribute + similar content', () => {
        const element = findStrategy('div[some-attribute="some-value"]*=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//div[contains(@some-attribute, "some-value") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by attribute + similar content', () => {
        const element = findStrategy('[some-attribute="some-value"]*=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//*[contains(@some-attribute, "some-value") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an custom element by tag name + content', () => {
        const element = findStrategy('custom-element-with-multiple-dashes=some random text with "§$%&/()div=or others')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('.//custom-element-with-multiple-dashes[normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should allow to go up and down the DOM tree with xpath', () => {
        let element = findStrategy('..')
        expect(element.using).toBe('xpath')
        element = findStrategy('.')
        expect(element.using).toBe('xpath')
        element = findStrategy('../')
        expect(element.using).toBe('xpath')
    })

    it('should find an element by ui automator strategy (android only)', () => {
        const element = findStrategy('android=foo')
        expect(element.using).toBe('-android uiautomator')
        expect(element.value).toBe('foo')
    })

    it('should find an element by datamatcher strategy (android only)', () => {
        const selector = { 'name': 'startsWith', 'args': 'aFakeString' }
        const element = findStrategy(selector)
        expect(element.using).toBe('-android datamatcher')
        expect(element.value).toBe('{"name":"startsWith","args":"aFakeString"}')
    })

    it('should find an element by viewmatcher strategy (android only)', () => {
        const selector = { 'name': 'startsWith', 'args': 'aFakeString', 'class': 'androidx.test.espresso.matcher.ViewMatchers' }
        const element = findStrategy(selector)
        expect(element.using).toBe('-android viewmatcher')
        expect(element.value).toBe('{"name":"startsWith","args":"aFakeString","class":"androidx.test.espresso.matcher.ViewMatchers"}')
    })

    it('should find an element by ui automation strategy (ios only)', () => {
        const element = findStrategy('ios=foo')
        expect(element.using).toBe('-ios uiautomation')
        expect(element.value).toBe('foo')
    })

    it('should find an element by predicate strategy (ios only)', () => {
        const element = findStrategy('-ios predicate string:type == \'XCUIElementTypeSwitch\' && name CONTAINS \'Allow\'')
        expect(element.using).toBe('-ios predicate string')
        expect(element.value).toBe('type == \'XCUIElementTypeSwitch\' && name CONTAINS \'Allow\'')
    })

    it('should find an element by class chain strategy (ios only)', () => {
        const element = findStrategy('-ios class chain:**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton')
        expect(element.using).toBe('-ios class chain')
        expect(element.value).toBe('**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton')
    })

    it('should find an element by accessibility id', () => {
        const element = findStrategy('~foo')
        expect(element.using).toBe('accessibility id')
        expect(element.value).toBe('foo')
    })

    it('should find an element by css selector with id and attribute', () => {
        const element = findStrategy('#purplebox[data-foundBy]')
        expect(element.using).toBe('css selector')
    })

    it('should find an element by css selector with id and immediately preceded operator', () => {
        const element = findStrategy('#purplebox+div')
        expect(element.using).toBe('css selector')
    })

    it('should find an element by css selector with id and preceded operator', () => {
        const element = findStrategy('#purplebox~div')
        expect(element.using).toBe('css selector')
    })

    it('should find an element by css selector with id and pseudo class', () => {
        const element = findStrategy('#purplebox:before')
        expect(element.using).toBe('css selector')
    })

    it('should find an element using "css selector" strategy if isMobile is false and w3c is used', () => {
        const element = findStrategy('[name="searchinput"]', true, false)
        expect(element.using).toBe('css selector')
        expect(element.value).toBe('[name="searchinput"]')
    })

    it('should find an element by android accessibility id', () => {
        const selector = 'new UiSelector().text("Cancel")).className("android.widget.Button")'
        const element = findStrategy('android=' + selector)
        expect(element.using).toBe('-android uiautomator')
        expect(element.value).toBe(selector)
    })

    it('should find an element by ios accessibility id', () => {
        const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
        const element = findStrategy('ios=' + selector)
        expect(element.using).toBe('-ios uiautomation')
        expect(element.value).toBe(selector)
    })

    it('should find an mobile ios element class name', () => {
        const element = findStrategy('UIATextField')
        expect(element.using).toBe('class name')
    })

    it('should find an mobile android element class name', () => {
        const element = findStrategy('android.widget.EditText')
        expect(element.using).toBe('class name')
    })

    it('should find an mobile youi.tv element class name', () => {
        const element = findStrategy('CYIPushButtonView')
        expect(element.using).toBe('class name')
    })

    it('allows to specify selector strategy directly', () => {
        let element = findStrategy('id:foobar id')
        expect(element.using).toBe('id')
        expect(element.value).toBe('foobar id')
        element = findStrategy('css selector:foobar css selector')
        expect(element.using).toBe('css selector')
        expect(element.value).toBe('foobar css selector')
        element = findStrategy('xpath:foobar xpath')
        expect(element.using).toBe('xpath')
        expect(element.value).toBe('foobar xpath')
        element = findStrategy('link text:foobar link text')
        expect(element.using).toBe('link text')
        expect(element.value).toBe('foobar link text')
        element = findStrategy('partial link text:foobar partial link text')
        expect(element.using).toBe('partial link text')
        expect(element.value).toBe('foobar partial link text')
        element = findStrategy('name:foobar name')
        expect(element.using).toBe('name')
        expect(element.value).toBe('foobar name')
        element = findStrategy('tag name:foobar tag name')
        expect(element.using).toBe('tag name')
        expect(element.value).toBe('foobar tag name')
        element = findStrategy('class name:foobar class name')
        expect(element.using).toBe('class name')
        expect(element.value).toBe('foobar class name')
        element = findStrategy('-android uiautomator:foobar -android uiautomator')
        expect(element.using).toBe('-android uiautomator')
        expect(element.value).toBe('foobar -android uiautomator')
        element = findStrategy('-android datamatcher:foobar -android datamatcher')
        expect(element.using).toBe('-android datamatcher')
        expect(element.value).toBe('foobar -android datamatcher')
        element = findStrategy('-android viewmatcher:foobar -android viewmatcher')
        expect(element.using).toBe('-android viewmatcher')
        expect(element.value).toBe('foobar -android viewmatcher')
        element = findStrategy('-android viewtag:foobar -android viewtag')
        expect(element.using).toBe('-android viewtag')
        expect(element.value).toBe('foobar -android viewtag')
        element = findStrategy('-ios uiautomation:foobar -ios uiautomation')
        expect(element.using).toBe('-ios uiautomation')
        expect(element.value).toBe('foobar -ios uiautomation')
        element = findStrategy('accessibility id:foobar accessibility id')
        expect(element.using).toBe('accessibility id')
        expect(element.value).toBe('foobar accessibility id')

        element = findStrategy('.ui-cloud__sec__develop-content__app-grid:nth-child(1)')
        expect(element.using).toBe('css selector')
        expect(element.value).toBe('.ui-cloud__sec__develop-content__app-grid:nth-child(1)')
    })

    it('should not allow unsupported selector strategies if w3c is used', () => {
        expect(() => findStrategy('accessibility id:foobar accessibility id', true)).toThrow()
    })

    it('should allow non w3c selector strategy if driver supports it', () => {
        expect(() => findStrategy('android=foo', true)).not.toThrow()
    })

    it('should allow mobile selector strategies if isMobile is used', () => {
        let element = findStrategy('android=foo', undefined, true)
        expect(element.using).toBe('-android uiautomator')
        expect(element.value).toBe('foo')

        element = findStrategy('ios=foo', undefined, true)
        expect(element.using).toBe('-ios uiautomation')
        expect(element.value).toBe('foo')
    })

    it('should allow mobile selector strategies if isMobile is used even when w3c is used', () => {
        let element = findStrategy('android=foo', true, true)
        expect(element.using).toBe('-android uiautomator')
        expect(element.value).toBe('foo')

        element = findStrategy('ios=foo', true, true)
        expect(element.using).toBe('-ios uiautomation')
        expect(element.value).toBe('foo')
    })

    it('should find an mobile element using image string', () => {
        fs.readFileSync = jest.fn(() => 'random string') as any
        let element = findStrategy('/test.jpg')
        expect(element.using).toBe('-image')
        expect(element.value).toBe('random string')

        element = findStrategy('path/test.png')
        expect(element.using).toBe('-image')
        expect(element.value).toBe('random string')

        element = findStrategy('path/test.PNG')
        expect(element.using).toBe('-image')
        expect(element.value).toBe('random string')

        element = findStrategy('//path//test.svg')
        expect(element.using).toBe('-image')
        expect(element.value).toBe('random string')

        element = findStrategy('//xpath[@img="/test.png"]')
        expect(element.using).toBe('xpath')
        expect(element.value).not.toBe('random string')

        element = findStrategy('.png')
        expect(element.using).toBe('css selector')
        expect(element.value).not.toBe('random string')
    })

    it('should find an element using "css selector" method with implicit & explicit ARIA roles of button in case of role selector', () => {
        const element = findStrategy('[role=button]')
        expect(element.using).toBe('css selector')
        expect(element.value).toBe('[role="button"],input[type="checkbox"],summary[aria-expanded="false"],summary[aria-expanded="true"],input[type="button"],input[type="image"],input[type="reset"],input[type="submit"],button')
    })

    it('should find an element using "css selector" method with implicit & explicit ARIA roles of checkbox in case of role selector', () => {
        const element = findStrategy('[role=checkbox]')
        expect(element.using).toBe('css selector')
        expect(element.value).toBe('[role="checkbox"],input[type="checkbox"]')
    })

    it('should find an element using "css selector" method with implicit & explicit ARIA roles of listbox in case of role selector', () => {
        const element = findStrategy('[role=listbox]')
        expect(element.using).toBe('css selector')
        expect(element.value).toBe('[role="listbox"],select[multiple],select[size],select[multiple],datalist')
    })

    it('should find an element using "css selector" method with implicit & explicit ARIA roles of rowgroup in case of role selector', () => {
        const element = findStrategy('[role=rowgroup]')
        expect(element.using).toBe('css selector')
        expect(element.value).toBe('[role="rowgroup"],tbody,tfoot,thead')
    })

    it('should find an element using "css selector" method with implicit & explicit ARIA roles of not matching roles in case of role selector', () => {
        const element = findStrategy('[role=abcd]')
        expect(element.using).toBe('css selector')
        expect(element.value).toBe('[role="abcd"]')
    })

    it('should use shadow selector strategy if selector is prefixed with >>>', () => {
        const element = findStrategy('>>>.foobar')
        expect(element.using).toBe('shadow')
        expect(element.value).toBe('.foobar')
    })
})
