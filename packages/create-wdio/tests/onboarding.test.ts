import fs from 'node:fs/promises'
import path from 'node:path'

import { vi, describe, it, expect, beforeEach } from 'vitest'

import { generateBrowserRunnerTestFiles } from '../src/utils.js'

vi.mock('node:fs/promises', async (orig) => ({
    ...(await orig()) as any,
    default: {
        writeFile: vi.fn().mockReturnValue(Promise.resolve()),
        mkdir: vi.fn().mockReturnValue(Promise.resolve('/foo/bar')),
        access: vi.fn().mockRejectedValue(new Error('dont exist')),
    },
}))

const destSpecRootPath = path.resolve(path.sep, 'foo', 'bar')

describe('onboarding templates', () => {
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
            const [cssFilePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(cssFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.css'))
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.tsx'))
            const [testFilePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.tsx'))
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
            const [cssFilePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(cssFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.css'))
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.tsx'))
            const [testFilePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.tsx'))
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'react',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.jsx'))
            const [testFilePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.jsx'))
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
            const [cssFilePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(cssFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.css'))
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.tsx'))
            const [testFilePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.tsx'))
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
            const [cssFilePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(cssFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.css'))
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.tsx'))
            const [testFilePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.tsx'))
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'preact',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.jsx'))
            const [testFilePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.jsx'))
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
            const [cssFilePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(cssFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.css'))
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.tsx'))
            const [testFilePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.tsx'))
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
            const [cssFilePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(cssFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.css'))
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.tsx'))
            const [testFilePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.tsx'))
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'solid',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.jsx'))
            const [testFilePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.jsx'))
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
            const [cssFilePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(cssFilePath.endsWith('Component.css')).toBe(true)
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath.endsWith('Component.ts')).toBe(true)
            const [testFilePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath.endsWith('Component.test.ts')).toBe(true)
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: '',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.js'))
            const [testFilePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.js'))
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
            const [cssFilePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(cssFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.css'))
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.vue'))
            const [testFilePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.ts'))
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
            const [cssFilePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(cssFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.css'))
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.vue'))
            const [testFilePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.ts'))
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'vue',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.vue'))
            const [testFilePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.js'))
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
            const [cssFilePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(cssFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.css'))
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.svelte'))
            const [testFilePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.ts'))
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
            const [cssFilePath] = vi.mocked(fs.writeFile).mock.calls[0] as string[]
            expect(cssFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.css'))
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.svelte'))
            const [testFilePath, content] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.ts'))
            expect(content).toMatchSnapshot()
        })

        it('when using JS', async () => {
            await generateBrowserRunnerTestFiles({
                preset: 'svelte',
                destSpecRootPath,
                installTestingLibrary: false,
                isUsingTypeScript: false
            } as any)
            const [componentFilePath] = vi.mocked(fs.writeFile).mock.calls[1] as string[]
            expect(componentFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.svelte'))
            const [testFilePath] = vi.mocked(fs.writeFile).mock.calls[2] as string[]
            expect(testFilePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.js'))
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
            expect(filePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.js'))
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
            expect(filePath).toBe(path.resolve(path.sep, 'foo', 'bar', 'Component.test.ts'))
        })
    })
})
