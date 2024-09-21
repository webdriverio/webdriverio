import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default {
    paths: [
        path.resolve(__dirname, 'test-skipped.feature')
    ],
}
