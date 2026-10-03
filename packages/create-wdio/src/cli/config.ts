import fss from 'node:fs'
import type { Argv } from 'yargs'

import { CLI_EPILOGUE
} from '../constants.js'
import {
    parseAnswers,
    runConfigCommand,
} from './utils.js'
import { ANSWER_FLAGS_HELP, getAnswerFlagYargsOptions, AnswerFlagError, parseAnswerFlags } from '../answerFlags.js'
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
        .options({ ...cmdArgs, ...getAnswerFlagYargsOptions() })
        .example('$0 config', 'Answer every question in the wizard')
        .example('$0 config --yes', 'Use the defaults: Mocha, Chrome and page objects')
        .example('$0 config --yes --framework cucumber --no-typescript', 'Use the defaults, but Cucumber in JavaScript')
        .example('$0 config --yes --environment mobile --mobile-environment android', 'Android app tests with the Appium service')
        .example('$0 config --runner component --preset react --framework mocha', 'Answer some questions, the wizard asks the rest')
        .epilogue(`${ANSWER_FLAGS_HELP}\n\n${CLI_EPILOGUE}`)
        .help()
}

export async function handler(argv: ConfigCommandArguments, runConfigCmd = runConfigCommand) {
    let parsedAnswers: Awaited<ReturnType<typeof parseAnswers>>
    try {
        parsedAnswers = await parseAnswers(argv.yes, parseAnswerFlags(argv))
    } catch (err) {
        if (!(err instanceof AnswerFlagError)) {
            throw err
        }
        console.error(`Error: ${err.message}\nRun "wdio config --help" for all flags.`)
        return process.exit(2)
    }
    await runConfigCmd(parsedAnswers, argv.npmTag, argv.yes)
    return {
        success: true,
        parsedAnswers,
        installedPackages: parsedAnswers.packagesToInstall.map((pkg) => pkg.split('--')[0])
    }
}

export { missingConfigurationPrompt, canAccessConfigPath  } from './utils.js'
export { formatConfigFilePaths } from '../utils.js'
