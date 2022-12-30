#!/usr/bin/env node

/**
 * This script initialises the playground by linking all package into the /test directory
 */

import { mkdirSync, readdirSync } from 'node:fs'
import { symlink } from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const packagesDir = path.join(__dirname, '..', 'packages')
const nodeModulesDir = path.join(__dirname, '..', 'packages', 'node_modules')
const nodeModulesWDIODir = path.join(__dirname, '..', 'packages', 'node_modules', '@wdio')

const packages = readdirSync(packagesDir)
mkdirSync(nodeModulesDir, { recursive: true })
mkdirSync(nodeModulesWDIODir, { recursive: true })

await Promise.all(packages.map(
    (pkg) => symlink(
        path.join(packagesDir, pkg),
        pkg.startsWith('wdio-')
            ? path.join(nodeModulesWDIODir, pkg.replace('wdio-', ''))
            : path.join(nodeModulesDir, pkg)
    )
))
