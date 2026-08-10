// Fake `wdio` binary for reproduce-path tests: writes a trace-*.zip into
// <cwd>/test-results (the directory the reproduce runner scans) and exits
// 0, or 1 when invoked with --fail.
import fs from 'node:fs'
import path from 'node:path'

const out = path.join(process.cwd(), 'test-results')
fs.mkdirSync(out, { recursive: true })
// minimal valid ZIP (empty archive): END header + zeros
const emptyZip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x05, 0x06]), Buffer.alloc(18)])
fs.writeFileSync(path.join(out, `trace-${Date.now()}.zip`), emptyZip)
process.exit(process.argv.includes('--fail') ? 1 : 0)
