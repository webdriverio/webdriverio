#!/usr/bin/env node
/**
 * Run Vitest for one workspace package.
 * Usage: pnpm run test:package webdriverio
 *        pnpm run test:package @wdio/cli
 *        pnpm run test:package wdio-cli
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const extraArgs = process.argv.slice(2)
const name = extraArgs.find((arg) => !arg.startsWith('-'))

if (!name) {
    console.error('Usage: pnpm run test:package <package-name-or-dir> [--print] [-- vitest-flags]')
    console.error('Examples: webdriverio | @wdio/cli | wdio-cli | packages/webdriver')
    process.exit(1)
}

const packagesRoot = path.join(root, 'packages')

function hasPackageJson (dir) {
    return fs.existsSync(path.join(dir, 'package.json'))
}

function resolvePackageDir (input) {
    const trimmed = input.replace(/\/+$/, '')
    const candidates = [
        path.resolve(root, trimmed),
        path.join(packagesRoot, trimmed),
        path.join(packagesRoot, trimmed.replace(/^@wdio\//, 'wdio-'))
    ]

    for (const candidate of candidates) {
        if (hasPackageJson(candidate)) {
            return candidate
        }
    }

    if (!fs.existsSync(packagesRoot)) {
        return undefined
    }

    for (const dirent of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
        if (!dirent.isDirectory()) {
            continue
        }
        const pkgPath = path.join(packagesRoot, dirent.name, 'package.json')
        if (!fs.existsSync(pkgPath)) {
            continue
        }
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        if (pkg.name === input || dirent.name === input) {
            return path.join(packagesRoot, dirent.name)
        }
    }

    return undefined
}

const pkgDir = resolvePackageDir(name)
if (!pkgDir) {
    console.error(`Could not resolve package "${name}" under packages/.`)
    process.exit(1)
}

const testsDir = path.join(pkgDir, 'tests')
const target = fs.existsSync(testsDir) ? testsDir : pkgDir
const vitestArgs = extraArgs.filter((arg) => arg !== name && arg !== '--print')

if (extraArgs.includes('--print')) {
    console.log(path.relative(root, target).split(path.sep).join('/'))
    process.exit(0)
}

const result = spawnSync(
    'pnpm',
    ['exec', 'vitest', '--config', path.join(root, 'vitest.config.ts'), '--run', target, ...vitestArgs],
    { stdio: 'inherit', cwd: root, shell: false }
)

if (result.error) {
    console.error(result.error)
    process.exit(1)
}

process.exit(result.status ?? 1)
