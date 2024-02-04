import path from 'node:path'
import { describe, expect, it, vi, beforeAll, afterEach } from 'vitest'
import { getValue, setValue, setPort, setResourcePool, getValueFromPool, addValueToPool } from '../src/client.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.spyOn(global, 'fetch').mockImplementation((URL: string | URL | globalThis.Request, options?: RequestInit) => {
    const url = URL as string
    const body = options?.body as string
    const key = url.split('/').pop() || JSON.parse(body).key

    if (key === 'fail') {
        return Promise.reject({
            message: 'Mock error'
        })
    }
    if (key === 'not-present') {
        return Promise.resolve(Response.json({ value: undefined }))
    }

    return Promise.resolve(Response.json({ value: 'store value' }))
})

const port = 3000
const baseUrl = `http://localhost:${port}`
const headers = {
    'Content-Type': 'application/json'
}

describe('client', () => {
    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })

    describe('when used in launcher process', () => {
        it('Error should be thrown when attempting to retrieve a value before server initialization', () => {
            expect(getValue('*')).rejects.toThrowError('Attempting to use `getValue` before the server has been initialized.')
            expect(getValueFromPool('*')).rejects.toThrowError('Attempting to use `getValueFromPool` before the server has been initialized.')
            expect(addValueToPool('*', '')).rejects.toThrowError('Attempting to use `addValueToPool` before the server has been initialized.')
        })

        it('should not post before server has started', async () => {
            const result1 = await setValue('foo', 'bar')
            const result2 = await setValue('bar', 'foo')
            const result3 = await setResourcePool('foo', ['bar'])
            expect([result1, result2, result3]).toEqual([undefined, undefined, undefined])

            expect(fetch).toBeCalledTimes(0)
            setPort(port)
            await Promise.resolve()
            expect(vi.mocked(fetch)).toBeCalledTimes(3)
            for (let i = 1; i <= 3; i++) {
                expect(vi.mocked(fetch)).toHaveBeenNthCalledWith(
                    i,
                    expect.any(String),
                    expect.objectContaining({ method: 'post' })
                )
            }
            await setValue('another', 'item')
            expect(vi.mocked(fetch).mockName('post')).toBeCalledTimes(4)
            for (let i = 1; i <= 4; i++) {
                expect(vi.mocked(fetch)).toHaveBeenNthCalledWith(
                    i,
                    expect.any(String),
                    expect.objectContaining({ method: 'post' })
                )
            }
        })
    })

    describe('when used in worker process', () => {
        beforeAll(() => {
            setPort(port)
        })

        it('should set value', async () => {
            await setValue('foo', 'bar')
            expect(fetch).toBeCalledWith(`${baseUrl}/`, {
                method: 'post',
                body: JSON.stringify({ key: 'foo', value: 'bar' }),
                headers
            })
        })

        it('should get value', async () => {
            const result = await getValue('foo')
            expect(fetch).toBeCalledWith(`${baseUrl}/foo`, {
                method: 'get',
                headers
            })
            expect(result).toBe('store value')
        })

        it('should not fail if key is not in store', async () => {
            const result = await getValue('not-present')
            expect(fetch).toBeCalledWith(`${baseUrl}/not-present`, {
                method: 'get',
                headers
            })
            expect(result).toBeUndefined()
        })

        it('should throw an error on get error', async () => {
            await expect(() => getValue('fail')).rejects.toThrowError('Mock error')
        })

        it('should throw an error on set error', async () => {
            await expect(() => setValue('fail', 'fail')).rejects.toThrowError('Mock error')
        })
    })

    describe('when calling setResourcePool', () => {
        describe('and after setPort is called', () => {
            it("should call /pool/set and return it's response code", async () => {
                vi.mocked(fetch).mockResolvedValueOnce(Response.json({}, { status: 200 }))
                const result = await setResourcePool('foo', ['bar'])
                expect(fetch).toBeCalledWith(`${baseUrl}/pool`, {
                    method: 'post',
                    body: JSON.stringify({ key: 'foo', value: ['bar'] }),
                    headers
                })
                expect(result).toEqual(200)
            })
        })

        describe('and when /pool/set fails', () => {
            it('should throw the error', async () => {
                vi.mocked(fetch).mockRejectedValue({ message: 'postError' })
                await expect(() => setResourcePool('fail', ['bar'])).rejects.toThrowError('postError')
            })
        })
    })

    describe('when calling getValueFromPool', () => {
        describe('and after setPort is called', () => {
            it("should call /pool/get and return it's response", async () => {
                vi.mocked(fetch).mockResolvedValueOnce(Response.json({ value: 'getResult' }))
                const result = await getValueFromPool('foo', { timeout: 100 })
                expect(fetch).toBeCalledWith(`${baseUrl}/pool/foo?timeout=100`, {
                    method: 'get',
                    headers
                })
                expect(result).toEqual('getResult')
            })
        })

        describe('and when /pool/get fails', () => {
            it('should throw the error', async () => {
                vi.mocked(fetch).mockRejectedValue({ message: 'getError' })
                await expect(() => getValueFromPool('foo')).rejects.toThrowError('getError')
            })
        })
    })

    describe('when calling addValueToPool', () => {
        describe('and after setPort is called', () => {
            it("should call /pool/add and return it's response code", async () => {
                vi.mocked(fetch).mockResolvedValueOnce(Response.json({}, { status: 200 }))
                const result = await addValueToPool('foo', 'bar')
                expect(fetch).toBeCalledWith(`${baseUrl}/pool/foo`, {
                    method: 'post',
                    body: JSON.stringify({ value: 'bar' }),
                    headers })
                expect(result).toEqual(200)
            })
        })

        describe('and when /pool/add fails', () => {
            it('should throw the error', async () => {
                vi.mocked(fetch).mockRejectedValue({ message: 'postError' })
                await expect(() => addValueToPool('foo', {})).rejects.toThrowError('postError')
            })
        })
    })
})
