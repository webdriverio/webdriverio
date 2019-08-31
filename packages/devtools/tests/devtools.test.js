import launch from '../src/launcher'
import DevTools from '../src'

jest.mock('../src/launcher', () => jest.fn().mockReturnValue({
    pages: jest.fn().mockReturnValue(Promise.resolve([{
        on: jest.fn(),
        setDefaultTimeout: jest.fn()
    }])),
    _connection: {
        url: () => 'ws://localhost:49375/devtools/browser/c4b017ea-f476-4026-a699-bc5d4858cfe1'
    },
    version: jest.fn().mockReturnValue(Promise.resolve('Chrome/78.0.3881.0'))
}))

test('newSession', async () => {
    const client = await DevTools.newSession({
        logLevel: 'trace',
        capabilities: {
            browserName: 'chrome'
        }
    })

    /**
     * don't include platform specific information in snapshot
     */
    delete client.options.capabilities.platformName
    delete client.options.capabilities.platformVersion

    expect(client.options.capabilities).toMatchSnapshot()
    expect(client.options.requestedCapabilities).toMatchSnapshot()
    expect(client.isDevTools).toBe(true)
    expect(client.isW3C).toBe(true)
    expect(launch).toBeCalledTimes(1)
})

test('reloadSession', async () => {
    const client = await DevTools.newSession({
        logLevel: 'trace',
        capabilities: {
            browserName: 'chrome'
        }
    })
    const origSessionId = client.sessionId
    const newClient = await DevTools.reloadSession(client)
    expect(origSessionId).toBe(newClient)
})
