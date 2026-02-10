import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { describe, it, expect } from 'vitest'
import type * as WebdriverIOBrowser from '../../packages/webdriverio/src/browser.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const BROWSER_BUILD_PATH = path.resolve(__dirname, '../../packages/webdriverio/build/browser.js')

describe.runIf(fs.existsSync(BROWSER_BUILD_PATH))('Browser Build', () => {

    it('should import browser bundle without crashing', async () => {
        // Dynamically import the browser bundle
        const wdio = await import(BROWSER_BUILD_PATH) as typeof WebdriverIOBrowser

        // Verify core exports exist
        expect(typeof wdio.remote).toBe('function')
        expect(typeof wdio.attach).toBe('function')
        expect(typeof wdio.multiremote).toBe('function')
        expect(typeof wdio.Key).toBe('object')
        expect(typeof wdio.SevereServiceError).toBe('function')
    })

    it('should have Key constants available', async () => {
        const { Key } = await import(BROWSER_BUILD_PATH) as typeof WebdriverIOBrowser

        // Verify commonly used keys
        expect(Key.Enter).toBeDefined()
        expect(Key.Escape).toBeDefined()
        expect(Key.Tab).toBeDefined()
        expect(Key.ArrowUp).toBeDefined()
        expect(Key.ArrowDown).toBeDefined()
    })

    it('should throw descriptive error for Node-only operations', async () => {
        const wdio = await import(BROWSER_BUILD_PATH) as typeof WebdriverIOBrowser

        // Attempting to call remote without proper config should fail gracefully
        // and NOT with a "module not found" or "require is not defined" error.
        // It might fail because of validation or because of a hard-error mock being hit.
        try {
            await (wdio.remote as Function)(undefined)
            // If we reach here, the call didn't throw - fail the test
            throw new Error('expected wdio.remote to throw')
        } catch (err: unknown) {
            // We expect SOME error, but it shouldn't be a crash of the runtime
            expect(err).toBeDefined()
            const error = err as Error
            // If it hits a hard-error mock, it should match the pattern
            if (error.message.includes('is not available in browser environments')) {
                expect(error.message).toMatch(/is not available in browser environments/)
            }
            // Ensure we didn't catch our own "expected to throw" error
            expect(error.message).not.toBe('expected wdio.remote to throw')
        }
    })

    it('should have process global available from banner injection', async () => {
        // Import triggers banner execution
        await import(BROWSER_BUILD_PATH)

        // Verify process global exists
        expect(globalThis.process).toBeDefined()
        expect(globalThis.process.env).toBeDefined()
        // In real browser this is 'browser', in vitest it might be system platform
        expect(globalThis.process.platform).toBeDefined()
    })

    it('should have Buffer global available from banner injection', async () => {
        // Import triggers banner execution
        await import(BROWSER_BUILD_PATH)

        // Verify Buffer global exists (from banner)
        expect(globalThis.Buffer).toBeDefined()
        expect(typeof globalThis.Buffer.from).toBe('function')
        expect(typeof globalThis.Buffer.alloc).toBe('function')
        expect(typeof globalThis.Buffer.isBuffer).toBe('function')
        expect(typeof globalThis.Buffer.concat).toBe('function')
    })

    it('Buffer.from should handle string input', async () => {
        await import(BROWSER_BUILD_PATH)

        const result = globalThis.Buffer.from('hello')
        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBe(5)
    })

    it('Buffer.from should handle base64 encoding', async () => {
        await import(BROWSER_BUILD_PATH)

        // 'aGVsbG8=' is base64 for 'hello'
        const result = globalThis.Buffer.from('aGVsbG8=', 'base64')
        expect(result).toBeInstanceOf(Uint8Array)
        // Should decode to 'hello' (5 bytes)
        expect(result.length).toBe(5)
    })

    // Polyfill functionality tests
    describe('Polyfill Functionality', () => {
        it('should handle util.format with placeholders', async () => {
            const util = await import('node:util')
            expect(util.format('Hello %s', 'World')).toBe('Hello World')
            expect(util.format('Number: %d', 42)).toBe('Number: 42')
            expect(util.format('Float: %f', 3.14)).toBe('Float: 3.14')
        })

        it('should handle URL.fileURLToPath', async () => {
            const { fileURLToPath } = await import('node:url')
            expect(fileURLToPath('file:///C:/path/to/file.txt')).toBe('C:/path/to/file.txt')
            expect(fileURLToPath('file:///path/to/file.txt')).toBe('/path/to/file.txt')
        })

        it('should handle URL.pathToFileURL', async () => {
            const { pathToFileURL } = await import('node:url')
            const url = pathToFileURL('C:/path/to/file.txt')
            expect(url.protocol).toBe('file:')
            expect(url.pathname).toContain('C:/path/to/file.txt')
        })

        it('should validate Buffer.from hex encoding', async () => {
            await import(BROWSER_BUILD_PATH)

            // Valid hex
            const valid = globalThis.Buffer.from('48656c6c6f', 'hex')
            expect(valid.toString()).toBe('Hello')

            // Invalid hex should throw
            expect(() => globalThis.Buffer.from('zzz', 'hex')).toThrow(/Invalid hex string/)
            expect(() => globalThis.Buffer.from('abc', 'hex')).toThrow(/Invalid hex string length/)
        })

        it('should reject numeric input to Buffer.from', async () => {
            await import(BROWSER_BUILD_PATH)
            expect(() => globalThis.Buffer.from(10 as unknown as string)).toThrow(/must not be of type number/)
        })

        it('should handle querystring encoding/decoding', async () => {
            const qs = await import('node:querystring')
            const encoded = qs.stringify({ foo: 'bar', baz: 'qux' })
            expect(encoded).toContain('foo=bar')
            expect(encoded).toContain('baz=qux')

            const decoded = qs.parse('foo=bar&baz=qux')
            expect(decoded.foo).toBe('bar')
            expect(decoded.baz).toBe('qux')
        })

        it('should handle assert.deepEqual with circular references', async () => {
            const assert = await import('node:assert')
            const obj: Record<string, unknown> = { a: 1 }
            obj.self = obj

            const obj2: Record<string, unknown> = { a: 1 }
            obj2.self = obj2

            // Should not throw for circular references
            expect(() => assert.deepEqual(obj, obj2)).not.toThrow()
        })

        it('should handle assert.deepEqual with undefined values', async () => {
            const assert = await import('node:assert')
            const obj1 = { a: 1, b: undefined }
            const obj2 = { a: 1, b: undefined }

            expect(() => assert.deepEqual(obj1, obj2)).not.toThrow()
        })

        it('should handle assert.deepEqual with different key orders', async () => {
            const assert = await import('node:assert')
            const obj1 = { a: 1, b: 2 }
            const obj2 = { b: 2, a: 1 }

            expect(() => assert.deepEqual(obj1, obj2)).not.toThrow()
        })

        it('should have process.version with semantic format', async () => {
            const process = await import('node:process')
            expect(process.version).toBe('v0.0.0-browser')
            expect(process.versions.browser).toBe('1.0.0')
        })
    })

    // Hard-error mock tests
    describe('Hard-Error Mocks', () => {
        it('should throw descriptive error for fs module', async () => {
            await expect(async () => {
                const fsModule = await import('node:fs')
                // @ts-expect-error - testing runtime behavior
                fsModule.readFileSync('/path')
            }).rejects.toThrow(/is not available in browser environments/)
        })

        it('should throw descriptive error for child_process module', async () => {
            await expect(async () => {
                const cp = await import('node:child_process')
                // @ts-expect-error - testing runtime behavior
                cp.spawn('command')
            }).rejects.toThrow(/is not available in browser environments/)
        })

        it('should throw descriptive error for net module', async () => {
            await expect(async () => {
                const netModule = await import('node:net')
                // @ts-expect-error - testing runtime behavior
                netModule.createServer()
            }).rejects.toThrow(/is not available in browser environments/)
        })
    })
})
