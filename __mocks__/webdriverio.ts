import { vi } from 'vitest'
const SevereServiceErrorImport = await vi.importActual('../packages/webdriverio/src/utils/SevereServiceError') as { default: any }

const getWdioMock = () => {
    const mock = {
        $: vi.fn(),
        $$: vi.fn(),
        debug: vi.fn(),
        on: vi.fn(),
        sessionId: 'fakeid',
        addCommand: vi.fn(),
        overwriteCommand: vi.fn(),
        react$: vi.fn(),
        react$$: vi.fn(),
        custom$: vi.fn(),
        deleteSession: vi.fn()
    }
    mock.deleteSession.mockReturnValue(Promise.resolve(mock))

    return mock
}

export const attach = vi.fn().mockImplementation(() => (getWdioMock()))
export const remote = vi.fn().mockImplementation(() => {
    if ((global as any).throwRemoteCall) {
        throw new Error('boom')
    }
    return getWdioMock()
})
export const multiremote = vi.fn().mockImplementation(() => (getWdioMock()))

export const SevereServiceError = SevereServiceErrorImport.default
