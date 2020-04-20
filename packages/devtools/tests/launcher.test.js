import puppeteer from 'puppeteer-core'
import puppeteerFirefox from 'puppeteer-firefox'
import { launch as launchChromeBrowser } from 'chrome-launcher'

import launch from '../src/launcher'

beforeEach(() => {
    puppeteer.connect.mockClear()
    puppeteerFirefox.launch.mockClear()
    launchChromeBrowser.mockClear()
})

test('launch chrome with default values', async () => {
    const browser = await launch({
        browserName: 'chrome'
    })
    expect(launchChromeBrowser.mock.calls).toMatchSnapshot()
    expect(puppeteer.connect.mock.calls).toMatchSnapshot()
    expect(puppeteerFirefox.launch).toBeCalledTimes(0)

    const pages = await browser.pages()
    expect(pages[0].close).toBeCalledTimes(1)
    expect(pages[1].close).toBeCalledTimes(0)
})

test('launch chrome with chrome arguments', async () => {
    const browser = await launch({
        browserName: 'chrome',
        'goog:chromeOptions': {
            headless: true,
            binary: '/foo/bar',
            args: ['--window-size=222,333'],
            mobileEmulation: {
                deviceName: 'Nexus 5'
            }
        }
    })
    expect(launchChromeBrowser.mock.calls).toMatchSnapshot()
    expect(puppeteerFirefox.launch).toBeCalledTimes(0)

    const pages = await browser.pages()
    expect(pages[0].setViewport).toBeCalledWith({
        height: 640,
        pixelRatio: 3,
        width: 360
    })
})

test('throws an error if an unknown deviceName is picked', async () => {
    const err = await launch({
        browserName: 'chrome',
        'goog:chromeOptions': {
            mobileEmulation: {
                deviceName: 'Cool Nexus 5'
            }
        }
    }).catch((err) => err)
    expect(err.message).toContain('Unknown device name "Cool Nexus 5"')
})

test('launch Firefox with default values', async () => {
    await launch({
        browserName: 'firefox'
    })
    expect(puppeteerFirefox.launch.mock.calls).toMatchSnapshot()
})

test('launch Firefox with custom arguments', async () => {
    await launch({
        browserName: 'firefox',
        'moz:firefoxOptions': {
            args: ['foobar'],
            headless: true,
            width: 123,
            height: 456
        }
    })
    expect(puppeteerFirefox.launch.mock.calls).toMatchSnapshot()
})

test('throws if browser is unknown', async () => {
    expect.assertions(1)

    try {
        await launch({ browserName: 'foobar' })
    } catch (e) {
        expect(e.message).toContain('Couldn\'t identify browserName')
    }
})
