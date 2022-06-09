#!/usr/bin/env node
/**
 * This script initialises the playground by linking all package into the /test directory
 */

import url from 'node:url'
import path from 'node:path'
import shell from 'shelljs'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const packagesDir = path.join(__dirname, '..', 'packages')
const nodeModulesDir = path.join(__dirname, '..', 'packages', 'node_modules')
const nodeModulesWDIODir = path.join(__dirname, '..', 'packages', 'node_modules', '@wdio')

const packages = shell.ls(packagesDir)
shell.mkdir(nodeModulesDir)
shell.mkdir(nodeModulesWDIODir)
packages.forEach(
    (pkg) => shell.ln(
        '-s',
        path.join(packagesDir, pkg),
        pkg.startsWith('wdio-')
            ? path.join(nodeModulesWDIODir, pkg.replace('wdio-', ''))
            : path.join(nodeModulesDir, pkg)
    )
)
