// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { Capabilities } from '@wdio/types'

import { multiremote } from '../src'
import { MultiRemoteBrowser } from '../build'

const got = gotMock as any as jest.Mock

const caps = (): Capabilities.MultiRemoteCapabilities => ({
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

    expect(got.mock.calls[0][0].pathname).toBe('/session')
    expect(got.mock.calls[0][1].method).toBe('POST')
    expect(got.mock.calls[1][0].pathname).toBe('/session')
    expect(got.mock.calls[1][1].method).toBe('POST')
    expect(got.mock.calls[2][0].pathname)
        .toBe('/session/foobar-123/execute/sync')
    expect(got.mock.calls[2][1].method).toBe('POST')
    expect(got.mock.calls[3][0].pathname)
        .toBe('/session/foobar-123/execute/sync')
    expect(got.mock.calls[3][1].method).toBe('POST')
})

test('should properly create stub instance', async () => {
    const params = caps()
    Object.values(params).forEach(cap => { cap.automationProtocol = './protocol-stub.js' })
    const browser = await multiremote(params, { automationProtocol: './protocol-stub.js' })
    expect(browser.$).toBeUndefined()
    expect(browser.options).toBeUndefined()
    expect(browser.commandList).toHaveLength(0)
    expect(browser.browserA).toBeDefined()
    expect(browser.browserB).toBeDefined()
    expect(browser.browserA.$).toBeUndefined()
    expect(browser.browserA.$).toBeUndefined()

    expect(() => browser.addCommand()).toThrow()
    expect(() => browser.browserA.addCommand()).toThrow()
    expect(() => browser.browserB.overwriteCommand()).toThrow()
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

    expect(got.mock.calls[2][0].pathname)
        .toEqual('/session/foobar-123/element')
    expect(got.mock.calls[3][0].pathname)
        .toEqual('/session/foobar-123/element')
    expect(got.mock.calls[4][0].pathname)
        .toEqual('/session/foobar-123/element/some-elem-123/rect')
    expect(got.mock.calls[5][0].pathname)
        .toEqual('/session/foobar-123/element/some-elem-123/rect')
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

    browser.addCommand('myCustomElementCommand', async function (this: MultiRemoteBrowser) {
        return this.execute(() => 1)
    }, true)

    const elem = await browser.$('#foo')

    expect(await elem.browserA.myCustomElementCommand()).toBe(1)
    expect(await elem.browserB.myCustomElementCommand()).toBe(1)
    expect(await elem.myCustomElementCommand()).toEqual([1, 1])
})

test('should be able to overwrite command to and element in multiremote', async () => {
    const browser = await multiremote(caps())

    browser.overwriteCommand('getSize', async function (this: MultiRemoteBrowser, origCmd: () => { width: number, height: number }) {
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
    got.mockClear()
})
