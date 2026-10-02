import { Buffer } from 'node:buffer'
import { expect, browser, $ } from '@wdio/globals'
import type { RespondWithOptions } from 'webdriverio'
import { html, render } from 'lit'

const CORS_PARAMS: RespondWithOptions = {
    headers: { 'Access-Control-Allow-Origin': '*' }
}
const originalImage = new URL('./__fixtures__/400x400.svg?no-inline', import.meta.url).href
const redirectedImage = new URL('./__fixtures__/600x500.svg?no-inline', import.meta.url).href

describe('WebdriverIO mock command', () => {
    it('supports mocking of API requests', async () => {
        for (const pattern of ['https://api.webdriver.io/api/*', '*/api/*']) {
            const apiMock = await browser.mock(pattern)
            try {
                apiMock
                    .respondOnce({ foo: 'bar' }, CORS_PARAMS)
                    .respondOnce('Hello World', CORS_PARAMS)

                const jsonAPI = await fetch('https://api.webdriver.io/api/foo')
                expect(await jsonAPI.json()).toEqual({ foo: 'bar' })
                const textAPI = await fetch('https://api.webdriver.io/api/bar')
                expect(await textAPI.text()).toBe('Hello World')
            } finally {
                await apiMock.restore()
            }
        }
    })

    it('supports binary responses without a global Buffer', async () => {
        expect(globalThis.Buffer).toBeUndefined()
        const bytes = [137, 80, 78, 71]
        const apiMock = await browser.mock('https://api.webdriver.io/api/*')
        try {
            apiMock
                .respondOnce(Buffer.from(bytes), CORS_PARAMS)
                .respondOnce(new Uint8Array(bytes), CORS_PARAMS)
                .respondOnce(() => new Uint8Array(bytes).buffer, CORS_PARAMS)

            for (const endpoint of ['buffer', 'typed-array', 'array-buffer']) {
                const response = await fetch(`https://api.webdriver.io/api/${endpoint}`)
                expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(bytes))
            }
            expect(apiMock.calls).toHaveLength(3)
            for (const call of apiMock.calls) {
                expect(apiMock.getBinaryResponse(call.request.request)).toEqual(new Uint8Array(bytes))
            }
        } finally {
            await apiMock.restore()
        }
    })

    it('supports binary responses from an iframe', async () => {
        const frame = document.createElement('iframe')
        const apiMock = await browser.mock('https://api.webdriver.io/api/*')
        document.body.append(frame)
        try {
            const FrameUint8Array = (frame.contentWindow as Window & typeof globalThis).Uint8Array
            const bytes = new FrameUint8Array([0, 137, 80, 78, 71, 0]).subarray(1, 5)
            const buffer = new FrameUint8Array([137, 80, 78, 71]).buffer
            Object.defineProperty(buffer, 'constructor', {
                value: {
                    get [Symbol.species]() {
                        throw new Error('Symbol.species must not be read')
                    }
                }
            })
            expect(bytes instanceof Uint8Array).toBe(false)
            expect(buffer instanceof ArrayBuffer).toBe(false)
            apiMock
                .respondOnce(bytes, CORS_PARAMS)
                .respondOnce(buffer, CORS_PARAMS)
                .respondOnce(() => bytes, CORS_PARAMS)
                .respondOnce(() => buffer, CORS_PARAMS)

            for (const endpoint of ['typed-array', 'array-buffer', 'typed-array-callback', 'array-buffer-callback']) {
                const response = await fetch(`https://api.webdriver.io/api/${endpoint}`)
                expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]))
            }
            expect(apiMock.calls).toHaveLength(4)
        } finally {
            frame.remove()
            await apiMock.restore()
        }
    })

    let imgMock: WebdriverIO.Mock
    it('can redirect images', async () => {
        const imagePattern = new URL(originalImage)
        imagePattern.search = '*'
        imgMock = await browser.mock(imagePattern.href)
        imgMock.redirect(redirectedImage)
        render(
            html`<img src=${originalImage} />`,
            document.body
        )
        await expect($('img')).toHaveSize({ width: 600, height: 500 })
    })

    it('shows image after clearing mock', async () => {
        await imgMock.restore()
        const restoredImage = new URL(originalImage)
        restoredImage.searchParams.set('invalidateCache', '')
        render(
            html`<img src=${restoredImage.href} />`,
            document.body
        )
        await expect($('img')).toHaveSize({ width: 400, height: 400 })
    })
})
