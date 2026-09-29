import { describe, expect, vi, beforeAll, afterEach, it } from 'vitest'
import { startServer } from '../src/server.js'

const headers = {
    'Content-Type': 'application/json'
}

describe('shared store server', () => {
    let baseUrl = ''
    let closeServer: (() => Promise<void>) | undefined

    beforeAll(() => {
        vi.unstubAllGlobals()
    })

    afterEach(async () => {
        await closeServer?.()
        closeServer = undefined
    })

    async function listen() {
        const result = await startServer()
        baseUrl = `http://127.0.0.1:${result.port}`
        closeServer = () => new Promise((resolve) => {
            if (result.app.server.close) {
                result.app.server.close(() => resolve())
                return
            }
            resolve()
        })
    }

    function post(path: string, body: unknown) {
        return fetch(`${baseUrl}${path}`, {
            method: 'post',
            body: JSON.stringify(body),
            headers
        })
    }

    it('should not fail if payload has no key/value', async () => {
        await listen()
        const response = await post('/', {})
        expect(response.status).toBe(200)
        const stored = await fetch(`${baseUrl}/*`, { method: 'get', headers })
        expect(await stored.json()).toEqual({ value: {} })
    })

    it('should handle non json type', async () => {
        await listen()
        const response = await fetch(baseUrl, { method: 'post', body: 'foobar', headers })
        expect(response.status).toBe(422)
        expect(response.statusText).toBe('Unprocessable Entity')
        expect(await response.text()).toBe('Invalid JSON')
    })

    it('should handle 404', async () => {
        await listen()
        const response = await fetch(`${baseUrl}/foo/bar`, { method: 'get', headers })
        expect(response.status).toBe(404)
    })

    it('should set and get an entry', async () => {
        await listen()
        const response = await post('/', { key: 'foo', value: 'bar' })
        expect(response.status).toBe(200)
        const res = await fetch(`${baseUrl}/foo`, { method: 'get', headers })
        expect(await res.json()).toEqual({ value: 'bar' })
    })

    describe('resource pools', () => {
        it('should store an array and return its values in order', async () => {
            await listen()
            const response = await post('/pool', { key: 'foo', value: ['bar', 'baz'] })
            expect(response.status).toBe(200)
            const first = await fetch(`${baseUrl}/pool/foo`, { method: 'get', headers })
            expect(first.status).toBe(200)
            expect(await first.json()).toEqual({ value: 'bar' })
            const second = await fetch(`${baseUrl}/pool/foo`, { method: 'get', headers })
            expect(await second.json()).toEqual({ value: 'baz' })
        })

        it('should reject a resource pool that is not an array', async () => {
            await listen()
            const response = await post('/pool', { key: 'foo', value: 'bar' })
            expect(response.status).toBe(500)
            expect(await response.text()).toBe('Resource pool must be an array of values')
        })

        it('should replace an existing resource pool', async () => {
            await listen()
            await post('/pool', { key: 'foo', value: ['old'] })
            const response = await post('/pool', { key: 'foo', value: ['bar'] })
            expect(response.status).toBe(200)
            const first = await fetch(`${baseUrl}/pool/foo`, { method: 'get', headers })
            expect(await first.json()).toEqual({ value: 'bar' })
            const leftover = await fetch(`${baseUrl}/pool/foo?timeout=50`, { method: 'get', headers })
            expect(leftover.status).toBe(500)
            expect(await leftover.text()).toBe("'foo' resource pool is empty. Set values to it first using 'setResourcePool' or 'addValueToPool'")
        })

        it('should return a value within the specified timeout', async () => {
            await listen()
            await post('/pool', { key: 'foo', value: [] })
            const promise = fetch(`${baseUrl}/pool/foo?timeout=200`, { method: 'get', headers })
            await new Promise((resolve) => setTimeout(resolve, 10))
            expect((await post('/pool/foo', { value: 'bar' })).status).toBe(200)
            const response = await promise
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({ value: 'bar' })
            const leftover = await fetch(`${baseUrl}/pool/foo?timeout=50`, { method: 'get', headers })
            expect(leftover.status).toBe(500)
        })

        it('should return a value within the default timeout', async () => {
            await listen()
            await post('/pool', { key: 'foo', value: [] })
            const promise = fetch(`${baseUrl}/pool/foo`, { method: 'get', headers })
            await new Promise((resolve) => setTimeout(resolve, 10))
            expect((await post('/pool/foo', { value: 'bar' })).status).toBe(200)
            const response = await promise
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({ value: 'bar' })
        })

        it('should fail when the pool does not exist', async () => {
            await listen()
            const response = await fetch(`${baseUrl}/pool/foo`, { method: 'get', headers })
            expect(response.status).toBe(500)
            expect(response.statusText).toBe('Internal Server Error')
            expect(await response.text()).toBe("'foo' resource pool does not exist. Set it first using 'setResourcePool'")
        })

        it('should add a value to an existing pool', async () => {
            await listen()
            await post('/pool', { key: 'foo', value: [] })
            const response = await post('/pool/foo', { value: 'bar' })
            expect(response.status).toBe(200)
            const got = await fetch(`${baseUrl}/pool/foo`, { method: 'get', headers })
            expect(await got.json()).toEqual({ value: 'bar' })
        })

        it('should fail when adding to a missing pool', async () => {
            await listen()
            const response = await post('/pool/foo', { value: 'bar' })
            expect(response.status).toBe(500)
            expect(await response.text()).toBe("'foo' resource pool does not exist. Set it first using 'setResourcePool'")
        })
    })
})
