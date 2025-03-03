import path from 'node:path'
<<<<<<< HEAD
import { expect, describe, it, vi, beforeEach } from 'vitest'
import { ELEMENT_KEY } from '@testplane/webdriver'
=======
import { expect, describe, it, vi } from 'vitest'
import { ELEMENT_KEY } from '@testplane/wdio-webdriver'
>>>>>>> 3c4557873 (fix: rename @testplane/webdriver to @testplane/wdio-webdriver)

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@testplane/wdio-logger', () => import(path.join(process.cwd(), '__mocks__', '@testplane/wdio-logger')))

describe('execute test', () => {
    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })

    it('should execute the script', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.$('#foo').execute((elem, a, b, c) => (elem.selector as string) + a + b + c, 1, 2, 3)
        expect((vi.mocked(fetch).mock.calls[1][0] as any).pathname)
            .toBe('/session/foobar-123/element')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[4][1]?.body as string)).toEqual(expect.objectContaining({
            script: expect.stringContaining('return ((elem, a, b, c) => elem.selector + a + b + c).apply(null, arguments)'),
            args: [{ [ELEMENT_KEY]: 'some-elem-123', ELEMENT: 'some-elem-123' }, 1, 2, 3]
        }))
    })

    it('should wait for element to exist', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.$('#foo').execute((elem) => elem)
        expect(vi.mocked(fetch).mock.calls.map(call => call[0])).toMatchInlineSnapshot(`
          [
            "http://localhost:4321/session",
            "http://localhost:4321/session/foobar-123/element",
            "http://localhost:4321/session/foobar-123/elements",
            "http://localhost:4321/session/foobar-123/element",
            "http://localhost:4321/session/foobar-123/execute/sync",
          ]
        `)
    })

    it('should return correct value', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const result = await browser.$('#foo').execute((elem, value) => `${elem}, ${value}`, 'foobar')
        expect(result).toEqual('some-elem-123, foobar')
    })

    it('should throw if script is wrong type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        // @ts-expect-error
        await expect(() => browser.$('#foo').execute(null)).rejects.toThrow()
        // @ts-expect-error
        await expect(() => browser.$('#foo').execute(1234)).rejects.toThrow()
    })
})
