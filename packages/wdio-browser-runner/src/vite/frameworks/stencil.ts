import path from 'node:path'
import url from 'node:url'

import { findStaticImports } from 'mlly'
import type { InlineConfig, Plugin } from 'vite'

import { hasFileByExtensions } from '../utils.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const STENCIL_IMPORT = '@stencil/core'

export async function isUsingStencilJS (rootDir: string, options: WebdriverIO.BrowserRunnerOptions) {
    return Boolean(options.preset === 'stencil' || await hasFileByExtensions(path.join(rootDir, 'stencil.config')))
}

export async function optimizeForStencil (rootDir: string) {
    const stencilConfig = await import(path.join(rootDir, 'stencil.config.ts')).catch(() => ({ config: {} }))
    const stencilPlugins = stencilConfig.config.plugins
    const stencilOptimizations: InlineConfig = {
        plugins: [await stencilVitePlugin(rootDir)]
    }

    if (stencilPlugins) {
        const esbuildPlugin = stencilPlugins.find((plugin: any) => plugin.name === 'esbuild-plugin')
        if (esbuildPlugin) {
            stencilOptimizations.optimizeDeps = {
                include: esbuildPlugin.options.include
            }
        }
    }

    stencilOptimizations.optimizeDeps?.include?.push('@stencil/core/internal/testing/index.js')
    return stencilOptimizations
}

async function stencilVitePlugin (rootDir: string): Promise<Plugin> {
    const { transpileSync } = await import('@stencil/core/compiler/stencil.js')
    const stencilHelperPath = path.resolve(__dirname, 'fixtures', 'stencil.js')
    return {
        name: 'wdio-stencil',
        enforce: 'pre',
        resolveId (source) {
            if (source === '@wdio/browser-runner/stencil') {
                return stencilHelperPath
            }
        },
        transform: function (code, id) {
            const usesStencil = findStaticImports(code).some((imp) => imp.specifier === STENCIL_IMPORT)
            if (!usesStencil) {
                return { code }
            }

            const opts = {
                componentExport: 'customelement',
                componentMetadata: 'compilerstatic',
                coreImportPath: '@stencil/core/internal/testing',
                currentDirectory: rootDir,
                module: 'esm',
                proxy: null,
                sourceMap: 'inline',
                style: 'static',
                styleImportData: 'queryparams',
                target: 'es2018',
                transformAliasedImportPaths: process.env.__STENCIL_TRANSPILE_PATHS__ === 'true',
            }

            const transpiledCode = transpileSync(code, opts)
            return {
                ...transpiledCode,
                code: transpiledCode.code
                    // HTMLElement gets imported from StencilJS but is undefined for some reasons
                    .replace(
                        'extends HTMLElement {',
                        // replace it with the original one
                        'extends window.HTMLElement {' +
                        // and add a style setter so it won't throw when setting
                        // style properties
                        '\n\tstatic set style (ignore) {}\n'
                    )
                    // make sure that components are exported properly
                    // StencilJS removes the export when componentExport is set to 'customelement'
                    .replace('\nconst', '\nexport const'),
                inputFilePath: id
            }
        }
    }
}
