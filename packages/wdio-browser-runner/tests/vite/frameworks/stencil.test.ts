import type { Plugin } from 'vite'

import { expect, vi, test } from 'vitest'
import { isUsingStencilJS, optimizeForStencil } from '../../../src/vite/frameworks/stencil.js'
import { hasFileByExtensions } from '../../../src/vite/utils.js'

vi.mock('@stencil/core/compiler/stencil.js', () => ({
    transpileSync: vi.fn().mockReturnValue({
        code: 'the transpiled code',
        inputFilePath: '/foo/bar/StencilComponent.tsx'
    })
}))

vi.mock('../../../src/vite/utils.js', () => ({
    hasFileByExtensions: vi.fn(),
    hasDir: vi.fn()
}))

vi.mock('/foo/bar/stencil.config.ts', () => ({
    config: {
        plugins: [{
            name: 'esbuild-plugin',
            options: {
                include: ['foo', 'bar']
            }
        }]
    }
}))

test('isNuxtFramework', async () => {
    expect(await isUsingStencilJS('/foo/bar', {})).toBe(false)
    expect(await isUsingStencilJS('/foo/bar', { preset: 'stencil' })).toBe(true)
    vi.mocked(hasFileByExtensions).mockResolvedValueOnce('true')
    expect(await isUsingStencilJS('/foo/bar', {})).toBe(true)
})

test('optimizeForStencil', async () => {
    const opt = await optimizeForStencil('/foo/bar')
    expect(opt).toEqual({
        optimizeDeps: {
            include: ['foo', 'bar']
        },
        plugins: [expect.any(Object)]
    })
    expect((opt.plugins?.[0] as Plugin).name).toBe('wdio-stencil')
    expect((opt.plugins?.[0] as Plugin).enforce).toBe('pre')
    expect((opt.plugins?.[0] as any).resolveId('foo')).toBe(undefined)
    expect((opt.plugins?.[0] as any).resolveId('@wdio/browser-runner/stencil'))
        .toEqual(expect.stringMatching(/\/vite\/frameworks\/fixtures\/stencil\.js$/))
    expect((opt.plugins?.[0] as any).transform('foo', '/foo/bar/StencilComponent.tsx', {}))
        .toEqual({
            code: 'the transpiled code',
            inputFilePath: '/foo/bar/StencilComponent.tsx'
        })
})
