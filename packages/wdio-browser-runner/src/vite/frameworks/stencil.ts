import path from 'node:path'
import url from 'node:url'

import { findStaticImports, parseStaticImport, type ParsedStaticImport } from 'mlly'
import type { InlineConfig, Plugin } from 'vite'

import { hasFileByExtensions } from '../utils.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const STENCIL_IMPORT = '@stencil/core'

interface CompilerOptions {
    baseUrl?: string
    paths?: Record<string, string[]>
    target?: string
}

export async function isUsingStencilJS(rootDir: string, options: WebdriverIO.BrowserRunnerOptions) {
    return Boolean(options.preset === 'stencil' || await hasFileByExtensions(path.join(rootDir, 'stencil.config')))
}

export async function optimizeForStencil(rootDir: string) {
    const stencilConfig = await importStencilConfig(rootDir)
    const stencilPlugins = stencilConfig.config.plugins
    const stencilOptimizations: InlineConfig = {
        plugins: [await stencilVitePlugin(rootDir)],
        optimizeDeps: { include: [] as string[] }
    }

    if (stencilPlugins) {
        const esbuildPlugin = stencilPlugins.find((plugin: { name: string }) => plugin.name === 'esbuild-plugin')
        if (esbuildPlugin) {
            stencilOptimizations.optimizeDeps?.include?.push(...esbuildPlugin.options.include)
        }
    }

    /**
     * testing helper from the stencil core package is unfortunately exported as CJS
     * module, in order to be able to use it in the browser we have to optimize it
     * it to compile it to ESM
     */
    stencilOptimizations.optimizeDeps?.include?.push(
        '@wdio/browser-runner/stencil > @stencil/core/internal/testing/index.js'
    )
    return stencilOptimizations
}

async function stencilVitePlugin(rootDir: string): Promise<Plugin> {
    const { transpileSync, ts } = await import('@stencil/core/compiler/stencil.js')
    const stencilHelperPath = path.resolve(__dirname, 'browser', 'integrations', 'stencil.js')
    return {
        name: 'wdio-stencil',
        enforce: 'pre',
        resolveId (source) {
            if (source === '@wdio/browser-runner/stencil') {
                return stencilHelperPath
            }
        },
        transform: function (code, id) {
            const staticImports = findStaticImports(code)
            const stencilImports = staticImports
                .filter((imp) => imp.specifier === STENCIL_IMPORT)
                .map((imp) => parseStaticImport(imp))
            const isStencilComponent = stencilImports.some((imp) => 'Component' in (imp.namedImports || {}))

            /**
             * if file doesn't define a Stencil component
             */
            if (!isStencilComponent) {
                /**
                 * if a test imports the `@wdio/browser-runner/stencil` package we want to automatically
                 * import `h` and `Fragment` from the `@stencil/core` package
                 */
                const stencilHelperImport = staticImports.find((imp) => imp.specifier === '@wdio/browser-runner/stencil')
                if (stencilHelperImport) {
                    const imports = parseStaticImport(stencilHelperImport)
                    if ('render' in (imports.namedImports || {})) {
                        code = injectStencilImports(code, stencilImports)
                    }
                }
                return { code }
            }

            const tsCompilerOptions = getCompilerOptions(ts, rootDir)
            const opts = {
                componentExport: 'module',
                componentMetadata: 'compilerstatic',
                coreImportPath: '@stencil/core/internal/client',
                currentDirectory: rootDir,
                file: path.basename(id),
                module: 'esm',
                sourceMap: 'inline',
                style: 'static',
                proxy: 'defineproperty',
                styleImportData: 'queryparams',
                transformAliasedImportPaths: process.env.__STENCIL_TRANSPILE_PATHS__ === 'true',
                target: tsCompilerOptions?.target || 'es2018',
                paths: tsCompilerOptions?.paths,
                baseUrl: tsCompilerOptions?.baseUrl,
            }

            const transpiledCode = transpileSync(code, opts)

            /**
             * StencilJS applies only a getter to the component without having a setter defined.
             * This causes issue in the browser as there is a check that the setter is defined
             * if the getter is defined. We can work around this by defining a setter.
             */
            let transformedCode = transpiledCode.code.replace(
                'static get style()',
                'static set style(_) {}\n    static get style()'
            )

            /**
             * StencilJS does not import the `h` or `Fragment` function by default. We need to add it so the user
             * doesn't need to.
             */
            transformedCode = injectStencilImports(transformedCode, stencilImports)

            /**
             * Ensure that CSS imports by Stencil have an `&inline` query parameter.
             *
             * Since Stencil 4.39, the compiler emits `static get style() { return
             * ${styleVarName}(); }`, i.e. it calls the imported style as a function,
             * whereas older versions emit `return ${styleVarName};` and use the
             * import directly (the runtime only requires the *result* of `Cstr.style`
             * to be a string, see `@stencil/core/internal/client`'s
             * `typeof Cstr.style === 'string'` check). We bypass Stencil's own CSS
             * bundling and resolve the import via Vite's native `?inline` CSS import
             * instead, which yields the raw CSS text as the default export rather
             * than a function. We inspect the generated code to see which calling
             * convention was actually emitted for this style var and only wrap the
             * import in a function when the compiler calls it as one, so this keeps
             * working across the whole declared `@stencil/core` `^4.20.0` range.
             */
            findStaticImports(transformedCode)
                .filter((imp) => imp.specifier.includes('&encapsulation=shadow'))
                .forEach((imp) => {
                    const cssPath = path.resolve(path.dirname(id), imp.specifier)
                    const styleVarName = imp.imports.trim()
                    const isStyleCalledAsFunction = new RegExp(`return\\s+${styleVarName}\\s*\\(\\)`).test(transformedCode)
                    transformedCode = transformedCode.replace(
                        imp.code,
                        isStyleCalledAsFunction
                            ? `import __${styleVarName}Css from '/@fs/${cssPath}&inline';\n` +
                              `const ${styleVarName} = () => __${styleVarName}Css;\n`
                            : `import ${styleVarName} from '/@fs/${cssPath}&inline';\n`
                    )
                })

            return {
                ...transpiledCode,
                code: transformedCode,
                inputFilePath: id
            }
        }
    }
}

