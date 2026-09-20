/**
 * Run the local equivalent of CI's path-filtered suites.
 * Usage: pnpm run test:changed [--base <ref>] [--dry-run] [--smoke] [--e2e]
 */
import { spawnSync } from 'node:child_process'
import { buildReport, collectChangedFiles, parseArgs, resolveBase } from './changed-lanes.js'
import { hasPackageTests, resolvePackageDir } from './test-package.js'
import type { ChangeReport, CheckArgs, CheckStep } from './types.js'
import { isMainModule, workspaceRoot } from './workspace.js'

const TYPINGS_SCRIPT: Readonly<Record<string, string>> = {
    webdriver: 'test:typings:webdriver',
    webdriverio: 'test:typings:webdriverio',
    'wdio-mocha-framework': 'test:typings:mocha',
    'wdio-jasmine-framework': 'test:typings:jasmine',
    'wdio-cucumber-framework': 'test:typings:cucumber',
    'wdio-protocols': 'test:typings:webdriver',
    'wdio-types': 'test:typings:webdriverio',
    'wdio-globals': 'test:typings:webdriverio'
}

export function parseCheckArgs (argv: readonly string[]): CheckArgs {
    return {
        ...parseArgs(argv),
        dryRun: argv.includes('--dry-run'),
        smoke: argv.includes('--smoke'),
        e2e: argv.includes('--e2e')
    }
}

export function planChecks (
    report: Omit<ChangeReport, 'base'> | ChangeReport,
    options: { smoke?: boolean, e2e?: boolean } = {}
): CheckStep[] {
    const smoke = options.smoke === true
    const e2e = options.e2e === true
    const steps: CheckStep[] = []

    if (!report.files.length) {
        return [{ name: 'none', reason: 'no changed files' }]
    }

    if (report.runAll) {
        steps.push({ name: 'test:local', cmd: ['pnpm', 'run', 'test:local'] })
        if (smoke) {
            steps.push({ name: 'test:smoke', cmd: ['pnpm', 'run', 'test:smoke'] })
        } else {
            steps.push({ name: 'smoke', reason: 'toolchain change; run pnpm run test:smoke or pass --smoke' })
        }
        return steps
    }

    if (report.lanes.code || report.lanes.component || report.lanes.xvfb) {
        steps.push({ name: 'test:eslint', cmd: ['pnpm', 'run', 'test:eslint'] })
    }

    for (const pkg of report.packages) {
        if (pkg === 'wdio-browser-runner' && !report.lanes.code) {
            continue
        }
        const pkgDir = resolvePackageDir(pkg)
        if (!pkgDir || !hasPackageTests(pkgDir)) {
            steps.push({
                name: `test:package ${pkg}`,
                reason: 'no package-local Vitest tests; typings or smoke cover this package'
            })
            continue
        }
        steps.push({ name: `test:package ${pkg}`, cmd: ['pnpm', 'run', 'test:package', pkg] })
    }

    const typings = new Set(
        report.typings
            .map((pkg) => TYPINGS_SCRIPT[pkg])
            .filter((script): script is string => Boolean(script))
    )
    for (const script of typings) {
        steps.push({ name: script, cmd: ['pnpm', 'run', script] })
    }

    if (report.smoke) {
        if (smoke) {
            steps.push({ name: 'test:smoke', cmd: ['pnpm', 'run', 'test:smoke'] })
        } else {
            steps.push({
                name: 'smoke',
                reason: 'runner/CLI/plugin wiring changed; run pnpm run test:smoke:list then a named suite, or pass --smoke'
            })
        }
    }

    if (report.lanes.component) {
        if (e2e) {
            steps.push({ name: 'test:component', cmd: ['pnpm', 'run', 'test:component'] })
        } else {
            steps.push({ name: 'component', reason: 'pass --e2e to run pnpm run test:component' })
        }
    }

    if (report.lanes.xvfb) {
        if (e2e) {
            steps.push({ name: 'test:e2e:xvfb', cmd: ['pnpm', 'run', 'test:e2e:xvfb'] })
        } else {
            steps.push({ name: 'xvfb', reason: 'pass --e2e to run pnpm run test:e2e:xvfb' })
        }
    }

    if (report.lanes.docs && !report.lanes.code && !report.lanes.component && !report.lanes.xvfb && !report.runAll) {
        steps.push({
            name: 'docs',
            reason: 'docs lane only; run pnpm run docs:list and regenerate if you changed JSDoc, protocols, or package READMEs'
        })
    }

    return steps.length ? steps : [{ name: 'none', reason: 'changed files are outside CI test lanes' }]
}

function runStep (step: CheckStep): number {
    if (!step.cmd) {
        console.log(`skip  ${step.name}: ${step.reason}`)
        return 0
    }
    console.log(`\n==> ${step.cmd.join(' ')}\n`)
    const result = spawnSync(step.cmd[0], step.cmd.slice(1), {
        cwd: workspaceRoot,
        stdio: 'inherit',
        shell: false
    })
    if (result.error) {
        console.error(result.error)
        return 1
    }
    return result.status ?? 1
}

function main (): void {
    try {
        const opts = parseCheckArgs(process.argv.slice(2))
        const base = resolveBase(opts.base)
        const files = opts.files
            ? opts.files.split(',').map((file) => file.trim()).filter(Boolean)
            : collectChangedFiles(base)
        const report = buildReport({ base, files })
        const steps = planChecks(report, opts)

        console.log(`base: ${report.base}`)
        console.log(`files: ${report.files.length}`)
        console.log(`lanes: ${Object.entries(report.lanes).filter(([, on]) => on).map(([name]) => name).join(', ') || '(none)'}`)
        if (report.packages.length) {
            console.log(`packages: ${report.packages.join(', ')}`)
        }

        if (opts.dryRun) {
            console.log('\nplan:')
            for (const step of steps) {
                console.log(step.cmd ? `- ${step.cmd.join(' ')}` : `- ${step.name}: ${step.reason}`)
            }
            return
        }

        let failed = 0
        for (const step of steps) {
            failed += runStep(step)
        }
        process.exit(failed ? 1 : 0)
    } catch (err) {
        console.error(err instanceof Error ? err.message : err)
        process.exit(1)
    }
}

if (isMainModule(import.meta.url)) {
    main()
}
