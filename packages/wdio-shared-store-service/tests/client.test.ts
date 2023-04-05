import path from 'node:path'
import type { SpyInstance } from 'vitest'
import { describe, expect, it, vi, beforeAll, afterEach } from 'vitest'
import got from 'got'
import { getValue, setValue, setPort, setResourcePool, getValueFromPool, addValueToPool } from '../src/client.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('got', () => {
    const handler = (url, options) => new Promise((resolve, reject) => {
        const key = url.split('/').pop() || options?.json.key as string

        if (key === 'fail') {
            return reject({
                message: 'Response code 404 (Not Found)',
                response: {
                    body: 'Mock error'
                }
            })
        }
        if (key === 'not-present') {
            return resolve({})
        }
        return resolve({ body: { value: 'store value' } })
    })
    return {
        default: {
            post: vi.fn().mockImplementation(handler),
            get: vi.fn().mockImplementation(handler)
        }
    }
})

const port = 3000
const baseUrl = `http://localhost:${port}`
const mockedGet = got.get as unknown as SpyInstance
const mockedPost = got.post as unknown as SpyInstance

describe('client', () => {
    afterEach(() => {
        vi.mocked(got.post).mockClear()
    })

    describe('when used in launcher process', () => {
        it('should not post before server has started', async () => {
            const result1 = await setValue('foo', 'bar')
            const result2 = await setValue('bar', 'foo')
            const result3 = await setResourcePool('foo', ['bar'])
            expect([result1, result2, result3]).toEqual([undefined, undefined, undefined])

            expect(got.post).toBeCalledTimes(0)
            setPort(port)
            await Promise.resolve()
            expect(got.post).toBeCalledTimes(3)
            await setValue('another', 'item')
            expect(got.post).toBeCalledTimes(4)
        })
    })

    describe('when used in worker process', () => {
        beforeAll(() => {
            setPort(port)
        })

        it('should set value', async () => {
            await setValue('foo', 'bar')
            expect(got.post).toBeCalledWith(`${baseUrl}/`, { json: { key: 'foo', value: 'bar' } })
        })

        it('should get value', async () => {
            const result = await getValue('foo')
            expect(got.get).toBeCalledWith(`${baseUrl}/foo`, { responseType: 'json' })
            expect(result).toBe('store value')
        })

        it('should not fail if key is not in store', async () => {
            const result = await getValue('not-present')
            expect(got.get).toBeCalledWith(`${baseUrl}/not-present`, { responseType: 'json' })
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
            it("should call /pool/set and return it's response", async () => {
                mockedPost.mockResolvedValue({ body: { value: 'postResult' } })
                const result = await setResourcePool('foo', ['bar'])
                expect(got.post).toBeCalledWith(`${baseUrl}/pool`, { json: { key: 'foo', value: ['bar'] } })
                expect(result).toEqual({ body: { value: 'postResult' } })
            })
        })

        describe('and when /pool/set fails', () => {
            it('should throw the error', async () => {
                mockedPost.mockRejectedValue({ response: { body: 'postError' } })

                await expect(() => setResourcePool('fail', ['bar'])).rejects.toThrowError('postError')
            })
        })
    })

    describe('when calling getValueFromPool', () => {
        describe('and after setPort is called', () => {
            it("should call /pool/get and return it's response", async () => {
                mockedGet.mockResolvedValue({ body: { value: 'getResult' } })
                const result = await getValueFromPool('foo', { timeout: 100 })
                expect(got.get).toBeCalledWith(`${baseUrl}/pool/foo?timeout=100`, { responseType: 'json' })
                expect(result).toEqual('getResult')
            })
        })

        describe('and when /pool/get fails', () => {
            it('should throw the error', async () => {
                mockedGet.mockRejectedValue({ response: { body: 'getError' } })

                await expect(() => getValueFromPool('foo')).rejects.toThrowError('getError')
            })
        })
    })

    describe('when calling addValueToPool', () => {
        describe('and after setPort is called', () => {
            it("should call /pool/add and return it's response", async () => {
                mockedPost.mockResolvedValue({ body: { value: 'postResult' } })
                const result = await addValueToPool('foo', 'bar')
                expect(got.post).toBeCalledWith(`${baseUrl}/pool/foo`, { json: { value: 'bar' }, responseType: 'json' })
                expect(result).toEqual('postResult')
            })
        })

        describe('and when /pool/add fails', () => {
            it('should throw the error', async () => {
                mockedPost.mockRejectedValue({ response: { body: 'postError' } })

                await expect(() => addValueToPool('foo', {})).rejects.toThrowError('postError')
            })
        })
    })
})
