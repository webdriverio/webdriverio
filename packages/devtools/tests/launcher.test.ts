import puppeteer from 'puppeteer-core'
import { launch as launchChromeBrowserImport } from 'chrome-launcher'

import launch from '../src/launcher'

const launchChromeBrowser = launchChromeBrowserImport as jest.Mock
const expect = global.expect as unknown as jest.Expect

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
    (puppeteer.connect as jest.Mock).mockClear()
    ;(puppeteer.launch as jest.Mock).mockClear()
    launchChromeBrowser.mockClear()
})

test('launch chrome with default values', async () => {
    const browser = await launch({
        browserName: 'chrome'
    })
    expect(launchChromeBrowser.mock.calls).toMatchSnapshot()
    expect((puppeteer.connect as jest.Mock).mock.calls).toMatchSnapshot()
    expect(puppeteer.registerCustomQueryHandler).toBeCalledWith(
        'shadow',
        {
            queryAll: expect.any(Function),
            queryOne: expect.any(Function)
        }
    )

    const pages = await browser.pages()
    expect(pages[0].close).toBeCalledTimes(1)
    expect(pages[1].close).toBeCalledTimes(0)
})

test('launch chrome with chrome arguments', async () => {
    const browser = await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            headless: true
        },
        'goog:chromeOptions': {
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
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true
        }
    })
    expect(launchChromeBrowser.mock.calls).toMatchSnapshot()
    expect((puppeteer.connect as jest.Mock).mock.calls).toMatchSnapshot()

    const pages = await browser.pages()
    expect(pages[0].close).toBeCalled()
    expect(pages[1].close).toBeCalledTimes(0)
})

test('overriding chrome default flags', async () => {
    const browser = await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: ['--disable-sync', '--enable-features=NetworkService,NetworkServiceInProcess']
        },
        'goog:chromeOptions': {
            args: ['--enable-features=NetworkService']
        }
    })
    expect(launchChromeBrowser.mock.calls).toMatchSnapshot()

    const pages = await browser.pages()
    expect(pages[0].close).toBeCalled()
    expect(pages[1].close).toBeCalledTimes(0)
})

test('overriding chrome default flags (backwards compat)', async () => {
    const browser = await launch({
        browserName: 'chrome',
        // ignore type check as we want to test whether it is still
        // possible with old format
        // @ts-ignore
        ignoreDefaultArgs: ['--disable-sync', '--enable-features=NetworkService,NetworkServiceInProcess'],
        'goog:chromeOptions': {
            // ignore type check as we want to test whether it is still
            // possible with old format
            // @ts-ignore
            headless: true,
            args: ['--enable-features=NetworkService']
        }
    })
    expect(launchChromeBrowser.mock.calls).toMatchSnapshot()

    const pages = await browser.pages()
    expect(pages[0].close).toBeCalled()
    expect(pages[1].close).toBeCalledTimes(0)
})

test('launch chrome with chrome port', async () => {
    const browser = await launch({
        browserName: 'chrome',
        'goog:chromeOptions': {},
        'wdio:devtoolsOptions': {
            customPort: 8041
        }
    })
    expect(launchChromeBrowser.mock.calls).toMatchSnapshot()
    expect(puppeteer.launch).toBeCalledTimes(0)

    const pages = await browser.pages()
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
                binary: '/foo/bar'
            },
            'wdio:devtoolsOptions': {
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
            binary: '/foo/firefox-nightly'
        },
        'wdio:devtoolsOptions': {
            headless: true,
            defaultViewport: {
                width: 123,
                height: 456
            }
        }
    })
    expect((puppeteer.launch as jest.Mock).mock.calls).toMatchSnapshot()
})

test('launch Edge with default values', async () => {
    await launch({
        browserName: 'edge'
    })
    expect((puppeteer.launch as jest.Mock).mock.calls).toMatchSnapshot()
})

