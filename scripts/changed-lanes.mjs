#!/usr/bin/env node
/**
 * Classify a git diff into the same lanes as .github/workflows/test.yml.
 * Usage: pnpm run changed:lanes [--json] [--base <ref>] [--files a,b]
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import url from 'node:url'

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')

export const LANE_FILTERS = {
    ci: [
        '.github/workflows/**',
        '.nvmrc',
        'package.json',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        'lerna.json',
        'tsconfig.json',
        'vitest.config.ts',
        'eslint.config.mjs'
    ],
    docs: [
        'website/**',
        'scripts/docs-generation/**',
        'scripts/updateDocs.ts'
    ],
    component: [
        'packages/wdio-browser-runner/**',
        'e2e/browser-runner/**'
    ],
    xvfb: [
        'packages/wdio-xvfb/**',
        'packages/wdio-local-runner/**',
        'e2e/wdio/xvfb/**'
    ],
    code: [
        'packages/**',
        '!packages/wdio-xvfb/**',
        '!packages/wdio-browser-runner/**',
        'tests/**',
        'e2e/**',
        '!e2e/wdio/xvfb/**',
        '!e2e/browser-runner/**',
        'scripts/**',
        '!scripts/docs-generation/**',
        'infra/**',
        'test-headless-flag/**',
        '@types/**',
        '__mocks__/**'
    ]
}

const TYPINGS_PACKAGES = new Set([
    'webdriver',
    'webdriverio',
    'wdio-protocols',
    'wdio-types',
    'wdio-globals',
    'wdio-mocha-framework',
    'wdio-jasmine-framework',
    'wdio-cucumber-framework'
])

const SMOKE_PACKAGES = new Set([
    'wdio-cli',
    'wdio-local-runner',
    'wdio-runner',
    'wdio-config',
    'wdio-mocha-framework',
    'wdio-jasmine-framework',
    'wdio-cucumber-framework',
    'wdio-reporter',
    'wdio-webdriver-mock-service',
    'wdio-smoke-test-service',
    'wdio-smoke-test-cjs-service',
    'wdio-smoke-test-reporter'
])

export function matchGlob (file, pattern) {
    const normalized = file.replace(/\\/g, '/').replace(/^\.\//, '')
    const negated = pattern.startsWith('!')
    const raw = negated ? pattern.slice(1) : pattern
    let regexSource = raw
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '::GLOBSTAR::')
        .replace(/\*/g, '[^/]*')
        .replace(/::GLOBSTAR::/g, '.*')
    if (raw.endsWith('/**')) {
        const prefix = raw.slice(0, -3)
        regexSource = `(?:${prefix.replace(/[.+^${}()|[\]\\]/g, '\\$&')}(?:/.*)?)`
    }
    const matched = new RegExp(`^${regexSource}$`).test(normalized)
    return { matched, negated }
}

export function matchesFilters (file, patterns) {
    let hit = false
    for (const pattern of patterns) {
        const { matched, negated } = matchGlob(file, pattern)
        if (!matched) {
            continue
        }
        hit = !negated
    }
    return hit
}

export function packageFromFile (file) {
    const normalized = file.replace(/\\/g, '/')
    const match = normalized.match(/^packages\/([^/]+)\//)
    return match ? match[1] : undefined
}

export function classify (files) {
    const unique = [...new Set(files.map((file) => file.replace(/\\/g, '/').replace(/^\.\//, '')))]
        .filter(Boolean)
    const lanes = {}
    for (const [lane, patterns] of Object.entries(LANE_FILTERS)) {
        lanes[lane] = unique.some((file) => matchesFilters(file, patterns))
    }
    const packages = [...new Set(unique.map(packageFromFile).filter(Boolean))].sort()
    const typings = packages.filter((pkg) => TYPINGS_PACKAGES.has(pkg))
    const smoke = unique.some((file) => file.startsWith('tests/')) ||
        packages.some((pkg) => SMOKE_PACKAGES.has(pkg) || pkg.endsWith('-reporter') || pkg.endsWith('-service') || pkg.endsWith('-framework'))

    return {
        files: unique,
        lanes,
        runAll: lanes.ci,
        packages,
        typings,
        smoke
    }
}

export function parseArgs (argv = process.argv.slice(2)) {
    const opts = { json: false, base: undefined, files: undefined }
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (arg === '--json') {
            opts.json = true
        } else if (arg === '--base') {
            opts.base = argv[++i]
        } else if (arg.startsWith('--base=')) {
            opts.base = arg.slice('--base='.length)
        } else if (arg === '--files') {
            opts.files = argv[++i]
        } else if (arg.startsWith('--files=')) {
            opts.files = arg.slice('--files='.length)
        }
    }
    return opts
}

function git (args) {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
    if (result.status !== 0) {
        return ''
    }
    return result.stdout
}

function refExists (ref) {
    return spawnSync('git', ['rev-parse', '--verify', ref], { cwd: root, encoding: 'utf8' }).status === 0
}

export function resolveBase (explicit) {
    if (explicit) {
        return explicit
    }
    if (process.env.CHANGED_BASE) {
        return process.env.CHANGED_BASE
    }
    for (const candidate of ['origin/v10', 'v10', 'origin/main', 'main']) {
        if (refExists(candidate)) {
            const mergeBase = git(['merge-base', 'HEAD', candidate]).trim()
            return mergeBase || candidate
        }
    }
    return 'HEAD~1'
}

export function collectChangedFiles (base) {
    const listed = [
        git(['diff', '--name-only', '--diff-filter=ACMRD', `${base}...HEAD`]),
        git(['diff', '--name-only', '--diff-filter=ACMRD']),
        git(['diff', '--name-only', '--cached', '--diff-filter=ACMRD']),
        git(['ls-files', '--others', '--exclude-standard'])
    ].join('\n')
    return listed.split('\n').map((line) => line.trim()).filter(Boolean)
}

export function buildReport ({ base, files }) {
    return { base, ...classify(files) }
}

function main () {
    const opts = parseArgs()
    const files = opts.files
        ? opts.files.split(',').map((file) => file.trim()).filter(Boolean)
        : collectChangedFiles(resolveBase(opts.base))
    const report = buildReport({
        base: opts.base || resolveBase(opts.base),
        files
    })
    if (opts.json) {
        console.log(JSON.stringify(report, null, 2))
        return
    }
    console.log(`base: ${report.base}`)
    console.log(`files: ${report.files.length}`)
    console.log(`lanes: ${Object.entries(report.lanes).filter(([, on]) => on).map(([name]) => name).join(', ') || '(none)'}`)
    if (report.packages.length) {
        console.log(`packages: ${report.packages.join(', ')}`)
    }
    if (report.typings.length) {
        console.log(`typings: ${report.typings.join(', ')}`)
    }
    if (report.smoke) {
        console.log('smoke: recommended')
    }
    if (report.runAll) {
        console.log('run-all: root toolchain change (same as CI ci filter)')
    }
}

const invokedDirectly = process.argv[1] &&
    path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)

if (invokedDirectly) {
    main()
}
