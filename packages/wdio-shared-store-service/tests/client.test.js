import { post } from 'axios'
import { getValue, setValue, setPort } from '../src/client'

const port = '3000'
const baseUrl = `http://localhost:${port}`

describe('client', () => {
    beforeAll(() => {
        setPort(port)
    })

    it('should set value', async () => {
        await setValue('foo', 'bar')
        expect(post).toBeCalledWith(`${baseUrl}/set`, { key: 'foo', value: 'bar' })
    })

    it('should get value', async () => {
        const result = await getValue('foo')
        expect(post).toBeCalledWith(`${baseUrl}/get`, { key: 'foo' })
        expect(result).toBe('store value')
    })

    it('should not fail if key is not in store', async () => {
        const result = await getValue()
        expect(post).toBeCalledWith(`${baseUrl}/get`, { key: undefined })
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
