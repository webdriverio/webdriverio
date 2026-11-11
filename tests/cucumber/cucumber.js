import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

// the name filter shows that WebdriverIO reads this file; its paths are not used (the specs choose the features)
export default {
    paths: [
        path.resolve(__dirname, 'test-skipped.feature')
    ],
    name: ['Sync Execution'],
}
