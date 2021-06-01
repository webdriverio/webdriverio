import { executeHooksWithArgs, runFnInFiberContext, wrapCommand, hasWdioSyncSupport, executeSync, runSync } from '../src/shim'
import { wrapCommand as wrapCommandSync } from '@wdio/sync'

jest.mock('@wdio/sync', () => ({
    executeHooksWithArgs: 'executeHooksWithArgs',
    runFnInFiberContext: 'runFnInFiberContext',
    wrapCommand: jest.fn().mockReturnValue(jest.fn()),
    executeSync: 'executeSync',
    runSync: 'runSync'
}))

describe('executeHooksWithArgs', () => {
    it('should match @wdio/sync', async () => {
        expect(executeHooksWithArgs).toBe('executeHooksWithArgs')
    })
})

describe('runFnInFiberContext', () => {
    it('should match @wdio/sync', async () => {
        expect(runFnInFiberContext).toBe('runFnInFiberContext')
    })
})

describe('wrapCommand', () => {
    it('should match @wdio/sync', async () => {
        global._HAS_FIBER_CONTEXT = true
        expect(wrapCommandSync).toBeCalledTimes(0)
        wrapCommand('foo', jest.fn(), {})('foo')
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
        expect(executeSync).toBe('executeSync')
    })
})

describe('runSync', () => {
    it('should match @wdio/sync', async () => {
        expect(runSync).toBe('runSync')
    })
})
