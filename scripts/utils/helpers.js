const shell = require('shelljs')
const path = require('path')

const getSubPackages = () => shell.ls(path.join(__dirname, '..', '..', 'packages')).filter((pkg) => (
    /**
     * ignore node_modules directory that is created by the link script to test the
     * wdio test runner
     */
    pkg !== 'node_modules' &&
    /**
     * ignore packages that don't need to be compiled
     */
    !['eslint-plugin-wdio', 'wdio-smoke-test-service', 'wdio-webdriver-mock-service'].includes(pkg)
))

module.exports = { getSubPackages }
