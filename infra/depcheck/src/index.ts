#!/usr/bin/env node

import path from 'node:path'
import { EventEmitter } from 'node:events'

import depcheck from 'depcheck'
import type { Options, Results } from 'depcheck'
import { getSubPackages, getRootDir } from '@wdio/repo-utils'

export type IgnoredPackages = Record<string, string[]>
export interface BrokenPackages extends Results {
    package?: string
    packagePath?: string
}

/**
 * Workaround for depcheck issue: https://github.com/depcheck/depcheck/issues/526
 */
export const IGNORE_PACKAGES: IgnoredPackages = {
    'wdio-browser-runner': ['virtual:wdio', 'mocha', '@nuxt/kit', 'unimport', 'unimport/unplugin', '@stencil/core']
}

export function formatBrokenPackages(brokenPackages: BrokenPackages[]) {
    let message = ''

    for (const result of brokenPackages) {
        message += `🚨 Broken Dependencies in ${result.package} 🚨\n`
        for (const [missingPkg, usage] of Object.entries(result.missing)) {
            message += `  * ${missingPkg} missing, used in:\n`
            message += usage.map((file) => `    * ${file}`).join('\n')
            message += '\n'
        }
    }

    return message
}

export interface DepcheckOptions {
    rootDir?: string
    packages?: string[]
}

export async function checkDependencies(options: DepcheckOptions = {}) {
    const rootDir = options.rootDir ?? getRootDir()
    const packages = options.packages ?? getSubPackages()

    /**
     * set proper size of max listener
     */
    EventEmitter.defaultMaxListeners = packages.length + 3

    const brokenPackages = (await Promise.all(packages.map(async (pkg) => {
        const packagePath = path.join(rootDir, 'packages', pkg)
        const depcheckOptions: Options = {
            ignorePatterns: ['build', 'tests'],
        }

        if (IGNORE_PACKAGES[pkg]) {
            depcheckOptions.ignoreMatches = IGNORE_PACKAGES[pkg]
        }

        const result: BrokenPackages = await depcheck(packagePath, depcheckOptions)
        result.package = pkg
        result.packagePath = packagePath
        return result
    }))).filter((result) => Object.keys(result.missing).length)

    return brokenPackages
}

