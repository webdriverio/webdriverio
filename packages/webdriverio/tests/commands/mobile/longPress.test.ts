import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('longPress test', () => {
    it('should call click with correct arguments for valid longPress', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const clickSpy = vi.spyOn(elem, 'click').mockResolvedValue(undefined)

        await elem.longPress({ duration: 2000, x: 50, y: 30 })

        expect(clickSpy).toHaveBeenCalledWith({
            duration: 2000,
            x: 50,
            y: 30,
        })

        clickSpy.mockRestore()
    })

    it('should throw an error if command is called from a desktop session', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })
        const elem = await browser.$('#foo')

        await expect(elem.longPress()).rejects.toThrow('The longPress command is only available for mobile platforms.')
    })

    it('should throw an error if the passed argument is not an options object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')

        // @ts-expect-error invalid param
        await expect(elem.longPress([])).rejects.toThrow('Options must be an object')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
