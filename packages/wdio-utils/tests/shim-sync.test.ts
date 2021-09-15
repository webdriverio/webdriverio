import { executeHooksWithArgs, runFnInFiberContext, wrapCommand, hasWdioSyncSupport, executeSync, runSync } from '../src/shim'
import { wrapCommand as wrapCommandSync } from '@wdio/sync'

jest.mock('@wdio/sync', () => ({
    executeHooksWithArgs: jest.fn().mockReturnValue('executeHooksWithArgs'),
    wrapCommand: jest.fn().mockReturnValue(jest.fn()),
    executeSync: jest.fn().mockReturnValue('executeSync'),
    runSync: jest.fn().mockReturnValue('runSync'),
    runFnInFiberContext: jest.fn().mockReturnValue(() => {})
}))

const command = jest.fn().mockReturnValue({})

describe('executeHooksWithArgs', () => {
    it('should match @wdio/sync', async () => {
        expect(executeHooksWithArgs.call({}, 'before', command)).toBe('executeHooksWithArgs')
    })
})

describe('runFnInFiberContext', () => {
    it('should match @wdio/sync', async () => {
        expect(typeof runFnInFiberContext.call({}, command)).toBe('function')
    })
})

describe('wrapCommand', () => {
    it('should match @wdio/sync', async () => {
        global._HAS_FIBER_CONTEXT = true

        expect(wrapCommandSync).toBeCalledTimes(0)
        wrapCommand('foo', jest.fn()).call({ options: {} }, 'foo')
        expect(wrapCommandSync).toBeCalledTimes(0)

        // @ts-ignore
        global.browser = {}
        wrapCommand('foo', jest.fn()).call({ options: {} }, 'foo')
        expect(wrapCommandSync).toBeCalledTimes(1)
    })
})

describe('hasWdioSyncSupport', () => {
    it('should be true', () => {
        expect(hasWdioSyncSupport).toBe(true)
    })
})

describe('executeSync', () => {
    it('should match @wdio/sync', async () => {
        expect(executeSync.call({}, command)).toBe('executeSync')
    })
})

describe('runSync', () => {
    it('should match @wdio/sync', async () => {
        expect(runSync.call({}, command)).toBe('runSync')
    })
})