/**
 * StencilJS does not import the `h` or `Fragment` function by default. We need to add it so the user
 * doesn't need to.
 */
function injectStencilImports(code: string, imports: ParsedStaticImport[]) {
    const hasRenderFunctionImport = imports.some((imp) => 'h' in (imp.namedImports || {}))
    if (!hasRenderFunctionImport) {
        code = `import { h } from '@stencil/core/internal/client';\n${code}`
    }
    const hasFragmentImport = imports.some((imp) => 'Fragment' in (imp.namedImports || {}))
    if (!hasFragmentImport) {
        code = `import { Fragment } from '@stencil/core/internal/client';\n${code}`
    }

    return code
}

let _tsCompilerOptions: CompilerOptions | null = null

/**
 * Read the TypeScript compiler configuration file from disk
 * @param rootDir the location to search for the config file
 * @returns the configuration, or `null` if the file cannot be found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCompilerOptions(ts: any, rootDir: string): CompilerOptions | null {
    if (_tsCompilerOptions) {
        return _tsCompilerOptions
    }

    if (typeof rootDir !== 'string') {
        return null
    }

    const tsconfigFilePath = ts.findConfigFile(rootDir, ts.sys.fileExists)
    if (!tsconfigFilePath) {
        return null
    }

    const tsconfigResults = ts.readConfigFile(tsconfigFilePath, ts.sys.readFile)

    if (tsconfigResults.error) {
        throw new Error(tsconfigResults.error)
    }

    const parseResult = ts.parseJsonConfigFileContent(
        tsconfigResults.config,
        ts.sys,
        rootDir,
        undefined,
        tsconfigFilePath,
    )

    _tsCompilerOptions = parseResult.options
    return _tsCompilerOptions
}

/**
 * helper method to import a Stencil config file
 */
export async function importStencilConfig(rootDir: string) {
    const configPath = path.join(rootDir, 'stencil.config.ts')
    const config = await import(configPath).catch(() => ({ config: {} }))

    /**
     * if we import the config within a CJS environment we need to
     * access the default property even though there is a named export
     */
    if ('default' in config) {
        return config.default
    }

    return config
}
