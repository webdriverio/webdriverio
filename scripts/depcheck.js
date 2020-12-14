#!/usr/bin/env node

const path = require('path')
const shell = require('shelljs')

const { getSubPackages } = require('./utils/helpers')

const packages = getSubPackages()

/**
 * set proper size of max listener
 */
require('events').EventEmitter.defaultMaxListeners = packages.length + 3

const ROOT_DIR = path.join(__dirname, '..')
const EXEC_OPTIONS = { silent: true, async: true }
const IGNORE_PACKAGES = {
    'wdio-reporter': ['cucumber']
}

;(async () => {
    shell.cd(ROOT_DIR)
    const brokenPackages = (await Promise.all(packages.map(async (pkg) => {
        const packagePath = path.join(ROOT_DIR, 'packages', pkg)
        let shellScript = `npx depcheck ${packagePath} --json --ignore-dirs build,tests`

        // Workaround for depcheck issue: https://github.com/depcheck/depcheck/issues/526
        if (IGNORE_PACKAGES[pkg]) {
            shellScript += ` --ignores="${IGNORE_PACKAGES[pkg].join(',')}"`
        }

        const shellResult = await new Promise((resolve, reject) => shell.exec(shellScript, EXEC_OPTIONS, (code, stdout, stderr) => {
            if (stderr) {
                return reject(stderr)
            }

            return resolve(stdout)
        }))

        const result = JSON.parse(shellResult)
        result.package = pkg
        result.packagePath = packagePath
        return result
    }))).filter((result) => Object.keys(result.missing).length)

    if (brokenPackages.length) {
        let message = ''

        for (const result of brokenPackages) {
            message += `🚨 Broken Dependencies in ${result.package} 🚨\n`
            for (const [missingPkg, usage] of Object.entries(result.missing)) {
                message += `  * ${missingPkg} missing, used in:\n`
                message += usage.map((file) => `    * ${file}`).join('\n')
                message += '\n'
            }
        }

        console.log(message)
        process.exit(1)
    }

    console.log('Depcheck passed!')
    process.exit(0)
})().catch((err) => {
    console.error('Depcheck failed:', err.stack)
    process.exit(1)
})

