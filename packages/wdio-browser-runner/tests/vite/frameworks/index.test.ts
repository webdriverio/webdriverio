import { expect, vi, test } from 'vitest'
import updateViteConfig from '../../../src/vite/frameworks/index.js'
import { isUsingTailwindCSS, optimizeForTailwindCSS } from '../../../src/vite/frameworks/tailwindcss.js'
import { isNuxtFramework, optimizeForNuxt } from '../../../src/vite/frameworks/nuxt.js'
import { isUsingStencilJS, optimizeForStencil } from '../../../src/vite/frameworks/stencil.js'

vi.mock('../../../src/vite/frameworks/nuxt.js', () => ({
    isNuxtFramework: vi.fn(),
    optimizeForNuxt: vi.fn()
}))

vi.mock('../../../src/vite/frameworks/tailwindcss.js', () => ({
    isUsingTailwindCSS: vi.fn(),
    optimizeForTailwindCSS: vi.fn()
}))

vi.mock('../../../src/vite/frameworks/stencil.js', () => ({
    isUsingStencilJS: vi.fn(),
    optimizeForStencil: vi.fn()
}))

test('should apply optimizations for frameworks correctly', async () => {
    const options: any = {}
    const config = { rootDir: '/foo/bar' } as any

    expect(await updateViteConfig(options, config)).toEqual({})
    expect(optimizeForNuxt).toBeCalledTimes(0)
    expect(optimizeForTailwindCSS).toBeCalledTimes(0)
    expect(optimizeForStencil).toBeCalledTimes(0)

    vi.mocked(isNuxtFramework).mockResolvedValueOnce(true)
    vi.mocked(isUsingTailwindCSS).mockResolvedValueOnce(true)
    vi.mocked(isUsingStencilJS).mockResolvedValueOnce(true)
    vi.mocked(optimizeForNuxt).mockResolvedValueOnce({ define: { NUXT: '1' }, shared: 'nuxt' })
    vi.mocked(optimizeForTailwindCSS).mockResolvedValueOnce({
        css: { postcss: { plugins: ['tw'] } },
        shared: 'tailwind'
    })
    vi.mocked(optimizeForStencil).mockResolvedValueOnce({ optimizeDeps: { include: ['stencil'] } })

    expect(await updateViteConfig(options, config)).toEqual({
        define: { NUXT: '1' },
        css: { postcss: { plugins: ['tw'] } },
        optimizeDeps: { include: ['stencil'] },
        shared: 'tailwind'
    })
    expect(isNuxtFramework).toHaveBeenCalledWith('/foo/bar')
    expect(optimizeForNuxt).toHaveBeenCalledWith(options, config)
    expect(isUsingTailwindCSS).toHaveBeenCalledWith('/foo/bar')
    expect(optimizeForTailwindCSS).toHaveBeenCalledWith('/foo/bar')
    expect(isUsingStencilJS).toHaveBeenCalledWith('/foo/bar', options)
    expect(optimizeForStencil).toHaveBeenCalledWith('/foo/bar')
})

