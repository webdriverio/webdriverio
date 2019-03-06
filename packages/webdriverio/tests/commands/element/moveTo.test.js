import request from 'request'
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
        await elem.moveTo()

        expect(request.mock.calls[3][0].uri.path).toContain('/foobar-123/actions')
        expect(request.mock.calls[3][0].body.actions).toHaveLength(1)
        expect(request.mock.calls[3][0].body.actions[0].type).toBe('pointer')
        expect(request.mock.calls[3][0].body.actions[0].actions).toHaveLength(1)
        expect(request.mock.calls[3][0].body.actions[0].actions[0])
            .toEqual({ type: 'pointerMove', duration: 0, x: 40, y: 35 })
    })

    it('should do a moveTo with params', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        await elem.moveTo(5, 10)
        expect(request.mock.calls[3][0].body.actions[0].actions[0])
            .toEqual({ type: 'pointerMove', duration: 0, x: 20, y: 30 })
    })

    it('should do a moveTo with params if getElementRect returned empty object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        request.setMockResponse([{}, { x: 5, y: 10, height: 33, width: 44 }])
        await elem.moveTo(5, 10)
        expect(request.mock.calls[4][0].body.actions[0].actions[0])
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
        request.setMockResponse([{}, {}])
        await expect(elem.moveTo(5, 10)).rejects.toThrow('Failed to receive element rects via execute command')
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
        expect(request.mock.calls[2][0].uri.path).toContain('/foobar-123/moveto')
        expect(request.mock.calls[2][0].body).toEqual({ element: 'some-elem-123' })

        await elem.moveTo(5, 10)
        expect(request.mock.calls[3][0].uri.path).toContain('/foobar-123/moveto')
        expect(request.mock.calls[3][0].body).toEqual({ element: 'some-elem-123', xoffset: 5, yoffset: 10 })
    })

    afterEach(() => {
        request.mockClear()
    })
})
