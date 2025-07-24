import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'

import { CODE_TO_REMOVE } from './constants.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

console.log('Patching lerna command...')

const rootDir = path.resolve(__dirname, '..', '..', '..')
const lernaCommandPath = path.join(rootDir, 'node_modules', 'lerna', 'dist', 'index.js')
const code = await fs.readFile(lernaCommandPath, 'utf-8')

if (!code.includes(CODE_TO_REMOVE)) {
    console.log('Code already patched')
    process.exit(0)
}

await fs.writeFile(lernaCommandPath, code.replace(CODE_TO_REMOVE, ''), 'utf-8')
console.log('Code patched 🎉')
