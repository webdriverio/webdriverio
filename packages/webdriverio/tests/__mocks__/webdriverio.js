const wdioMock = {
    $: jest.fn(),
    $$: jest.fn(),
    debug: jest.fn(),
    deleteSession: jest.fn()
}

export const attach = jest.fn().mockImplementation(() => wdioMock)
export const remote = jest.fn().mockImplementation(() => wdioMock)
export const multiremote = jest.fn().mockImplementation(() => wdioMock)