test('launch Edge with custom arguments', async () => {
    await launch({
        browserName: 'edge',
        'ms:edgeOptions': {
            args: ['foobar']
        },
        'wdio:devtoolsOptions': {
            headless: true,
            defaultViewport: {
                width: 123,
                height: 456
            }
        }
    })
    expect((puppeteer.launch as jest.Mock).mock.calls).toMatchSnapshot()
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
            binary: '/foo/firefox-nightly'
        },
        'wdio:devtoolsOptions': {
            headless: true,
            ignoreDefaultArgs: true
        }
    })
    expect((puppeteer.launch as jest.Mock).mock.calls).toMatchSnapshot()
})

test('launch Firefox Nightly binary without Puppeteer default args', async () => {
    await launch({
        browserName: 'firefox',
        'moz:firefoxOptions': {
            binary: 'firefox'
        },
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true
        }
    })
    expect((puppeteer.launch as jest.Mock).mock.calls).toMatchSnapshot()
})

test('launch Firefox without Puppeteer default args', async () => {
    expect.assertions(1)

    try {
        await launch({
            browserName: 'firefox',
            'moz:firefoxOptions': {
                binary: '/foo/firefox'
            },
            'wdio:devtoolsOptions': {
                headless: true,
                ignoreDefaultArgs: true
            }
        })
    } catch (err) {
        expect(err.message).toContain('Only Nightly release channel is supported')
    }
})

test('launch Firefox without Puppeteer default args (backwards compat)', async () => {
    expect.assertions(1)

    try {
        await launch({
            browserName: 'firefox',
            'moz:firefoxOptions': {
                binary: '/foo/firefox',
                // ignore type check as we want to test whether it is still
                // possible with old format
                // @ts-ignore
                headless: true,
            },
            // ignore type check as we want to test whether it is still
            // possible with old format
            // @ts-ignore
            ignoreDefaultArgs: true
        })
    } catch (err) {
        expect(err.message).toContain('Only Nightly release channel is supported')
    }
})

test('launch Edge without Puppeteer default args', async () => {
    await launch({
        browserName: 'edge',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true
        }
    })
    expect((puppeteer.launch as jest.Mock).mock.calls).toMatchSnapshot()
})

test('launch Edge without Puppeteer default args (backwards compat)', async () => {
    await launch({
        browserName: 'edge',
        // ignore type check as we want to test whether it is still
        // possible with old format
        // @ts-ignore
        ignoreDefaultArgs: true,
        'ms:edgeOptions': {
            // ignore type check as we want to test whether it is still
            // possible with old format
            // @ts-ignore
            headless: true
        }
    })
    expect((puppeteer.launch as jest.Mock).mock.calls).toMatchSnapshot()
})

test('connect to existing browser session', async () => {
    await launch({
        browserName: 'edge',
        'ms:edgeOptions': {
            debuggerAddress: 'localhost:12345'
        }
    })
    expect(puppeteer.launch).not.toBeCalled()
    expect(puppeteer.connect as jest.Mock)
        .toBeCalledWith({ browserURL: 'http://localhost:12345' })
})

test('connect to an existing devtools websocket', async () => {
    await launch({
        browserName: 'edge',
        'ms:edgeOptions': {},
        'wdio:devtoolsOptions': {
            browserWSEndpoint: 'wss://cloud.vendor.com'
        }
    })
    expect(puppeteer.launch).not.toBeCalled()
    expect(puppeteer.connect as jest.Mock)
        .toBeCalledWith({ browserWSEndpoint: 'wss://cloud.vendor.com' })
})

test('connect to an existing devtools browser url', async () => {
    const devtoolsOptions = {
        browserURL: 'http://localhost:1234',
        ignoreHTTPSErrors: true
    }
    await launch({
        browserName: 'edge',
        'ms:edgeOptions': {},
        'wdio:devtoolsOptions': devtoolsOptions
    })
    expect(puppeteer.launch).not.toBeCalled()
    expect(puppeteer.connect as jest.Mock)
        .toBeCalledWith(devtoolsOptions)
})
