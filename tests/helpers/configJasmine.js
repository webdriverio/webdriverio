import path from 'node:path'
import url from 'node:url'
import fs from 'node:fs/promises'

import { config as baseConfig } from './config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
let expectationResults = ''

export const config = {
    ...baseConfig,
    jasmineOpts: {
        ...baseConfig.jasmineOpts,
        expectationResultHandler: (_, assertion) => {
            expectationResults += `expect(${typeof assertion.expected}).${assertion.matcherName}(${typeof assertion.actual})\n`
            return fs.writeFile(path.resolve(__dirname, 'expectationResults.log'), expectationResults)
        }
    }
}
