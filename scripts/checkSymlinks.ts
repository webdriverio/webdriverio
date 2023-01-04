#!/usr/bin/env node

import { lstatSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSubPackages } from './utils/helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')

/**
 * This script checks if lerna bootstrap symlinked all cross package dependencies correctly.
 * @see https://github.com/lerna/lerna/tree/main/commands/bootstrap
 */

const brokenPackages = new Set<[string, string]>()

const packages = getSubPackages()

packages.forEach((pkg) => {
    const packagePath = path.join(ROOT_DIR, 'packages', pkg)
    try {
        const wdioDependencies = readdirSync(path.join(packagePath, 'node_modules', '@wdio'))
        const crossPackageDependencies = [
            ...wdioDependencies.map((dep) => path.join(packagePath, 'node_modules', '@wdio', dep)),
            ...['devtools', 'webdriver', 'webdriverio'].map((dep) => path.join(packagePath, 'node_modules', dep)),
        ]
        crossPackageDependencies.forEach((dep) => {
            try {
                const stat = lstatSync(dep)
                const isSymlink = stat.isSymbolicLink()
                if (!isSymlink) {
                    brokenPackages.add([pkg, dep])
                }
            } catch {
            // ignore
            }
        })
    } catch {
        // ignore
    }
})

if (brokenPackages.size) {
    let message = ''

    for (const [pkg, dep] of brokenPackages) {
        message += `🚨 ${pkg} - ${dep} is not symlinked\n`
    }

    console.error(message)
    process.exit(1)
} else {
    console.log('✅ All cross package dependencies are symlinked')
}
