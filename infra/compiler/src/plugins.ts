import cp, { type ExecException } from 'node:child_process'
import url from 'node:url'
import path from 'node:path'
import util from 'node:util'
import chalk from 'chalk'
import { rimraf } from 'rimraf'
import { copy } from 'esbuild-plugin-copy'
import type { Plugin, BuildOptions } from 'esbuild'
import type { PackageJson } from 'type-fest'

const MAX_RETRIES = 3
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const exec = util.promisify(cp.exec)
const tscPath = path.resolve(path.dirname(url.fileURLToPath(import.meta.resolve('typescript'))), '..', 'bin', 'tsc')

const l = {
    format: (format: string = 'unknown') => chalk.yellowBright(format),
    file: (file: string = 'unknown') => chalk.blueBright(file),
    name: (name: string = 'unknown') => chalk.hex('#EA5907')(`[${name}]`)
}

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
                console.log(`${l.name(pkg.name)} 🏗️ Building ${l.format(`${options.platform}:${options.format}`)} package: ${l.file(srcFile)} → ${l.file(outFile)}`)
            })
            build.onEnd((result) => {
                if (result.errors.length === 0) {
                    console.log(`${l.name(pkg.name)} ✅ Success building ${l.format(`${options.platform}:${options.format}`)} package: ${l.file(srcFile)} → ${l.file(outFile)}`)
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
    const outfile = config.outfile || config.outdir
    if (!outfile) {
        throw new Error('No outfile defined')
    }

    return {
        name: 'ClearPlugin',
        async setup() {
            await Promise.all([
                rimraf(path.dirname(outfile), rimrafOptions),
            ])
        }
    }
}

/**
 * Generates type definition files (d.ts) for a given package.
 *
 * @param {string} cwd - The current working directory.
 * @param {PackageJson} pkg - The package JSON object.
 * @param {number} [retry=MAX_RETRIES] - The number of retries.
 * @return {Promise<void>} A promise that resolves when the types are generated.
 */
function generateTypes(cwd: string, pkg: PackageJson, retry = MAX_RETRIES): Promise<void> {
    const child = exec(`node ${tscPath} --emitDeclarationOnly`, { cwd })
    return child.then(() => { }, (err) => {
        if (retry > 0) {
            console.log(`${l.name(pkg.name)} ↻ Retrying (${MAX_RETRIES - (retry - 1)}/${MAX_RETRIES}) building types for ${pkg.name}`)
            return generateTypes(cwd, pkg, retry - 1)
        }
        const error: ExecException = err instanceof Error ? err : new Error(`unknown error: ${err}`)
        throw new Error(`[${pkg.name}] Failed to generate d.ts files: ${error.message}\n${error.stdout}`)
    })
}

/**
 * generate type definition files (d.ts) for working dir
 * @param {string} absWorkingDir absolute path to the working directory
 * @returns an Esbuild plugin
 */
export function generateDts(absWorkingDir: string, pkg: PackageJson): Plugin {
    return {
        name: 'TypeScriptDeclarationsPlugin',
        setup(build) {
            build.onEnd(async (result) => {
                /**
                 * don't build types if we failed already somewhere else
                 */
                if (result.errors.length > 0) {
                    return
                }

                await generateTypes(absWorkingDir, pkg)
            })
        }
    }
}

/**
 * Plugin to copy EJS templates from specified package to build directory
 * @param {string} pkgName Name of the package to copy
 * @returns {Plugin} an Esbuild plugin
 */
export function copyEJSTemplates(pkgName: string): Plugin {
    const cliPackage = path.resolve(__dirname, '..', '..', '..', 'packages', pkgName)
    return copy({
        resolveFrom: cliPackage,
        assets: [{
            from: [path.resolve(cliPackage, 'src', 'templates', '**', '*.ejs')],
            to: path.resolve(cliPackage, 'build', 'templates')
        }, {
            from: [path.resolve(cliPackage, 'src', 'templates', '**', '*.feature')],
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
            build.onResolve({ filter: /\/scripts\// }, (args) => ({
                path: `./scripts/${path.basename(args.path)}`,
                external: true,
                pluginName: name
            }))
        }
    }
}

export function runBuildScript(absWorkingDir: string, pkg: PackageJson): Plugin {
    return {
        name: `build-${pkg.name || 'unknown'}`,
        setup(build) {
            build.onEnd(async () => {
                const child = cp.spawn('pnpm',
                    ['run', 'build'],
                    { cwd: absWorkingDir, stdio: 'inherit' }
                )
                child.on('exit', (code) => {
                    if (code !== 0) {
                        console.log(`${l.name(pkg.name)} ❌ Failed run build script for ${pkg.name}`)
                        return
                    }
                    console.log(`${l.name(pkg.name)} ✅ Successfully ran build script for ${pkg.name}: "${pkg.scripts?.build}"`)
                })
            })
        }
    }
}
