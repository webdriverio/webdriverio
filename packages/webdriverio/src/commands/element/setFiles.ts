import path from 'node:path'

import { getBrowserObject } from '@wdio/utils'

import { contextIdOf } from '../../session/browsingContext.js'

/**
 * Set the files of an `<input type="file">` with the WebDriver BiDi
 * [`input.setFiles`](https://w3c.github.io/webdriver-bidi/#command-input-setFiles) command.
 *
 * The paths are opened by the browser. They are not copied and not uploaded.
 * A relative path is resolved against `process.cwd()`, so a path the test
 * process can open is the path a local browser opens. A remote browser needs
 * a path on the machine that runs the browser.
 *
 * This command needs a BiDi session. On a classic session, [`setValue`](/docs/api/element/setValue)
 * still types a path the local browser can already see.
 *
 * Passing more than one path to an input without `multiple`, a disabled input,
 * or an element that is not a file input fails with the BiDi error
 * `unable to set file input`.
 *
 * <example>
    :setFiles.js
    it('sets a file input', async () => {
        await $('#file-upload').setFiles('/path/to/file.png')
        await $('#file-upload').setFiles(['/path/to/a.png', '/path/to/b.png'])
    });
 * </example>
 *
 * @alias element.setFiles
 * @param {string|string[]} files  path or paths the browser machine can read
 * @type utility
 * @uses protocol/inputSetFiles
 */
export async function setFiles (
    this: WebdriverIO.Element,
    files: string | string[]
): Promise<void> {
    const browser = getBrowserObject(this)
    if (!browser.isBidi) {
        throw new Error(
            'setFiles requires a WebDriver BiDi session. ' +
            'On a classic session, use setValue with a path the local browser can already see.'
        )
    }

    const list = Array.isArray(files) ? files : [files]
    if (list.length === 0) {
        throw new Error('setFiles requires at least one file path.')
    }

    const resolved = list.map((file, index) => {
        if (typeof file !== 'string') {
            const where = Array.isArray(files) ? ` at index ${index}` : ''
            const received = file === null ? 'null' : typeof file
            throw new Error(`setFiles expected a file path string${where}, received ${received}.`)
        }
        return path.resolve(file)
    })

    /**
     * A file input inside a frame belongs to that frame's browsing context.
     * An element found in a held context uses that context. Otherwise the
     * context manager tracks the context the element was located in.
     */
    const context = await contextIdOf(this)
    await browser.inputSetFiles({
        context,
        element: { sharedId: this.elementId },
        files: resolved
    })
}
