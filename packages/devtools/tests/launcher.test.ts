import path from 'node:path'
import { expect, vi, beforeEach, test } from 'vitest'
import puppeteer, { Puppeteer } from 'puppeteer-core'
import { launch as launchChromeBrowser } from 'chrome-launcher'

import launch from '../src/launcher.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('puppeteer-core', () => import(path.join(process.cwd(), '__mocks__', 'puppeteer-core')))
vi.mock('chrome-launcher', () => import(path.join(process.cwd(), '__mocks__', 'chrome-launcher')))

vi.mock('../src/finder/firefox', () => ({
    default: {
        darwin: vi.fn().mockReturnValue(['/path/to/firefox']),
        linux: vi.fn().mockReturnValue(['/path/to/firefox']),
        win32: vi.fn().mockReturnValue(['/path/to/firefox'])
    }
}))

vi.mock('../src/finder/edge', () => ({
    default: {
        darwin: vi.fn().mockReturnValue(['/path/to/edge']),
        linux: vi.fn().mockReturnValue(['/path/to/edge']),
        win32: vi.fn().mockReturnValue(['/path/to/edge'])
    }
}))

beforeEach(() => {
    vi.mocked(puppeteer.connect).mockClear()
    vi.mocked(puppeteer.launch).mockClear()
    vi.mocked(launchChromeBrowser).mockClear()
})

test('launch chrome with default values', async () => {
    const browser = await launch({
        browserName: 'chrome'
    })
    expect(vi.mocked(launchChromeBrowser).mock.calls).toMatchSnapshot()
    expect(vi.mocked(puppeteer.connect).mock.calls).toMatchSnapshot()
    expect(Puppeteer.registerCustomQueryHandler).toBeCalledWith(
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
    await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            headless: true,
            env: { foo: 'bar' }
        },
        'goog:chromeOptions': {
            binary: '/foo/bar',
            args: ['--window-size=222,333'],
            mobileEmulation: {
                deviceName: 'Nexus 6P'
            }
        }
    })
    expect(vi.mocked(launchChromeBrowser).mock.calls).toMatchSnapshot()
    expect(puppeteer.launch).toBeCalledTimes(0)
})

test('launch chrome with defaultViewport in wdio:devtoolsOptions', async () => {
    await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            defaultViewport: {
                width: 222,
                height: 333,
                deviceScaleFactor: 1.42,
                isMobile: true
            }
        }
    })
    expect(vi.mocked(launchChromeBrowser).mock.calls).toMatchSnapshot()
    expect(puppeteer.launch).toBeCalledTimes(0)
})

test('launch chrome without default flags and without puppeteer default args', async () => {
    const browser = await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true
        }
    })
    expect(vi.mocked(launchChromeBrowser).mock.calls).toMatchSnapshot()
    expect(vi.mocked(puppeteer.connect).mock.calls).toMatchSnapshot()

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
    expect(vi.mocked(launchChromeBrowser).mock.calls).toMatchSnapshot()

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
            args: ['--enable-features=NetworkService'],
            prefs: {
                bar: 'foo'
            }
        }
    })
    expect(vi.mocked(launchChromeBrowser).mock.calls).toMatchSnapshot()

    const pages = await browser.pages()
    expect(pages[0].close).toBeCalled()
    expect(pages[1].close).toBeCalledTimes(0)
})

test('launch chrome with custom user data dir', async () => {
    await launch({
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['enable-features=NetworkService', 'someOtherFlag', 'user-data-dir=/foo/bar', 'anotherFlag']
        }
    })
    expect(vi.mocked(launchChromeBrowser).mock.calls).toMatchSnapshot()
})

test('launch chrome with chrome port', async () => {
    const browser = await launch({
        browserName: 'chrome',
        'goog:chromeOptions': {},
        'wdio:devtoolsOptions': {
            customPort: 8041
        }
    })
    expect(vi.mocked(launchChromeBrowser).mock.calls).toMatchSnapshot()
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
            },
            prefs: {
                foo: 'bar'
            }
        }
    }).catch((err) => err)
    expect(err.message).toContain('Unknown device name "Cool Nexus 5"')
})

test('launch Firefox with custom arguments', async () => {
    await launch({
        browserName: 'firefox',
        'wdio:devtoolsOptions': {
            headless: true,
            defaultViewport: {
                width: 123,
                height: 456
            }
        }
    })
    expect(vi.mocked(puppeteer.launch).mock.calls).toMatchSnapshot()
})

test('launch Edge with default values', async () => {
    await launch({
        browserName: 'edge'
    })
    expect(vi.mocked(puppeteer.launch).mock.calls).toMatchSnapshot()
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
    expect(vi.mocked(puppeteer.launch).mock.calls).toMatchSnapshot()
})

