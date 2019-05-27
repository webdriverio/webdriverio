const wdioMock = {
    $: jest.fn(),
    $$: jest.fn(),
    debug: jest.fn(),
    deleteSession: jest.fn(),
    on: jest.fn(),
    sessionId: 'fakeid'
}

export const attach = jest.fn().mockImplementation(() => ({ ...wdioMock }))
export const remote = jest.fn().mockImplementation(() => {
    if (global.throwRemoteCall) {
        throw new Error('boom')
    }
    return { ...wdioMock }
})
export const multiremote = jest.fn().mockImplementation(() => ({ ...wdioMock }))
