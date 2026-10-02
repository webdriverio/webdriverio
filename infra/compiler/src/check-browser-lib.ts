import fss from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'
import { spawnSync } from 'node:child_process'
import { build, type BuildOptions, type Metafile } from 'esbuild'

import { createBuildConfigs } from './configs.js'
import { BROWSER_TS_LIB, EXECUTE_SCRIPT_TS_LIB } from './targets.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..', '..', '..')
const tscPath = path.resolve(path.dirname(url.fileURLToPath(import.meta.resolve('typescript'))), '..', 'bin', 'tsc')
const scriptsDir = path.resolve(rootDir, 'packages', 'webdriverio', 'src', 'scripts')

/**
 * Type-check the browser bundles at `BROWSER_TS_LIB` and the `execute` scripts
 * at `EXECUTE_SCRIPT_TS_LIB`. esbuild only rewrites syntax for the browser
 * target, so this is what stops a newer API from shipping to those browsers.
 *
 * Errors are kept only when they point at a file the bundle or the script
 * list actually contains. A relative import can pull another file into the
 * TypeScript program; that file is outside the check.
 */
const configs = (await createBuildConfigs({})).filter((config) => config.platform === 'browser')
if (configs.length === 0) {
    throw new Error('No browser builds found')
}

/**
 * TypeScript's `dom` lib is current, so these calls type-check at ES2021 and
 * still throw in Chrome 90, Edge 90, Firefox 90 and Safari 14.1. esbuild does
 * not polyfill them. The emitted bundle is what the browser runs.
 */
const UNSUPPORTED_BROWSER_APIS: { name: string, pattern: RegExp }[] = [
    { name: 'AbortSignal.any', pattern: /AbortSignal\.any\b/ },
    { name: 'AbortSignal.timeout', pattern: /AbortSignal\.timeout\b/ }
]

const bundleFiles = new Set<string>()
const unsupportedApiUses: string[] = []
for (const config of configs) {
    const result = await build({
        ...config,
        plugins: (config.plugins || []).filter((plugin) => plugin.name !== 'LogPlugin'),
        metafile: true,
        write: false,
        logLevel: 'silent',
        sourcemap: false
    } satisfies BuildOptions)
    if (!result.metafile) {
        throw new Error('esbuild did not return a metafile for a browser build')
    }
    for (const file of sourceFiles(result.metafile, config.absWorkingDir)) {
        bundleFiles.add(file)
    }
    const bundleName = path.relative(rootDir, config.outfile || config.outdir || 'browser bundle')
    for (const output of result.outputFiles ?? []) {
        for (const api of UNSUPPORTED_BROWSER_APIS) {
            if (api.pattern.test(output.text)) {
                unsupportedApiUses.push(`${bundleName} calls ${api.name}`)
            }
        }
    }
}

if (unsupportedApiUses.length > 0) {
    console.error('\nBrowser bundle calls APIs the declared browsers do not have:\n')
    console.error(unsupportedApiUses.join('\n'))
    process.exitCode = 1
} else {
    console.log('browser bundle APIs: ok')
}

const scriptFiles = (await fs.readdir(scriptsDir))
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts'))
    .map((file) => path.resolve(scriptsDir, file))

if (bundleFiles.size === 0) {
    throw new Error('The browser metafile did not contain any source files')
}
if (scriptFiles.length === 0) {
    throw new Error(`No execute scripts found in ${scriptsDir}`)
}

console.log(`Browser bundle: ${bundleFiles.size} files, lib ${BROWSER_TS_LIB.join(',')}`)
console.log(`Execute scripts: ${scriptFiles.length} files, lib ${EXECUTE_SCRIPT_TS_LIB.join(',')}`)

const bundleErrors = typecheckPackages(bundleFiles)
const scriptErrors = await typecheck(scriptFiles, [...EXECUTE_SCRIPT_TS_LIB], new Set(scriptFiles), 'execute scripts')

if (bundleErrors.length > 0 || scriptErrors.length > 0) {
    process.exitCode = 1
}

function typecheckPackages (owned: Set<string>): string[] {
    const byPackage = new Map<string, Set<string>>()
    for (const file of owned) {
        const dir = packageDirOf(file)
        if (!dir) {
            throw new Error(`Browser bundle file is outside packages/: ${file}`)
        }
        const files = byPackage.get(dir) ?? new Set<string>()
        files.add(file)
        byPackage.set(dir, files)
    }

    const relevant: string[] = []
    for (const [dir, files] of byPackage) {
        relevant.push(...typecheckProject(dir, files, path.basename(dir)))
    }
    if (relevant.length === 0) {
        console.log('browser bundle: ok')
    }
    return relevant
}

