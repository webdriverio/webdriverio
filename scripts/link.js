#!/usr/bin/env node
/**
 * This script initialises the playground by linking all package into the /test directory
 */

const path = require('path')
const shell = require('shelljs')

const packagesDir = path.join(__dirname, '..', 'packages')
const nodeModulesDir = path.join(__dirname, '..', 'packages', 'node_modules')

const packages = shell.ls(packagesDir)
shell.mkdir(nodeModulesDir)
packages.forEach(
    (pkg) => shell.ln('-s', path.join(packagesDir, pkg), path.join(nodeModulesDir, pkg))
)
