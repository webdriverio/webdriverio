import { describe, expect, vi, beforeAll, afterAll, afterEach, it } from 'vitest'
import { startServer, __store, __resourcePoolStore } from '../src/server.js'
import type gotType from 'got'

const got = (await vi.importActual('got') as { default: typeof gotType }).default

const errHandler = vi.fn()

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

        result = await startServer()
        const baseUrl = `http://localhost:${result.port}`
        setUrl = `${baseUrl}/`
        getUrl = `${baseUrl}`
        setResourcePoolUrl = `${baseUrl}/pool/`
        getValueFromPoolUrl = `${baseUrl}/pool`
        addValueToPoolUrl = `${baseUrl}/pool`
    })

    it('should not fail if payload has no key/value', async () => {
        await got.post(setUrl, { json: {} })
        await got.post(getUrl, { json: {} })
        expect(__store).toEqual({})
    })

    it('should handle non json type', async () => {
        const response = await got.post(getUrl, { body: 'foobar', throwHttpErrors: false, retry: { limit: 0 } })
        expect(response.statusCode).toBe(422)
        expect(response.statusMessage).toBe('Unprocessable Entity')
        expect(response.url).toContain('/')
        expect(response.body).toBe('Invalid JSON')
    })

    it('should handle 404', async () => {
        const response = await got.get(`${getUrl}/foo/bar`, { throwHttpErrors: false, retry: { limit: 0 } })
        expect(response.statusCode).toBe(404)
    })

    describe('setting/getting entries', () => {
        it('should set entry', async () => {
            await got.post(setUrl, { json: { key: 'foo', value: 'bar' }, responseType: 'json' })
            expect(__store).toEqual({ foo: 'bar' })
        })

        it('should get entry', async () => {
            __store.foobar = 'barfoo'
            const res = await got.get<{ value: string }>(`${getUrl}/foobar`, { responseType: 'json' })
            expect(res.body.value).toEqual('barfoo')
        })
    })

    describe('resource pools', () => {
        describe('when calling setResourcePool with an array', () => {
            it('should initialize that value in the store', async () => {
                const response = await got.post(setResourcePoolUrl, { json: { key: 'foo', value: ['bar'] }, responseType: 'json' })
                expect(response.statusCode).toBe(200)
                expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', ['bar']]])
            })
        })

        describe('when calling setResourcePool without an array', () => {
            it('should throw an error', async () => {
                const response = await got.post(setResourcePoolUrl, { json: { key: 'foo', value: 'bar' }, responseType: 'json', throwHttpErrors: false, retry: { limit: 0 } })

                expect(response.statusCode).toBe(500)
                expect(response.body).toBe('Resource pool must be an array of values')
            })
        })

        describe('when calling setResourcePool with an already existing key', () => {
            it('should should override it', async () => {
                await got.post(setResourcePoolUrl, { json: { key: 'foo', value: [] }, responseType: 'json' })
                await got.post(setResourcePoolUrl, { json: { key: 'foo', value: ['bar'] }, responseType: 'json' })
                expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', ['bar']]])
            })
        })

        describe('when calling getValueFromPool with the name of an existing pool', () => {
            it('should return the first element and update the store', async () => {
                __resourcePoolStore.set('foo', ['bar'])
                const response = await got.get<{ value: string }>(`${getValueFromPoolUrl}/foo`, { responseType: 'json' })
                expect(response.body.value).toEqual('bar')
                expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', []]])
            })

            describe('and the pool will receive values after calling', () => {
                describe('and the timeout has a specified value', () => {
                    it('should return a value within the specified timeout', async () => {
                        __resourcePoolStore.set('foo', [])
                        const promise = got.get<{ value: string }>(`${getValueFromPoolUrl}/foo?timeout=200`, { responseType: 'json' })
                        await new Promise(resolve => setTimeout(resolve, 10))
                        __resourcePoolStore.set('foo', ['bar'])
                        const response = await promise
                        expect(response.statusCode).toBe(200)
                        expect(response.body.value).toEqual('bar')
                        expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', []]])
                    })
                })

                describe('and the timeout is not specified', () => {
                    it('should return a value within the default timeout', async () => {
                        __resourcePoolStore.set('foo', [])
                        const promise = got.get<{ value: string }>(`${getValueFromPoolUrl}/foo`, { responseType: 'json' })
                        await new Promise(resolve => setTimeout(resolve, 10))
                        __resourcePoolStore.set('foo', ['bar'])
                        const response = await promise
                        expect(response.statusCode).toBe(200)
                        expect(response.body.value).toEqual('bar')
                        expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', []]])
                    })
                })
            })
        })

        describe('when calling getValueFromPool with the name of a non existing pool', () => {
            it('should throw an error', async () => {
                const response = await got.get(`${getValueFromPoolUrl}/foo`, { responseType: 'json', throwHttpErrors: false, retry: { limit: 0 } })
                expect(response.statusCode).toBe(500)
                expect(response.statusMessage).toBe('Internal Server Error')
                expect(response.body).toBe("'foo' resource pool does not exist. Set it first using 'setResourcePool'")
                expect(Array.from(__resourcePoolStore.entries())).toEqual([])
            })
        })

        describe('when calling addValueToPool with a value and valid pool name', () => {
            it('should add that value to the pool', async () => {
                __resourcePoolStore.set('foo', [])

                const response = await got.post(addValueToPoolUrl + '/foo', { json: { value: 'bar' }, responseType: 'json' })
                expect(response.statusCode).toBe(200)
                expect(Array.from(__resourcePoolStore.entries())).toEqual([['foo', ['bar']]])
            })
        })

        describe('when calling addValueToPool with an invalid pool name', () => {
            it('should throw an error', async () => {
                const response = await got.post(addValueToPoolUrl + '/foo', { json: { value: 'bar' }, responseType: 'json', throwHttpErrors: false, retry: { limit: 0 } })

                expect(response.statusCode).toBe(500)
                expect(response.body).toBe("'foo' resource pool does not exist. Set it first using 'setResourcePool'")
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
