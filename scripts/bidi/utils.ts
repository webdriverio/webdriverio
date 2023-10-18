import fs from 'node:fs/promises'

import { GENERATED_FILE_COMMENT } from './constants.js'

/**
 * write generated ts file so it
 *   - passes our eslint rules (no crlf)
 *   - and has a note at the top that the file is generated
 *
 * @param filePath path to file to write
 * @param content content of file
 */
export async function writeFile (filePath: string, content: string) {
    return fs.writeFile(
        filePath,
        GENERATED_FILE_COMMENT + '\n\n' + content.replace(/\r\n/g, '\n')
    )
}
