import { post } from 'got'
import { getValue, setValue, setPort } from '../src/client'

jest.mock('got', () => ({
    post: jest.fn().mockImplementation((url, options) => new Promise((resolve, reject) => {
        if (options.json.key === 'fail') {
            return reject({
                message: 'Response code 404 (Not Found)',
                statusCode: 404,
                statusMessage: 'Not Found',
                body: 'Not Found',
                url
            })
        }
        if (typeof options.json.key === 'undefined') {
            return resolve({})
        }
        return resolve({ body: { value: 'store value' } })
    }))
}))

const port = '3000'
const baseUrl = `http://localhost:${port}`

describe('client', () => {
    beforeAll(() => {
        setPort(port)
    })

    it('should set value', async () => {
        await setValue('foo', 'bar')
        expect(post).toBeCalledWith(`${baseUrl}/set`, { json: { key: 'foo', value: 'bar' } })
    })

    it('should get value', async () => {
        const result = await getValue('foo')
        expect(post).toBeCalledWith(`${baseUrl}/get`, { json: { key: 'foo' }, responseType: 'json' })
        expect(result).toBe('store value')
    })

    it('should not fail if key is not in store', async () => {
        const result = await getValue()
        expect(post).toBeCalledWith(`${baseUrl}/get`, { json: { key: undefined }, responseType: 'json' })
        expect(result).toBeUndefined()
    })

    it('should not fail on get error', async () => {
        const result = await getValue('fail')
        expect(result).toBeUndefined()
    })

    it('should not fail on set error', async () => {
        const result = await setValue('fail')
        expect(result).toBeUndefined()
    })

    afterEach(() => {
        post.mockClear()
    })
})
