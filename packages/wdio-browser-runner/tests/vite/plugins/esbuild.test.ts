import { build } from 'esbuild'
import { test, expect } from 'vitest'

import { DEFAULT_VITE_CONFIG } from '../../../src/vite/constants.js'

test('pre-bundled deps can use path and __dirname when they load', async () => {
    const result = await build({
        ...DEFAULT_VITE_CONFIG.optimizeDeps!.esbuildOptions,
        stdin: {
            // what jest-message-util >= 30.5 runs when it loads
            contents: `
                import path from 'node:path'
                import { basename } from 'path'
                export const dir = path.resolve(__dirname, '..', '..')
                export const name = basename('/foo/bar.js')
            `,
            resolveDir: process.cwd()
        },
        bundle: true,
        write: false,
        format: 'esm',
        platform: 'browser',
        logLevel: 'silent'
    })
    const code = result.outputFiles[0].text
    const mod = await import(`data:text/javascript,${encodeURIComponent(code)}`)
    expect(mod.dir).toBe('/')
    expect(mod.name).toBe('bar.js')
})
