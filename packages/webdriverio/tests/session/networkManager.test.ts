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

    it('falls back to the last navigation overall for unknown contexts', () => {
        navigate('A', 'nav-A')
        navigate('B', 'nav-B')

        browser.emit('network.beforeRequestSent', subresource('iframe', 'sub-1'))

        expect(manager.getPendingRequests('nav-B').map((r) => r.id)).toEqual(['sub-1'])
    })
})
