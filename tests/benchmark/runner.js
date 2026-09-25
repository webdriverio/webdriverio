#!/usr/bin/env node
/**
 * Runner hot-path benchmark.
 *
 * Reuses the smoke launch path (`Launcher` + webdriver-mock) with generated
 * fixtures so wall-clock includes CLI, config, worker fork, framework, and
 * mock commands — without real-browser noise.
 *
 * Usage:
 *   pnpm run bench:runner
 *   pnpm run bench:runner -- --scenario mocha-large-quiet --iterations 3
 *   pnpm run bench:runner -- --baseline path/to/baseline.json
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { execSync } from 'node:child_process'

process.env.WDIO_UNIT_TESTS = '1'

import launch from '../helpers/launch.js'
import { generateFixtures, cleanupFixtures } from './generate-fixtures.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const configPath = path.resolve(__dirname, 'config.js')
const resultsDir = path.resolve(__dirname, 'results')

const DEFAULT_ITERATIONS = 5
const IMPROVE_THRESHOLD = 0.03
const REGRESS_THRESHOLD = 0.03

function parseArgs (argv) {
    const opts = {
        iterations: DEFAULT_ITERATIONS,
        scenario: null,
        baseline: null,
        label: null,
        write: true
    }
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (arg === '--iterations') {
            opts.iterations = Number(argv[++i])
        } else if (arg === '--scenario') {
            opts.scenario = argv[++i]
        } else if (arg === '--baseline') {
            opts.baseline = argv[++i]
        } else if (arg === '--label') {
            opts.label = argv[++i]
        } else if (arg === '--no-write') {
            opts.write = false
        }
    }
    return opts
}

function median (values) {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid]
}

function stats (values) {
    return {
        median: median(values),
        min: Math.min(...values),
        max: Math.max(...values),
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        samples: values.length
    }
}

function gitSha () {
    try {
        return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
    } catch {
        return 'unknown'
    }
}

function sumWorkerPhase (workerTimings = [], phase) {
    return workerTimings.reduce((acc, t) => acc + (typeof t[phase] === 'number' ? t[phase] : 0), 0)
}

function defineScenarios () {
    const sizes = [
        { name: 'small', count: 20, skips: 0 },
        { name: 'large', count: 200, skips: 0 },
        { name: 'skips', count: 20, skips: 40 }
    ]
    const profiles = [
        { name: 'info', logLevel: 'info' },
        { name: 'quiet', logLevel: 'error' }
    ]

    const scenarios = []
    for (const size of sizes) {
        for (const profile of profiles) {
            scenarios.push({
                id: `mocha-${size.name}-${profile.name}`,
                framework: 'mocha',
                size,
                profile,
                buildArgs: (fx) => ({
                    framework: 'mocha',
                    logLevel: profile.logLevel,
                    specs: [fx.mochaSpec],
                    mochaOpts: { ui: 'bdd', timeout: 10000 }
                })
            })
            scenarios.push({
                id: `jasmine-${size.name}-${profile.name}`,
                framework: 'jasmine',
                size,
                profile,
                buildArgs: (fx) => ({
                    framework: 'jasmine',
                    logLevel: profile.logLevel,
                    specs: [fx.jasmineSpec],
                    jasmineOpts: { defaultTimeoutInterval: 60000 }
                })
            })
            // Cucumber skip fixtures are not generated; skip the skips size for cucumber
            if (size.name !== 'skips') {
                scenarios.push({
                    id: `cucumber-${size.name}-${profile.name}`,
                    framework: 'cucumber',
                    size,
                    profile,
                    buildArgs: (fx) => ({
                        framework: 'cucumber',
                        logLevel: profile.logLevel,
                        specs: [fx.featureFile],
                        cucumberOpts: {
                            timeout: 5000,
                            require: [fx.stepsFile]
                        }
                    })
                })
            }
        }
    }
    return scenarios
}

async function runOnce (scenario, fixtures) {
    const args = scenario.buildArgs(fixtures)
    const wallStart = performance.now()
    const result = await launch(`bench:${scenario.id}`, configPath, args)
    const wallMs = performance.now() - wallStart
    return {
        wallMs,
        setupSec: sumWorkerPhase(result.workerTimings, 'setup'),
        executionSec: sumWorkerPhase(result.workerTimings, 'execution'),
        teardownSec: sumWorkerPhase(result.workerTimings, 'teardown'),
        totalSec: sumWorkerPhase(result.workerTimings, 'total'),
        passed: result.passed,
        failed: result.failed
    }
}

async function measureScenario (scenario, iterations) {
    const sized = await generateFixtures({
        testCount: scenario.size.count,
        includeSkips: scenario.size.skips
    })

    try {
        process.stdout.write(`  warmup ${scenario.id}...`)
        await runOnce(scenario, sized)
        process.stdout.write(' ok\n')

        const samples = []
        for (let i = 0; i < iterations; i++) {
            process.stdout.write(`  iter ${i + 1}/${iterations} ${scenario.id}...`)
            const sample = await runOnce(scenario, sized)
            samples.push(sample)
            process.stdout.write(` ${sample.wallMs.toFixed(0)}ms\n`)
        }

        return {
            id: scenario.id,
            framework: scenario.framework,
            size: scenario.size.name,
            profile: scenario.profile.name,
            wallMs: stats(samples.map((s) => s.wallMs)),
            setupSec: stats(samples.map((s) => s.setupSec)),
            executionSec: stats(samples.map((s) => s.executionSec)),
            teardownSec: stats(samples.map((s) => s.teardownSec)),
            samples
        }
    } finally {
        await cleanupFixtures(sized.root)
    }
}

function formatMs (ms) {
    return `${ms.toFixed(0)}ms`
}

function formatDelta (current, baseline) {
    if (baseline === null || baseline === undefined || baseline === 0) {
        return 'n/a'
    }
    const pct = ((current - baseline) / baseline) * 100
    const sign = pct > 0 ? '+' : ''
    return `${sign}${pct.toFixed(1)}%`
}

function printTable (results, baselineMap) {
    console.log('\nScenario                              wall med   vs base   exec med   vs base')
    console.log('-'.repeat(80))
    for (const r of results) {
        const base = baselineMap?.get(r.id)
        const wallDelta = formatDelta(r.wallMs.median, base?.wallMs?.median)
        const execDelta = formatDelta(r.executionSec.median, base?.executionSec?.median)
        console.log(
            `${r.id.padEnd(36)} ${formatMs(r.wallMs.median).padStart(8)} ${wallDelta.padStart(9)} ` +
            `${(r.executionSec.median * 1000).toFixed(0).padStart(7)}ms ${execDelta.padStart(9)}`
        )
    }
    console.log('')
}

function evaluateGate (results, baselineMap, targetIds) {
    if (!baselineMap) {
        return { ok: true, notes: ['no baseline provided'] }
    }
    const notes = []
    let ok = true
    const targets = new Set(targetIds || results.map((r) => r.id))

    for (const r of results) {
        const base = baselineMap.get(r.id)
        if (!base) {
            ok = false
            notes.push(`${r.id}: missing from baseline`)
            continue
        }
        const wallDelta = (r.wallMs.median - base.wallMs.median) / base.wallMs.median
        const execDelta = (r.executionSec.median - base.executionSec.median) /
            (base.executionSec.median || Number.EPSILON)
        const wallLabel = formatDelta(r.wallMs.median, base.wallMs.median)
        const execLabel = formatDelta(r.executionSec.median, base.executionSec.median)
        const regressed = wallDelta > REGRESS_THRESHOLD || execDelta > REGRESS_THRESHOLD

        if (targets.has(r.id)) {
            const improved = wallDelta <= -IMPROVE_THRESHOLD || execDelta <= -IMPROVE_THRESHOLD
            if (regressed) {
                ok = false
                notes.push(`${r.id}: regression (wall ${wallLabel}, exec ${execLabel})`)
            } else if (!improved) {
                ok = false
                notes.push(`${r.id}: no ≥3% improvement (wall ${wallLabel}, exec ${execLabel})`)
            } else {
                notes.push(`${r.id}: improved (wall ${wallLabel}, exec ${execLabel})`)
            }
        } else if (regressed) {
            ok = false
            notes.push(`${r.id}: regression (wall ${wallLabel}, exec ${execLabel})`)
        }
    }
    return { ok, notes }
}

async function loadBaseline (baselinePath) {
    if (!baselinePath) {
        return null
    }
    const repoRoot = path.resolve(__dirname, '../..')
    const candidates = [
        path.isAbsolute(baselinePath) ? baselinePath : null,
        // `pnpm run bench:runner` cds into tests/, so accept repo-root-relative paths too
        path.resolve(repoRoot, baselinePath),
        path.resolve(resultsDir, baselinePath),
        path.resolve(resultsDir, path.basename(baselinePath)),
        path.resolve(process.cwd(), baselinePath),
        path.resolve(__dirname, baselinePath)
    ].filter(Boolean)

    let lastError
    for (const candidate of candidates) {
        try {
            const raw = JSON.parse(await fs.readFile(candidate, 'utf8'))
            return new Map(raw.results.map((r) => [r.id, r]))
        } catch (err) {
            lastError = err
        }
    }
    throw lastError
}

async function main () {
    const opts = parseArgs(process.argv.slice(2))
    const sha = gitSha()
    const label = opts.label || sha

    const allScenarios = defineScenarios()

    const selected = opts.scenario
        ? allScenarios.filter((s) => s.id === opts.scenario)
        : allScenarios.filter((s) =>
            // Default set: large+quiet (isolates framework), large+info (realistic),
            // and mocha-skips-quiet for skip-path work.
            (s.size.name === 'large') ||
            (s.id === 'mocha-skips-quiet')
        )

    if (selected.length === 0) {
        console.error(`No scenarios matched. Available:\n${allScenarios.map((s) => s.id).join('\n')}`)
        process.exit(1)
    }

    console.log(`Benchmark label=${label} iterations=${opts.iterations} scenarios=${selected.map((s) => s.id).join(', ')}`)

    const results = []
    for (const scenario of selected) {
        console.log(`\nMeasuring ${scenario.id}`)
        results.push(await measureScenario(scenario, opts.iterations))
    }

    const baselineMap = await loadBaseline(opts.baseline)
    printTable(results, baselineMap)

    if (baselineMap) {
        const gate = evaluateGate(results, baselineMap, opts.scenario ? [opts.scenario] : null)
        console.log('Gate:')
        for (const note of gate.notes) {
            console.log(`  - ${note}`)
        }
        console.log(gate.ok ? 'PASS' : 'FAIL')
        if (!gate.ok) {
            process.exitCode = 1
        }
    }

    if (opts.write) {
        await fs.mkdir(resultsDir, { recursive: true })
        const outPath = path.join(resultsDir, `${label}.json`)
        await fs.writeFile(outPath, JSON.stringify({
            label,
            sha,
            createdAt: new Date().toISOString(),
            iterations: opts.iterations,
            results
        }, null, 2))
        console.log(`Wrote ${outPath}`)
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
