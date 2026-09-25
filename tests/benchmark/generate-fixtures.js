import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const FIXTURE_ROOT = path.join(__dirname, '.tmp')

/**
 * Write ephemeral Mocha / Jasmine / Cucumber fixtures for the runner benchmark.
 * Specs live under tests/benchmark/.tmp so workspace package resolution works
 * for Cucumber step definition imports.
 *
 * Each test hits `browser.getTitle()` via expect-webdriverio (Infinity-mocked)
 * so the command/reporter hot path stays on the critical path.
 */
export async function generateFixtures ({ testCount = 20, includeSkips = 0 } = {}) {
    await fs.mkdir(FIXTURE_ROOT, { recursive: true })
    const root = await fs.mkdtemp(path.join(FIXTURE_ROOT, 'run-'))
    const mochaDir = path.join(root, 'mocha')
    const jasmineDir = path.join(root, 'jasmine')
    const cucumberDir = path.join(root, 'cucumber')
    const stepsDir = path.join(cucumberDir, 'steps')

    await Promise.all([
        fs.mkdir(mochaDir, { recursive: true }),
        fs.mkdir(jasmineDir, { recursive: true }),
        fs.mkdir(stepsDir, { recursive: true })
    ])

    const mochaBody = [
        "describe('bench mocha', () => {",
        ...Array.from({ length: testCount }, (_, i) => [
            `    it('test ${i}', async () => {`,
            "        await expect(browser).toHaveTitle('Mock Page Title')",
            '    })'
        ].join('\n')),
        ...Array.from({ length: includeSkips }, (_, i) => [
            `    it('skip ${i}', function () {`,
            '        this.skip()',
            '    })'
        ].join('\n')),
        '})',
        ''
    ].join('\n')

    const jasmineBody = [
        "describe('bench jasmine', () => {",
        ...Array.from({ length: testCount }, (_, i) => [
            `    it('test ${i}', async () => {`,
            "        await expect(browser).toHaveTitle('Mock Page Title')",
            '    })'
        ].join('\n')),
        ...Array.from({ length: includeSkips }, (_, i) => [
            `    xit('skip ${i}', () => {`,
            '        expect(true).toBe(true)',
            '    })'
        ].join('\n')),
        '})',
        ''
    ].join('\n')

    const featureBody = [
        'Feature: bench cucumber',
        '',
        ...Array.from({ length: testCount }, (_, i) => [
            `  Scenario: scenario ${i}`,
            '    Given the page title is mocked',
            ''
        ].join('\n'))
    ].join('\n')

    const stepsBody = [
        "import { Given } from '@wdio/cucumber-framework'",
        '',
        "Given('the page title is mocked', async () => {",
        "    await expect(browser).toHaveTitle('Mock Page Title')",
        '})',
        ''
    ].join('\n')

    const mochaSpec = path.join(mochaDir, 'bench.js')
    const jasmineSpec = path.join(jasmineDir, 'bench.js')
    const featureFile = path.join(cucumberDir, 'bench.feature')
    const stepsFile = path.join(stepsDir, 'steps.js')

    await Promise.all([
        fs.writeFile(mochaSpec, mochaBody),
        fs.writeFile(jasmineSpec, jasmineBody),
        fs.writeFile(featureFile, featureBody),
        fs.writeFile(stepsFile, stepsBody)
    ])

    return {
        root,
        mochaSpec,
        jasmineSpec,
        featureFile,
        stepsFile
    }
}

export async function cleanupFixtures (root) {
    await fs.rm(root, { recursive: true, force: true })
}
