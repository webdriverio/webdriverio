import url from 'node:url'
import path from 'node:path'
import { expect, vi, test } from 'vitest'

import { isUsingTailwindCSS, optimizeForTailwindCSS } from '../../../src/vite/frameworks/tailwindcss.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn().mockImplementation((pkg) => {
        if (pkg === '@tailwindcss/postcss') {
            return Promise.resolve('@tailwindcss/postcss')
        }
        if (pkg === 'tailwindcss') {
            return Promise.resolve('tailwindcss')
        }
        return Promise.reject(new Error(`Package ${pkg} not found`))
    })
}))

vi.mock('@tailwindcss/postcss', () => ({
    default: 'tailwindcss-postcss'
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
            postcss: { plugins: ['tailwindcss-postcss'] }
        }
    })
})

test('optimizeForTailwindCSS falls back to legacy tailwindcss', async () => {
    const { resolve } = await import('import-meta-resolve')
    vi.mocked(resolve).mockImplementationOnce((pkg) => {
        if (pkg === 'tailwindcss') {
            return Promise.resolve('tailwindcss')
        }
        return Promise.reject(new Error(`Package ${pkg} not found`))
    })

    expect(await optimizeForTailwindCSS(path.resolve(__dirname, '__fixtures__'))).toEqual({
        css: {
            postcss: { plugins: ['tailwindcss'] }
        }
    })
})
