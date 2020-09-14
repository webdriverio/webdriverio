#!/usr/bin/env node

const path = require('path')
const shell = require('shelljs')

const { getSubPackages } = require('./utils/helpers')

const IGNORE_COMPILING_FOR_PACKAGES = ['eslint-plugin-wdio', 'wdio-protocols']
const args = process.argv.slice(2)
const HAS_WATCH_FLAG = args[0] === '--watch'
const TSCONFIG_FILE = process.env.NODE_ENV === 'production' ? 'tsconfig.prod.json' : 'tsconfig.json'

if (HAS_WATCH_FLAG) {
    args.shift()
}

const packages = getSubPackages()
    /**
     * filter out packages that don't need compiling
     */
    .filter((pkg) => !IGNORE_COMPILING_FOR_PACKAGES.includes(pkg))
    /**
     * only build packages that are passed in as params
     */
    .filter((pkg) => args.length === 0 || args.includes(pkg))

shell.cd(path.join(__dirname, '..'))
const cmd = `npx tsc -b ${packages.map((pkg) => `packages/${pkg}/${TSCONFIG_FILE}`).join(' ')}${HAS_WATCH_FLAG ? ' --watch' : ''}`

console.log(cmd)
shell.exec(cmd)
