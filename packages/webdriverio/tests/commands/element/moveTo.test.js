import got from 'got'
import { remote } from '../../../src'

describe('moveTo', () => {
    it('should do a moveTo without params', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        got.setMockResponse([undefined, { scrollX: 0, scrollY: 20 }])
        await elem.moveTo()

        expect(got.mock.calls[4][0].pathname).toContain('/foobar-123/actions')
        expect(got.mock.calls[4][1].json.actions).toHaveLength(1)
        expect(got.mock.calls[4][1].json.actions[0].type).toBe('pointer')
        expect(got.mock.calls[4][1].json.actions[0].actions).toHaveLength(1)
        expect(got.mock.calls[4][1].json.actions[0].actions[0])
            .toEqual({ type: 'pointerMove', duration: 0, x: 40, y: 15 })
    })

    it('should do a moveTo with params', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        got.setMockResponse([undefined, { scrollX: 19, scrollY: 0 }])
        await elem.moveTo({ xOffset: 5, yOffset: 10 })
        expect(got.mock.calls[4][1].json.actions[0].actions[0])
            .toEqual({ type: 'pointerMove', duration: 0, x: 1, y: 30 })
    })

    it('should do a moveTo with params if getElementRect returned empty object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        got.setMockResponse([{}, { x: 5, y: 10, height: 33, width: 44 }, { scrollX: 0, scrollY: 0 }])
        await elem.moveTo({ xOffset: 5, yOffset: 10 })
        expect(got.mock.calls[5][1].json.actions[0].actions[0])
            .toEqual({ type: 'pointerMove', duration: 0, x: 10, y: 20 })
    })

    it('should do a moveTo with params if getElementRect and getBoundingClientRect returned empty object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        got.setMockResponse([{}, {}])
        await expect(elem.moveTo({ xOffset: 5, yOffset: 10 }))
            .rejects.toThrow('Failed to receive element rects via execute command')
    })

    it('should do a moveTo without params (no-w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#elem')
        await elem.moveTo()
        expect(got.mock.calls[2][0].pathname)
            .toContain('/foobar-123/moveto')
        expect(got.mock.calls[2][1].json)
            .toEqual({ element: 'some-elem-123' })

        await elem.moveTo({ xOffset: 5, yOffset: 10 })
        expect(got.mock.calls[3][0].pathname)
            .toContain('/foobar-123/moveto')
        expect(got.mock.calls[3][1].json)
            .toEqual({ element: 'some-elem-123', xoffset: 5, yoffset: 10 })
    })

    it('should return integer values when provided float getScrollPosition params', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        got.setMockResponse([{}, { x: 4, y: 9, height: 35, width: 42 }, { scrollX: 2.1, scrollY: 3.3 }])
        await elem.moveTo({ xOffset: 5, yOffset: 10 })
        expect(got.mock.calls[5][1].json.actions[0].actions[0])
            .toEqual({ type: 'pointerMove', duration: 0, x: 6, y: 15 })
    })

    afterEach(() => {
        got.mockClear()
    })
})
