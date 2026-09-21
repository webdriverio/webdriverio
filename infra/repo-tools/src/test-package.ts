/**
 * Run Vitest for one workspace package.
 * Usage: pnpm run test:package webdriverio
 *        pnpm run test:package @wdio/cli
 *        pnpm run test:package wdio-cli
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { PackageArgs, PackageManifest } from './types.js'
import { isMainModule, toPosix, workspaceRoot } from './workspace.js'

function hasPackageJson (dir: string): boolean {
    return fs.existsSync(path.join(dir, 'package.json'))
}

function readPackageName (dir: string): string | undefined {
    const pkgPath = path.join(dir, 'package.json')
    if (!fs.existsSync(pkgPath)) {
        return undefined
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as PackageManifest
    return pkg.name
}

function workspacePackageDirs (): string[] {
    const roots = ['packages', 'infra'].map((dir) => path.join(workspaceRoot, dir))
    const dirs: string[] = []
    for (const root of roots) {
        if (!fs.existsSync(root)) {
            continue
        }
        for (const dirent of fs.readdirSync(root, { withFileTypes: true })) {
            if (!dirent.isDirectory()) {
                continue
            }
            const abs = path.join(root, dirent.name)
            if (hasPackageJson(abs)) {
                dirs.push(abs)
            }
        }
    }
    return dirs
}

export function resolvePackageDir (input: string): string | undefined {
    const trimmed = input.replace(/\/+$/, '')
    const candidates = [
        path.resolve(workspaceRoot, trimmed),
        path.join(workspaceRoot, 'packages', trimmed),
        path.join(workspaceRoot, 'packages', trimmed.replace(/^@wdio\//, 'wdio-')),
        path.join(workspaceRoot, 'infra', trimmed),
        path.join(workspaceRoot, 'infra', trimmed.replace(/^@wdio\//, ''))
    ]

    for (const candidate of candidates) {
        if (hasPackageJson(candidate)) {
            return candidate
        }
    }

    for (const dir of workspacePackageDirs()) {
        const name = readPackageName(dir)
        if (name === input || path.basename(dir) === input) {
            return dir
        }
    }

    return undefined
}

const SKIP_TEST_DIRS: ReadonlySet<string> = new Set([
    'node_modules',
    'build',
    'cjs',
    'coverage',
    '.git'
])

function containsTestFile (dir: string): boolean {
    if (!fs.existsSync(dir)) {
        return false
    }
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, dirent.name)
        if (dirent.isDirectory()) {
            if (SKIP_TEST_DIRS.has(dirent.name)) {
                continue
            }
            if (containsTestFile(abs)) {
                return true
            }
            continue
        }
        if (dirent.name.endsWith('.test.ts')) {
            return true
        }
    }
    return false
}

export function findTestRoot (pkgDir: string): string | undefined {
    const testsDir = path.join(pkgDir, 'tests')
    if (containsTestFile(testsDir)) {
        return testsDir
    }
    if (containsTestFile(pkgDir)) {
        return pkgDir
    }
    return undefined
}

export function hasPackageTests (pkgDir: string): boolean {
    return Boolean(findTestRoot(pkgDir))
}

export function resolveTestTarget (pkgDir: string): string | undefined {
    return findTestRoot(pkgDir)
}

export function parsePackageArgs (argv: readonly string[]): PackageArgs {
    const name = argv.find((arg) => !arg.startsWith('-'))
    return {
        name,
        print: argv.includes('--print'),
        vitestArgs: argv.filter((arg) => arg !== name && arg !== '--print')
    }
}

function main (): void {
    const { name, print, vitestArgs } = parsePackageArgs(process.argv.slice(2))
    if (!name) {
        console.error('Usage: pnpm run test:package <package-name-or-dir> [--print] [-- vitest-flags]')
        console.error('Examples: webdriverio | @wdio/cli | wdio-cli | packages/webdriver | repo-tools')
        process.exit(1)
    }

    const pkgDir = resolvePackageDir(name)
    if (!pkgDir) {
        console.error(`Could not resolve package "${name}" under packages/ or infra/.`)
        process.exit(1)
    }

    const target = resolveTestTarget(pkgDir)
    if (!target) {
        const relative = toPosix(path.relative(workspaceRoot, pkgDir))
        if (print) {
            console.error(`No Vitest files in ${relative}`)
            process.exit(1)
        }
        console.log(`No Vitest files in ${relative}; skipping.`)
        process.exit(0)
    }

    if (print) {
        console.log(toPosix(path.relative(workspaceRoot, target)))
        process.exit(0)
    }

    const result = spawnSync(
        'pnpm',
        ['exec', 'vitest', '--config', path.join(workspaceRoot, 'vitest.config.ts'), '--run', target, ...vitestArgs],
        { stdio: 'inherit', cwd: workspaceRoot, shell: false }
    )

    if (result.error) {
        console.error(result.error)
        process.exit(1)
    }

    process.exit(result.status ?? 1)
}

if (isMainModule(import.meta.url)) {
    main()
}
