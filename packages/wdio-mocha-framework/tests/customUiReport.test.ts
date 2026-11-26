import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { EventEmitter } from 'node:events'
import { describe, test, expect, afterEach, vi } from 'vitest'
import Mocha from 'mocha'

const require = createRequire(import.meta.url)
const mochaModuleUrl = pathToFileURL(require.resolve('mocha')).href

import { MochaAdapter } from '../src/index.js'
import SpecReporter from '../../wdio-spec-reporter/src/index.js'
import JunitReporter from '../../wdio-junit-reporter/src/index.js'
import ConciseReporter from '../../wdio-concise-reporter/src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const tempDirs: string[] = []
const registeredInterfaces: string[] = []

function makeTempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-mocha-ui-'))
    tempDirs.push(dir)
    return dir
}

afterEach(() => {
    for (const name of registeredInterfaces.splice(0)) {
        delete (Mocha.interfaces as unknown as Record<string, unknown>)[name]
    }
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

interface RunOptions {
    rootDir: string
    specs: string[]
    mochaOpts: Record<string, unknown>
    beforeTest?: Function[]
    afterTest?: Function[]
}

async function runWithReporters({ rootDir, specs, mochaOpts, beforeTest = [], afterTest = [] }: RunOptions) {
    const out = { spec: '', junit: '', concise: '' }
    const events: { event: string, payload: Record<string, any> }[] = []

    const spec = new SpecReporter({ stdout: true, writeStream: { write: (s: string) => { out.spec += s; return true } } } as never)
    const junit = new JunitReporter({ stdout: true, writeStream: { write: (s: string) => { out.junit += s; return true } } } as never)
    const concise = new ConciseReporter({ stdout: true, writeStream: { write: (s: string) => { out.concise += s; return true } } } as never)

    const bus = new EventEmitter()
    const origEmit = bus.emit.bind(bus)
    bus.emit = ((event: string, payload: Record<string, any>) => {
        events.push({ event, payload: { ...payload } })
        spec.emit(event, payload)
        junit.emit(event, payload)
        concise.emit(event, payload)
        return origEmit(event, payload)
    }) as never

    const config = {
        rootDir,
        framework: 'mocha',
        mochaOpts: { ...mochaOpts },
        beforeTest,
        afterTest,
        beforeHook: [],
        afterHook: [],
        beforeSuite: [],
        afterSuite: [],
        after: []
    }

    const runnerPayload = {
        cid: '0-0',
        specs,
        capabilities: { browserName: 'chrome' },
        config,
        sessionId: 'sess-1',
        isMultiRemote: false,
        instanceOptions: {},
        retry: 0
    }

    bus.emit('runner:start', runnerPayload)

    const adapter = new MochaAdapter('0-0', config as never, specs, { browserName: 'chrome' }, bus)
    await adapter.init()
    const failures = await adapter.run()

    bus.emit('runner:end', { ...runnerPayload, failures })

    return { failures, events, out }
}

describe('Mocha root-level test reporting (QUnit & top-level tests)', () => {
    test('reports QUnit top-level tests without suite() across Spec, JUnit and Concise reporters', async () => {
        const dir = makeTempDir()
        const specFile = path.join(dir, 'qunit-top-level.spec.cjs')
        fs.writeFileSync(specFile, `
test('passing top-level qunit test', () => {})

test('failing top-level qunit test', () => {
    throw new Error('boom from qunit')
})

test.skip('static skipped qunit test', () => {})

test('runtime skipped qunit test', function () {
    this.skip()
})
`)

        const { failures, events, out } = await runWithReporters({
            rootDir: dir,
            specs: [specFile],
            mochaOpts: { ui: 'qunit' }
        })

        expect(failures).toBe(1)

        const suiteStarts = events.filter((e) => e.event === 'suite:start')
        const suiteEnds = events.filter((e) => e.event === 'suite:end')
        expect(suiteStarts).toHaveLength(1)
        expect(suiteEnds).toHaveLength(1)
        expect(suiteStarts[0].payload.title).toBe('qunit-top-level.spec.cjs')
        expect(suiteStarts[0].payload.uid).toBe(suiteEnds[0].payload.uid)

        const testStarts = events.filter((e) => e.event === 'test:start')
        expect(testStarts.map((e) => [e.payload.title, e.payload.parent, e.payload.fullTitle])).toEqual([
            ['passing top-level qunit test', 'qunit-top-level.spec.cjs', 'qunit-top-level.spec.cjs.passing top-level qunit test'],
            ['failing top-level qunit test', 'qunit-top-level.spec.cjs', 'qunit-top-level.spec.cjs.failing top-level qunit test'],
            ['runtime skipped qunit test', 'qunit-top-level.spec.cjs', 'qunit-top-level.spec.cjs.runtime skipped qunit test']
        ])

        // Spec reporter displays every test and the failure details
        expect(out.spec).toContain('qunit-top-level.spec.cjs')
        expect(out.spec).toContain('passing top-level qunit test')
        expect(out.spec).toContain('failing top-level qunit test')
        expect(out.spec).toContain('static skipped qunit test')
        expect(out.spec).toContain('runtime skipped qunit test')
        expect(out.spec).toContain('boom from qunit')
        expect(out.spec).toContain('1 passing')
        expect(out.spec).toContain('1 failing')
        expect(out.spec).toContain('2 skipped')

        // JUnit reporter emits a testsuite with all 4 testcases (not empty)
        expect(out.junit).toContain('<testsuite ')
        expect(out.junit).toMatch(/tests="4"/)
        expect(out.junit).toMatch(/failures="1"/)
        expect(out.junit).toMatch(/skipped="2"/)
        expect(out.junit).toContain('passing top level qunit test')
        expect(out.junit).toContain('failing top level qunit test')
        expect(out.junit).toContain('boom from qunit')

        // Concise reporter lists the failed test and error message
        expect(out.concise).toContain('Test failed (1)')
        expect(out.concise).toContain('failing top-level qunit test')
        expect(out.concise).toContain('boom from qunit')
    })

    test('closes the synthetic wrapper suite before a real suite starts', async () => {
        const dir = makeTempDir()
        const specFile = path.join(dir, 'mixed-qunit.spec.cjs')
        fs.writeFileSync(specFile, `
test('before any suite', () => {})

suite('Named QUnit Suite')

test('inside named suite', () => {})
`)

        const { failures, events, out } = await runWithReporters({
            rootDir: dir,
            specs: [specFile],
            mochaOpts: { ui: 'qunit' }
        })

        expect(failures).toBe(0)

        const suiteFlow = events
            .filter((e) => e.event === 'suite:start' || e.event === 'suite:end' || e.event === 'test:start')
            .map((e) => [e.event, e.payload.title])

        expect(suiteFlow).toEqual([
            ['suite:start', 'mixed-qunit.spec.cjs'],
            ['test:start', 'before any suite'],
            ['suite:end', 'mixed-qunit.spec.cjs'],
            ['suite:start', 'Named QUnit Suite'],
            ['test:start', 'inside named suite'],
            ['suite:end', 'Named QUnit Suite']
        ])

        expect(out.spec).toContain('before any suite')
        expect(out.spec).toContain('Named QUnit Suite')
        expect(out.spec).toContain('inside named suite')
        expect(out.junit).toMatch(/tests="2"/)
    })

    test('opens separate wrapper suites when multiple specs have root-level tests', async () => {
        const dir = makeTempDir()
        const firstSpec = path.join(dir, 'first.spec.cjs')
        const secondSpec = path.join(dir, 'second.spec.cjs')
        fs.writeFileSync(firstSpec, 'test(\'first root test\', () => {})\n')
        fs.writeFileSync(secondSpec, 'test(\'second root test\', () => {})\n')

        const { failures, events, out } = await runWithReporters({
            rootDir: dir,
            specs: [firstSpec, secondSpec],
            mochaOpts: { ui: 'qunit' }
        })

        expect(failures).toBe(0)
        const suiteFlow = events
            .filter((e) => e.event === 'suite:start' || e.event === 'suite:end' || e.event === 'test:start')
            .map((e) => [e.event, e.payload.title])

        expect(suiteFlow).toEqual([
            ['suite:start', 'first.spec.cjs'],
            ['test:start', 'first root test'],
            ['suite:end', 'first.spec.cjs'],
            ['suite:start', 'second.spec.cjs'],
            ['test:start', 'second root test'],
            ['suite:end', 'second.spec.cjs']
        ])
        expect(out.junit).toMatch(/tests="2"/)
    })

    test('reports failing root-level afterEach and after hooks under the wrapper suite', async () => {
        const dir = makeTempDir()
        const specFile = path.join(dir, 'hooks-qunit.spec.cjs')
        fs.writeFileSync(specFile, `
afterEach(() => {
    throw new Error('afterEach boom')
})

test('top-level test with failing afterEach', () => {})
`)

        const { failures, out } = await runWithReporters({
            rootDir: dir,
            specs: [specFile],
            mochaOpts: { ui: 'qunit' }
        })

        expect(failures).toBe(1)
        expect(out.spec).toContain('top-level test with failing afterEach')
        expect(out.spec).toContain('afterEach boom')
        expect(out.junit).toContain('afterEach boom')
        expect(out.concise).toContain('afterEach boom')
    })

    test('does not emit a synthetic wrapper suite for normal BDD specs with describe and root hooks', async () => {
        const dir = makeTempDir()
        const specFile = path.join(dir, 'normal-bdd.spec.cjs')
        fs.writeFileSync(specFile, `
before(() => {})
after(() => {})

describe('Regular Suite', () => {
    it('regular test', () => {})
})
`)

        const { failures, events } = await runWithReporters({
            rootDir: dir,
            specs: [specFile],
            mochaOpts: { ui: 'bdd' }
        })

        expect(failures).toBe(0)
        expect(events.filter((e) => e.event === 'suite:start').map((e) => e.payload.title)).toEqual(['Regular Suite'])
    })
})

describe('Mocha third-party and custom UIs', () => {
    test('loads a custom UI from a relative CJS file path and wraps hooks according to -qunit suffix', async () => {
        const dir = makeTempDir()
        const uiFile = path.join(dir, 'my-custom-qunit.cjs')
        fs.writeFileSync(uiFile, `
const Mocha = require('mocha')
module.exports = function myCustomQunit(suite) {
    suite.on('pre-require', function (context, file) {
        context.test = function (title, fn) {
            const t = new Mocha.Test(title, fn)
            t.file = file
            suite.addTest(t)
            return t
        }
    })
}
`)
        const specFile = path.join(dir, 'custom-cjs.spec.cjs')
        fs.writeFileSync(specFile, 'test(\'custom cjs ui test\', () => {})\n')

        const beforeTest = vi.fn()
        const afterTest = vi.fn()
        const { failures, out } = await runWithReporters({
            rootDir: dir,
            specs: [specFile],
            mochaOpts: { ui: './my-custom-qunit.cjs' },
            beforeTest: [beforeTest],
            afterTest: [afterTest]
        })

        expect(failures).toBe(0)
        expect(beforeTest).toHaveBeenCalledTimes(1)
        expect(afterTest).toHaveBeenCalledTimes(1)
        expect(out.spec).toContain('custom cjs ui test')
        expect(out.junit).toContain('custom cjs ui test')
    })

    test('loads a custom UI from a relative ESM file path (including top-level await)', async () => {
        const dir = makeTempDir()
        const uiFile = path.join(dir, 'my-custom-tdd.mjs')
        fs.writeFileSync(uiFile, `
import Mocha from ${JSON.stringify(mochaModuleUrl)}
await Promise.resolve()
export default function myCustomTdd(suite) {
    suite.on('pre-require', function (context, file) {
        context.suite = function (title, fn) {
            const s = Mocha.Suite.create(suite, title)
            s.file = file
            const prev = context.test
            context.test = function (testTitle, testFn) {
                const t = new Mocha.Test(testTitle, testFn)
                t.file = file
                s.addTest(t)
                return t
            }
            fn()
            context.test = prev
            return s
        }
    })
}
`)
        const specFile = path.join(dir, 'custom-esm.spec.cjs')
        fs.writeFileSync(specFile, `
suite('ESM Custom Suite', () => {
    test('custom esm ui test', () => {})
})
`)

        const { failures, out } = await runWithReporters({
            rootDir: dir,
            specs: [specFile],
            mochaOpts: { ui: './my-custom-tdd.mjs' }
        })

        expect(failures).toBe(0)
        expect(out.spec).toContain('ESM Custom Suite')
        expect(out.spec).toContain('custom esm ui test')
        expect(out.junit).toContain('custom esm ui test')
    })

    test('supports passing a custom UI function directly in mochaOpts.ui', async () => {
        const dir = makeTempDir()
        const specFile = path.join(dir, 'custom-fn.spec.cjs')
        fs.writeFileSync(specFile, 'myCase(\'inline function ui test\', () => {})\n')

        const customUi = (suite: Mocha.Suite) => {
            suite.on('pre-require', (context: Record<string, unknown>, file: string) => {
                context.myCase = (title: string, fn: Mocha.Func) => {
                    const t = new Mocha.Test(title, fn)
                    t.file = file
                    suite.addTest(t)
                    return t
                }
            })
        }

        const { failures, out } = await runWithReporters({
            rootDir: dir,
            specs: [specFile],
            mochaOpts: { ui: customUi }
        })

        expect(failures).toBe(0)
        expect(out.spec).toContain('inline function ui test')
        expect(out.junit).toContain('inline function ui test')
    })

    test('loads a third-party UI package from rootDir/node_modules and via mochaOpts.require registration', async () => {
        const dir = makeTempDir()
        const pkgDir = path.join(dir, 'node_modules', 'mocha-demo-qunit')
        fs.mkdirSync(pkgDir, { recursive: true })
        fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({
            name: 'mocha-demo-qunit',
            version: '1.0.0',
            main: 'index.cjs'
        }))
        fs.writeFileSync(path.join(pkgDir, 'index.cjs'), `
const Mocha = require('mocha')
module.exports = function demoQunit(suite) {
    suite.on('pre-require', function (context, file) {
        context.test = function (title, fn) {
            const t = new Mocha.Test(title, fn)
            t.file = file
            suite.addTest(t)
            return t
        }
    })
}
`)

        const regPkgDir = path.join(dir, 'node_modules', 'mocha-register-ui-plugin')
        fs.mkdirSync(regPkgDir, { recursive: true })
        fs.writeFileSync(path.join(regPkgDir, 'package.json'), JSON.stringify({
            name: 'mocha-register-ui-plugin',
            version: '1.0.0',
            main: 'index.cjs'
        }))
        const uiName = 'registered-demo-qunit'
        registeredInterfaces.push(uiName)
        fs.writeFileSync(path.join(regPkgDir, 'index.cjs'), `
const Mocha = require('mocha')
Mocha.interfaces['${uiName}'] = function (suite) {
    suite.on('pre-require', function (context, file) {
        context.test = function (title, fn) {
            const t = new Mocha.Test(title, fn)
            t.file = file
            suite.addTest(t)
            return t
        }
    })
}
`)

        const specFile = path.join(dir, 'pkg-ui.spec.cjs')
        fs.writeFileSync(specFile, 'test(\'third-party package ui test\', () => {})\n')

        const directPkgRun = await runWithReporters({
            rootDir: dir,
            specs: [specFile],
            mochaOpts: { ui: 'mocha-demo-qunit' }
        })
        expect(directPkgRun.failures).toBe(0)
        expect(directPkgRun.out.spec).toContain('third-party package ui test')
        expect(directPkgRun.out.junit).toContain('third party package ui test')

        const requiredPkgRun = await runWithReporters({
            rootDir: dir,
            specs: [specFile],
            mochaOpts: {
                require: ['mocha-register-ui-plugin'],
                ui: uiName
            }
        })
        expect(requiredPkgRun.failures).toBe(0)
        expect(requiredPkgRun.out.spec).toContain('third-party package ui test')
        expect(requiredPkgRun.out.junit).toContain('third party package ui test')
    })
})
