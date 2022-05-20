import { describe, expect, vi, beforeAll, afterAll, afterEach, it } from 'vitest'
import { startServer, stopServer, __store } from '../src/server'

vi.mock('got')

const { post } = await vi.importActual('got')
const errHandler = vi.fn()

describe('WdioSharedStoreService exports', () => {
    let setUrl: string
    let getUrl: string

    beforeAll(async () => {
        const result = await startServer()
        const baseUrl = `http://localhost:${result.port}`
        setUrl = `${baseUrl}/set`
        getUrl = `${baseUrl}/get`
    })

    it('should not fail if payload has no key/value', async () => {
        await post(setUrl, { json: {} })
        await post(getUrl, { json: {} })
        expect(__store).toEqual({})
    })

    it('should handle non json type', async () => {
        const response = await post(getUrl, { body: 'foobar', throwHttpErrors: false })
        expect(response.statusCode).toBe(422)
        expect(response.statusMessage).toBe('Unprocessable Entity')
        expect(response.url).toContain('/get')
        expect(response.body).toBe('Invalid JSON')
    })

    it('should handle 404', async () => {
        const response = await post(getUrl + 'foobar', { throwHttpErrors: false })
        expect(response.statusCode).toBe(404)
    })

    describe('setting/getting entries', () => {
        it('should set entry', async () => {
            await post(setUrl, { json: { key: 'foo', value: 'bar' }, responseType: 'json' })
            expect(__store).toEqual({ foo: 'bar' })
        })

        it('should get entry', async () => {
            __store.foobar = 'barfoo'
            const res = await post(getUrl, { json: { key: 'foobar' }, responseType: 'json' })
            expect(res.body.value).toEqual('barfoo')
        })
    })

    afterEach(() => {
        Object.keys(__store).forEach(key => { delete __store[key] })
        errHandler.mockClear()
    })

    afterAll(async () => {
        await stopServer()
    })
})
