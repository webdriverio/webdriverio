import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { execSync } from 'node:child_process'

import { resolve as resolveModule } from 'import-meta-resolve'

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

export interface ResolveOptions {
    /**
     * project directory whose `node_modules` is searched first (default `process.cwd()`)
     */
    cwd?: string
    /**
     * location of the package that needs the dependency, searched second
     * (usually `import.meta.url`)
     */
    from?: string | URL
    /**
     * also search the global npm prefix
     */
    global?: boolean
}

export interface ImportOptions extends ResolveOptions {
    /**
     * what the dependency is needed for, e.g. "open an Android session"
     */
    feature: string
    /**
     * install commands shown to the user (default: `installCommand(name)`)
     */
    install?: string[]
    /**
     * error message (default: `Cannot <feature>: <name> is not installed.`)
     */
    message?: string
}

/**
 * Thrown when an optional dependency cannot be resolved.
 */
export class MissingDependencyError extends Error {
    readonly code = 'MISSING_DEPENDENCY'
    readonly package: string
    readonly feature: string
    readonly install: string[]

    constructor (name: string, opts: { feature: string, install?: string[], message?: string, cwd?: string }) {
        super(opts.message || `Cannot ${opts.feature}: ${name} is not installed.`)
        this.name = 'MissingDependencyError'
        this.package = name
        this.feature = opts.feature
        this.install = opts.install || [installCommand(name, { cwd: opts.cwd })]
    }
}

async function tryResolve (name: string, parent: string) {
    try {
        return url.fileURLToPath(await resolveModule(name, parent))
    } catch {
        return null
    }
}

function toParentUrl (location: string | URL) {
    if (location instanceof URL) {
        return location.href
    }
    return location.startsWith('file:') ? location : url.pathToFileURL(location).href
}

function globalNodeModules () {
    try {
        const prefix = execSync('npm config get prefix', { encoding: 'utf-8' }).trim()
        return process.platform === 'win32'
            ? path.resolve(prefix, 'node_modules')
            : path.resolve(prefix, 'lib', 'node_modules')
    } catch {
        return undefined
    }
}

/**
 * Resolve a package that is not a hard dependency. Looks in the project's
 * `node_modules` first, then next to the package that needs it, then
 * (with `global: true`) in the global npm prefix.
 *
 * @returns absolute path of the package entry, or `null` if not installed
 */
export async function resolveOptionalDependency (name: string, opts: ResolveOptions = {}): Promise<string | null> {
    const cwd = opts.cwd || process.cwd()
    const parents = [toParentUrl(path.join(cwd, 'node_modules'))]
    if (opts.from) {
        parents.push(toParentUrl(opts.from))
    }
    for (const parent of parents) {
        const resolved = await tryResolve(name, parent)
        if (resolved) {
            return resolved
        }
    }
    if (opts.global) {
        const dir = globalNodeModules()
        if (dir) {
            return tryResolve(name, toParentUrl(dir))
        }
    }
    return null
}

/**
 * Import an optional dependency or throw a `MissingDependencyError` that
 * tells the user how to install it.
 */
export async function importOptionalDependency<T = unknown> (name: string, opts: ImportOptions): Promise<T> {
    const resolved = await resolveOptionalDependency(name, opts)
    if (!resolved) {
        throw new MissingDependencyError(name, opts)
    }
    return import(url.pathToFileURL(resolved).href) as Promise<T>
}

const LOCKFILES: [string, PackageManager][] = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lock', 'bun'],
    ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm']
]

/**
 * Detect the package manager of a project: `packageManager` field of the
 * nearest `package.json`, then lockfiles, then the user agent of the
 * running package manager, else npm.
 */
export function detectPackageManager (cwd = process.cwd(), env = process.env): PackageManager {
    let dir = path.resolve(cwd)
    while (true) {
        const pkgFile = path.join(dir, 'package.json')
        if (fs.existsSync(pkgFile)) {
            try {
                const { packageManager } = JSON.parse(fs.readFileSync(pkgFile, 'utf-8')) as { packageManager?: string }
                const name = packageManager?.split('@')[0]
                if (name === 'npm' || name === 'pnpm' || name === 'yarn' || name === 'bun') {
                    return name
                }
            } catch {
                // ignore invalid package.json
            }
        }
        for (const [file, pm] of LOCKFILES) {
            if (fs.existsSync(path.join(dir, file))) {
                return pm
            }
        }
        const parent = path.dirname(dir)
        if (parent === dir) {
            break
        }
        dir = parent
    }
    const agent = env.npm_config_user_agent || ''
    for (const pm of ['pnpm', 'yarn', 'bun'] as const) {
        if (agent.startsWith(`${pm}/`)) {
            return pm
        }
    }
    return 'npm'
}

/**
 * Command that installs a package with the project's package manager.
 */
export function installCommand (pkg: string, opts: { dev?: boolean, cwd?: string, packageManager?: PackageManager } = {}) {
    const dev = opts.dev !== false
    const pm = opts.packageManager || detectPackageManager(opts.cwd)
    switch (pm) {
    case 'pnpm':
        return `pnpm add${dev ? ' -D' : ''} ${pkg}`
    case 'yarn':
        return `yarn add${dev ? ' -D' : ''} ${pkg}`
    case 'bun':
        return `bun add${dev ? ' -d' : ''} ${pkg}`
    default:
        return `npm i${dev ? ' -D' : ''} ${pkg}`
    }
}
