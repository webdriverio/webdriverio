import request from 'request'

import { multiremote } from '../src'

const caps = () => ({
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

test('should run command on all instances', async () => {
    const browser = await multiremote(caps())

    expect(browser.browserA).toBeDefined()
    expect(browser.browserB).toBeDefined()

    const result = await browser.execute(() => 'foobar')
    expect(result).toEqual(['foobar', 'foobar'])

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
    const browser = await multiremote(caps())

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
    const browser = await multiremote(caps())

    const elems = await browser.$$('#foo')
    expect(elems).toHaveLength(3)

    const size = await elems[0].getSize()
    expect(size).toEqual([{ width: 50, height: 30 }, { width: 50, height: 30 }])
})

test('should be able to add a command to and element in multiremote', async () => {
    const browser = await multiremote(caps())

    browser.addCommand('myCustomElementCommand', async function () {
        return this.execute(function () {return 1})
    }, true)

    const elem = await browser.$('#foo')

    expect(await elem.browserA.myCustomElementCommand()).toBe(1)
    expect(await elem.browserB.myCustomElementCommand()).toBe(1)
    expect(await elem.myCustomElementCommand()).toEqual([1, 1])
})

test('should be able to overwrite command to and element in multiremote', async () => {
    const browser = await multiremote(caps())

    browser.overwriteCommand('getSize', async function (origCmd) {
        let size = await origCmd()
        size = { width: size.width / 10, height: size.height / 10 }
        return size
    }, true)

    const elem = await browser.$('#foo')

    const sizes = await elem.getSize()
    const sizeA = await elem.browserA.getSize()
    const sizeB = await elem.browserB.getSize()
    const result = { width: 5, height: 3 }

    expect(sizes).toEqual([result, result])
    expect(sizeA).toEqual(result)
    expect(sizeB).toEqual(result)
})

afterEach(() => {
    request.mockClear()
})
