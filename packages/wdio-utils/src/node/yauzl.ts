import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

/**
 * `extract-zip`, which `@puppeteer/browsers` 2 unzips with, hangs on Node 26 with a `yauzl`
 * older than 3.3.1: its read streams never emit `close` (#15608, thejoshwolfe/yauzl#169).
 * 3.3.1 and later (for example from an `overrides` entry) work there.
 * @returns `true` only when the `yauzl` that `extract-zip` loads is older than 3.3.1
 */
export function extractZipUsesFaultyYauzl (): boolean {
    try {
        const fromHere = createRequire(import.meta.url)
        const extractZip = createRequire(fromHere.resolve('@puppeteer/browsers')).resolve('extract-zip')
        let dir = path.dirname(createRequire(extractZip).resolve('yauzl'))
        while (!fs.existsSync(path.join(dir, 'package.json'))) {
            const parent = path.dirname(dir)
            if (parent === dir) {
                return false
            }
            dir = parent
        }
        const { version } = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as { version?: string }
        const [major, minor, patch] = (version ?? '').split('.').map((part) => parseInt(part, 10))
        return major < 3 || (major === 3 && (minor < 3 || (minor === 3 && patch < 1)))
    } catch {
        // not readable: keep the `extract-zip` path, as before
        return false
    }
}
