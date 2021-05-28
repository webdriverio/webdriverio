import { remote } from '../../../src'
// @ts-expect-error mock feature
import { getMockCalls } from '../../../src/commands/browser/mock'

jest.mock('../../../src/commands/browser/mock', () => {
    let clearedMocks = 0
    const bumpCall = () => ++clearedMocks
    const SESSION_MOCKS: Record<string, any> = {}
    SESSION_MOCKS['foobar'] = new Set()
    SESSION_MOCKS['foobar'].add({ clear: jest.fn(bumpCall) })
    SESSION_MOCKS['foobar'].add({ clear: jest.fn(bumpCall) })
    SESSION_MOCKS['barfoo'] = new Set()
    SESSION_MOCKS['barfoo'].add({ clear: jest.fn(bumpCall) })
    return { SESSION_MOCKS, getMockCalls: () => clearedMocks }
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
        await browser.mockClearAll()
        expect(getMockCalls()).toBe(3)
    })
})
