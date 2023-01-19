#!/usr/bin/env node
/**
 * This script initialises the playground by linking all package into the specified directory
 */

import url from 'node:url'
import path from 'node:path'
import shell from 'shelljs'

if (process.argv.length < 3) {
    console.log('Usage: link.js <directory>')
    process.exit(1)
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const destDir = process.argv[2]

const packagesDir = path.join(__dirname, '..', 'packages')
const nodeModulesDir = path.join(__dirname, '..', destDir, 'node_modules')
const nodeModulesWDIODir = path.join(__dirname, '..', destDir, 'node_modules', '@wdio')

const packages = shell.ls(packagesDir)
shell.mkdir('-p', nodeModulesDir)
shell.mkdir('-p', nodeModulesWDIODir)
packages.forEach(
    (pkg) => shell.ln(
        '-s',
        path.join(packagesDir, pkg),
        pkg.startsWith('wdio-')
            ? path.join(nodeModulesWDIODir, pkg.replace('wdio-', ''))
            : path.join(nodeModulesDir, pkg)
    )
)
