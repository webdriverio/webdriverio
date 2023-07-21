import path from 'node:path'
import { test, expect, vi, afterEach } from 'vitest'
// @ts-expect-error mock is a webdriver dependency
import got from 'got'
import type { Capabilities } from '@wdio/types'

import { multiremote } from '../src/index.js'

vi.mock('got')
vi.mock('devtools')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

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

    expect(browser.getInstance('browserA')).toBeDefined()
    expect(browser.getInstance('browserB')).toBeDefined()

    const result = await browser.execute(() => 'foobar')
    expect(result).toEqual(['foobar', 'foobar'])

    expect((vi.mocked(got).mock.calls[0][0] as any).pathname).toBe('/session')
    expect((vi.mocked(got).mock.calls[0][1] as any).method).toBe('POST')
    expect((vi.mocked(got).mock.calls[1][0] as any).pathname).toBe('/session')
    expect((vi.mocked(got).mock.calls[1][1] as any).method).toBe('POST')
    expect((vi.mocked(got).mock.calls[2][0] as any).pathname)
        .toBe('/session/foobar-123/execute/sync')
    expect((vi.mocked(got).mock.calls[2][1] as any).method).toBe('POST')
    expect((vi.mocked(got).mock.calls[3][0] as any).pathname)
        .toBe('/session/foobar-123/execute/sync')
    expect((vi.mocked(got).mock.calls[3][1] as any).method).toBe('POST')
})

test('should properly create stub instance', async () => {
    const params = caps()
    Object.values(params).forEach(cap => { cap.automationProtocol = './protocol-stub.js' })
    const browser = await multiremote(params, { automationProtocol: './protocol-stub.js' })
    expect(browser.$).toBeUndefined()
    expect(browser.options).toBeUndefined()
    expect(browser.commandList).toHaveLength(0)
    expect(browser.getInstance('browserA')).toBeDefined()
    expect(browser.getInstance('browserB')).toBeDefined()
    expect(browser.getInstance('browserA').$).toBeUndefined()
    expect(browser.getInstance('browserA').$).toBeUndefined()
})

test('should allow to call on elements', async () => {
    const browser = await multiremote(caps())

    const elem = await browser.$('#foo')
    expect(elem.getInstance('browserA')).toBeDefined()
    expect(elem.getInstance('browserB')).toBeDefined()
    expect(elem.getInstance('browserA').elementId).toBe('some-elem-123')
    expect(elem.getInstance('browserB').elementId).toBe('some-elem-123')

    // @ts-expect-error invalid params
    const result = await elem.getSize()
    expect(result).toEqual([{ width: 50, height: 30 }, { width: 50, height: 30 }])

    expect((vi.mocked(got).mock.calls[2][0] as any).pathname)
        .toEqual('/session/foobar-123/element')
    expect((vi.mocked(got).mock.calls[3][0] as any).pathname)
        .toEqual('/session/foobar-123/element')
    expect((vi.mocked(got).mock.calls[4][0] as any).pathname)
        .toEqual('/session/foobar-123/element/some-elem-123/rect')
    expect((vi.mocked(got).mock.calls[5][0] as any).pathname)
        .toEqual('/session/foobar-123/element/some-elem-123/rect')
})

test('should be able to fetch multiple elements', async () => {
    const browser = await multiremote(caps())

    const elems = await browser.$$('#foo')
    expect(elems).toHaveLength(3)

    // @ts-expect-error invalid params
    const size = await elems[0].getSize()
    expect(size).toEqual([{ width: 50, height: 30 }, { width: 50, height: 30 }])
})

test('should be able to add a command to and element in multiremote', async () => {
    const browser = await multiremote(caps())

    browser.addCommand('myCustomElementCommand', async function (this: WebdriverIO.MultiRemoteBrowser) {
        // @ts-expect-error invalid params
        const size = await this.getSize()
        return size.width
    }, true)

    const elem = await browser.$('#foo')

    // @ts-expect-error untyped custom command
    expect(await elem.browserA.myCustomElementCommand()).toBe(50)
    // @ts-expect-error untyped custom command
    expect(await elem.browserB.myCustomElementCommand()).toBe(50)
    // @ts-expect-error untyped custom command
    expect(await elem.myCustomElementCommand()).toEqual([50, 50])
})

test('should be able to overwrite command to and element in multiremote', async () => {
    const browser = await multiremote(caps())

    browser.overwriteCommand('getSize', async function (
        this: WebdriverIO.MultiRemoteBrowser,
        origCmd: any
    ) {
        let size = await origCmd()
        size = { width: size.width / 10, height: size.height / 10 }
        return size
    }, true)

    const elem = await browser.$('#foo')

    // @ts-expect-error invalid params
    const sizes = await elem.getSize()
    const sizeA = await elem.getInstance('browserA').getSize()
    const sizeB = await elem.getInstance('browserB').getSize()
    const result = { width: 5, height: 3 }

    expect(sizes).toEqual([result, result])
    expect(sizeA).toEqual(result)
    expect(sizeB).toEqual(result)
})

afterEach(() => {
    vi.mocked(got).mockClear()
})
