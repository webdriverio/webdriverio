import request from 'request'
import { remote } from '../../../src'

describe('doubleClick', () => {
    beforeEach(() => {
        request.mockClear()
    })

    it('should do a doubleClick', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        await elem.doubleClick()

        // move to
        expect(request.mock.calls[3][0].uri.path).toContain('/foobar-123/actions')
        expect(request.mock.calls[3][0].body.actions).toHaveLength(1)
        expect(request.mock.calls[3][0].body.actions[0].type).toBe('pointer')
        expect(request.mock.calls[3][0].body.actions[0].actions).toHaveLength(1)
        expect(request.mock.calls[3][0].body.actions[0].actions[0])
            .toEqual({ type: 'pointerMove', duration: 0, x: 40, y: 35 })

        // release
        expect(request.mock.calls[4][0].uri.path).toContain('/foobar-123/actions')
        expect(request.mock.calls[4][0].method).toContain('DELETE')

        // double click
        expect(request.mock.calls[5][0].uri.path).toContain('/foobar-123/actions')
        expect(request.mock.calls[5][0].body.actions).toHaveLength(1)
        expect(request.mock.calls[5][0].body.actions[0].type).toBe('pointer')
        expect(request.mock.calls[5][0].body.actions[0].actions).toHaveLength(5)
        expect(request.mock.calls[5][0].body.actions[0].actions).toEqual([
            { button: 0, type: 'pointerDown'},
            { button: 0, type: 'pointerUp'},
            { duration: 10, type: 'pause'},
            { button: 0, type: 'pointerDown'},
            { button: 0, type: 'pointerUp'}
        ])
    })

    it('should do a doubleClick (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#elem')
        await elem.doubleClick()

        // move to
        expect(request.mock.calls[2][0].uri.path).toContain('/foobar-123/moveto')
        expect(request.mock.calls[2][0].body).toEqual({ element: 'some-elem-123' })

        // double click
        expect(request.mock.calls[3][0].uri.path).toContain('/foobar-123/doubleclick')
    })
})
