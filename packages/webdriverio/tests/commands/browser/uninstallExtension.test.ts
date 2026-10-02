import path from 'node:path'

import { expect, describe, it, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('uninstallExtension', () => {
    it('throws on a classic session and names webExtension.uninstall', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'chrome'
            }
        })

        await expect(browser.uninstallExtension('ext-id')).rejects.toThrow(
            'uninstallExtension requires a WebDriver BiDi session (webExtension.uninstall)'
        )
    })

    it('forwards the extension id', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })
        vi.spyOn(browser, 'webExtensionUninstall').mockResolvedValue({})

        await expect(browser.uninstallExtension('ext-id')).resolves.toBeUndefined()
        expect(browser.webExtensionUninstall).toHaveBeenCalledWith({ extension: 'ext-id' })
    })

    it('explains how to enable webExtension.uninstall on Chrome', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })
        const cause = new Error(
            'WebDriver Bidi command "webExtension.uninstall" failed with error: unknown error - Method not available.'
        )
        vi.spyOn(browser, 'webExtensionUninstall').mockRejectedValue(cause)

        await expect(browser.uninstallExtension('ext-id')).rejects.toSatisfy((error: Error) => (
            /Method not available[\s\S]*--enable-unsafe-extension-debugging[\s\S]*--remote-debugging-pipe[\s\S]*webExtension\.uninstall/.test(error.message) &&
            error.cause === cause
        ))
    })

    it('rejects an empty id', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })

        await expect(browser.uninstallExtension('')).rejects.toThrow(
            'uninstallExtension expects the extension id returned by installExtension'
        )
        // @ts-expect-error wrong payload
        await expect(browser.uninstallExtension(42)).rejects.toThrow(
            'uninstallExtension expects the extension id returned by installExtension'
        )
    })
})
