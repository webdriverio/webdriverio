/**
 * An uncaught error inside a component test must fail that test through Mocha,
 * not end the whole spec (#14216). The spec fails on purpose, so this script
 * runs it and checks the result.
 */
import url from 'node:url'
import path from 'node:path'
import assert from 'node:assert'
import { spawnSync } from 'node:child_process'

const e2eDir = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const { status, stdout, stderr } = spawnSync(
    'npx',
    ['wdio', './browser-runner/wdio.conf.js', '--spec', 'uncaughtError.check.ts'],
    { cwd: e2eDir, encoding: 'utf8', shell: process.platform === 'win32' }
)
const output = `${stdout}\n${stderr}`

try {
    assert.notStrictEqual(status, 0, 'the spec has a failing test, so wdio must exit with an error')
    assert.ok(!output.includes('Test failed due to following error(s)'), 'the uncaught error ended the whole spec')
    assert.ok(output.includes('uncaught error in test 2'), 'Mocha did not report the uncaught error')
    assert.ok(/\b2 passing\b/.test(output), 'tests 1 and 3 did not pass')
    /**
     * the failure list names a test with its suite; the failure count is not
     * checked, because Mocha also counts an uncaught error twice with the local runner
     */
    assert.ok(output.includes('uncaught error during a test fails with the uncaught error'), 'test 2 did not fail')
    assert.ok(!output.includes('uncaught error during a test passes before the uncaught error'), 'test 1 failed')
    assert.ok(!output.includes('uncaught error during a test still runs after the uncaught error'), 'test 3 failed')
} catch (err) {
    console.error(output)
    throw err
}
console.log('uncaught error check passed: tests 1 and 3 pass, test 2 fails')
