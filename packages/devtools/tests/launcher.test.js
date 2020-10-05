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
                deviceName: 'Nexus 6P'
            }
        }
    })
    expect(launchChromeBrowser.mock.calls).toMatchSnapshot()
    expect(puppeteer.launch).toBeCalledTimes(0)

    const pages = await browser.pages()
    expect(pages[0].setViewport).toBeCalledWith({
        height: 732,
        pixelRatio: 3.5,
        width: 412
    })
})

test('launch chrome without default flags and without puppeteer default args', async () => {
    const browser = await launch({
        browserName: 'chrome',
        ignoreDefaultArgs: true
    })
    expect(launchChromeBrowser.mock.calls).toMatchSnapshot()
    expect(puppeteer.connect.mock.calls).toMatchSnapshot()

    const pages = await browser.pages()
    expect(pages[0].close).toBeCalled()
    expect(pages[1].close).toBeCalledTimes(0)
})

test('overriding chrome default flags', async () => {
    const browser = await launch({
        browserName: 'chrome',
        ignoreDefaultArgs: ['--disable-sync', '--enable-features=NetworkService,NetworkServiceInProcess'],
        'goog:chromeOptions': {
            args: ['--enable-features=NetworkService']
        }
    })
    expect(launchChromeBrowser.mock.calls).toMatchSnapshot()

    const pages = await browser.pages()
    expect(pages[0].close).toBeCalled()
    expect(pages[1].close).toBeCalledTimes(0)
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
    expect.assertions(1)

    try {
        await launch({ browserName: 'firefox' })
    } catch (err) {
        expect(err.message).toContain('Only Nightly release channel is supported')
    }
})

test('launch Firefox with custom arguments', async () => {
    expect.assertions(1)

    try {
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
    } catch (err) {
        expect(err.message).toContain('Only Nightly release channel is supported')
    }
})

test('launch Firefox Nightly with custom arguments', async () => {
    await launch({
        browserName: 'firefox',
        'moz:firefoxOptions': {
            args: ['foobar'],
            binary: '/foo/firefox-nightly',
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

test('launch Firefox Nightly without Puppeteer default args', async () => {
    await launch({
        browserName: 'firefox',
        'moz:firefoxOptions': {
            binary: '/foo/firefox-nightly',
            headless: true
        },
        ignoreDefaultArgs: true
    })
    expect(puppeteer.launch.mock.calls).toMatchSnapshot()
})

test('launch Firefox Nightly binary without Puppeteer default args', async () => {
    await launch({
        browserName: 'firefox',
        'moz:firefoxOptions': {
            binary: 'firefox',
            headless: true
        },
        ignoreDefaultArgs: true
    })
    expect(puppeteer.launch.mock.calls).toMatchSnapshot()
})

test('launch Firefox without Puppeteer default args', async () => {
    expect.assertions(1)

    try {
        await launch({
            browserName: 'firefox',
            'moz:firefoxOptions': {
                binary: '/foo/firefox',
                headless: true
            },
            ignoreDefaultArgs: true
        })
    } catch (err) {
        expect(err.message).toContain('Only Nightly release channel is supported')
    }
})

test('launch Edge without Puppeteer default args', async () => {
    await launch({
        browserName: 'edge',
        ignoreDefaultArgs: true,
        'ms:edgeOptions': {
            headless: true
        }
    })
    expect(puppeteer.launch.mock.calls).toMatchSnapshot()
})
