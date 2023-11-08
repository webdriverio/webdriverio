#!/usr/bin/env node
import { accessSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'

import chalk from 'chalk'
import shell from 'shelljs'

import { getSubPackages } from './utils/helpers.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const args: string[] = process.argv.slice(2)
const HAS_WATCH_FLAG = args[0] === '--watch'
const TSCONFIG_FILE = process.env.NODE_ENV === 'production' ? 'tsconfig.prod.json' : 'tsconfig.json'

if (HAS_WATCH_FLAG) {
    args.shift()
}

// Required to be compiled first
const PKG_TO_COMPILE_FIRST = [
    'wdio-types',
    'wdio-protocols',
    'wdio-logger',
    'wdio-utils',
    'wdio-config',
    'wdio-repl',
    'devtools',
    'webdriver',
    'webdriverio'
]

// Order of packages:
// 1. root packages
// 2. core packages (e.g. wdio-cli)
// 3. plugins (e.g. wdio-allure-reporter)
const ROOT_PACKAGES = [
    ...PKG_TO_COMPILE_FIRST,
    'wdio-globals',
    'wdio-runner',
    'wdio-local-runner',
    'wdio-mocha-framework',
    'wdio-browser-runner',
]

const ESM_CJS_PACKAGES = [
    'eslint-plugin-wdio',
    'wdio-allure-reporter',
    'wdio-globals',
    'wdio-reporter'
]

const CJS_PACKAGES = ['wdio-smoke-test-cjs-service']

const ESM_PACKAGES_WITH_CJS_FOLDER = ['devtools', 'wdio-cli', 'webdriver', 'webdriverio']

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
    }, [[], []] as string[][])

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

const esmPackages = packages.filter((pkg) => !CJS_PACKAGES.includes(pkg.split('/')[1]))
const cjsPackages = packages.filter((pkg) => CJS_PACKAGES.includes(pkg.split('/')[1]))

ESM_CJS_PACKAGES.forEach((pkg) => {
    if (packages.some((projectPath) => projectPath.split('/')[1] === pkg)) {
        cjsPackages.push(`packages/${pkg}/tsconfig.cjs.json`)
    }
})

const cmd = (packages: string[]) => `npx tsc -b ${packages.join(' ')}${HAS_WATCH_FLAG ? ' --watch' : ''}`

/**
 * if we build the project make sure root packages are compiled first
 */
const rootPkgs = packages.filter((p) => PKG_TO_COMPILE_FIRST.find((rp) => p.includes(`/${rp}/`)))
if (!HAS_WATCH_FLAG && rootPkgs.length) {
    const rootCmd = cmd(rootPkgs)
    console.log('\n' + chalk.cyan('Compiling Root packages'))
    console.log(rootCmd)
    shell.exec(rootCmd)
}

const esmCmd = cmd(esmPackages)
const cjsCmd = cmd(cjsPackages)

console.log('\n' + chalk.cyan('Compiling ESM packages'))
console.log(esmCmd)
const { code: esmCode } = shell.exec(esmCmd)

console.log('\n' + chalk.cyan('Compiling CJS packages'))
console.log(cjsCmd)
const { code: cjsCode } = shell.exec(cjsCmd)

if (!HAS_WATCH_FLAG) {
    console.log('\n' + chalk.grey('Removing `export {}` from CJS files compiled using module ESNext'))
    for (const pkg of ESM_PACKAGES_WITH_CJS_FOLDER) {
        const filePath = path.join(__dirname, '..', 'packages', pkg, 'build', 'cjs', 'index.js')
        const fileContent = await readFile(filePath, 'utf8')
        await writeFile(filePath, fileContent.toString().replace('export {};', ''), 'utf8')
    }

    /**
     * Fix type annotation in `@wdio/globals` package.
     *
     * For some reason TypeScript doesn't keep the type annotation comment in
     * `packages/wdio-globals/src/index.ts` in the first line. After compiling
     * the package it becomes:
     *
     * ```ts
     * /// <reference types="./standalone.js" />
     * /// <reference types="types.js" />
     * ```
     *
     * Which can't get resolved by TypeScript. Instead we want the original annotation
     * comment to be kept.
     */
    const filePath = path.join(__dirname, '..', 'packages', 'wdio-globals', 'build', 'index.d.ts')
    const fileContent = (await readFile(filePath, 'utf8')).toString().replace(/\/\/\/ <reference (types|path)(.*)/g, '')
    await writeFile(filePath, `/// <reference path="../types.d.ts" />${fileContent}`, 'utf8')
}

if (esmCode || cjsCode) {
    throw new Error('Failed compiling TypeScript files!')
}
