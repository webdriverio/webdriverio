import { executeHooksWithArgs, runFnInFiberContext, wrapCommand, hasWdioSyncSupport, executeSync, runSync } from '../src/shim'

jest.mock('@wdio/sync', () => ({
    executeHooksWithArgs: 'executeHooksWithArgs',
    runFnInFiberContext: 'runFnInFiberContext',
    wrapCommand: 'wrapCommand',
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
        expect(wrapCommand).toBe('wrapCommand')
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
