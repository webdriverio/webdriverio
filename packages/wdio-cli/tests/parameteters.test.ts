import path from 'node:path'
import url from 'node:url'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import run from '../src/run.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

vi.mock('@wdio/utils', async (importOriginal) => {
    const actual = await importOriginal() as any
    return {
        ...actual,
        duration: {
            start: vi.fn(),
            end: vi.fn(),
            reset: vi.fn(),
            getSummary: vi.fn(() => '100ms (setup 50ms, prepare 25ms, execute 20ms, complete 5ms)')
        }
    }
})

vi.mock('../src/launcher', () => ({
    default: class MockLauncher {
        constructor (public path: string, public params: any) {}
        run () {
            return ({
                then: () => ({
                    catch: () => this
                })
            })
        }
    }
}))

describe('framework parameter conversion', () => {
    beforeEach(() => {
        process.argv.splice(2, Infinity)
    })

    it('should proper transform cucumberOpts', async () => {
        process.argv.push(
            path.resolve(__dirname, '__fixtures__', 'wdio.conf.js'),
            '--cucumberOpts.name', 'mocha',
            '--cucumberOpts.paths', '/foo/bar',
            '--cucumberOpts.backtrace', 'true',
            '--cucumberOpts.dryRun', 'true',
            '--cucumberOpts.forceExit', 'true',
            '--cucumberOpts.failFast', 'true',
            '--cucumberOpts.format', 'foo',
            '--cucumberOpts.formatOptions', '{"someOption":true}',
            '--cucumberOpts.import', 'foo',
            '--cucumberOpts.language', 'en',
            '--cucumberOpts.order', 'defined',
            '--cucumberOpts.publish', 'true',
            '--cucumberOpts.require', 'foo',
            '--cucumberOpts.requireModule', 'foo',
            '--cucumberOpts.retry', '123',
            '--cucumberOpts.strict', 'true',
            '--cucumberOpts.tags', 'foo',
            '--cucumberOpts.worldParameters', '{"appUrl":"http://localhost:3000/"}',
            '--cucumberOpts.timeout', '123',
            '--cucumberOpts.scenarioLevelReporter', 'true',
            '--cucumberOpts.tagsInTitle', 'true',
            '--cucumberOpts.ignoreUndefinedDefinitions', 'true',
            '--cucumberOpts.failAmbiguousDefinitions', 'true',
            '--cucumberOpts.tagExpression', 'foo',
            '--cucumberOpts.profiles', 'foo',
            '--cucumberOpts.file', 'foo'
        )

        const { params } = await run() as any
        expect(params.cucumberOpts).toMatchInlineSnapshot(`
          {
            "backtrace": true,
            "dryRun": true,
            "failAmbiguousDefinitions": true,
            "failFast": true,
            "file": "foo",
            "forceExit": true,
            "format": [
              "foo",
            ],
            "formatOptions": {
              "someOption": true,
            },
            "ignoreUndefinedDefinitions": true,
            "import": [
              "foo",
            ],
            "language": "en",
            "name": [
              "mocha",
            ],
            "order": "defined",
            "paths": [
              "/foo/bar",
            ],
            "profiles": [
              "foo",
            ],
            "publish": true,
            "require": "foo",
            "requireModule": [
              "foo",
            ],
            "retry": 123,
            "scenarioLevelReporter": true,
            "strict": true,
            "tagExpression": "foo",
            "tags": "foo",
            "tagsInTitle": true,
            "timeout": 123,
            "worldParameters": {
              "appUrl": "http://localhost:3000/",
            },
          }
        `)
    })

    it('should proper transform mochaOpts', async () => {
        process.argv.push(
            path.resolve(__dirname, '__fixtures__', 'wdio.conf.js'),
            '--mochaOpts.require', 'foo',
            '--mochaOpts.compilers', 'foo',
            '--no-mochaOpts.allowUncaught',
            '--mochaOpts.asyncOnly', 'true',
            '--mochaOpts.bail',
            '--mochaOpts.checkLeaks', 'false',
            '--mochaOpts.delay', 'true',
            '--mochaOpts.fgrep', 'foo',
            '--mochaOpts.forbidOnly', 'false',
            '--mochaOpts.forbidPending', 'true',
            '--no-mochaOpts.fullTrace', 'false',
            '--mochaOpts.global', 'foo',
            '--mochaOpts.grep', 'foo',
            '--mochaOpts.invert', 'true',
            '--mochaOpts.retries', '123',
            '--mochaOpts.timeout', '456',
            '--mochaOpts.ui', 'foo'
        )
        const { params } = await run() as any
        expect(params.mochaOpts).toMatchInlineSnapshot(`
          {
            "allowUncaught": false,
            "asyncOnly": true,
            "bail": true,
            "checkLeaks": false,
            "compilers": [
              "foo",
            ],
            "delay": true,
            "fgrep": "foo",
            "forbidOnly": false,
            "forbidPending": true,
            "fullTrace": false,
            "global": [
              "foo",
            ],
            "grep": "foo",
            "invert": true,
            "require": [
              "foo",
            ],
            "retries": 123,
            "timeout": 456,
            "ui": "foo",
          }
        `)
    })

    it('should proper transform jasmineOpts', async () => {
        process.argv.push(
            path.resolve(__dirname, '__fixtures__', 'wdio.conf.js'),
            '--jasmineOpts.defaultTimeoutInterval', '123',
            '--jasmineOpts.helpers', 'foo',
            '--jasmineOpts.requires', 'foo',
            '--jasmineOpts.random', 'true',
            '--jasmineOpts.seed', 'foo',
            '--jasmineOpts.failFast', 'true',
            '--jasmineOpts.failSpecWithNoExpectations', 'true',
            '--jasmineOpts.oneFailurePerSpec', 'true',
            '--jasmineOpts.grep', 'foo',
            '--jasmineOpts.invertGrep', 'true',
            '--jasmineOpts.cleanStack', 'true',
            '--jasmineOpts.stopOnSpecFailure', 'true',
            '--jasmineOpts.stopSpecOnExpectationFailure', 'true',
            '--jasmineOpts.requireModule', 'foo'
        )
        const { params } = await run() as any
        expect(params.jasmineOpts).toMatchInlineSnapshot(`
          {
            "cleanStack": true,
            "defaultTimeoutInterval": 123,
            "failFast": true,
            "failSpecWithNoExpectations": true,
            "grep": "foo",
            "helpers": [
              "foo",
            ],
            "invertGrep": true,
            "oneFailurePerSpec": true,
            "random": true,
            "requireModule": [
              "foo",
            ],
            "requires": [
              "foo",
            ],
            "seed": "foo",
            "stopOnSpecFailure": true,
            "stopSpecOnExpectationFailure": true,
          }
        `)
    })
})
