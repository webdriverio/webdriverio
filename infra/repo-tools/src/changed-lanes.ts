/**
 * Classify a git diff into the same lanes as .github/workflows/test.yml.
 * Usage: pnpm run changed:lanes [--json] [--base <ref>] [--files a,b]
 */
import { spawnSync } from 'node:child_process'
import type {
    ChangeReport,
    GlobMatch,
    LaneArgs,
    LaneFilters,
    LaneFlags,
    LaneName
} from './types.js'
import { isMainModule, toPosix, workspaceRoot } from './workspace.js'

export const LANE_FILTERS: LaneFilters = {
    ci: [
        '.github/workflows/**',
        '.nvmrc',
        'package.json',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        'lerna.json',
        'tsconfig.json',
        'vitest.config.ts',
        '.oxlintrc.json'
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
    display_server: [
        'packages/wdio-display-server/**',
        'packages/wdio-local-runner/**',
        'e2e/wdio/display-server/**'
    ],
    code: [
        'packages/**',
        '!packages/wdio-display-server/**',
        '!packages/wdio-browser-runner/**',
        'tests/**',
        'e2e/**',
        '!e2e/wdio/display-server/**',
        '!e2e/browser-runner/**',
        'scripts/**',
        '!scripts/docs-generation/**',
        'infra/**',
        'test-headless-flag/**',
        '@types/**',
        '__mocks__/**'
    ]
}

const TYPINGS_PACKAGES: ReadonlySet<string> = new Set([
    'webdriver',
    'webdriverio',
    'wdio-protocols',
    'wdio-types',
    'wdio-globals',
    'wdio-mocha-framework',
    'wdio-jasmine-framework',
    'wdio-cucumber-framework'
])

const SMOKE_PACKAGES: ReadonlySet<string> = new Set([
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

const DEFAULT_BASES: readonly string[] = ['origin/v10', 'v10', 'origin/main', 'main']

export function matchGlob (file: string, pattern: string): GlobMatch {
    const normalized = toPosix(file)
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
    return {
        matched: new RegExp(`^${regexSource}$`).test(normalized),
        negated
    }
}

export function matchesFilters (file: string, patterns: readonly string[]): boolean {
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

export function packageFromFile (file: string): string | undefined {
    const normalized = toPosix(file)
    const workspaceMatch = normalized.match(/^(?:packages|infra)\/([^/]+)\//)
    return workspaceMatch?.[1]
}

export function classify (files: readonly string[]): Omit<ChangeReport, 'base'> {
    const unique = [...new Set(files.map(toPosix))].filter(Boolean)
    const lanes: LaneFlags = {
        ci: false,
        docs: false,
        component: false,
        display_server: false,
        code: false
    }
    for (const lane of Object.keys(LANE_FILTERS) as LaneName[]) {
        lanes[lane] = unique.some((file) => matchesFilters(file, LANE_FILTERS[lane]))
    }
    const packages = [...new Set(unique.map(packageFromFile).filter((name): name is string => Boolean(name)))].sort()
    const typings = packages.filter((pkg) => TYPINGS_PACKAGES.has(pkg))
    const smoke = unique.some((file) => file.startsWith('tests/')) ||
        packages.some((pkg) => (
            SMOKE_PACKAGES.has(pkg) ||
            pkg.endsWith('-reporter') ||
            pkg.endsWith('-service') ||
            pkg.endsWith('-framework')
        ))

    return {
        files: unique,
        lanes,
        runAll: lanes.ci,
        packages,
        typings,
        smoke
    }
}

export function parseArgs (argv: readonly string[] = process.argv.slice(2)): LaneArgs {
    const opts: LaneArgs = { json: false, base: undefined, files: undefined }
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

function git (args: readonly string[], options: { optional?: boolean } = {}): string {
    const result = spawnSync('git', [...args], { cwd: workspaceRoot, encoding: 'utf8' })
    if (result.status === 0) {
        return result.stdout
    }
    if (options.optional) {
        return ''
    }
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
}

function refExists (ref: string): boolean {
    return spawnSync('git', ['rev-parse', '--verify', ref], {
        cwd: workspaceRoot,
        encoding: 'utf8'
    }).status === 0
}

export function resolveBase (explicit?: string): string {
    const requested = explicit || process.env.CHANGED_BASE
    if (requested) {
        if (!refExists(requested)) {
            throw new Error(`Unknown git base "${requested}"`)
        }
        return requested
    }
    for (const candidate of DEFAULT_BASES) {
        if (refExists(candidate)) {
            const mergeBase = git(['merge-base', 'HEAD', candidate], { optional: true }).trim()
            return mergeBase || candidate
        }
    }
    return 'HEAD~1'
}

export function collectChangedFiles (base: string): string[] {
    if (!refExists(base)) {
        throw new Error(`Cannot classify changes: git base "${base}" does not exist`)
    }
    const listed = [
        git(['diff', '--name-only', '--diff-filter=ACMRD', `${base}...HEAD`]),
        git(['diff', '--name-only', '--diff-filter=ACMRD'], { optional: true }),
        git(['diff', '--name-only', '--cached', '--diff-filter=ACMRD'], { optional: true }),
        git(['ls-files', '--others', '--exclude-standard'], { optional: true })
    ].join('\n')
    return listed.split('\n').map((line) => line.trim()).filter(Boolean)
}

export function buildReport (input: { base: string, files: readonly string[] }): ChangeReport {
    return { base: input.base, ...classify(input.files) }
}

function printReport (report: ChangeReport): void {
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

function main (): void {
    try {
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
        printReport(report)
    } catch (err) {
        console.error(err instanceof Error ? err.message : err)
        process.exit(1)
    }
}

if (isMainModule(import.meta.url)) {
    main()
}
