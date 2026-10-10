import path from 'node:path'
import https from 'node:https'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolve as resolveModule } from 'import-meta-resolve'
import logger from '@wdio/logger'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('import-meta-resolve', () => ({ resolve: vi.fn() }))

const PROXY_VARIABLES = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy']

async function loadWarning () {
    vi.resetModules()
    const { warnIfDownloadProxyIgnored } = await import('../../src/node/downloadProxy.js')
    return warnIfDownloadProxyIgnored
}

/**
 * `@puppeteer/browsers` uses a proxy only with `proxy-agent` installed or with
 * Node.js' built-in proxy support, so a configured proxy can be ignored silently
 */
describe('warnIfDownloadProxyIgnored', () => {
    const env = { ...process.env }
    const agentOptions = (https.globalAgent as unknown as { options: Record<string, unknown> }).options
    const warn = vi.mocked(logger('@wdio/utils').warn)

    beforeEach(() => {
        for (const name of [...PROXY_VARIABLES, 'NODE_USE_ENV_PROXY']) {
            delete process.env[name]
        }
        delete agentOptions.proxyEnv
        warn.mockClear()
        vi.mocked(resolveModule).mockReset().mockImplementation((name: string) => {
            if (name === 'proxy-agent') {
                throw new Error('Cannot find package \'proxy-agent\'')
            }
            return 'file:///node_modules/@puppeteer/browsers/lib/main.js'
        })
    })

    afterEach(() => {
        process.env = { ...env }
        delete agentOptions.proxyEnv
    })

    it('does not warn without a proxy variable', async () => {
        const warnIfDownloadProxyIgnored = await loadWarning()
        warnIfDownloadProxyIgnored()
        expect(warn).not.toHaveBeenCalled()
    })

    it('warns once when a proxy is set and nothing makes the download use it', async () => {
        process.env.HTTPS_PROXY = 'http://proxy.example:8080'
        const warnIfDownloadProxyIgnored = await loadWarning()

        warnIfDownloadProxyIgnored()
        warnIfDownloadProxyIgnored()

        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn.mock.calls[0][0]).toContain('HTTPS_PROXY is set, but browser and Chromedriver downloads ignore it')
        expect(warn.mock.calls[0][0]).toContain('proxy-agent')
        expect(warn.mock.calls[0][0]).toContain('NODE_USE_ENV_PROXY=1')
    })

    it('checks the lower-case variables too', async () => {
        process.env.http_proxy = 'http://proxy.example:8080'
        const warnIfDownloadProxyIgnored = await loadWarning()
        warnIfDownloadProxyIgnored()
        expect(warn.mock.calls[0][0]).toContain('http_proxy is set')
    })

    it('does not warn when proxy-agent resolves from @puppeteer/browsers', async () => {
        process.env.HTTPS_PROXY = 'http://proxy.example:8080'
        vi.mocked(resolveModule).mockImplementation((name: string) => name === 'proxy-agent'
            ? 'file:///node_modules/proxy-agent/dist/index.js'
            : 'file:///node_modules/@puppeteer/browsers/lib/main.js')
        const warnIfDownloadProxyIgnored = await loadWarning()

        warnIfDownloadProxyIgnored()

        expect(warn).not.toHaveBeenCalled()
        expect(resolveModule).toHaveBeenCalledWith('proxy-agent', 'file:///node_modules/@puppeteer/browsers/lib/main.js')
    })

    it('does not warn when Node.js built-in proxy support is on', async () => {
        process.env.HTTPS_PROXY = 'http://proxy.example:8080'
        agentOptions.proxyEnv = { HTTPS_PROXY: 'http://proxy.example:8080' }
        const warnIfDownloadProxyIgnored = await loadWarning()

        warnIfDownloadProxyIgnored()

        expect(warn).not.toHaveBeenCalled()
    })
})