test('throws if browser is unknown', async () => {
    expect.assertions(1)

    try {
        await launch({ browserName: 'foobar' })
    } catch (err: any) {
        expect(err.message).toContain('Couldn\'t identify browserName')
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
    expect(vi.mocked(puppeteer.launch).mock.calls).toMatchSnapshot()
})

test('launch Firefox Nightly binary without Puppeteer default args', async () => {
    await launch({
        browserName: 'firefox',
        'moz:firefoxOptions': {
            binary: 'firefox',
            prefs: {
                foo: 'bar'
            }
        },
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true
        }
    })
    expect(vi.mocked(puppeteer.launch).mock.calls).toMatchSnapshot()
})

test('launch Edge without Puppeteer default args', async () => {
    await launch({
        browserName: 'edge',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true
        }
    })
    expect(vi.mocked(puppeteer.launch).mock.calls).toMatchSnapshot()
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
            headless: true,
            prefs: {
                foo: 'bar'
            }
        }
    })
    expect(vi.mocked(puppeteer.launch).mock.calls).toMatchSnapshot()
})

test('connect to existing browser session', async () => {
    await launch({
        browserName: 'edge',
        'ms:edgeOptions': {
            debuggerAddress: 'localhost:12345'
        }
    })
    expect(puppeteer.launch).not.toBeCalled()
    expect(vi.mocked(puppeteer.connect))
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
    expect(vi.mocked(puppeteer.connect))
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
    expect(vi.mocked(puppeteer.connect))
        .toBeCalledWith(devtoolsOptions)
})

test('launch Chrome with default Args to ignore certificate errors (devtools option ignoreHTTPSErrors)', async () => {
    await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
            ignoreHTTPSErrors: true
        }
    })

    expect(launchChromeBrowser).toBeCalledWith(
        expect.objectContaining({
            chromeFlags: expect.arrayContaining([
                '--ignore-certificate-errors',
            ]),
        })
    )
})

test('launch Chrome while ignoring default args to ignore certificate errors (devtools option ignoreHTTPSErrors)', async () => {
    await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
            ignoreHTTPSErrors: true
        }
    })

    expect(launchChromeBrowser).toBeCalledWith(
        expect.objectContaining({
            chromeFlags: expect.arrayContaining([
                '--ignore-certificate-errors',
            ]),
        })
    )
})

test('launch Edge with default Args to ignore certificate errors (devtools option ignoreHTTPSErrors)', async () => {
    await launch({
        browserName: 'edge',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
            ignoreHTTPSErrors: true
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            args: ['--ignore-certificate-errors'],
        })
    )
})

test('launch Edge while ignoring default args to ignore certificate errors (devtools option ignoreHTTPSErrors)', async () => {
    await launch({
        browserName: 'edge',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
            ignoreHTTPSErrors: true
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            args: ['--ignore-certificate-errors'],
        })
    )
})

test('launch Firefox with default Args to ignore certificate errors (devtools option ignoreHTTPSErrors)', async () => {
    await launch({
        browserName: 'firefox',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
            ignoreHTTPSErrors: true
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            'ignoreHTTPSErrors': true
        })
    )
})

test('launch Firefox while ignoring default args to ignore certificate errors (devtools option ignoreHTTPSErrors)', async () => {
    await launch({
        browserName: 'firefox',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
            ignoreHTTPSErrors: true
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            'ignoreHTTPSErrors': true
        })
    )
})

test('launch Chrome with default Args to ignore certificate errors (W3C capability acceptInsecureCerts)', async () => {
    await launch({
        browserName: 'chrome',
        acceptInsecureCerts: true,
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
        }
    })

    expect(launchChromeBrowser).toBeCalledWith(
        expect.objectContaining({
            chromeFlags: expect.arrayContaining([
                '--ignore-certificate-errors',
            ]),
        })
    )
})

test('launch Chrome while ignoring default args to ignore certificate errors (W3C capability acceptInsecureCerts)', async () => {
    await launch({
        browserName: 'chrome',
        acceptInsecureCerts: true,
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
        }
    })

    expect(launchChromeBrowser).toBeCalledWith(
        expect.objectContaining({
            chromeFlags: expect.arrayContaining([
                '--ignore-certificate-errors',
            ]),
        })
    )
})

test('launch Edge with default Args to ignore certificate errors (W3C capability acceptInsecureCerts)', async () => {
    await launch({
        browserName: 'edge',
        acceptInsecureCerts: true,
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            args: ['--ignore-certificate-errors'],
        })
    )
})

