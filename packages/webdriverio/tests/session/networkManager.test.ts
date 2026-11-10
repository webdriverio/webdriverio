import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NetworkManager } from '../../src/session/networkManager.js'

describe('NetworkManager', () => {
    let browser: any
    let manager: NetworkManager

    const navigate = (context: string, navigation: string) => browser.emit('browsingContext.navigationStarted', {
        context, navigation, url: `http://${navigation}.test/`, timestamp: 1
    })
    const subresource = (context: string, id: string) => ({
        context,
        navigation: null,
        timestamp: 2,
        request: { request: id, url: `http://sub.test/${id}`, headers: [], cookies: [] }
    })

    beforeEach(async () => {
        const { EventEmitter } = await import('node:events')
        browser = Object.assign(new EventEmitter(), {
            isBidi: true,
            sessionId: 'session-id',
            sessionSubscribe: vi.fn().mockResolvedValue({})
        })
        vi.spyOn(NetworkManager.prototype, 'isEnabled').mockReturnValue(true)
        manager = new NetworkManager(browser)
    })

    it('attributes subresources to the last navigation of their own context', () => {
        navigate('A', 'nav-A')
        navigate('B', 'nav-B')

        browser.emit('network.beforeRequestSent', subresource('A', 'sub-1'))

        expect(manager.getPendingRequests('nav-A').map((r) => r.id)).toEqual(['sub-1'])
        expect(manager.getPendingRequests('nav-B')).toEqual([])

        browser.emit('network.responseCompleted', {
            ...subresource('A', 'sub-1'),
            response: { url: 'http://sub.test/sub-1', fromCache: false, headers: [], mimeType: 'text/css', status: 200 }
        })
        expect(manager.getPendingRequests('nav-A')).toEqual([])
        expect(manager.getRequestResponseData('nav-A')?.children?.[0].response?.status).toBe(200)
        expect(manager.getRequestResponseData('nav-B')?.children).toEqual([])
    })

    it('lists a finished subresource once in the children of its navigation (#16416)', () => {
        navigate('A', 'nav-A')

        for (const id of ['sub-1', 'sub-2']) {
            browser.emit('network.beforeRequestSent', subresource('A', id))
            browser.emit('network.responseCompleted', {
                ...subresource('A', id),
                response: { url: `http://sub.test/${id}`, fromCache: false, headers: [], mimeType: 'text/css', status: 200 }
            })
        }

        const children = manager.getRequestResponseData('nav-A')?.children
        expect(children?.map((child) => child.id)).toEqual(['sub-1', 'sub-2'])
        expect(children?.map((child) => child.response?.status)).toEqual([200, 200])
    })

    it('sets the error of a failed subresource on its own child', () => {
        navigate('A', 'nav-A')

        browser.emit('network.beforeRequestSent', subresource('A', 'sub-1'))
        browser.emit('network.beforeRequestSent', subresource('A', 'sub-2'))
        browser.emit('network.fetchError', { ...subresource('A', 'sub-2'), errorText: 'net::ERR_FAILED' })

        const children = manager.getRequestResponseData('nav-A')?.children
        expect(children?.map((child) => child.error)).toEqual([undefined, 'net::ERR_FAILED'])
        // a failed request is not pending anymore, the other one still is
        expect(manager.getPendingRequests('nav-A').map((r) => r.id)).toEqual(['sub-1'])
    })

    it('falls back to the last navigation overall for unknown contexts', () => {
        navigate('A', 'nav-A')
        navigate('B', 'nav-B')

        browser.emit('network.beforeRequestSent', subresource('iframe', 'sub-1'))

        expect(manager.getPendingRequests('nav-B').map((r) => r.id)).toEqual(['sub-1'])
    })
})
