import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import { createRequire } from 'node:module'

import { CODE_TO_REMOVE, SIGSTORE_CONFLICT_CODE, SIGSTORE_CONFLICT_FIX } from './constants.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

console.log('Patching lerna command...')

const rootDir = path.resolve(__dirname, '..', '..', '..')
const lernaCommandPath = path.join(rootDir, 'node_modules', 'lerna', 'dist', 'index.js')
const code = await fs.readFile(lernaCommandPath, 'utf-8')

if (!code.includes(CODE_TO_REMOVE)) {
    console.log('Code already patched')
} else {
    await fs.writeFile(lernaCommandPath, code.replace(CODE_TO_REMOVE, ''), 'utf-8')
    console.log('Code patched 🎉')
}

/**
 * sigstore gives each Rekor upload 5 s and retries it: when Rekor saved the first upload
 * but answered late, the retry gets a 409 and the package is not published
 */
console.log('Patching sigstore Rekor conflict...')
// `node_modules/lerna` is a pnpm link: resolve from its real folder to find its dependencies
const libnpmpublishPath = createRequire(await fs.realpath(lernaCommandPath)).resolve('libnpmpublish')
const sigstoreConfigPath = path.join(path.dirname(createRequire(libnpmpublishPath).resolve('sigstore')), 'config.js')
const sigstoreConfig = await fs.readFile(sigstoreConfigPath, 'utf-8')

if (sigstoreConfig.includes(SIGSTORE_CONFLICT_FIX)) {
    console.log('Code already patched')
} else if (!sigstoreConfig.includes(SIGSTORE_CONFLICT_CODE)) {
    throw new Error(`Couldn't find "${SIGSTORE_CONFLICT_CODE}" in ${sigstoreConfigPath}, update the patch`)
} else {
    await fs.writeFile(sigstoreConfigPath, sigstoreConfig.replace(SIGSTORE_CONFLICT_CODE, SIGSTORE_CONFLICT_FIX), 'utf-8')
    console.log('Code patched 🎉')
}
