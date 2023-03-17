import fs from 'node:fs/promises'

import { vi, describe, it, expect, beforeEach } from 'vitest'

import { generateBrowserRunnerTestFiles } from '../src/utils.js'

vi.mock('node:fs/promises', () => ({
    default: {
        writeFile: vi.fn().mockReturnValue(Promise.resolve()),
        mkdir: vi.fn().mockReturnValue(Promise.resolve('/foo/bar'))
    }
}))

const destSpecRootPath = '/foo/bar'

describe.only('', () => {
    beforeEach(async () => {
        vi.mocked(fs.writeFile).mockClear()
    })

    describe('react', () => {
        it('with testing-library', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'react',
                destSpecRootPath,
                installTestingLibrary: true,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(3)
            let [filePath, content] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.css')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.tsx')
            ;[filePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.tsx')
            expect(content).toMatchSnapshot()
        })

        it('without testing-library', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'react',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(3)
            let [filePath, content] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.css')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.tsx')
            ;[filePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.tsx')
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'react',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            let [filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.jsx')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.jsx')
        })
    })

    describe('preact', () => {
        it('with testing-library', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'preact',
                destSpecRootPath,
                installTestingLibrary: true,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(3)
            let [filePath, content] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.css')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.tsx')
            ;[filePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.tsx')
            expect(content).toMatchSnapshot()
        })

        it('without testing-library', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'preact',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(3)
            let [filePath, content] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.css')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.tsx')
            ;[filePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.tsx')
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'preact',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            let [filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath.endsWith('Component.jsx')).toBe(true)
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath.endsWith('Component.test.jsx')).toBe(true)
        })
    })

    describe('solid', () => {
        it('with testing-library', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'solid',
                destSpecRootPath,
                installTestingLibrary: true,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(3)
            let [filePath, content] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.css')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.tsx')
            ;[filePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.tsx')
            expect(content).toMatchSnapshot()
        })

        it('without testing-library', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'solid',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(3)
            let [filePath, content] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.css')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.tsx')
            ;[filePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.tsx')
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'solid',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            let [filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath.endsWith('Component.jsx')).toBe(true)
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath.endsWith('Component.test.jsx')).toBe(true)
        })
    })

    describe('lit', () => {
        it('without testing-library', async () => {
            await generateBrowserRunnerTestFiles({
                preset: '',
                destSpecRootPath,
                installTestingLibrary: true,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(3)
            let [filePath, content] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath.endsWith('Component.css')).toBe(true)
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath.endsWith('Component.ts')).toBe(true)
            ;[filePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath.endsWith('Component.test.ts')).toBe(true)
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: '',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            let [filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.js')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.js')
        })
    })

    describe('Vue', () => {
        it('with testing-library', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'vue',
                destSpecRootPath,
                installTestingLibrary: true,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(3)
            let [filePath, content] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.css')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.vue')
            ;[filePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.ts')
            expect(content).toMatchSnapshot()
        })

        it('without testing-library', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'vue',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(3)
            let [filePath, content] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.css')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.vue')
            ;[filePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.ts')
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'vue',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            let [filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath.endsWith('Component.vue')).toBe(true)
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath.endsWith('Component.test.js')).toBe(true)
        })
    })

    describe('Svelte', () => {
        it('with testing-library', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'svelte',
                destSpecRootPath,
                installTestingLibrary: true,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(3)
            let [filePath, content] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.css')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.svelte')
            ;[filePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.ts')
            expect(content).toMatchSnapshot()
        })

        it('without testing-library', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'svelte',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(3)
            let [filePath, content] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.css')
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath).toBe('/foo/bar/Component.svelte')
            ;[filePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.ts')
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'svelte',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            let [filePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(filePath.endsWith('Component.svelte')).toBe(true)
            ;[filePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(filePath.endsWith('Component.test.js')).toBe(true)
        })
    })

    describe('other', () => {
        it('renders correctly with js', async () => {
            await generateBrowserRunnerTestFiles({
                preset: false,
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            expect(fs.writeFile).toBeCalledTimes(1)
            const [filePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.js')
        })

        it('renders correctly with ts', async () => {
            await generateBrowserRunnerTestFiles({
                preset: false,
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: true
            } as any)
            expect(fs.writeFile).toBeCalledTimes(1)
            const [filePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(filePath).toBe('/foo/bar/Component.test.ts')
        })
    })
})
