import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { parseArgs } from 'node:util'
import { build, context, type BuildOptions, type Plugin } from 'esbuild'
import type { PackageJson } from 'type-fest'

import { getExternal } from './utils.js'
import { log, clear, generateDts, copyEJSTemplates, externalScripts } from './plugins.js'
import { generateTypes } from './type-generation/index.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..', '..', '..')
const args = process.argv.slice(2)
const options = {
    project: {
        type: 'string',
        short: 'p',
        multiple: true,
    },
    watch: {
        type: 'boolean',
    },
    clear: {
        type: 'boolean'
    }
} as const

const { values } = parseArgs({ args, options })

/**
 * parse through all packages and filter based on command parameters
 */
const projects = (await fs.readdir(
    path.resolve(rootDir, 'packages')
)).filter((dir) => dir !== 'node_modules')

const packages = (
    await Promise.all(
        projects.map(async (project) => {
            const pkg = await import(path.resolve(rootDir, 'packages', project, 'package.json'), { assert: { type: 'json' } })
            return [project, pkg.default]
        })
    ) as [string, PackageJson][]
).filter(([packageDir, pkg]) => (
    !values.project ||
    (pkg.name && values.project.includes(pkg.name)) ||
    values.project.includes(packageDir)
))

/**
 * plugins for the ESM build
 */
const esmPlugins: Record<string, Plugin[]> = {
    '@wdio/protocols': [generateTypes()],
    '@wdio/cli': [copyEJSTemplates()],
    'webdriverio': [externalScripts()]
}
/**
 * plugins for the cjs build
 */
const cjsPlugins: Record<string, Plugin[]> = {}
/**
 * plugins for the browser build
 */
const browserPlugins: Record<string, Plugin[]> = {}

/**
 * compose Esbuild configs
 */
const configs = packages.map(([packageDir, pkg]) => {
    const packageBuilds: BuildOptions[] = []
    const exports = (pkg.exports || {}) as PackageJson.ExportConditions

    if (!pkg.name) {
        throw new Error(`Package in ${packageDir} does not have a "name" field, which is required to build the package`)
    }

    /**
     * in cases where we don't have an exports field but a main field
     * we assume that the main field is the main entry point of the package
     */
    if (!pkg.exports && pkg.main) {
        exports['.'] = {
            require: pkg.main
        }
    }

    const exportedModules = Object.entries(exports).filter?.(([, exp]) => typeof exp === 'object' && !Array.isArray(exp)) as [string, PackageJson.ExportConditions][]
    for (const [target, exp] of exportedModules) {
        const absWorkingDir = path.resolve(rootDir, 'packages', packageDir)
        const source = (exp.source as string | undefined) || './src/index.ts'
        const baseConfig: BuildOptions = {
            sourceRoot: absWorkingDir,
            tsconfig: path.resolve(absWorkingDir, 'tsconfig.json'),
            sourcemap: process.env.NODE_ENV !== 'production',
            external: getExternal(pkg),
            target: 'node18',
            bundle: true,
            absWorkingDir
        }

        if (typeof exp.import === 'string') {
            const esmSource = (exp.importSource as string | undefined) || source
            const esmBuild: BuildOptions = {
                ...baseConfig,
                entryPoints: [path.resolve(absWorkingDir, esmSource)],
                platform: 'node',
                format: 'esm',
                plugins: []
            }

            if (exp.import.endsWith('*')) {
                esmBuild.outdir = path.resolve(absWorkingDir, path.dirname(exp.import))
            } else {
                esmBuild.outfile = path.resolve(absWorkingDir, exp.import)
            }

            esmBuild.plugins?.push(
                log(esmBuild, pkg),
                ...(esmPlugins[pkg.name] || [])
            )

            /**
             * if types field is a string, generate TypeScript declarations
             */
            if (typeof exp.types === 'string' && target === '.') {
                esmBuild.plugins?.push(generateDts(absWorkingDir))
            }

            if (values.clear) {
                esmBuild.plugins?.push(clear(esmBuild))
            }

            packageBuilds.push(esmBuild)
        }

        if (typeof exp.require === 'string') {
            const requireSource = (exp.requireSource as string | undefined) || source
            const cjsBuild: BuildOptions = {
                ...baseConfig,
                external: getExternal(pkg),
                entryPoints: [path.resolve(absWorkingDir, requireSource)],
                platform: 'node',
                format: 'cjs',
                plugins: [],
                banner: {
                    'js': 'const __importMetaUrl = require(\'url\').pathToFileURL(__filename).href;'
                },
                define: {
                    'import.meta.url': '__importMetaUrl',
                    'import.meta.resolve': 'require.resolve'
                }
            }

            if (exp.require.endsWith('*')) {
                cjsBuild.outdir = path.resolve(absWorkingDir, path.dirname(exp.require))
            } else {
                cjsBuild.outfile = path.resolve(absWorkingDir, exp.require)
            }

            /**
             * if we define an `index.cts` as require source it is suppose to be a small wrapper
             * around the main source file that exports the main source file within the CJS context,
             * hence we need to mark this export as external
             */
            if (requireSource.endsWith('.cts')) {
                cjsBuild.external?.push('./index.js')
            }

            cjsBuild.plugins?.push(
                log(cjsBuild, pkg),
                ...(cjsPlugins[pkg.name] || [])
            )
            packageBuilds.push(cjsBuild)
        }

        if (typeof exp.browser === 'string') {
            const browserSource = (exp.browserSource as string | undefined) || source
            const browserBuild: BuildOptions = {
                ...baseConfig,
                entryPoints: [path.resolve(absWorkingDir, browserSource)],
                platform: 'browser',
                format: 'esm',
                target: ['es2021', 'chrome90', 'edge90', 'firefox90', 'safari12'],
                plugins: [],
                supported: {
                    'top-level-await': true //browsers can handle top-level-await features
                }
            }

            if (exp.browser.endsWith('*')) {
                browserBuild.outdir = path.resolve(absWorkingDir, path.dirname(exp.browser))
            } else {
                browserBuild.outfile = path.resolve(absWorkingDir, exp.browser)
            }

            browserBuild.plugins?.push(
                log(browserBuild, pkg),
                ...(browserPlugins[pkg.name] || [])
            )

            packageBuilds.push(browserBuild)
        }
    }
    return packageBuilds
}).flat()

if (configs.length === 0) {
    throw new Error(`No packages found to build using params: ${JSON.stringify(values)}`)
}

/**
 * build packages
 */
await Promise.all(configs.map(async (config) => {
    if (values.watch) {
        const ctx = await context(config)
        return ctx.watch()
    }

    const result = await build(config)
    if (result.errors.length > 0) {
        console.error(result.errors)
        throw new Error('Failed to build packages')
    }
}))
