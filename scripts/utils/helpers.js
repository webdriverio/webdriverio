const shell = require('shelljs')
const path = require('path')

const { IGNORED_SUBPACKAGES_FOR_DOCS } = require('../constants')

const getSubPackages = () => shell.ls(path.join(__dirname, '..', '..', 'packages')).filter((pkg) => (
    /**
     * ignore node_modules directory that is created by the link script to test the
     * wdio test runner
     */
    pkg !== 'node_modules' &&
    /**
     * ignore packages that don't need to be compiled
     */
    !IGNORED_SUBPACKAGES_FOR_DOCS.includes(pkg)
))

module.exports = { getSubPackages }
