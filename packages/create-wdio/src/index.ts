import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

import chalk from 'chalk'
import semver from 'semver'
import { Command } from 'commander'
import { resolve } from 'import-meta-resolve'

import { runProgram, getPackageVersion } from './utils.js'
import {
    ASCII_ROBOT, PROGRAM_TITLE, UNSUPPORTED_NODE_VERSION, DEFAULT_NPM_TAG,
    INSTALL_COMMAND, DEV_FLAG, SUPPORTED_PACKAGE_MANAGERS, EXECUTER, EXECUTE_COMMAND
} from './constants.js'
import type { ProgramOpts } from './types.js'

const WDIO_COMMAND = 'wdio'
let projectDir: string | undefined

export async function run(operation = createWebdriverIO) {
    const version = await getPackageVersion()

    /**
     * print program ASCII art
     */
    if (!(process.argv.includes('--version') || process.argv.includes('-v'))) {
        console.log(ASCII_ROBOT, PROGRAM_TITLE)
    }

    /**
     * ensure right Node.js version is used
     */
    const unsupportedNodeVersion = !semver.satisfies(process.version, '>=18.18.0')
    if (unsupportedNodeVersion) {
        console.log(chalk.yellow(UNSUPPORTED_NODE_VERSION))
        return
    }

    const program = new Command(WDIO_COMMAND)
        .version(version, '-v, --version')
        .arguments('[project-path]')
        .usage(`${chalk.green('[project-path]')} [options]`)
        .action(name => (projectDir = name))

        .option('-t, --npm-tag <tag>', 'Which NPM version you like to install, e.g. @next', DEFAULT_NPM_TAG)
        .option('-y, --yes', 'will fill in all config defaults without prompting', false)
        .option('-d, --dev', 'Install all packages as into devDependencies', true)

        .allowUnknownOption()
        .on('--help', () => console.log())
        .parse(process.argv)

    return operation(program.opts())
}

/**
 * detects the package manager that was used
 * uses the environment variable `npm_config_user_agent` to detect the package manager
 * falls back to `npm` if no package manager could be detected
 */
function detectPackageManager() {
    if (!process.env.npm_config_user_agent) {
        return 'npm'
    }
    const detectedPM = process.env.npm_config_user_agent.split('/')[0].toLowerCase()

    const matchedPM = SUPPORTED_PACKAGE_MANAGERS.find(pm => pm.toLowerCase() === detectedPM)

    return matchedPM || 'npm'
}

export async function createWebdriverIO(opts: ProgramOpts) {
    const npmTag = opts.npmTag.startsWith('@') ? opts.npmTag : `@${opts.npmTag}`
    const root = path.resolve(process.cwd(), projectDir || '')

    /**
     * find package manager that was used to create project
     */
    const pm = detectPackageManager()

    const hasPackageJson = await fs.access(path.resolve(root, 'package.json')).then(() => true).catch(() => false)
    if (!hasPackageJson) {
        await fs.mkdir(root, { recursive: true })
        await fs.writeFile(path.resolve(root, 'package.json'), JSON.stringify({
            name: root.substring(root.lastIndexOf(path.sep) + 1),
            type: 'module'
        }, null, 2))
    }

    const cliInstalled = await isCLIInstalled(root)
    if (!cliInstalled) {
        console.log(`\nInstalling ${chalk.bold('@wdio/cli')} to initialize project...`)
        const args = [INSTALL_COMMAND[pm]]
        if (opts.dev) {
            args.push(DEV_FLAG[pm])
        }
        args.push(`@wdio/cli${npmTag}`)
        await runProgram(pm, args, { cwd: root, stdio: 'ignore' })
        console.log(chalk.green.bold('✔ Success!'))
    }

    return runProgram(EXECUTER[pm], [
        EXECUTE_COMMAND[pm],
        WDIO_COMMAND,
        'config',
        ...(opts.yes ? ['--yes'] : []),
        ...(opts.npmTag ? ['--npm-tag', opts.npmTag] : [])
    ].filter(i => !!i), { cwd: root })
}

async function isCLIInstalled(path: string) {
    try {
        // can be replaced with import.meta.resolve('@wdio/cli', new URL(`file:///${root}`).href) in the future
        // check if the cli is installed in the project
        resolve('@wdio/cli', pathToFileURL(path).href)
        return true
    } catch {
        // check of the cli is installed globally
        // wrap in try/catch as it can fail on Windows
        try {
            const output = execSync('npm ls -g', {
                encoding: 'utf-8',
                stdio: ['ignore', 'pipe', 'ignore']
            })
            if (output.includes('@wdio/cli')) {
                return true
            }
        } catch {
            return false
        }

        return false
    }
}
