import cp from 'node:child_process'
import url from 'node:url'
import path from 'node:path'
import { rimraf } from 'rimraf'
import { copy } from 'esbuild-plugin-copy'
import type { Plugin, BuildOptions } from 'esbuild'
import type { PackageJson } from 'type-fest'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export function log(options: BuildOptions, pkg: PackageJson): Plugin {
    const srcFile = path.relative(options.absWorkingDir || process.cwd(), (options.entryPoints as string[])[0])
    const outFile = path.relative(options.absWorkingDir || process.cwd(), options.outfile as string)
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

export function clear(outfile: string): Plugin {
    return {
        name: 'ClearPlugin',
        async setup() {
            await rimraf(path.dirname(outfile), {
                maxRetries: 1
            })
        }
    }
}

export function generateDts(absWorkingDir: string): Plugin {
    return {
        name: 'TypeScriptDeclarationsPlugin',
        setup(build) {
            build.onEnd((result) => {
                if (result.errors.length > 0) {
                    return
                }

                try {
                    cp.execSync('tsc --emitDeclarationOnly', {
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
