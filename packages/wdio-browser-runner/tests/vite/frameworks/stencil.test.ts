import type { Plugin } from 'vite'

import { expect, vi, test } from 'vitest'
import { isUsingStencilJS, optimizeForStencil } from '../../../src/vite/frameworks/stencil.js'
import { hasFileByExtensions } from '../../../src/vite/utils.js'

vi.mock('@stencil/core/compiler/stencil.js', () => ({
    transpileSync: vi.fn().mockReturnValue({
        code: 'the transpiled code',
        inputFilePath: '/foo/bar/StencilComponent.tsx'
    }),
    ts: {
        findConfigFile: vi.fn().mockReturnValue('/foo/bar/tsconfig.json'),
        sys: {
            resolvePath: vi.fn().mockReturnValue('/foo/bar/tsconfig.json'),
            fileExists: vi.fn().mockReturnValue(true)
        },
        readConfigFile: vi.fn().mockReturnValue({
            config: {
                compilerOptions: {
                    baseUrl: './',
                    paths: {
                        '@stencil/core': ['node_modules/@stencil/core/dist/types']
                    },
                    target: 'es2017'
                }
            }
        }),
        parseJsonConfigFileContent: vi.fn().mockReturnValue({
            options: {}
        })
    }
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
            include: ['foo', 'bar', '@wdio/browser-runner/stencil > @stencil/core/internal/testing/index.js']
        },
        plugins: [expect.any(Object)]
    })
    expect((opt.plugins?.[0] as Plugin).name).toBe('wdio-stencil')
    expect((opt.plugins?.[0] as Plugin).enforce).toBe('pre')
    expect((opt.plugins?.[0] as any).resolveId('foo')).toBe(undefined)
    expect(typeof (opt.plugins?.[0] as any).resolveId('@wdio/browser-runner/stencil')).toBe('string')
    expect((opt.plugins?.[0] as any).transform(
        "import { Component, Prop, h } from '@stencil/core'",
        '/foo/bar/StencilComponent.tsx', {})
    ).toEqual({
        code: "import { Fragment } from '@stencil/core';\nthe transpiled code",
        inputFilePath: '/foo/bar/StencilComponent.tsx'
    })
    expect((opt.plugins?.[0] as any).transform(
        "import { Component, Prop, h } from 'something else'",
        '/foo/bar/StencilComponent.tsx', {})
    ).toEqual({
        code: "import { Component, Prop, h } from 'something else'"
    })
})

test('auto imports "h" from Stencil', async () => {
    const opt = await optimizeForStencil('/foo/bar')
    const codeWithoutFragment = `
    import { some as thing } from '@stencil/core';
    import { h, foobar } from '@stencil/core';
    import { render as renderMe } from '@wdio/browser-runner/stencil';

    console.log("Hello");
    `

    const transformedCode = (opt.plugins?.[0] as any).transform(
        codeWithoutFragment,
        '/foo/bar/StencilComponent.tsx', {}
    )
    expect(transformedCode).toEqual({
        code: expect.stringContaining('import { Fragment } from \'@stencil/core\';')
    })
    expect(transformedCode).toEqual({
        code: expect.not.stringContaining('import { h } from \'@stencil/core\';')
    })
})

test('auto imports "h" and "Fragment" from Stencil', async () => {
    const opt = await optimizeForStencil('/foo/bar')
    const codeWithoutAny = `
    import { some as thing } from '@stencil/core';
    import { foobar } from '@stencil/core';
    import { render as renderMe } from '@wdio/browser-runner/stencil';

    console.log("Hello");
    `

    const transformedCode = (opt.plugins?.[0] as any).transform(
        codeWithoutAny,
        '/foo/bar/StencilComponent.tsx', {}
    )
    expect(transformedCode).toEqual({
        code: expect.stringContaining('import { Fragment } from \'@stencil/core\';')
    })
    expect(transformedCode).toEqual({
        code: expect.stringContaining('import { h } from \'@stencil/core\';')
    })
})
