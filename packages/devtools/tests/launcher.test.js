import puppeteer from 'puppeteer-core'
import { launch as launchChromeBrowser } from 'chrome-launcher'

import launch from '../src/launcher'

jest.mock('../src/finder/firefox', () => ({
    darwin: jest.fn().mockReturnValue(['/path/to/firefox']),
    linux: jest.fn().mockReturnValue(['/path/to/firefox']),
    win32: jest.fn().mockReturnValue(['/path/to/firefox'])
}))

jest.mock('../src/finder/edge', () => ({
    darwin: jest.fn().mockReturnValue(['/path/to/edge']),
    linux: jest.fn().mockReturnValue(['/path/to/edge']),
    win32: jest.fn().mockReturnValue(['/path/to/edge'])
}))

beforeEach(() => {
    puppeteer.connect.mockClear()
    launchChromeBrowser.mockClear()
    puppeteer.launch.mockClear()
})

test('launch chrome with default values', async () => {
    const browser = await launch({
        browserName: 'chrome'
    })
    expect(launchChromeBrowser.mock.calls).toMatchSnapshot()
    expect(puppeteer.connect.mock.calls).toMatchSnapshot()

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
    expect(puppeteer.launch).toBeCalledTimes(0)

    const pages = await browser.pages()
    expect(pages[0].setViewport).toBeCalledWith({
        height: 640,
        pixelRatio: 3,
        width: 360
    })
})

test('launch Firefox with default values', async () => {
    await launch({
        browserName: 'firefox'
    })
    expect(puppeteer.launch.mock.calls).toMatchSnapshot()
})

test('launch Firefox with custom arguments', async () => {
    await launch({
        browserName: 'firefox',
        'moz:firefoxOptions': {
            args: ['foobar'],
            binary: '/foo/bar',
            headless: true,
            defaultViewport: {
                width: 123,
                height: 456
            }
        }
    })
    expect(puppeteer.launch.mock.calls).toMatchSnapshot()
})

test('launch Edge with default values', async () => {
    await launch({
        browserName: 'edge'
    })
    expect(puppeteer.launch.mock.calls).toMatchSnapshot()
})

test('launch Edge with custom arguments', async () => {
    await launch({
        browserName: 'edge',
        'ms:edgeOptions': {
            args: ['foobar'],
            headless: true,
            defaultViewport: {
                width: 123,
                height: 456
            }
        }
    })
    expect(puppeteer.launch.mock.calls).toMatchSnapshot()
})

test('throws if browser is unknown', async () => {
    expect.assertions(1)

    try {
        await launch({ browserName: 'foobar' })
    } catch (e) {
        expect(e.message).toContain('Couldn\'t identify browserName')
    }
})
