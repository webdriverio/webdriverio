import path from 'node:path'

import { expect, describe, it, vi, beforeEach, beforeAll } from 'vitest'
import puppeteer from 'puppeteer-core'

import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('puppeteer-core')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const puppeteerConnect = vi.mocked(puppeteer.connect)

describe('attach Puppeteer', () => {
    let browser: WebdriverIO.Browser

    beforeEach(() => {
        puppeteerConnect.mockClear()
    })

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            },
            headers: {
                Authorization: 'OAuth token'
            }
        })
    })

    it('should pass for Chrome', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            options: browser.options,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            },
            requestedCapabilities: {}
        })
        expect(typeof pptr).toBe('object')
        expect(puppeteerConnect.mock.calls).toMatchSnapshot()
    })

    it('should pass for Firefox', async () => {
        const pprt = await browser.getPuppeteer.call({
            ...browser,
            options: browser.options,
            capabilities: {
                browserName: 'firefox',
                browserVersion: '79.0b'
            },
            requestedCapabilities: {
                'moz:firefoxOptions': {
                    args: ['foo', 'bar', '-remote-debugging-port', 4321, 'barfoo']
                } as any
            }
        })
        expect(typeof pprt).toBe('object')
        expect(puppeteerConnect.mock.calls).toMatchSnapshot()
    })

    it('should pass for Firefox (DevTools)', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            options: browser.options,
            capabilities: {
                browserName: 'firefox',
                browserVersion: '79.0b',
                'moz:firefoxOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            },
            requestedCapabilities: {
                'moz:firefoxOptions': {
                    args: []
                } as any
            }
        })
        expect(typeof pptr).toBe('object')
        expect(puppeteerConnect.mock.calls).toMatchSnapshot()
    })

    it('should pass for Firefox and moz:debuggerAddress flag enabled', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            options: browser.options,
            capabilities: {
                browserName: 'firefox',
                browserVersion: '79.0b',
                'moz:debuggerAddress': 'localhost:1234'
            },
            requestedCapabilities: {
                'moz:firefoxOptions': {
                    args: []
                } as any
            }
        })
        expect(typeof pptr).toBe('object')
        expect(puppeteerConnect.mock.calls).toMatchSnapshot()
    })

    it('should fail for Firefox if no info is given', async () => {
        await expect(browser.getPuppeteer.call({
            ...browser,
            options: browser.options,
            capabilities: {
                browserName: 'firefox',
                browserVersion: '79.0b'
            },
            requestedCapabilities: {
                'moz:firefoxOptions': {
                    args: []
                } as any
            }
        })).rejects.toThrow('Could\'t find a websocket url')
    })

    it('should pass for Edge', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            options: browser.options,
            capabilities: {
                browserName: 'edge',
                'ms:edgeOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            },
            requestedCapabilities: {}
        })
        expect(typeof pptr).toBe('object')
        expect(puppeteerConnect.mock.calls).toMatchSnapshot()
    })

    it('should fail for old Firefox version', async () => {
        const err = await browser.getPuppeteer.call({
            ...browser,
            options: browser.options,
            capabilities: {
                browserName: 'firefox',
                browserVersion: '78.0b'
            },
            requestedCapabilities: {
                'moz:firefoxOptions': {
                    args: ['foo', 'bar', '-remote-debugging-port', 4321, 'barfoo']
                } as any
            }
        // @ts-ignore uses sync command
        }).catch(err => err)

        expect(err.message).toContain('Using DevTools capabilities is not supported for this session.')
    })

    it('should not re-attach if connection was already established', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            options: browser.options,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            },
            puppeteer: {
                isConnected: vi.fn().mockReturnValue(true)
            } as any
        })
        expect(typeof pptr).toBe('object')
        expect(puppeteerConnect).toHaveBeenCalledTimes(0)
    })

    it('should pass for Selenium CDP', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            options: browser.options,
            capabilities: {
                'se:cdp': 'http://my.grid:1234/session/mytestsession/se/cdp'
            }
        })
        expect(typeof pptr).toBe('object')
        expect(puppeteerConnect.mock.calls).toMatchSnapshot()
    })

    it('should pass for Aerokube Selenoid CDP', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            capabilities: {
                'selenoid:options': {
                    foo: 'bar'
                } as any
            },
            requestedCapabilities: {
                'selenoid:options': {
                    foo: 'bar'
                } as any
            },
            options: {
                hostname: 'my.grid',
                port: 4444,
                path: '/wd/hub',
                headers: {
                    Authorization: 'OAuth token'
                }
            } as any
        })
        expect(typeof pptr).toBe('object')
        expect(puppeteerConnect.mock.calls).toMatchSnapshot()
    })

    it('should pass for Aerokube Moon CDP', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            capabilities: {
                'moon:options': {
                    foo: 'bar'
                } as any
            },
            requestedCapabilities: {
                'moon:options': {
                    foo: 'bar'
                } as any
            },
            options: {
                hostname: 'my.grid',
                port: 4444,
                path: '/wd/hub',
                headers: {
                    Authorization: 'OAuth token'
                }
            } as any
        })
        expect(typeof pptr).toBe('object')
        expect(puppeteerConnect.mock.calls).toMatchSnapshot()
    })

})
