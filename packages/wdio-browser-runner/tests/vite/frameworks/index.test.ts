import { expect, vi, test } from 'vitest'
import updateViteConfig from '../../../src/vite/frameworks/index.js'
import { isNuxtFramework, optimizeForNuxt } from '../../../src/vite/frameworks/nuxt.js'

vi.mock('../../../src/vite/frameworks/nuxt.js', () => ({
    isNuxtFramework: vi.fn(),
    optimizeForNuxt: vi.fn()
}))

test('should apply optimizations for frameworks correctly', async () => {
    await updateViteConfig({}, {} as any, { rootDir: '/foo/bar' } as any)
    expect(optimizeForNuxt).toBeCalledTimes(0)

    vi.mocked(isNuxtFramework).mockResolvedValueOnce(true)
    await updateViteConfig({}, {} as any, { rootDir: '/foo/bar' } as any)
    expect(optimizeForNuxt).toBeCalledTimes(1)
})
