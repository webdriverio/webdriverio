import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const nodeModulesPath = path.join(__dirname, '..', '..', 'packages', 'webdriver', 'node_modules')
const gotPath = path.join(nodeModulesPath, 'got')
const tmpGotPath = path.join(nodeModulesPath, 'tmp_got')

/**
 * Rename "got" dependency so Vitest is forced to use the mock.
 * For some reasons it is not possible to mock `webdriver`s got
 * dependency when running `webdriverio` unit tests. Even using
 * the deps.inline option. This is a workaround for this.
 */
export const setup = async () => {
    await fs.rename(gotPath, tmpGotPath)
}

export const teardown = async () => {
    await fs.rename(tmpGotPath, gotPath)
}
