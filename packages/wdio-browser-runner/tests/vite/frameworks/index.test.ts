import { expect, vi, test } from 'vitest'
import updateViteConfig from '../../../src/vite/frameworks/index.js'
import { isUsingTailwindCSS, optimizeForTailwindCSS } from '../../../src/vite/frameworks/tailwindcss.js'
import { isNuxtFramework, optimizeForNuxt } from '../../../src/vite/frameworks/nuxt.js'

vi.mock('../../../src/vite/frameworks/nuxt.js', () => ({
    isNuxtFramework: vi.fn(),
    optimizeForNuxt: vi.fn()
}))

vi.mock('../../../src/vite/frameworks/tailwindcss.js', () => ({
    isUsingTailwindCSS: vi.fn(),
    optimizeForTailwindCSS: vi.fn()
}))

test('should apply optimizations for frameworks correctly', async () => {
    const options: any = {}
    await updateViteConfig(options, { rootDir: '/foo/bar' } as any)
    expect(optimizeForNuxt).toBeCalledTimes(0)
    expect(optimizeForTailwindCSS).toBeCalledTimes(0)

    vi.mocked(isNuxtFramework).mockResolvedValueOnce(true)
    await updateViteConfig(options, { rootDir: '/foo/bar' } as any)
    expect(optimizeForNuxt).toBeCalledTimes(1)

    vi.mocked(isUsingTailwindCSS).mockResolvedValueOnce(true)
    await updateViteConfig(options, { rootDir: '/foo/bar' } as any)
    expect(optimizeForTailwindCSS).toBeCalledTimes(1)
})

