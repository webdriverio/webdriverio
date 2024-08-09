import cp from 'node:child_process'
import url from 'node:url'
import path from 'node:path'
import { rimraf } from 'rimraf'
import { copy } from 'esbuild-plugin-copy'
import type { Plugin, BuildOptions } from 'esbuild'
import type { PackageJson } from 'type-fest'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * little logger plugin for Esbuild
 * @param {BuildOptions} options  Esbuild options
 * @param {PackageJson} pkg package.json of given project as object
 * @returns
 */
export function log(options: BuildOptions, pkg: PackageJson): Plugin {
    const srcFile = path.relative(options.absWorkingDir || process.cwd(), (options.entryPoints as string[])[0])
    const outFile = path.relative(options.absWorkingDir || process.cwd(), options.outfile || options.outdir as string)
    return {
        name: 'LogPlugin',
        setup(build) {
            build.onStart(() => {
                console.log(`🏗️ Building "${pkg.name}" for ${options.format}: ${srcFile} → ${outFile}`)
            })
            build.onEnd((result) => {
                if (result.errors.length === 0) {
                    console.log(`✅ Success building "${pkg.name}" for ${options.format}: ${srcFile} → ${outFile}`)
                }
            })
        }
    }
}

/**
 * clear previously generated build files
 * @param {string} outfile directory that Esbuild usually compiles to
 * @returns an Esbuild plugin
 */
export function clear(config: BuildOptions): Plugin {
    const rimrafOptions = { maxRetries: 1 }
    const outfile = config.outfile
    if (!outfile) {
        throw new Error('No outfile defined')
    }

    return {
        name: 'ClearPlugin',
        async setup() {
            await Promise.all([
                rimraf(path.dirname(outfile), rimrafOptions),
                rimraf(path.join(config.absWorkingDir || process.cwd(), 'tsconfig.tsbuildinfo'), rimrafOptions)
            ])
        }
    }
}

/**
 * generate type definition files (d.ts) for working dir
 * @param {string} absWorkingDir absolute path to the working directory
 * @returns an Esbuild plugin
 */
export function generateDts(absWorkingDir: string): Plugin {
    return {
        name: 'TypeScriptDeclarationsPlugin',
        setup(build) {
            build.onEnd((result) => {
                if (result.errors.length > 0) {
                    return
                }

                try {
                    cp.execSync('tsc --emitDeclarationOnly --incremental', {
                        cwd: absWorkingDir,
                        stdio: 'inherit'
                    })
                } catch {
                    console.log('Failed to generate TypeScript declarations')
                }
            })
        }
    }
}

/**
 * Make the CJS build of the `webdriver` package always export the `ws` module
 * as we don't support the browser socket implementation in the CJS build
 * @returns {Plugin} an Esbuild plugin
 */
export function exportNodeSocket(): Plugin {
    let pluginWasUsed = false

    return {
        name: 'ExportBrowserSocket',
        setup(build) {
            build.onLoad({ filter: /src\/bidi\/socket\.ts$/ }, () => {
                pluginWasUsed = true
                return {
                    contents: 'import ws from \'ws\'\nexport default ws'
                }
            })

            build.onEnd(() => {
                if (!pluginWasUsed) {
                    throw new Error('Plugin was not used')
                }
            })
        }
    }
}

/**
 * Plugin to copy EJS templates from the `@wdio/cli` package to build directory
 * @returns {Plugin} an Esbuild plugin
 */
export function copyEJSTemplates () {
    const cliPackage = path.resolve(__dirname, '..', '..', 'packages', 'wdio-cli')
    return copy({
        resolveFrom: cliPackage,
        assets: [{
            from: [path.resolve(cliPackage, 'src', 'templates', '**', '*.ejs')],
            to: path.resolve(cliPackage, 'build', 'templates')
        }]
    })
}

/**
 * Plugin to mark all WebdriverIO scripts in `packages/webdriverio/src/scripts` as external
 */
export function externalScripts(): Plugin {
    const name = 'ExternalScripts'
    return {
        name,
        setup(build) {
            build.onResolve({ filter: /\/scripts\// }, (args) => {
                return {
                    path: args.path.replace('../../', './'),
                    external: true,
                    pluginName: name
                }
            })
        }
    }
}
