#!/usr/bin/env node

import url from 'node:url'
import path from 'node:path'
import { EventEmitter } from 'node:events'

import depcheck from 'depcheck'
import type { Options, Results } from 'depcheck'

import { getSubPackages } from './utils/helpers.js'

type IgnoredPackages = Record<string, string[]>
interface BrokenPackages extends Results {
    package?: string
    packagePath?: string
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const packages = getSubPackages()

/**
 * set proper size of max listener
 */
EventEmitter.defaultMaxListeners = packages.length + 3

const ROOT_DIR = path.join(__dirname, '..')

const IGNORE_PACKAGES: IgnoredPackages = {
    'wdio-browser-runner': ['virtual:wdio', 'mocha'],
}

const brokenPackages = (await Promise.all(packages.map(async (pkg) => {
    const packagePath = path.join(ROOT_DIR, 'packages', pkg)
    const depcheckOptions: Options = {
        ignorePatterns: ['build', 'tests'],
    }

    // Workaround for depcheck issue: https://github.com/depcheck/depcheck/issues/526
    if (IGNORE_PACKAGES[pkg]) {
        depcheckOptions.ignoreMatches = IGNORE_PACKAGES[pkg]
    }

    const result: BrokenPackages = await depcheck(packagePath, depcheckOptions)
    result.package = pkg
    result.packagePath = packagePath
    return result
}))).filter((result) => Object.keys(result.missing).length)

if (brokenPackages.length) {
    let message = ''

    for (const result of brokenPackages) {
        message += `🚨 Broken Dependencies in ${result.package} 🚨\n`
        for (const [missingPkg, usage] of Object.entries(result.missing)) {
            message += `  * ${missingPkg} missing, used in:\n`
            message += usage.map((file) => `    * ${file}`).join('\n')
            message += '\n'
        }
    }

    console.log(message)
    process.exit(1)
}

console.log('Depcheck passed!')
process.exit(0)
