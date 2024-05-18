import { describe, expect, vi, beforeAll, afterAll, afterEach, it } from 'vitest'
import { startServer, __store, __resourcePoolStore } from '../src/server.js'

const errHandler = vi.fn()

const headers = {
    'Content-Type': 'application/json'
}

describe('WdioSharedStoreService exports', () => {
    let setUrl: string
    let getUrl: string
    let result: {
        port: number;
        app: PolkaInstance;
    } | undefined
    let setResourcePoolUrl: string
    let getValueFromPoolUrl: string
    let addValueToPoolUrl: string

    beforeAll(async () => {
        vi.unstubAllGlobals()
        result = await startServer()
        const baseUrl = `http://localhost:${result.port}`
        setUrl = `${baseUrl}/`
        getUrl = `${baseUrl}`
        setResourcePoolUrl = `${baseUrl}/pool/`
        getValueFromPoolUrl = `${baseUrl}/pool`
        addValueToPoolUrl = `${baseUrl}/pool`
    })

    it('should not fail if payload has no key/value', async () => {
        await fetch(setUrl, { method: 'post', body: JSON.stringify({}), headers })
        await fetch(getUrl, { method: 'post', body: JSON.stringify({}), headers })
        expect(__store).toEqual({})
    })

    it('should handle non json type', async () => {
        const response = await fetch(getUrl, { method: 'post', body: 'foobar', headers })
        expect(response.status).toBe(422)
        expect(response.statusText).toBe('Unprocessable Entity')
        expect(response.url).toContain('/')
        expect(await response.text()).toBe('Invalid JSON')
    })

    it('should handle 404', async () => {
        const response = await fetch(`${getUrl}/foo/bar`, { method: 'get', headers })
        expect(response.status).toBe(404)
    })

    describe('setting/getting entries', () => {
        it('should set entry', async () => {
            await fetch(setUrl, {
                method: 'post',
                body: JSON.stringify({ key: 'foo', value: 'bar' }),
                headers
            })
            expect(__store).toEqual({ foo: 'bar' })
        })

        it('should get entry', async () => {
            __store.foobar = 'barfoo'
            const res = await fetch(`${getUrl}/foobar`, { method: 'get', headers })
            expect((await res.json()).value).toEqual('barfoo')
        })
    })

    describe('resource pools', () => {
        describe('when calling setResourcePool with an array', () => {
            it('should initialize that value in the store', async () => {
                const response = await fetch(setResourcePoolUrl, { method: 'post', body: JSON.stringify({ key: 'foo', value: ['bar'] }), headers })
                expect(response.status).toBe(200)
                expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', ['bar']]])
            })
        })

        describe('when calling setResourcePool without an array', () => {
            it('should throw an error', async () => {
                const response = await fetch(setResourcePoolUrl, { method: 'post', body: JSON.stringify({ key: 'foo', value: 'bar' }), headers })
                expect(response.status).toBe(500)
                expect((await response.text())).toBe('Resource pool must be an array of values')
            })
        })

        describe('when calling setResourcePool with an already existing key', () => {
            it('should should override it', async () => {
                await fetch(setResourcePoolUrl, { method: 'post', body: JSON.stringify({ key: 'foo', value: [] }), headers })
                await fetch(setResourcePoolUrl, { method: 'post', body: JSON.stringify({ key: 'foo', value: ['bar'] }), headers })
                expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', ['bar']]])
            })
        })

        describe('when calling getValueFromPool with the name of an existing pool', () => {
            it('should return the first element and update the store', async () => {
                __resourcePoolStore.set('foo', ['bar'])
                const response = await fetch(`${getValueFromPoolUrl}/foo`, { method: 'get', headers })
                expect((await response.json()).value).toEqual('bar')
                expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', []]])
            })

            describe('and the pool will receive values after calling', () => {
                describe('and the timeout has a specified value', () => {
                    it('should return a value within the specified timeout', async () => {
                        __resourcePoolStore.set('foo', [])
                        const promise = fetch(`${getValueFromPoolUrl}/foo?timeout=200`, { method: 'get', headers })
                        await new Promise(resolve => setTimeout(resolve, 10))
                        __resourcePoolStore.set('foo', ['bar'])
                        const response = await promise
                        expect(response.status).toBe(200)
                        expect((await response.json()).value).toEqual('bar')
                        expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', []]])
                    })
                })

                describe('and the timeout is not specified', () => {
                    it('should return a value within the default timeout', async () => {
                        __resourcePoolStore.set('foo', [])
                        const promise = fetch(`${getValueFromPoolUrl}/foo`, { method: 'get', headers })
                        await new Promise(resolve => setTimeout(resolve, 10))
                        __resourcePoolStore.set('foo', ['bar'])
                        const response = await promise
                        expect(response.status).toBe(200)
                        expect((await response.json()).value).toEqual('bar')
                        expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', []]])
                    })
                })
            })
        })

        describe('when calling getValueFromPool with the name of a non existing pool', () => {
            it('should throw an error', async () => {
                const response = await fetch(`${getValueFromPoolUrl}/foo`, { method: 'get', headers })
                expect(response.status).toBe(500)
                expect(response.statusText).toBe('Internal Server Error')
                expect(await response.text()).toBe("'foo' resource pool does not exist. Set it first using 'setResourcePool'")
                expect(Array.from(__resourcePoolStore.entries())).toEqual([])
            })
        })

        describe('when calling addValueToPool with a value and valid pool name', () => {
            it('should add that value to the pool', async () => {
                __resourcePoolStore.set('foo', [])
                const response = await fetch(addValueToPoolUrl + '/foo', { method: 'post', body: JSON.stringify({ value: 'bar' }), headers })
                expect(response.status).toBe(200)
                expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', ['bar']]])
            })
        })

        describe('when calling addValueToPool with an invalid pool name', () => {
            it('should throw an error', async () => {
                const response = await fetch(addValueToPoolUrl + '/foo', { method: 'post', body: JSON.stringify({ value: 'bar' }), headers })
                expect(response.status).toBe(500)
                expect(await response.text()).toBe("'foo' resource pool does not exist. Set it first using 'setResourcePool'")
            })
        })
    })

    afterEach(() => {
        Object.keys(__store).forEach(key => { delete __store[key] })
        __resourcePoolStore.clear()
        errHandler.mockClear()
    })

    afterAll(async () => {
        return new Promise((resolve) => {
            if (result?.app.server.close) {
                return result?.app.server.close(() => resolve())
            }
            resolve()
        })
    })
})
