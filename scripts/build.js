#!/usr/bin/env node
import { accessSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import shell from 'shelljs'
import { getSubPackages } from './utils/helpers.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
const HAS_WATCH_FLAG = args[0] === '--watch'
const TSCONFIG_FILE = process.env.NODE_ENV === 'production' ? 'tsconfig.prod.json' : 'tsconfig.json'

if (HAS_WATCH_FLAG) {
    args.shift()
}

// Order of packages:
// 1. root packages
// 2. core packages (e.g. wdio-cli)
// 3. plugins (e.g. wdio-allure-reporter)
const ROOT_PACKAGES = [
    'wdio-types',
    'wdio-protocols',
    'wdio-logger',
    'wdio-utils',
    'wdio-config',
    'wdio-repl',
    'webdriver',
    'devtools',
    'webdriverio',
    'wdio-globals',
    'wdio-runner',
    'wdio-local-runner',
    'wdio-mocha-framework',
    'wdio-browser-runner'
]

const BUILD_CJS = [
    'eslint-plugin-wdio',
    'wdio-allure-reporter',
    'wdio-globals',
    'webdriver'
]

const packages = getSubPackages()
    /**
     * Filter out packages that don't need compiling
     */
    .filter((pkg) => {
        try {
            accessSync(`packages/${pkg}/${TSCONFIG_FILE}`)
            return true
        } catch (err) {
            return false
        }
    })

    /**
     * Deduplicate root packages
     */
    .filter((pkg) => !ROOT_PACKAGES.includes(pkg))

    /**
     * Divide packages into core (e.g. wdio-cli) and
     * plugins (wdio-allure-reporter)
     */
    .reduce((acc, pkg) => {
        const tokens = pkg.split('-')
        acc[tokens.length > 2 ? 1 : 0].push(pkg)
        return acc
    }, [[], []])

    /**
     * Concat all groups of packages, with root packages as first
     */
    .reduce((acc, collection) => acc.concat(collection), ROOT_PACKAGES)

    /**
     * Only build packages that are passed in as params
     */
    .filter((pkg) => args.length === 0 || args.includes(pkg))

    /**
     * map tsconfig path
     */
    .map((pkg) => `packages/${pkg}/${TSCONFIG_FILE}`)

shell.cd(path.join(__dirname, '..'))

/**
 * Add CJS compiling for packages in BUILD_CJS
 */
BUILD_CJS.forEach((pkg) => {
    if (packages.some((projectPath) => projectPath.split('/')[1] === pkg)) {
        packages.push(`packages/${pkg}/tsconfig.cjs.json`)
    }
})

const cmd = `npx tsc -b ${packages.join(' ')}${HAS_WATCH_FLAG ? ' --watch' : ''}`

console.log(cmd)
const { code } = shell.exec(cmd)

if (!HAS_WATCH_FLAG) {
    console.log('\nRemoving `export {}` from CJS files')
    for (const pkg of ['devtools', 'webdriverio']) {
        const filePath = path.join(__dirname, '..', 'packages', pkg, 'build', 'cjs', 'index.js')
        const fileContent = await readFile(filePath, 'utf8')
        await writeFile(filePath, fileContent.toString().replace('export {};', ''), 'utf8')
    }
}

if (code) {
    throw new Error('Failed compiling TypeScript files!')
}
