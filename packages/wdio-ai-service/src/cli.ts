import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'

import { cacheFileFor, type CacheFile } from './cache.js'
import { eject } from './eject.js'

const USAGE = `Usage: wdio-ai eject <spec...> [--test <title>] [--cache-dir <dir>] [--dry-run]

Replace act() calls in specs with the WebdriverIO code recorded for them in
their cache files: the entry of the call's \`id\`, or of its test and position
in the test. The instruction stays as a comment.

Options:
  --test <title>      only eject the calls of this test (full title)
  --cache-dir <dir>   where the cache files are (default: __act__ next to the spec)
  --dry-run           print the result instead of writing the spec`

/**
 * `wdio-ai <command>`, returns the exit code
 */
export async function runCli (argv: string[], out: (line: string) => void = console.log): Promise<number> {
    let parsed: ReturnType<typeof parse>
    try {
        parsed = parse(argv)
    } catch (err) {
        out(`${(err as Error).message}\n\n${USAGE}`)
        return 1
    }
    const [command, ...specs] = parsed.positionals
    if (parsed.values.help || !command) {
        out(USAGE)
        return command || parsed.values.help ? 0 : 1
    }
    if (command !== 'eject' || !specs.length) {
        out(USAGE)
        return 1
    }

    let failed = false
    for (const spec of specs) {
        const specPath = path.resolve(spec)
        const cacheFile = cacheFileFor(specPath, parsed.values['cache-dir'])
        let cache: CacheFile
        try {
            cache = JSON.parse(await fs.readFile(cacheFile, 'utf-8'))
        } catch {
            out(`${spec}: no cache file at ${path.relative(process.cwd(), cacheFile)}, run the spec once to record it`)
            failed = true
            continue
        }
        const source = await fs.readFile(specPath, 'utf-8')
        const result = eject(source, cache, { test: parsed.values.test, filename: specPath })
        for (const { instruction, steps } of result.ejected) {
            out(`${spec}: ejected "${instruction}" (${steps} step${steps === 1 ? '' : 's'})`)
        }
        for (const { instruction, reason } of result.skipped) {
            out(`${spec}: skipped "${instruction}": ${reason}`)
        }
        if (parsed.values['dry-run']) {
            out(result.source)
        } else if (result.ejected.length) {
            await fs.writeFile(specPath, result.source)
        }
    }
    return failed ? 1 : 0
}

function parse (argv: string[]) {
    return parseArgs({
        args: argv,
        allowPositionals: true,
        options: {
            test: { type: 'string' },
            'cache-dir': { type: 'string' },
            'dry-run': { type: 'boolean' },
            help: { type: 'boolean', short: 'h' }
        }
    })
}
