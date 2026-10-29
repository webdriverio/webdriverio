import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'
import { setWdioKind } from '@wdio/utils'
import { remote } from '../../../src/index.js'
import { mockRestoreAll } from '../../../src/commands/browser/mockRestoreAll.js'
// @ts-expect-error mock feature
import { getMockCalls, SESSION_MOCKS } from '../../../src/commands/browser/mock.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/commands/browser/mock', () => {
    let clearedMocks = 0
    const bumpCall = () => ++clearedMocks
    const SESSION_MOCKS: Record<string, any> = {}
    SESSION_MOCKS.foobar = new Set()
    SESSION_MOCKS.foobar.add({ restore: vi.fn(bumpCall), isOwnedBy: () => true })
    SESSION_MOCKS.foobar.add({ restore: vi.fn(bumpCall), isOwnedBy: () => true })
    SESSION_MOCKS.barfoo = new Set()
    SESSION_MOCKS.barfoo.add({ restore: vi.fn(bumpCall), isOwnedBy: () => true })
    return { SESSION_MOCKS, getMockCalls: () => clearedMocks, default: vi.fn() }
})

describe('mockClearAll', () => {
    it('should clear all mocks', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'devtools'
            }
        })
        expect(getMockCalls()).toBe(0)
        await browser.mockRestoreAll()
        expect(getMockCalls()).toBe(3)
    })

    it('should restore every mock even when one of them fails, and then throw', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'devtools'
            }
        })
        const failing = { restore: vi.fn().mockRejectedValue(new Error('no such intercept')), isOwnedBy: () => true }
        const other = { restore: vi.fn(), isOwnedBy: () => true }
        const original = Object.entries(SESSION_MOCKS).map(([key, mocks]) => [key, mocks] as const)
        for (const [key] of original) {
            delete SESSION_MOCKS[key]
        }
        SESSION_MOCKS.contextC = new Set([failing, other])

        await expect(browser.mockRestoreAll()).rejects.toThrow('no such intercept')
        expect(other.restore).toHaveBeenCalledTimes(1)

        delete SESSION_MOCKS.contextC
        for (const [key, mocks] of original) {
            SESSION_MOCKS[key] = mocks
        }
    })

    it('should only restore mocks of the calling browser', async () => {
        const [browserA, browserB] = await Promise.all([1, 2].map(() => remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'devtools'
            }
        })))
        const getMock = (owner: WebdriverIO.Browser) => ({
            restore: vi.fn(),
            isOwnedBy: (browser: WebdriverIO.Browser) => browser === owner
        })
        const mockA = getMock(browserA)
        const mockB = getMock(browserB)
        SESSION_MOCKS.contextA = new Set([mockA])
        SESSION_MOCKS.contextB = new Set([mockB])

        await browserA.mockRestoreAll()
        expect(mockA.restore).toHaveBeenCalledTimes(1)
        expect(mockB.restore).not.toHaveBeenCalled()

        delete SESSION_MOCKS.contextA
        delete SESSION_MOCKS.contextB
    })

    it('should only restore mocks of the browser a browsing context belongs to', async () => {
        const [browserA, browserB] = await Promise.all([1, 2].map(() => remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'devtools'
            }
        })))
        const getMock = (owner: WebdriverIO.Browser) => ({
            restore: vi.fn(),
            isOwnedBy: (browser: WebdriverIO.Browser) => browser === owner
        })
        const mockA = getMock(browserA)
        const mockB = getMock(browserB)
        SESSION_MOCKS.contextA = new Set([mockA])
        SESSION_MOCKS.contextB = new Set([mockB])
        const page = setWdioKind({ contextId: 'page-a', browser: browserA, parent: browserA }, 'browsing-context') as unknown as WebdriverIO.BrowsingContext

        await mockRestoreAll.call(page)
        expect(mockA.restore).toHaveBeenCalledTimes(1)
        expect(mockB.restore).not.toHaveBeenCalled()

        delete SESSION_MOCKS.contextA
        delete SESSION_MOCKS.contextB
    })
})
