const { post } = jest.requireActual('got')
import StoreServer from '../src/server'

const { startServer, stopServer, __store } = StoreServer
const errHandler = jest.fn()

describe('WdioSharedStoreService exports', () => {
    let setUrl
    let getUrl
    beforeAll(async () => {
        const result = await startServer()
        const baseUrl = `http://localhost:${result.port}`
        setUrl = `${baseUrl}/set`
        getUrl = `${baseUrl}/get`
    })

    it('should not fail if payload has no key/value', async () => {
        await post(setUrl, { json: true, body: {} })
        await post(getUrl, { json: true, body: {} })
        expect(__store).toEqual({})
    })

    it('should handle non json type', async () => {
        let error
        await post(getUrl, { body: 'foobar' }).catch((err) => { error = err })
        expect(error.statusCode).toBe(422)
        expect(error.statusMessage).toBe('Unprocessable Entity')
        expect(error.url).toContain('/get')
        expect(error.body).toBe('Invalid JSON')
    })

    it('should handle 404', async () => {
        let error
        await post(getUrl + 'foobar', { json: true }).catch((err) => { error = err })
        expect(error.statusCode).toBe(404)
    })

    it('should set entry', async () => {
        await post(setUrl, { json: true, body: { key: 'foo', value: 'bar' } })
        expect(__store).toEqual({ foo: 'bar' })
    })

    it('should get entry', async () => {
        __store.foobar = 'barfoo'
        const res = await post(getUrl, { json: true, body: { key: 'foobar' } })
        expect(res.body.value).toEqual('barfoo')
    })

    afterEach(() => {
        Object.keys(__store).forEach(key => { delete __store[key] })
        errHandler.mockClear()
    })

    afterAll(async () => {
        await stopServer()
    })
})
