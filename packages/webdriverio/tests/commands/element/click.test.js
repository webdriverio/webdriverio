import request from 'request'
import { remote } from '../../../src'

describe('click test', () => {
    it('should allow to left click on an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        await elem.click()

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/click')
    })

    it('should allow to right click on an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        await elem.click({ button: 'right' })

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/actions')
        expect(request.mock.calls[2][0].body.actions[0].actions[0].type).toBe('pointerMove')
        expect(request.mock.calls[2][0].body.actions[0].actions[1]).toEqual({ type: 'pointerDown', button: 2 })
        expect(request.mock.calls[2][0].body.actions[0].actions[2]).toEqual({ type: 'pointerUp', button: 2 })

        await elem.click({ button: 2 })

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/actions')
        expect(request.mock.calls[2][0].body.actions[0].actions[0].type).toBe('pointerMove')
        expect(request.mock.calls[2][0].body.actions[0].actions[1]).toEqual({ type: 'pointerDown', button: 2 })
        expect(request.mock.calls[2][0].body.actions[0].actions[2]).toEqual({ type: 'pointerUp', button: 2 })
    })

    it('should allow to middle click on an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        await elem.click({ button: 'middle' })

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/actions')
        expect(request.mock.calls[2][0].body.actions[0].actions[0].type).toBe('pointerMove')
        expect(request.mock.calls[2][0].body.actions[0].actions[1]).toEqual({ type: 'pointerDown', button: 1 })
        expect(request.mock.calls[2][0].body.actions[0].actions[2]).toEqual({ type: 'pointerUp', button: 1 })

        await elem.click({ button: 1 })

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/actions')
        expect(request.mock.calls[2][0].body.actions[0].actions[0].type).toBe('pointerMove')
        expect(request.mock.calls[2][0].body.actions[0].actions[1]).toEqual({ type: 'pointerDown', button: 1 })
        expect(request.mock.calls[2][0].body.actions[0].actions[2]).toEqual({ type: 'pointerUp', button: 1 })
    })

    it('should allow to right click on an element (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })
        const elem = await browser.$('#foo')

        await elem.click({ button: 'right' })

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/moveto')
        expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/click')
        expect(request.mock.calls[3][0].body).toEqual({ 'button': 2 })

        await elem.click({ button: 2 })

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/moveto')
        expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/click')
        expect(request.mock.calls[3][0].body).toEqual({ 'button': 2 })
    })

    it('should allow to middle click on an element (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })
        const elem = await browser.$('#foo')

        await elem.click({ button: 'middle' })

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/moveto')
        expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/click')
        expect(request.mock.calls[3][0].body).toEqual({ 'button': 1 })

        await elem.click({ button: 1 })

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/moveto')
        expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/click')
        expect(request.mock.calls[3][0].body).toEqual({ 'button': 1 })
    })

    afterEach(() => {
        request.mockClear()
    })
})
