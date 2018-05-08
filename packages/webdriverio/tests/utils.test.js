import {
    findStrategy,
    getElementFromResponse,
    mobileDetector,
    getBrowserObject,
    transformToCharString
} from '../src/utils'

describe('utils', () => {
    describe('selector strategies helper', () => {
        it('should throw when not a string', () => {
            expect(() => findStrategy(123)).toThrow('selector needs to be typeof `string`')
        })

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

        it('should find an element using "name" method', () => {
            const element = findStrategy('[name="searchinput"]')
            expect(element.using).toBe('name')
            expect(element.value).toBe('searchinput')
        })

        it('should find an element using "name" method with a . in the name', () => {
            const element = findStrategy('[name="search.input"]')
            expect(element.using).toBe('name')
            expect(element.value).toBe('search.input')
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

        it('should find an element using "tag name" method and tag format <XXX />', () => {
            const element = findStrategy('<textarea />')
            expect(element.using).toBe('tag name')
            expect(element.value).toBe('textarea')
        })

        it('should find an element using "tag name" method and tag format <XXX>', () => {
            const element = findStrategy('<textarea>')
            expect(element.using).toBe('tag name')
            expect(element.value).toBe('textarea')
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

        it('should allow to go up and down the DOM tree with xpath', () => {
            let element = findStrategy('..')
            expect(element.using).toBe('xpath')
            element = findStrategy('.')
            expect(element.using).toBe('xpath')
        })

        it('should find an element by ui automator strategy (android only)', () => {
            const element = findStrategy('android=foo')
            expect(element.using).toBe('-android uiautomator')
            expect(element.value).toBe('foo')
        })

        it('should find an element by ui automation strategy (ios only)', () => {
            const element = findStrategy('ios=foo')
            expect(element.using).toBe('-ios uiautomation')
            expect(element.value).toBe('foo')
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
            expect(() => findStrategy('android=foo', true)).toThrow()
        })
    })

    describe('getElementFromResponse', () => {
        it('should find element from JSONWireProtocol response', () => {
            expect(getElementFromResponse({ ELEMENT: 'foobar' })).toBe('foobar')
        })

        it('should find element from W3C response', () => {
            expect(getElementFromResponse({ 'element-6066-11e4-a52e-4f735466cecf': 'barfoo' })).toBe('barfoo')
        })

        it('should throw otherwise', () => {
            expect(getElementFromResponse({ invalid: 'response '})).toBe(null)
        })
    })

    describe('mobileDetector', () => {
        it('should not detect mobile app for browserName===undefined', function () {
            const {isMobile, isIOS, isAndroid} = mobileDetector({})
            expect(isMobile).toEqual(false)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(false)
        })

        it('should not detect mobile app for browserName==="firefox"', function () {
            const {isMobile, isIOS, isAndroid} = mobileDetector({browserName: 'firefox'})
            expect(isMobile).toEqual(false)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(false)
        })

        it('should not detect mobile app for browserName==="chrome"', function () {
            const {isMobile, isIOS, isAndroid} = mobileDetector({browserName: 'chrome'})
            expect(isMobile).toEqual(false)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(false)
        })

        it('should detect mobile app for browserName===""', function () {
            const {isMobile, isIOS, isAndroid} = mobileDetector({browserName: ''})
            expect(isMobile).toEqual(true)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(false)
        })

        it('should detect Android mobile app', function () {
            const {isMobile, isIOS, isAndroid} = mobileDetector({
                platformName: 'Android',
                platformVersion: '4.4',
                deviceName: 'LGVS450PP2a16334',
                app: 'foo.apk'
            })
            expect(isMobile).toEqual(true)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(true)
        })

        it('should detect Android mobile app without upload', function () {
            const {isMobile, isIOS, isAndroid} = mobileDetector({
                platformName: 'Android',
                platformVersion: '4.4',
                deviceName: 'LGVS450PP2a16334',
                appPackage: 'com.example',
                appActivity: 'com.example.gui.LauncherActivity',
                noReset: true,
                appWaitActivity: 'com.example.gui.LauncherActivity'
            })
            expect(isMobile).toEqual(true)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(true)
        })
    })

    describe('getBrowserObject', () => {
        it('should traverse up', () => {
            expect(getBrowserObject({
                parent: {
                    parent: {
                        parent: {
                            foo: 'bar'
                        }
                    }
                }
            })).toEqual({ foo: 'bar' })
        })
    })

    describe('transformToCharString', () => {
        it('should allow to pass non arrays to it', () => {
            expect(transformToCharString('foobar')).toEqual(['f', 'o', 'o', 'b', 'a', 'r'])
        })

        it('should do nothing if all is good', () => {
            expect(transformToCharString(['f'])).toEqual(['f'])
        })

        it('should be able to transform objects', () => {
            expect(transformToCharString({ a: 1 })).toEqual(['{', '"', 'a', '"', ':', '1', '}'])
        })

        it('should be able to transform numvers', () => {
            expect(transformToCharString(42)).toEqual(['4', '2'])
        })

        it('ignore undefined/null', () => {
            expect(transformToCharString([null])).toEqual([])
            expect(transformToCharString([undefined])).toEqual([])
        })
    })
})
