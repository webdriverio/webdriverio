import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
    classify,
    collectChangedFiles,
    collectDocEntries,
    hasPackageTests,
    listSmokeSuites,
    matchGlob,
    matchesFilters,
    packageFromFile,
    parseArgs,
    parsePackageArgs,
    planChecks,
    resolveBase,
    resolvePackageDir,
    workspaceRoot
} from '../src/index.js'

describe('matchGlob', () => {
    it('matches a directory prefix', () => {
        expect(matchGlob('packages/webdriverio/src/index.ts', 'packages/**').matched).toBe(true)
        expect(matchGlob('website/docs/GettingStarted.md', 'packages/**').matched).toBe(false)
    })

    it('matches an exact file', () => {
        expect(matchGlob('package.json', 'package.json').matched).toBe(true)
        expect(matchGlob('packages/package.json', 'package.json').matched).toBe(false)
    })
})

describe('classify', () => {
    it('maps a webdriverio command change to the code lane', () => {
        const report = classify(['packages/webdriverio/src/commands/element/click.ts'])
        expect(report.lanes.code).toBe(true)
        expect(report.lanes.docs).toBe(false)
        expect(report.lanes.ci).toBe(false)
        expect(report.packages).toEqual(['webdriverio'])
        expect(report.typings).toEqual(['webdriverio'])
        expect(report.smoke).toBe(false)
    })

    it('keeps browser-runner out of the code lane', () => {
        const report = classify(['packages/wdio-browser-runner/src/index.ts'])
        expect(report.lanes.component).toBe(true)
        expect(report.lanes.code).toBe(false)
        expect(report.lanes.display_server).toBe(false)
    })

    it('keeps display-server trees out of the code lane', () => {
        const report = classify(['packages/wdio-display-server/src/index.ts', 'e2e/wdio/display-server/wdio.conf.ts'])
        expect(report.lanes.display_server).toBe(true)
        expect(report.lanes.code).toBe(false)
    })

    it('classifies website docs as docs-only', () => {
        const report = classify(['website/docs/GettingStarted.md'])
        expect(report.lanes.docs).toBe(true)
        expect(report.lanes.code).toBe(false)
        expect(report.runAll).toBe(false)
    })

    it('treats root toolchain files as run-all', () => {
        const report = classify(['package.json', 'pnpm-lock.yaml'])
        expect(report.lanes.ci).toBe(true)
        expect(report.runAll).toBe(true)
        expect(classify(['.oxlintrc.json']).runAll).toBe(true)
    })

    it('does not treat docs-generation as code', () => {
        const report = classify(['scripts/docs-generation/generateDocs.ts'])
        expect(report.lanes.docs).toBe(true)
        expect(report.lanes.code).toBe(false)
    })

    it('maps infra helper changes to the code lane', () => {
        const report = classify(['infra/repo-tools/src/changed-lanes.ts'])
        expect(report.lanes.code).toBe(true)
        expect(report.packages).toEqual(['repo-tools'])
    })
})

describe('packageFromFile', () => {
    it('returns the workspace directory name', () => {
        expect(packageFromFile('packages/wdio-cli/src/index.ts')).toBe('wdio-cli')
        expect(packageFromFile('infra/repo-tools/src/docs-list.ts')).toBe('repo-tools')
        expect(packageFromFile('scripts/generateSubPackage.ts')).toBeUndefined()
    })
})

describe('matchesFilters', () => {
    it('honors negation after a broader include', () => {
        const patterns = ['packages/**', '!packages/wdio-display-server/**']
        expect(matchesFilters('packages/webdriverio/src/a.ts', patterns)).toBe(true)
        expect(matchesFilters('packages/wdio-display-server/src/a.ts', patterns)).toBe(false)
    })
})

describe('parseArgs', () => {
    it('reads --json and --base', () => {
        expect(parseArgs(['--json', '--base', 'origin/v10'])).toEqual({
            json: true,
            base: 'origin/v10',
            files: undefined
        })
    })
})