test('launch Edge while ignoring default args to ignore certificate errors (W3C capability acceptInsecureCerts)', async () => {
    await launch({
        browserName: 'edge',
        acceptInsecureCerts: true,
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            args: ['--ignore-certificate-errors'],
        })
    )
})

test('launch Firefox with default Args to ignore certificate errors (W3C capability acceptInsecureCerts)', async () => {
    await launch({
        browserName: 'firefox',
        acceptInsecureCerts: true,
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            'ignoreHTTPSErrors': true
        })
    )
})

test('launch Firefox while ignoring default args to ignore certificate errors (W3C capability acceptInsecureCerts)', async () => {
    await launch({
        browserName: 'firefox',
        acceptInsecureCerts: true,
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
        }
    })

    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            'ignoreHTTPSErrors': true,
        })
    )
})

// qwe

test('launch Chrome with default Args and not specifying devtools option ignoreHTTPSErrors', async () => {
    await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
        }
    })

    expect(launchChromeBrowser).toBeCalledWith(
        expect.objectContaining({
            chromeFlags: expect.not.arrayContaining([
                '--ignore-certificate-errors',
            ]),
        })
    )
})

test('launch Chrome while ignoring default args and not specifying devtools option ignoreHTTPSErrors', async () => {
    await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
        }
    })

    expect(launchChromeBrowser).toBeCalledWith(
        expect.objectContaining({
            chromeFlags: expect.not.arrayContaining([
                '--ignore-certificate-errors',
            ]),
        })
    )
})

test('launch Edge with default Args and not specifying devtools option ignoreHTTPSErrors', async () => {
    await launch({
        browserName: 'edge',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
        }
    })

    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            args: expect.not.arrayContaining(
                ['--ignore-certificate-errors']
            ),
        })
    )
})

test('launch Edge while ignoring default args and not specifying devtools option ignoreHTTPSErrors', async () => {
    await launch({
        browserName: 'edge',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            args: expect.not.arrayContaining(
                ['--ignore-certificate-errors']
            ),
        })
    )
})

test('launch Firefox with default Args and not specifying devtools option ignoreHTTPSErrors', async () => {
    await launch({
        browserName: 'firefox',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            'ignoreHTTPSErrors': false
        })
    )
})

test('launch Firefox while ignoring default args and not specifying devtools option ignoreHTTPSErrors', async () => {
    await launch({
        browserName: 'firefox',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            'ignoreHTTPSErrors': false
        })
    )
})

test('launch Chrome with default Args and not specifying W3C capability acceptInsecureCerts', async () => {
    await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
        }
    })

    expect(launchChromeBrowser).toBeCalledWith(
        expect.objectContaining({
            chromeFlags: expect.not.arrayContaining([
                '--ignore-certificate-errors',
            ]),
        })
    )
})

test('launch Chrome while ignoring default args and not specifying W3C capability acceptInsecureCerts', async () => {
    await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
        }
    })

    expect(launchChromeBrowser).toBeCalledWith(
        expect.objectContaining({
            chromeFlags: expect.not.arrayContaining([
                '--ignore-certificate-errors',
            ]),
        })
    )
})

test('launch Edge with default Args and not specifying W3C capability acceptInsecureCerts', async () => {
    await launch({
        browserName: 'edge',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            args: expect.not.arrayContaining(
                ['--ignore-certificate-errors']
            )
        })
    )
})

test('launch Edge while ignoring default args and not specifying W3C capability acceptInsecureCerts', async () => {
    await launch({
        browserName: 'edge',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            args: expect.not.arrayContaining(
                ['--ignore-certificate-errors']
            )
        })
    )
})

test('launch Firefox with default args and not specifying W3C capability acceptInsecureCerts', async () => {
    await launch({
        browserName: 'firefox',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false,
            headless: true,
        }
    })
    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            'ignoreHTTPSErrors': false
        })
    )
})

test('launch Firefox while ignoring default args and not specifying W3C capability acceptInsecureCerts', async () => {
    await launch({
        browserName: 'firefox',
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: true,
            headless: true,
        }
    })

    expect(puppeteer.launch).toBeCalledWith(
        expect.objectContaining({
            'ignoreHTTPSErrors': false,
        })
    )
})

test('launch Chrome with defaultViewPort as null', async () => {
    await launch({
        browserName: 'chrome',
        'wdio:devtoolsOptions': { defaultViewport: null }
    })
    expect(launchChromeBrowser).toBeCalledWith(
        expect.objectContaining({
            chromeFlags: expect.not.arrayContaining(
                ['--window-size=1200,900', '--window-position=0,0']
            )
        })
    )
})
