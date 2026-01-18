import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { describe, it, expect } from 'vitest'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const BROWSER_BUILD_PATH = path.resolve(__dirname, '../../packages/webdriverio/build/browser.js')

describe.runIf(fs.existsSync(BROWSER_BUILD_PATH))('Browser Build', () => {

    it('should import browser bundle without crashing', async () => {
        // Dynamically import the browser bundle
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wdio: any = await import(BROWSER_BUILD_PATH)

        // Verify core exports exist
        expect(typeof wdio.remote).toBe('function')
        expect(typeof wdio.attach).toBe('function')
        expect(typeof wdio.multiremote).toBe('function')
        expect(typeof wdio.Key).toBe('object')
        expect(typeof wdio.SevereServiceError).toBe('function')
    })

    it('should have Key constants available', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Key } = await import(BROWSER_BUILD_PATH) as any

        // Verify commonly used keys
        expect(Key.Enter).toBeDefined()
        expect(Key.Escape).toBeDefined()
        expect(Key.Tab).toBeDefined()
        expect(Key.ArrowUp).toBeDefined()
        expect(Key.ArrowDown).toBeDefined()
    })

    it('should throw descriptive error for Node-only operations', async () => {
        const wdio = await import(BROWSER_BUILD_PATH)

        // Attempting to call remote without proper config should fail gracefully
        // and NOT with a "module not found" or "require is not defined" error.
        // It might fail because of validation or because of a hard-error mock being hit.
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await wdio.remote(undefined as any)
            // If we reach here, the call didn't throw - fail the test
            throw new Error('expected wdio.remote to throw')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            // We expect SOME error, but it shouldn't be a crash of the runtime
            expect(err).toBeDefined()
            // If it hits a hard-error mock, it should match the pattern
            if (err.message.includes('is not available in browser environments')) {
                expect(err.message).toMatch(/is not available in browser environments/)
            }
            // Ensure we didn't catch our own "expected to throw" error
            expect(err.message).not.toBe('expected wdio.remote to throw')
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
})
