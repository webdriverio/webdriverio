import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
    classify,
    matchGlob,
    matchesFilters,
    packageFromFile,
    parseArgs
} from './changed-lanes.mjs'
import { planChecks } from './check-changed.mjs'
import { listSmokeSuites } from './smoke-list.mjs'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')

describe('matchGlob', () => {
    it('matches a directory prefix', () => {
        assert.equal(matchGlob('packages/webdriverio/src/index.ts', 'packages/**').matched, true)
        assert.equal(matchGlob('website/docs/GettingStarted.md', 'packages/**').matched, false)
    })

    it('matches an exact file', () => {
        assert.equal(matchGlob('package.json', 'package.json').matched, true)
        assert.equal(matchGlob('packages/package.json', 'package.json').matched, false)
    })
})

describe('classify', () => {
    it('maps a webdriverio command change to the code lane', () => {
        const report = classify(['packages/webdriverio/src/commands/element/click.ts'])
        assert.equal(report.lanes.code, true)
        assert.equal(report.lanes.docs, false)
        assert.equal(report.lanes.ci, false)
        assert.deepEqual(report.packages, ['webdriverio'])
        assert.deepEqual(report.typings, ['webdriverio'])
        assert.equal(report.smoke, false)
    })

    it('keeps browser-runner out of the code lane', () => {
        const report = classify(['packages/wdio-browser-runner/src/index.ts'])
        assert.equal(report.lanes.component, true)
        assert.equal(report.lanes.code, false)
        assert.equal(report.lanes.xvfb, false)
    })

    it('keeps xvfb trees out of the code lane', () => {
        const report = classify(['packages/wdio-xvfb/src/index.ts', 'e2e/wdio/xvfb/wdio.conf.ts'])
        assert.equal(report.lanes.xvfb, true)
        assert.equal(report.lanes.code, false)
    })

    it('classifies website docs as docs-only', () => {
        const report = classify(['website/docs/GettingStarted.md'])
        assert.equal(report.lanes.docs, true)
        assert.equal(report.lanes.code, false)
        assert.equal(report.runAll, false)
    })

    it('treats root toolchain files as run-all', () => {
        const report = classify(['package.json', 'pnpm-lock.yaml'])
        assert.equal(report.lanes.ci, true)
        assert.equal(report.runAll, true)
    })

    it('does not treat docs-generation as code', () => {
        const report = classify(['scripts/docs-generation/generateDocs.ts'])
        assert.equal(report.lanes.docs, true)
        assert.equal(report.lanes.code, false)
    })
})

describe('packageFromFile', () => {
    it('returns the workspace directory name', () => {
        assert.equal(packageFromFile('packages/wdio-cli/src/index.ts'), 'wdio-cli')
        assert.equal(packageFromFile('scripts/docs-list.mjs'), undefined)
    })
})

describe('matchesFilters', () => {
    it('honors negation after a broader include', () => {
        const patterns = ['packages/**', '!packages/wdio-xvfb/**']
        assert.equal(matchesFilters('packages/webdriverio/src/a.ts', patterns), true)
        assert.equal(matchesFilters('packages/wdio-xvfb/src/a.ts', patterns), false)
    })
})

describe('parseArgs', () => {
    it('reads --json and --base', () => {
        assert.deepEqual(parseArgs(['--json', '--base', 'origin/v10']), {
            json: true,
            base: 'origin/v10',
            files: undefined
        })
    })
})

describe('planChecks', () => {
    it('plans package unit tests and typings for a command change', () => {
        const steps = planChecks(classify(['packages/webdriverio/src/commands/element/click.ts']))
        assert.ok(steps.some((step) => step.cmd?.join(' ') === 'pnpm run test:eslint'))
        assert.ok(steps.some((step) => step.cmd?.join(' ') === 'pnpm run test:package webdriverio'))
        assert.ok(steps.some((step) => step.cmd?.join(' ') === 'pnpm run test:typings:webdriverio'))
        assert.equal(steps.some((step) => step.name === 'smoke'), false)
    })

    it('does not run the full local suite for a docs-only change', () => {
        const steps = planChecks(classify(['website/docs/GettingStarted.md']))
        assert.equal(steps.length, 1)
        assert.equal(steps[0].name, 'docs')
        assert.equal(steps[0].cmd, undefined)
    })

    it('uses test:local when the CI filter would run-all', () => {
        const steps = planChecks(classify(['vitest.config.ts']))
        assert.deepEqual(steps[0].cmd, ['pnpm', 'run', 'test:local'])
    })

    it('recommends smoke for a CLI change and runs it when asked', () => {
        const report = classify(['packages/wdio-cli/src/launcher.ts'])
        assert.equal(report.smoke, true)
        const dry = planChecks(report)
        assert.ok(dry.some((step) => step.name === 'smoke' && !step.cmd))
        const withSmoke = planChecks(report, { smoke: true })
        assert.ok(withSmoke.some((step) => step.cmd?.join(' ') === 'pnpm run test:smoke'))
    })
})

describe('listSmokeSuites', () => {
    it('reads every registered suite name from smoke.runner.js', () => {
        const names = listSmokeSuites(fs.readFileSync(path.join(root, 'tests', 'smoke.runner.js'), 'utf8'))
        assert.ok(names.includes('mochaTestrunner'))
        assert.ok(names.includes('standaloneTest'))
        assert.ok(names.includes('customReporterString'))
        assert.ok(names.length > 40)
    })
})
