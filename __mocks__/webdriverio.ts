import { vi } from 'vitest'
import type SevereServiceErrorType from '../packages/webdriverio/src/utils/SevereServiceError.js'
const SevereServiceErrorImport = await vi.importActual('../packages/webdriverio/src/utils/SevereServiceError') as { default: typeof SevereServiceErrorType }

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
    if ((global as typeof globalThis & { throwRemoteCall?: boolean }).throwRemoteCall) {
        throw new Error('boom')
    }
    return getWdioMock()
})
export const multiRemote = vi.fn().mockImplementation(() => (getWdioMock()))

export const SevereServiceError = SevereServiceErrorImport.default