/**
 * Use the package tsconfig so paths, `@types` and included globals match the
 * normal build. Override `lib` so the browser sources are checked at ES2021.
 * Workspace packages must already be built: their types resolve from `build/`.
 */
function typecheckProject (dir: string, owned: Set<string>, label: string): string[] {
    const result = spawnSync(process.execPath, [
        tscPath,
        '--pretty', 'false',
        '--noEmit',
        '--lib', BROWSER_TS_LIB.join(','),
        '--project', path.join(dir, 'tsconfig.json')
    ], {
        cwd: dir,
        encoding: 'utf-8'
    })

    if (result.error) {
        throw result.error
    }

    const output = `${result.stdout || ''}${result.stderr || ''}`
    const errors = output.split('\n').filter((line) => /error TS\d+/.test(line))
    const parsed = errors.map((line) => {
        const match = /^(.*)\(\d+,\d+\): error TS\d+/.exec(line)
        return { line, file: match ? path.resolve(dir, match[1]) : undefined }
    })
    const relevant = parsed.filter((entry) => entry.file && owned.has(entry.file)).map((entry) => entry.line)
    const unattached = parsed.filter((entry) => !entry.file)

    if (unattached.length > 0) {
        console.error(`\n${label} type-check failed:\n`)
        console.error(unattached.map((entry) => entry.line).join('\n'))
        console.error(result.stderr || '')
        throw new Error(`tsc failed while checking ${label} (exit ${result.status})`)
    }

    if (relevant.length > 0) {
        console.error(`\n${label} is newer than ${BROWSER_TS_LIB.join(', ')}:\n`)
        console.error(relevant.join('\n'))
    }

    return relevant
}

function packageDirOf (file: string): string | undefined {
    const rel = path.relative(path.join(rootDir, 'packages'), file)
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
        return undefined
    }
    const name = rel.split(path.sep)[0]
    return name ? path.join(rootDir, 'packages', name) : undefined
}

function sourceFiles (metafile: Metafile, absWorkingDir?: string): string[] {
    const files: string[] = []
    for (const input of Object.keys(metafile.inputs)) {
        const resolved = resolveInput(input, absWorkingDir)
        if (!resolved || resolved.includes(`${path.sep}node_modules${path.sep}`)) {
            continue
        }
        if (!resolved.startsWith(rootDir + path.sep)) {
            continue
        }
        if (!/\.(cts|mts|ts|tsx)$/.test(resolved) || resolved.endsWith('.d.ts')) {
            continue
        }
        files.push(resolved)
    }
    return files
}

function resolveInput (input: string, absWorkingDir?: string): string | undefined {
    if (input.includes('\0')) {
        return undefined
    }
    const candidates = [
        path.resolve(input),
        absWorkingDir ? path.resolve(absWorkingDir, input) : undefined
    ].filter((candidate): candidate is string => Boolean(candidate))
    return candidates.find((candidate) => fss.existsSync(candidate))
}

async function typecheck (files: string[], lib: string[], owned: Set<string>, label: string): Promise<string[]> {
    const configPath = path.join(os.tmpdir(), `wdio-${label.replace(/\s+/g, '-')}-tsconfig.json`)
    const config = {
        compilerOptions: {
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            target: 'es2021',
            lib,
            strict: true,
            strictFunctionTypes: false,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            experimentalDecorators: true,
            useDefineForClassFields: true,
            noEmit: true,
            // These scripts run in the automated browser. An empty `types`
            // list keeps `@types/node` out, so `process` and `Buffer` are errors.
            types: []
        },
        files
    }
    await fs.writeFile(configPath, JSON.stringify(config))

    const result = spawnSync(process.execPath, [tscPath, '--pretty', 'false', '--project', configPath], {
        cwd: rootDir,
        encoding: 'utf-8'
    })
    await fs.rm(configPath, { force: true })

    if (result.error) {
        throw result.error
    }

    const output = `${result.stdout || ''}${result.stderr || ''}`
    const errors = output.split('\n').filter((line) => /error TS\d+/.test(line))
    const relevant = errors.filter((line) => owned.has(path.resolve(line.split('(')[0])))
    const ignored = errors.length - relevant.length

    if (relevant.length > 0) {
        console.error(`\n${label} is newer than ${lib.join(', ')}:\n`)
        console.error(relevant.join('\n'))
    } else if (result.status === 0) {
        console.log(`${label}: ok`)
    } else if (ignored > 0) {
        console.log(`${label}: ok (${ignored} errors in files outside this check)`)
    } else if (result.status !== 0) {
        console.error(output)
        throw new Error(`tsc failed while checking ${label} (exit ${result.status})`)
    }

    return relevant
}