describe('planChecks', () => {
    it('plans package unit tests and typings for a command change', () => {
        const steps = planChecks(classify(['packages/webdriverio/src/commands/element/click.ts']))
        expect(steps.some((step) => step.cmd?.join(' ') === 'pnpm run test:oxlint')).toBe(true)
        expect(steps.some((step) => step.cmd?.join(' ') === 'pnpm run test:package webdriverio')).toBe(true)
        expect(steps.some((step) => step.cmd?.join(' ') === 'pnpm run test:typings:webdriverio')).toBe(true)
        expect(steps.some((step) => step.name === 'smoke')).toBe(false)
    })

    it('does not run the full local suite for a docs-only change', () => {
        const steps = planChecks(classify(['website/docs/GettingStarted.md']))
        expect(steps).toHaveLength(1)
        expect(steps[0]?.name).toBe('docs')
        expect(steps[0]?.cmd).toBeUndefined()
    })

    it('uses test:local when the CI filter would run-all', () => {
        const steps = planChecks(classify(['vitest.config.ts']))
        expect(steps[0]?.cmd).toEqual(['pnpm', 'run', 'test:local'])
    })

    it('recommends smoke for a CLI change and runs it when asked', () => {
        const report = classify(['packages/wdio-cli/src/launcher.ts'])
        expect(report.smoke).toBe(true)
        const dry = planChecks(report)
        expect(dry.some((step) => step.name === 'smoke' && !step.cmd)).toBe(true)
        const withSmoke = planChecks(report, { smoke: true })
        expect(withSmoke.some((step) => step.cmd?.join(' ') === 'pnpm run test:smoke')).toBe(true)
    })

    it('does not schedule Vitest for packages that have no local tests', () => {
        const steps = planChecks(classify(['packages/wdio-protocols/src/index.ts']))
        expect(steps.some((step) => step.cmd?.join(' ') === 'pnpm run test:package wdio-protocols')).toBe(false)
        expect(steps.some((step) => (
            step.name === 'test:package wdio-protocols' &&
            step.reason?.includes('no package-local Vitest tests')
        ))).toBe(true)
        expect(steps.some((step) => step.cmd?.join(' ') === 'pnpm run test:typings:webdriver')).toBe(true)
    })
})

describe('hasPackageTests', () => {
    it('detects packages with and without Vitest files', () => {
        expect(hasPackageTests(path.join(workspaceRoot, 'packages', 'webdriverio'))).toBe(true)
        expect(hasPackageTests(path.join(workspaceRoot, 'packages', 'wdio-protocols'))).toBe(false)
        expect(hasPackageTests(path.join(workspaceRoot, 'packages', 'wdio-types'))).toBe(false)
        expect(hasPackageTests(path.join(workspaceRoot, 'infra', 'repo-tools'))).toBe(true)
    })
})

describe('collectChangedFiles', () => {
    it('fails instead of hiding committed changes when the base is invalid', () => {
        expect(() => collectChangedFiles('not-a-real-git-ref')).toThrow(/does not exist/)
        expect(() => resolveBase('not-a-real-git-ref')).toThrow(/Unknown git base/)
    })
})

describe('listSmokeSuites', () => {
    it('reads every registered suite name from smoke.runner.js', () => {
        const names = listSmokeSuites(
            fs.readFileSync(path.join(workspaceRoot, 'tests', 'smoke.runner.js'), 'utf8')
        )
        expect(names).toContain('mochaTestrunner')
        expect(names).toContain('standaloneTest')
        expect(names).toContain('customReporterString')
        expect(names.length).toBeGreaterThan(40)
    })
})

describe('resolvePackageDir', () => {
    it('resolves npm names, directories, and infra packages', () => {
        expect(path.basename(resolvePackageDir('webdriverio') ?? '')).toBe('webdriverio')
        expect(path.basename(resolvePackageDir('@wdio/cli') ?? '')).toBe('wdio-cli')
        expect(path.basename(resolvePackageDir('repo-tools') ?? '')).toBe('repo-tools')
        expect(path.basename(resolvePackageDir('@wdio/repo-tools') ?? '')).toBe('repo-tools')
        expect(resolvePackageDir('not-a-real-pkg')).toBeUndefined()
    })
})

describe('parsePackageArgs', () => {
    it('separates the package name from flags', () => {
        expect(parsePackageArgs(['@wdio/cli', '--print'])).toEqual({
            name: '@wdio/cli',
            print: true,
            vitestArgs: []
        })
    })
})

describe('collectDocEntries', () => {
    it('includes agent guides and the ownership map', () => {
        const files = collectDocEntries().map((entry) => entry.file)
        expect(files).toContain('AGENTS.md')
        expect(files).toContain('.github/OWNERSHIP.md')
        expect(files).toContain('infra/repo-tools/AGENTS.md')
    })
})
