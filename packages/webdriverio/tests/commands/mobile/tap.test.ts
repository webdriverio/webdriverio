import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('tap test', () => {
    // it('should call click with correct arguments for valid longPress', async () => {
    //     const browser = await remote({
    //         baseUrl: 'http://foobar.com',
    //         capabilities: {
    //             browserName: 'foobar',
    //             mobileMode: true,
    //         } as any
    //     })
    //     const elem = await browser.$('#foo')
    //     const clickSpy = vi.spyOn(elem, 'click').mockResolvedValue(undefined)

    //     await elem.longPress({ duration: 2000, x: 50, y: 30 })

    //     expect(clickSpy).toHaveBeenCalledWith({
    //         duration: 2000,
    //         x: 50,
    //         y: 30,
    //     })

    //     clickSpy.mockRestore()
    // })

    it('should throw an error if tap command is called for a desktop session', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })
        const elem = await browser.$('#foo')

        expect(elem.tap()).rejects.toThrow('The tap command is only available for mobile platforms.')
    })

    it('should throw an error if the passed argument to the tap command missing the mandatory x or y value', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')

        // @ts-expect-error invalid param
        expect(elem.tap({ x: 1 })).rejects.toThrow('If x is set, then y must be set as well.')
        // @ts-expect-error invalid param
        expect(elem.tap({ y: 1 })).rejects.toThrow('If y is set, then x must be set as well.')
    })

    it('should throw an error if the passed argument to the tap command is not an options object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')

        // @ts-expect-error invalid param
        expect(elem.tap([])).rejects.toThrow('Options must be an object.')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
