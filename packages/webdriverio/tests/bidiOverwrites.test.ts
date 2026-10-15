import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { attach } from '../src/index.js'
import { applyBidiBrowserOverwrites } from '../src/utils/bidi/browserOverwrites.js'

const overwrites = new Map<string, (...args: any[]) => Promise<unknown>>()
let client: Record<string, any> = {}

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio', 'logger')))
vi.mock('../src/session/index.js', () => ({ registerSessionManager: vi.fn() }))
vi.mock('../src/browsingContext.js', () => ({ enableBrowsingContextCommands: vi.fn() }))
vi.mock('../src/utils/scriptTimeout.js', () => ({ markAttachedSession: vi.fn() }))
vi.mock('../src/session/context.js', () => ({
    getContextManager: () => ({ getCurrentContext: async () => 'ctx-1', getCurrentTopLevelContext: async () => 'top-1' }),
    PARALLEL_CONTEXT_STORE_KEY: 'parallel'
}))
vi.mock('../src/utils/driver.js', () => ({
    getProtocolDriver: async () => ({
        Driver: { attachToSession: () => client },
        options: {}
    })
}))

const OVERWRITTEN = ['getTitle', 'getUrl', 'getPageSource', 'takeScreenshot', 'refresh', 'takeElementScreenshot']

describe('BiDi overwrites for takeScreenshot, refresh, takeElementScreenshot', () => {
    let unitTests: string | undefined

    beforeEach(async () => {
        unitTests = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        overwrites.clear()
        client = {}
        Object.assign(client, {
            isBidi: true,
            __bidiCommandsEnabled: true,
            options: {},
            capabilities: {},
            overwriteCommand: (name: string, fn: (...args: any[]) => Promise<unknown>) => overwrites.set(name, fn),
            browsingContextCaptureScreenshot: vi.fn().mockResolvedValue({ data: 'base64-data' }),
            browsingContextReload: vi.fn().mockResolvedValue({})
        })
        await attach({ options: {}, capabilities: {} } as any)
    })

    afterEach(() => {
        if (unitTests === undefined) {
            delete process.env.WDIO_UNIT_TESTS
        } else {
            process.env.WDIO_UNIT_TESTS = unitTests
        }
    })

    it('takeScreenshot captures the viewport as png over BiDi', async () => {
        const orig = vi.fn()
        expect(await overwrites.get('takeScreenshot')!.call(client, orig)).toBe('base64-data')
        expect(client.browsingContextCaptureScreenshot).toHaveBeenCalledWith({
            context: 'top-1',
            origin: 'viewport',
            format: { type: 'image/png' }
        })
        expect(orig).not.toHaveBeenCalled()
    })

    it('takeScreenshot falls back to the original command when BiDi commands are disabled', async () => {
        client.__bidiCommandsEnabled = false
        const orig = vi.fn().mockResolvedValue('classic-data')
        expect(await overwrites.get('takeScreenshot')!.call(client, orig)).toBe('classic-data')
        expect(client.browsingContextCaptureScreenshot).not.toHaveBeenCalled()
    })

    it('refresh reloads the current context over BiDi and returns null', async () => {
        const orig = vi.fn()
        expect(await overwrites.get('refresh')!.call(client, orig)).toBeNull()
        expect(client.browsingContextReload).toHaveBeenCalledWith({ context: 'top-1', wait: 'complete' })
        expect(orig).not.toHaveBeenCalled()
    })

    it('refresh falls back to the original command when BiDi commands are disabled', async () => {
        client.__bidiCommandsEnabled = false
        const orig = vi.fn().mockResolvedValue(null)
        await overwrites.get('refresh')!.call(client, orig)
        expect(orig).toHaveBeenCalledTimes(1)
        expect(client.browsingContextReload).not.toHaveBeenCalled()
    })

    it('takeElementScreenshot clips to the element over BiDi', async () => {
        const orig = vi.fn()
        expect(await overwrites.get('takeElementScreenshot')!.call(client, orig, 'el-1')).toBe('base64-data')
        expect(client.browsingContextCaptureScreenshot).toHaveBeenCalledWith({
            context: 'ctx-1',
            clip: { type: 'element', element: { sharedId: 'el-1' } }
        })
        expect(orig).not.toHaveBeenCalled()
    })

    it('takeElementScreenshot passes the element id to the original command when BiDi commands are disabled', async () => {
        client.isBidi = false
        const orig = vi.fn().mockResolvedValue('classic-data')
        expect(await overwrites.get('takeElementScreenshot')!.call(client, orig, 'el-1')).toBe('classic-data')
        expect(orig).toHaveBeenCalledWith('el-1')
        expect(client.browsingContextCaptureScreenshot).not.toHaveBeenCalled()
    })

    it('registers all six overwrites when BiDi commands are enabled', () => {
        expect([...overwrites.keys()].sort()).toEqual([...OVERWRITTEN].sort())
    })

    it('registers overwrites once per browser even when applied twice', () => {
        const overwriteCommand = vi.fn()
        const browser: any = { isBidi: true, __bidiCommandsEnabled: true, options: {}, overwriteCommand }
        applyBidiBrowserOverwrites(browser)
        applyBidiBrowserOverwrites(browser)
        expect(overwriteCommand).toHaveBeenCalledTimes(OVERWRITTEN.length)
    })

    it.each([
        ['the flag is off', { isBidi: true, __bidiCommandsEnabled: false }],
        ['the flag is absent', { isBidi: true }],
        ['the session is not BiDi', { isBidi: false, __bidiCommandsEnabled: true }]
    ])('registers no overwrites when %s', (_, props) => {
        const overwriteCommand = vi.fn()
        applyBidiBrowserOverwrites({ ...props, options: {}, overwriteCommand } as any)
        expect(overwriteCommand).not.toHaveBeenCalled()
    })
})
