import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'
import { remote } from '../../../src/index.js'
// @ts-expect-error mock feature
import { getMockCalls } from '../../../src/commands/browser/mock.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/commands/browser/mock', () => {
    let clearedMocks = 0
    const bumpCall = () => ++clearedMocks
    const SESSION_MOCKS: Record<string, any> = {}
    SESSION_MOCKS.foobar = new Set()
    SESSION_MOCKS.foobar.add({ restore: vi.fn(bumpCall) })
    SESSION_MOCKS.foobar.add({ restore: vi.fn(bumpCall) })
    SESSION_MOCKS.barfoo = new Set()
    SESSION_MOCKS.barfoo.add({ restore: vi.fn(bumpCall) })
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
})
