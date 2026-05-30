import fss from 'node:fs'
import type { Argv } from 'yargs'

import { CLI_EPILOGUE
} from '../constants.js'
import {
    parseAnswers,
    runConfigCommand,
} from './utils.js'
import type { ConfigCommandArguments } from '../types.js'

let hasYarnLock = false
try {
    fss.accessSync('yarn.lock')
    hasYarnLock = true
} catch {
    hasYarnLock = false
}

export const command = 'config'
export const desc = 'Initialize WebdriverIO and setup configuration in your current project.'

export const cmdArgs = {
    yarn: {
        type: 'boolean',
        desc: 'Install packages via Yarn package manager.',
        default: hasYarnLock
    },
    yes: {
        alias: 'y',
        desc: 'will fill in all config defaults without prompting',
        type: 'boolean',
        default: false
    },
    npmTag: {
        alias: 't',
        desc: 'define NPM tag to use for WebdriverIO related packages',
        type: 'string',
        default: 'latest'
    }
} as const

export const builder = (yargs: Argv) => {
    return yargs
        .options(cmdArgs)
        .epilogue(CLI_EPILOGUE)
        .help()
}

export async function handler(argv: ConfigCommandArguments, runConfigCmd = runConfigCommand) {
    const parsedAnswers = await parseAnswers(argv.yes)
    await runConfigCmd(parsedAnswers, argv.npmTag)
    return {
        success: true,
        parsedAnswers,
        installedPackages: parsedAnswers.packagesToInstall.map((pkg) => pkg.split('--')[0])
    }
}

export { missingConfigurationPrompt, canAccessConfigPath  } from './utils.js'
export { formatConfigFilePaths } from '../utils.js'
