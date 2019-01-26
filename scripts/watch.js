#!/usr/bin/env node

const path = require('path')
const shell = require('shelljs')

const { getSubPackages } = require('./utils/helpers')

const packages = getSubPackages()

/**
 * set proper size of max listener
 */
require('events').EventEmitter.defaultMaxListeners = packages.length + 3

shell.cd(path.join(__dirname, '..'))
packages.forEach(
    (pkg) => shell.exec(`lerna exec 'npm run compile -- --watch --source-maps inline' --scope ${pkg.replace('wdio-', '@wdio/')}`, { async: true })
)
