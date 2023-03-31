import { describe, expect, vi, beforeAll, afterAll, afterEach, it } from 'vitest'
import { startServer, __store } from '../src/server.js'
import type gotType from 'got'

vi.mock('got')

const got = (await vi.importActual('got') as { default: typeof gotType }).default

const errHandler = vi.fn()

describe('WdioSharedStoreService exports', () => {
    let setUrl: string
    let getUrl: string
    let result: {
        port: number;
        app: PolkaInstance;
    } | undefined

    beforeAll(async () => {
        result = await startServer()
        const baseUrl = `http://localhost:${result.port}`
        setUrl = `${baseUrl}/set`
        getUrl = `${baseUrl}/get`
    })

    it('should not fail if payload has no key/value', async () => {
        await got.post(setUrl, { json: {} })
        await got.post(getUrl, { json: {} })
        expect(__store).toEqual({})
    })

    it('should handle non json type', async () => {
        const response = await got.post(getUrl, { body: 'foobar', throwHttpErrors: false })
        expect(response.statusCode).toBe(422)
        expect(response.statusMessage).toBe('Unprocessable Entity')
        expect(response.url).toContain('/get')
        expect(response.body).toBe('Invalid JSON')
    })

    it('should handle 404', async () => {
        const response = await got.post(getUrl + 'foobar', { throwHttpErrors: false })
        expect(response.statusCode).toBe(404)
    })

    describe('setting/getting entries', () => {
        it('should set entry', async () => {
            await got.post(setUrl, { json: { key: 'foo', value: 'bar' }, responseType: 'json' })
            expect(__store).toEqual({ foo: 'bar' })
        })

        it('should get entry', async () => {
            __store.foobar = 'barfoo'
            const res = await got.post<{ value: string }>(getUrl, { json: { key: 'foobar' }, responseType: 'json' })
            expect(res.body.value).toEqual('barfoo')
        })
    })

    afterEach(() => {
        Object.keys(__store).forEach(key => { delete __store[key] })
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
