import assert from 'node:assert/strict'
import path from 'node:path'

assert.equal(globalThis.specFilesModuleLoaded, undefined, 'setup must run before the spec modules')
const specs = JSON.parse(process.env.WDIO_SPEC_FILES ?? 'null')
assert.ok(Array.isArray(specs), 'WDIO_SPEC_FILES must contain a JSON array')
assert.ok(specs.every(spec => path.isAbsolute(spec)), 'WDIO_SPEC_FILES must contain absolute file paths')
globalThis.specFilesFromRequire = specs
