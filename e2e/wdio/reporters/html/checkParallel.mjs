/**
 * Real-browser check of `@wdio/html-reporter` in parallel mode, with Mocha and with
 * Cucumber. Some tests fail on purpose, so this script runs `wdio.parallel.conf.ts`
 * and checks the reports: each log and screenshot must be under the test that sent it,
 * and the failed hook must be counted.
 */
import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

const here = path.dirname(url.fileURLToPath(import.meta.url))
const e2eDir = path.resolve(here, '..', '..', '..')
const md5 = (file) => crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex')

const RUNS = {
    mocha: {
        tokens: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].flatMap((t) => [`${t}:start`, `${t}:end`, `HB:${t}`, `HA:${t}`]).concat('T6:late', 'HS:T23'),
        // T21 passes, its afterEach fails, T2 and T22 fail, the before hook of T23 skips it
        metrics: { passed: 7, failed: 3, skipped: 1 }
    },
    cucumber: {
        // the report shows the last try of S4, so its Before hook log comes from the retry
        tokens: ['S1', 'S2', 'S3'].flatMap((s) => [`${s}:open`, `${s}:start`, `${s}:end`, `HB:${s}`, `HA:${s}`]).concat('HB:S4', 'S4:open', 'S4:start', 'S4:try2', 'HA:S4'),
        metrics: { passed: 3, failed: 1, skipped: 0 }
    }
}

function check (framework, { tokens, metrics: expectedMetrics }) {
    const errors = []
    const { status } = spawnSync('npx', ['wdio', 'run', './wdio/reporters/html/wdio.parallel.conf.ts'], {
        cwd: e2eDir,
        stdio: 'inherit',
        env: { ...process.env, HTML_PARALLEL_FRAMEWORK: framework },
        shell: process.platform === 'win32'
    })
    if (status === 0) {
        errors.push('some tests fail on purpose, so wdio must exit with an error')
    }

    const htmlDir = path.join(here, 'results', 'parallel', framework, 'html')
    const reports = fs.existsSync(htmlDir) ? fs.readdirSync(htmlDir).filter((file) => /^report-.*\.json$/.test(file)) : []
    if (!reports.length) {
        errors.push(`no report JSON in ${htmlDir}`)
    }
    const metrics = { passed: 0, failed: 0, skipped: 0 }
    const tests = new Map()
    for (const file of reports) {
        const data = JSON.parse(fs.readFileSync(path.join(htmlDir, file), 'utf-8'))
        metrics.passed += data.metrics.passed
        metrics.failed += data.metrics.failed
        metrics.skipped += data.metrics.skipped
        // a suite can be listed twice (its runner and its parent)
        const walk = (suite) => {
            for (const test of suite.tests ?? []) {
                tests.set(`${test.uid}|${test.start}`, test)
            }
            ;(suite.suites ?? []).forEach(walk)
        }
        data.suites.forEach(walk)
    }

    const afterCommandDir = path.join(htmlDir, 'screenshots')
    const found = new Set()
    const md5Logs = []
    const md5Owners = new Map()
    const afterCommandShots = []
    for (const test of tests.values()) {
        const owner = test.title.match(/^(?:Given |When |Then )?([TS]\d+)/)?.[1] ?? test.title
        const ownMd5 = new Set()
        const shots = []
        for (const event of test.events ?? []) {
            if (event.type === 'log') {
                const text = String(event.value)
                found.add(text)
                const [, sender, hash] = text.match(/^(?:H[BAS]:)?([TS]\d+)(?::md5:(\w+))?/) ?? []
                if (sender !== owner) {
                    errors.push(`log "${text}" is under ${owner}`)
                }
                if (hash) {
                    ownMd5.add(hash)
                    md5Logs.push(hash)
                    md5Owners.set(hash, new Set([...md5Owners.get(hash) ?? [], sender]))
                }
            } else if (event.type === 'screenshot') {
                shots.push(String(event.value))
            }
        }
        for (const file of shots) {
            if (file.startsWith(afterCommandDir)) {
                afterCommandShots.push(file)
                if (!fs.existsSync(file) || !ownMd5.has(md5(file))) {
                    errors.push(`the screenshot ${path.relative(htmlDir, file)} under ${owner} is not a screenshot of ${owner}`)
                }
            } else if (!path.basename(file).startsWith(`${owner}-`)) {
                errors.push(`the screenshot ${path.basename(file)} is under ${owner}`)
            }
        }
    }

    // the md5 tells the tests apart only if each test shows its own page (a blank window is white in CI)
    for (const [hash, owners] of md5Owners) {
        if (owners.size > 1) {
            errors.push(`${[...owners].join(', ')} have the same screenshot ${hash}, so the check cannot tell them apart`)
        }
    }
    // the `-2` file name needs 2 screenshots in the same millisecond, so this run does not always prove it (a unit test does)
    const lost = tokens.filter((token) => !found.has(token))
    if (lost.length) {
        errors.push(`logs not in the report: ${lost.join(', ')}`)
    }
    if (afterCommandShots.length !== md5Logs.length || new Set(afterCommandShots).size !== afterCommandShots.length) {
        errors.push(`${md5Logs.length} screenshots taken, ${afterCommandShots.length} in the report, ${new Set(afterCommandShots).size} files`)
    }
    if (Object.entries(expectedMetrics).some(([key, value]) => metrics[key] !== value)) {
        errors.push(`metrics ${JSON.stringify(metrics)}, expected ${JSON.stringify(expectedMetrics)}`)
    }
    console.log(`${framework}: ${tests.size} tests, ${found.size} logs, ${afterCommandShots.length} screenshots, metrics ${JSON.stringify(metrics)}`)
    return errors.map((error) => `${framework}: ${error}`)
}

const errors = Object.entries(RUNS).flatMap(([framework, run]) => check(framework, run))
if (errors.length) {
    console.error(`HTML reporter parallel e2e check failed:\n  - ${errors.join('\n  - ')}`)
    process.exit(1)
}
console.log('HTML reporter parallel e2e check passed: Mocha and Cucumber')
