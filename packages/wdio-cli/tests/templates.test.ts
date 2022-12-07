import fs from 'node:fs/promises'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import { generateTestFiles } from '../src/utils.js'

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockResolvedValue({}),
        mkdir: vi.fn(),
        writeFile: vi.fn().mockReturnValue(Promise.resolve())
    }
}))
vi.mock('webdriverio')
vi.mock('devtools')

describe('template generation', () => {
    beforeEach(() => {
        vi.mocked(fs.writeFile).mockClear()
    })

    it('react', async () => {
        await generateTestFiles({
            framework: 'mocha',
            destSpecRootPath: '/foo/bar',
            preset: 'react',
            usePageObjects: false,
            runner: 'browser',
            isUsingTypeScript: true,
            installTestingLibrary: true
        } as any)
        expect(fs.writeFile).toBeCalledTimes(1)
        expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
    })

    it('react w/o testing library', async () => {
        await generateTestFiles({
            framework: 'mocha',
            destSpecRootPath: '/foo/bar',
            preset: 'react',
            usePageObjects: false,
            runner: 'browser',
            esmSupport: false,
            isUsingTypeScript: false,
            installTestingLibrary: false
        } as any)
        expect(fs.writeFile).toBeCalledTimes(1)
        expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
    })

    it('preact', async () => {
        await generateTestFiles({
            framework: 'mocha',
            destSpecRootPath: '/foo/bar',
            preset: 'preact',
            usePageObjects: false,
            runner: 'browser',
            isUsingTypeScript: true,
            installTestingLibrary: true
        } as any)
        expect(fs.writeFile).toBeCalledTimes(1)
        expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
    })

    it('preact w/o testing library', async () => {
        await generateTestFiles({
            framework: 'mocha',
            destSpecRootPath: '/foo/bar',
            preset: 'preact',
            usePageObjects: false,
            runner: 'browser',
            esmSupport: false,
            isUsingTypeScript: false,
            installTestingLibrary: false
        } as any)
        expect(fs.writeFile).toBeCalledTimes(1)
        expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
    })

    it('svelte', async () => {
        await generateTestFiles({
            framework: 'mocha',
            destSpecRootPath: '/foo/bar',
            preset: 'svelte',
            usePageObjects: false,
            runner: 'browser',
            isUsingTypeScript: true,
            installTestingLibrary: true
        } as any)
        expect(fs.writeFile).toBeCalledTimes(1)
        expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
    })

    it('vue', async () => {
        await generateTestFiles({
            framework: 'mocha',
            destSpecRootPath: '/foo/bar',
            preset: 'vue',
            usePageObjects: false,
            runner: 'browser',
            isUsingTypeScript: true,
            installTestingLibrary: false
        } as any)
        expect(fs.writeFile).toBeCalledTimes(1)
        expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
    })

    it('solid', async () => {
        await generateTestFiles({
            framework: 'mocha',
            destSpecRootPath: '/foo/bar',
            preset: 'solid',
            usePageObjects: false,
            runner: 'browser',
            isUsingTypeScript: true,
            installTestingLibrary: false
        } as any)
        expect(fs.writeFile).toBeCalledTimes(1)
        expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
    })

    it('lit', async () => {
        await generateTestFiles({
            framework: 'mocha',
            destSpecRootPath: '/foo/bar',
            preset: null,
            usePageObjects: false,
            runner: 'browser',
            isUsingTypeScript: true,
            installTestingLibrary: false
        } as any)
        expect(fs.writeFile).toBeCalledTimes(1)
        expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
    })
})

