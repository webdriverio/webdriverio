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

it('can handle navigation and command execution', async () => {
    await browser.navigateTo('http://guinea-pig.webdriver.io')
    expect(typeof (await browser.getTitle())).toContain('string')

    const link = await browser.findElement('link text', 'two')
    await browser.elementClick(link[ELEMENT_KEY])
    expect(typeof (await browser.getTitle())).toContain('string')

    await browser.back()
    expect(typeof (await browser.getTitle())).toContain('string')

    const githubLink = await browser.findElement('link text', 'GitHub Repo')
    await browser.elementClick(githubLink[ELEMENT_KEY])
    expect(typeof (await browser.getTitle())).toContain('string')
})

afterAll(async () => {
    await browser.deleteSession()
})
