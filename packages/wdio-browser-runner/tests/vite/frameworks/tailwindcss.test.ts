import url from 'node:url'
import path from 'node:path'
import { expect, vi, test } from 'vitest'

import { isUsingTailwindCSS, optimizeForTailwindCSS } from '../../../src/vite/frameworks/tailwindcss.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn().mockResolvedValue('tailwindcss')
}))

vi.mock('tailwindcss', () => ({
    default: 'tailwindcss'
}))

test('isUsingTailwindCSS', async () => {
    expect(await isUsingTailwindCSS(path.resolve(__dirname, '__fixtures__'))).toBe(true)
})

test('optimizeForTailwindCSS', async () => {
    expect(await optimizeForTailwindCSS(path.resolve(__dirname, '__fixtures__'))).toEqual({
        css: {
            postcss: { plugins: ['tailwindcss'] }
        }
    })
})
