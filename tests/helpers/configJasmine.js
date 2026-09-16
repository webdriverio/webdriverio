import path from 'node:path'
import url from 'node:url'
import fs from 'node:fs'

import { config as baseConfig } from './config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
let expectationResults = ''

export const config = {
    ...baseConfig,
    jasmineOpts: {
        ...baseConfig.jasmineOpts,
        expectationResultHandler: (_, assertion) => {
            /**
             * Must be synchronous: the Jasmine adapter does not await this
             * handler, and the worker can exit before an async writeFile
             * settles, leaving expectationResults.log empty for the smoke
             * runner to read (intermittent on faster Node versions).
             */
            expectationResults += `expect(${typeof assertion.expected}).${assertion.matcherName}(${typeof assertion.actual})\n`
            fs.writeFileSync(path.resolve(__dirname, 'expectationResults.log'), expectationResults)
        }
    }
}
