import puppeteer from 'puppeteer-core'

import { remote } from '../../../src'

describe('attach Puppeteer', () => {
    let browser

    beforeEach(() => {
        puppeteer.connect.mockClear()
    })

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should pass for Chrome', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            }
        })
        expect(typeof pptr).toBe('object')
        expect(puppeteer.connect.mock.calls).toMatchSnapshot()
    })

    it('should pass for Firefox', async () => {
        const pprt = await browser.getPuppeteer.call({
            ...browser,
            capabilities: {
                browserName: 'firefox',
                browserVersion: '79.0b'
            },
            requestedCapabilities: {
                'moz:firefoxOptions': {
                    args: ['foo', 'bar', '-remote-debugging-port', 4321, 'barfoo']
                }
            }
        })
        expect(typeof pprt).toBe('object')
        expect(puppeteer.connect.mock.calls).toMatchSnapshot()
    })

    it('should pass for Firefox (DevTools)', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            capabilities: {
                browserName: 'firefox',
                browserVersion: '79.0b',
                'moz:firefoxOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            },
            requestedCapabilities: {
                'moz:firefoxOptions': {
                    args: {}
                }
            }
        })
        expect(typeof pptr).toBe('object')
        expect(puppeteer.connect.mock.calls).toMatchSnapshot()
    })

    it('should pass for Edge', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            capabilities: {
                browserName: 'edge',
                'ms:edgeOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            },
            options: {
                requestedCapabilities: {}
            }
        })
        expect(typeof pptr).toBe('object')
        expect(puppeteer.connect.mock.calls).toMatchSnapshot()
    })

    it('should fail for old Firefox version', async () => {
        const err = await browser.getPuppeteer.call({
            ...browser,
            capabilities: {
                browserName: 'firefox',
                browserVersion: '78.0b'
            },
            requestedCapabilities: {
                'moz:firefoxOptions': {
                    args: ['foo', 'bar', '-remote-debugging-port', 4321, 'barfoo']
                }
            }
        }).catch(err => err)
        expect(err.message).toContain('Using DevTools capabilities is not supported for this session.')
    })

    it('should not re-attach if connection was already established', async () => {
        const pptr = await browser.getPuppeteer.call({
            ...browser,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            },
            puppeteer: 'foobar'
        })
        expect(pptr).toBe('foobar')
        expect(puppeteer.connect).toHaveBeenCalledTimes(0)
    })
})
