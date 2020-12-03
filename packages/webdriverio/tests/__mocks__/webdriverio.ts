const SevereServiceErrorImport = jest.requireActual('../../src/utils/SevereServiceError')

const getWdioMock = () => {
    const mock = {
        $: jest.fn(),
        $$: jest.fn(),
        debug: jest.fn(),
        on: jest.fn(),
        sessionId: 'fakeid',
        react$: jest.fn(),
        react$$: jest.fn(),
        custom$: jest.fn(),
        deleteSession: jest.fn()
    }
    mock.deleteSession.mockReturnValue(Promise.resolve(mock))

    return mock
}

export const attach = jest.fn().mockImplementation(() => (getWdioMock()))
export const remote = jest.fn().mockImplementation(() => {
    if ((global as any).throwRemoteCall) {
        throw new Error('boom')
    }
    return getWdioMock()
})
export const multiremote = jest.fn().mockImplementation(() => (getWdioMock()))

export const SevereServiceError = SevereServiceErrorImport.default
