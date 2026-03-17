import fs from 'node:fs/promises'
import type path from 'node:path'

import { GENERATED_FILE_COMMENT } from './constants.js'
import type { Assignment, Group } from 'cddl'

export type CddlType = 'local' | 'remote'

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

/**
 * Patches the content of the downloaded CDDL file to fix known issues before parsing it.
 * Report those issue to https://github.com/w3c/webdriver-bidi to have them fixed.
 *
 * @param cddlPath path to the downloadedCDDL file
 * @param tempPath path to the temporary file to write the patched content to
 * @param type the local.cddl or the remote.cddl file
 */
export async function patchCDDLFileContent (dirname: string, path: path.PlatformPath, cddlPath: string, type: 'local' | 'remote'): Promise<string> {
    const tempPath = path.join(dirname, 'cddl', `${type}.tmp.cddl`)
    const content = await fs.readFile(cddlPath, 'utf8')
    if (type === 'local') {
        // Fixes error found in the local.cddl. Report those issue to https://github.com/w3c/webdriver-bidi to have them fixed.
        // `InputResult` is missing in local.cddl, remove temporary fix when issue is merge: https://github.com/w3c/webdriver-bidi/pull/1102
        //         content += `
        // InputResult = (
        //   input.PerformActionsResult /
        //   input.ReleaseActionsResult /
        //   input.SetFilesResult
        // )

        // `
    } else if (type === 'remote') {
        // Fixes error found in the remote.cddl. Report those issue to https://github.com/w3c/webdriver-bidi to have them fixed.
        // `input.FileDialogInfo` should not be in remote.cddl, remove temporary fix when issue is merge: https://github.com/w3c/webdriver-bidi/pull/1104
        // content = content.replace(/input\.FileDialogOpened\s*=\s*\(\s*method:\s*"input\.fileDialogOpened",\s*params:\s*input\.FileDialogInfo\s*\)\s*input\.FileDialogInfo\s*=\s*\{\s*context:\s*browsingContext\.BrowsingContext,\s*\?\s*userContext:\s*browser\.UserContext,\s*\?\s*element:\s*script\.SharedReference,\s*multiple:\s*bool,\s*\}/g, '')
    }

    await fs.writeFile(tempPath, content)
    return tempPath
}

export function findGroupByName (ast: Assignment[], name: string): Group | undefined {
    return ast.find((a: Assignment): a is Group => a.Type === 'group' && a.Name === name)
}
