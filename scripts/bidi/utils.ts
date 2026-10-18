import fs from 'node:fs/promises'

import { GENERATED_FILE_COMMENT, RENAMED_TYPES } from './constants.js'
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

export function findGroupByName (ast: Assignment[], name: string): Group | undefined {
    return ast.find((a: Assignment): a is Group => a.Type === 'group' && a.Name === name)
}

const declares = (code: string, name: string) => new RegExp(`^export (type|interface) ${name}\\b`, 'm').test(code)

/**
 * add a deprecated alias for each renamed type that the spec no longer defines
 */
export function addRenamedTypeAliases (code: string) {
    const aliases = Object.entries(RENAMED_TYPES)
        .filter(([oldName, newName]) => declares(code, newName) && !declares(code, oldName))
        .map(([oldName, newName]) => (
            `/**\n * @deprecated renamed to \`${newName}\` in the WebDriver BiDi spec\n */\n` +
            `export type ${oldName} = ${newName}\n`
        ))
    return aliases.length ? `${code.trimEnd()}\n\n${aliases.join('\n')}` : code
}
