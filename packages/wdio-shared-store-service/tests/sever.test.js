const { post } = jest.requireActual('axios')
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

    it('should not fail if payload is not json', async () => {
        await post(setUrl, 'foobar')
        await post(getUrl, 'foobar')
        expect(__store).toEqual({})
    })

    it('should set entry', async () => {
        await post(setUrl, { key: 'foo', value: 'bar' })
        expect(__store).toEqual({ foo: 'bar' })
    })

    it('should get entry', async () => {
        __store.foobar = 'barfoo'
        const res = await post(getUrl, { key: 'foobar' })
        expect(res.data.value).toEqual('barfoo')
    })

    afterEach(() => {
        Object.keys(__store).forEach(key => { delete __store[key] })
        errHandler.mockClear()
    })

    afterAll(async () => {
        await stopServer()
    })
})
