import request from 'request'

import { multiremote } from '../src'

test('should run command on all instances', async () => {
    const browser = await multiremote({
        browserA: {
            logLevel: 'debug',
            capabilities: {
                browserName: 'chrome'
            }
        },
        browserB: {
            logLevel: 'debug',
            port: 4445,
            capabilities: {
                browserName: 'firefox'
            }
        }
    })

    expect(browser.browserA).toBeDefined()
    expect(browser.browserB).toBeDefined()

    const result = await browser.execute(() => 'foobar')
    expect(result).toEqual([ 'foobar', 'foobar' ])

    expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session')
    expect(request.mock.calls[0][0].method).toBe('POST')
    expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session')
    expect(request.mock.calls[1][0].method).toBe('POST')
    expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/execute/sync')
    expect(request.mock.calls[2][0].method).toBe('POST')
    expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/execute/sync')
    expect(request.mock.calls[3][0].method).toBe('POST')
})

test('should allow to call on elements', async () => {
    const browser = await multiremote({
        browserA: {
            logLevel: 'debug',
            capabilities: {
                browserName: 'chrome'
            }
        },
        browserB: {
            logLevel: 'debug',
            port: 4445,
            capabilities: {
                browserName: 'firefox'
            }
        }
    })

    const elem = await browser.$('#foo')
    expect(elem.browserA).toBeDefined()
    expect(elem.browserB).toBeDefined()
    expect(elem.browserA.elementId).toBe('some-elem-123')
    expect(elem.browserB.elementId).toBe('some-elem-123')

    const result = await elem.getSize()
    expect(result).toEqual([{ width: 50, height: 30 }, { width: 50, height: 30 }])

    expect(request.mock.calls[2][0].uri.path).toEqual('/wd/hub/session/foobar-123/element')
    expect(request.mock.calls[3][0].uri.path).toEqual('/wd/hub/session/foobar-123/element')
    expect(request.mock.calls[4][0].uri.path).toEqual('/wd/hub/session/foobar-123/element/some-elem-123/rect')
    expect(request.mock.calls[5][0].uri.path).toEqual('/wd/hub/session/foobar-123/element/some-elem-123/rect')
})

test('should be able to fetch multiple elements', async () => {
    const browser = await multiremote({
        browserA: {
            logLevel: 'debug',
            capabilities: {
                browserName: 'chrome'
            }
        },
        browserB: {
            logLevel: 'debug',
            port: 4445,
            capabilities: {
                browserName: 'firefox'
            }
        }
    })

    const elems = await browser.$$('#foo')
    expect(elems).toHaveLength(3)

    const size = await elems[0].getSize()
    expect(size).toEqual([{ width: 50, height: 30 }, { width: 50, height: 30 }])
})

afterEach(() => {
    request.mockClear()
})
