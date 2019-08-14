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

    expect(client.params.capabilities).toMatchSnapshot()
    expect(client.params.requestedCapabilities).toMatchSnapshot()
    expect(client.prototype.isDevTools.value).toBe(true)
    expect(client.prototype.isW3C.value).toBe(true)
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

//
// static async reloadSession (instance) {
//     const { session } = sessionMap.get(instance.sessionId)
//     const { w3cCaps } = instance.options.requestedCapabilities
//     const browser = await launch(w3cCaps)
//     const pages = await browser.pages()
//
//     session.elementStore.clear()
//     session.windows = new Map()
//     session.browser = browser
//
//     for (const page of pages) {
//         const pageId = uuidv4()
//         session.windows.set(pageId, page)
//         session.currentWindowHandle = pageId
//     }
//
//     sessionMap.set(instance.sessionId, { browser, session })
//     return instance.sessionId
// }
