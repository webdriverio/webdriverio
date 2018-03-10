#!/usr/bin/env node

const path = require('path')
const shell = require('shelljs')

const packages = shell.ls(path.join(__dirname, '..', 'packages')).filter(
    /**
     * ignore node_modules directory that is created by the link script to test the
     * wdio test runner
     */
    (pkg) => pkg !== 'node_modules'
)

/**
 * set proper size of max listener
 */
require('events').EventEmitter.defaultMaxListeners = packages.length + 3

shell.cd(path.join(__dirname, '..'))
packages.forEach(
    (pkg) => shell.exec(`lerna exec 'npm run compile -- --watch --source-maps inline' --scope ${pkg}`, { async: true })
)
