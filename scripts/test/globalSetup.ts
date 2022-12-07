import fs from 'node:fs/promises'
import util from 'node:util'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const nodeModulesPath = path.join(__dirname, '..', '..', 'packages', 'webdriver', 'node_modules')
const gotPath = path.join(nodeModulesPath, 'got')
const tmpGotPath = path.join(nodeModulesPath, 'tmp_got')
const ERROR_MESSAGE = `Renaming "got" dependency failed!

WebdriverIO needs to hide the "got" dependency (at "packages/webdriver/node_modules/got")
during the test to force Vitest to use our mocked version. WebdriverIO does this by renaming: 

"packages/webdriver/node_modules/got"
to
"packages/webdriver/node_modules/tmp_got"

during test setup and back again during test tear-down.

'%s has failed.  Maybe because you are already running unit tests in a different
'terminal.
`

function throwBetterErrorMessageSetup (err: Error) {
    throw new Error(
        util.format(ERROR_MESSAGE, 'Setup') +
        err.stack +
        '\n\nTo correct this error please run:\n\tmv packages/webdriver/node_modules/tmp_got packages/webdriver/node_modules/got\n'
    )
}

function throwBetterErrorMessageTearDown (err: Error) {
    throw new Error(
        util.format(ERROR_MESSAGE, 'Tear-down') +
        err.stack
    )
}

/**
 * Rename "got" dependency so Vitest is forced to use the mock.
 * For some reasons it is not possible to mock `webdriver`s got
 * dependency when running `webdriverio` unit tests. Even using
 * the deps.inline option. This is a workaround for this.
 */
export const setup = async () => {
    await fs.rename(gotPath, tmpGotPath).catch(throwBetterErrorMessageSetup)
}

export const teardown = async () => {
    await fs.rename(tmpGotPath, gotPath).catch(throwBetterErrorMessageTearDown)
}
