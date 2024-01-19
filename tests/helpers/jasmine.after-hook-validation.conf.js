import path from 'node:path'
import url from 'node:url'
import fs from 'node:fs/promises'

import { config as baseConfig } from './config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config = {
    ...baseConfig,
    reporters: [
        ['spec', {
            addConsoleLogs: true
        }]
    ],
    framework: 'jasmine',
    jasmineOpts: {
        ...baseConfig.jasmineOpts,
    },
    afterTest: async function (
        test,
        context,
        { error, result, duration, passed, retries }
    ) {
        const expectationResults = {
            test: test,
            context: context,
            error: error,
            result: result,
            duration: duration,
            passed: passed,
            retries: retries
        }

        if (test.description.includes('pass')) {
            fs.writeFile(path.resolve(__dirname, 'expectationResultsPassed.log'), JSON.stringify(expectationResults))
        } else {
            fs.writeFile(path.resolve(__dirname, 'expectationResultsFailed.log'), JSON.stringify(expectationResults))
        }
    }
}
