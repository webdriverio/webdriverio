#!/usr/bin/env node
/**
 * This script initialises the playground by linking all package into the /test directory
 */

const path = require('node:path')
const shell = require('shelljs')

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
