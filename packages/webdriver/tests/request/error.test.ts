
import { URL } from 'node:url'
import type { MockedFunction } from 'vitest'
import { transformCommandLogResult } from '@wdio/utils'
import { describe, it, expect, vi } from 'vitest'

import '../../src/browser.js'
import { WebDriverResponseError, WebDriverRequestError } from '../../src/request/error.js'

const cmdURL = new URL('http://localhost:1234/session/abc123/url')
const init = { method: 'POST' }

vi.mock('@wdio/utils')

describe('WebDriverResponseError', () => {
    it('captures errors without body', () => {
        const error = new WebDriverResponseError({} as any, cmdURL, init)
        expect(error.message).toBe('WebDriverError: Response has empty body when running "url" with method "POST"')
        expect(error.stack).toMatch('Response has empty body')
    })

    it('captures errors with unknown body', () => {
        const error = new WebDriverResponseError({ body: {} } as any, cmdURL, init)
        expect(error.message).toBe('WebDriverError: unknown error when running "url" with method "POST"')
        expect(error.stack).toMatch('unknown error')
    })

    it('captures Firefox errors', () => {
        //Firefox
        const error = new WebDriverResponseError({
            body: {
                value: {
                    error: 'foo',
                    message: 'bar'
                }
            }
        } as any, cmdURL, init)
        expect(error.name).toBe('foo')
        expect(error.message).toBe('WebDriverError: bar when running "url" with method "POST"')
    })

    it('captures Chrome errors', () => {
        const error = new WebDriverResponseError({
            body: { value: { message: 'stale element reference' } }
        } as any, cmdURL, init)
        expect(error.name).toBe('stale element reference')
        expect(error.message).toBe('WebDriverError: stale element reference when running "url" with method "POST"')
        expect(error.stack).toMatch('stale element reference')
        expect(error.stack).toMatch('stale element reference')
    })

    it('captures errors with message', () => {
        const error = new WebDriverResponseError({
            body: { value: { message: 'message error' } }
        } as any, cmdURL, init)
        expect(error.name).toBe('WebDriver Error')
        expect(error.message).toBe('WebDriverError: message error when running "url" with method "POST"')
        expect(error.stack).toMatch('WebDriver Error')
        expect(error.stack).toMatch('message')
    })

    it('captures errors with class', () => {
        const error = new WebDriverResponseError({
            body: { value: { class: 'class error' } }
        } as any, cmdURL, init)
        expect(error.name).toBe('WebDriver Error')
        expect(error.message).toBe('WebDriverError: class error when running "url" with method "POST"')
        expect(error.stack).toMatch('WebDriver Error')
        expect(error.stack).toMatch('class')
    })

    it('captures errors with name', () => {
        const error = new WebDriverResponseError({
            body: { value: { name: 'Protocol Error' } }
        } as any, cmdURL, init)
        expect(error.name).toBe('Protocol Error')
        expect(error.message).toBe('WebDriverError: unknown error when running "url" with method "POST"')
        expect(error.stack).toMatch('Protocol Error')
        expect(error.stack).toMatch('unknown error')
    })

    it('captures errors without value', () => {
        const error = new WebDriverResponseError({
            body: { value: { } }
        } as any, cmdURL, init)
        expect(error.name).toBe('WebDriver Error')
        expect(error.message).toBe('WebDriverError: unknown error when running "url" with method "POST"')
        expect(error.stack).toMatch('WebDriver Error')
        expect(error.stack).toMatch('unknown error')
    })

    it('captures invalid selector errors', () => {
        const error = new WebDriverResponseError(
            { body: { value: { message: 'invalid locator' } } } as any,
            cmdURL,
            { body: { using: 'css selector', value: '!!' }, method: 'POST' } as any
        )
        expect(error.message).toMatchInlineSnapshot('"WebDriverError: The selector "!!" used with strategy "css selector" is invalid! when running "url" with method "POST" and args "{"using":"css selector","value":"!!"}""')
    })

    it('captures unknown command errors', () => {
        const error = new WebDriverResponseError(
            {
                body: {
                    message: 'Command not found: POST /some/command',
                    error: 'unknown method',
                    name: 'Protocol Error'
                }
            } as any,
            cmdURL,
            init
        )
        expect(error.message).toMatchInlineSnapshot('"WebDriverError: Command not found: POST /some/command when running "url" with method "POST""')
        expect(error.name).toBe('unknown method')
    })

    it('command name as full endpoint', async () => {
        const timeoutErr = new WebDriverResponseError(
            { body: { message: 'Timeout' } } as any,
            new URL('https://localhost:4445/wd/hub/session'),
            { method: 'GET' }
        )

        expect(timeoutErr.message).toEqual(expect.stringMatching('when running "https://localhost:4445/wd/hub/session"'))
    })

    it('command args as stringified object', async () => {
        const timeoutErr = new WebDriverResponseError(
            { body: { message: 'Timeout' } } as any,
            new URL('https://localhost:4445/default/method'),
            { method: 'GET', body: { foo: 'bar' } as any }
        )

        expect(timeoutErr.message).toEqual(
            expect.stringMatching(new RegExp(`when running .+ with method .+ and args "${JSON.stringify({ foo: 'bar' })}"`))
        )
    })

    it('command args with base64 script', async () => {
        (transformCommandLogResult as MockedFunction<any>).mockReturnValueOnce('"<Script[base64]>"')

        const cmdArgs = { script: Buffer.from('script').toString('base64') }
        const reqOpts = { body: cmdArgs, method: 'POST' }

        const timeoutErr = new WebDriverResponseError(
            { body: { message: 'Timeout' } } as any,
            new URL('https://localhost:4445/default/method'),
            reqOpts as any
        )

        expect(timeoutErr.message).toEqual(
            expect.stringMatching(/when running .+ with method .+ and args "<Script\[base64\]>"/)
        )
    })

    it('command args with function script without extra wrapper', async () => {
        const cmdArgs = { script: 'return (function() {\nconsole.log("hi")\n}).apply(null, arguments)' }
        const reqOpts = { body: cmdArgs, method: 'POST' }

        const timeoutErr = new WebDriverResponseError(
            { body: { message: 'Timeout' } } as any,
            new URL('https://localhost:4445/default/method'),
            reqOpts as any
        )
        expect(timeoutErr.message).toEqual(
            expect.stringMatching(/when running .+ with method .+ and args "function\(\) {\nconsole\.log\("hi"\)\n}/)
        )
    })

    it('command args with base64 screenshot', async () => {
        (transformCommandLogResult as MockedFunction<any>).mockReturnValueOnce('"<Screenshot[base64]>"')

        const cmdArgs = { file: Buffer.from('screen').toString('base64') }
        const reqOpts = { body: cmdArgs, method: 'POST' }

        const timeoutErr = new WebDriverResponseError(
            { body: { message: 'Timeout' } } as any,
            new URL('https://localhost:4445/default/method'),
            reqOpts as any
        )

        expect(timeoutErr.message).toEqual(
            expect.stringMatching(/when running .+ with method .+ and args "<Screenshot\[base64\]>"/)
        )
    })
})

describe('WebDriverRequestError', () => {
    const url = new URL('http://localhost:1234')
    const init: any = { method: 'POST' }

    it('captures basic error', () => {
        const error = new WebDriverRequestError(new Error('ups'), url, init)
        expect(error.message).toBe('WebDriverError: ups when running "http://localhost:1234/" with method "POST"')
    })

    it('captures fetch errors', () => {
        const err = new Error('fetch failed')
        err.cause = { code: 'ECONNREFUSED' }
        const error = new WebDriverRequestError(err, url, init)
        expect(error.message).toBe('WebDriverError: Request failed with error code ECONNREFUSED when running "http://localhost:1234/" with method "POST"')
    })

    it('captures timeout errors', () => {
        const err = new Error('fetch failed')
        err.cause = { code: 'UND_ERR_CONNECT_TIMEOUT' }
        const error = new WebDriverRequestError(err, url, init)
        expect(error.message).toBe('WebDriverError: Request timed out! Consider increasing the "connectionRetryTimeout" option. when running "http://localhost:1234/" with method "POST"')
    })
})
