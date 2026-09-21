import fs from 'node:fs/promises'

import { GENERATED_FILE_COMMENT } from './constants.js'
import type { Assignment, Group } from 'cddl'

export type CddlType = 'local' | 'remote'

/**
 * cddl2ts emits `export type Foo = Bar;` and `};` after object type aliases.
 * Oxlint's stylistic `semi: never` flags those statement semicolons but does
 * not auto-fix them (unlike ESLint), so strip them before writing.
 */
export function stripStatementSemicolons (content: string): string {
    return content
        .replace(/^(export type .+);$/gm, '$1')
        .replace(/^};$/gm, '}')
}

/**
 * write generated ts file so it
 *   - passes our oxlint rules (no crlf, no statement semicolons)
 *   - and has a note at the top that the file is generated
 *
 * @param filePath path to file to write
 * @param content content of file
 */
export async function writeFile (filePath: string, content: string) {
    const normalized = stripStatementSemicolons(content.replace(/\r\n/g, '\n'))
    return fs.writeFile(
        filePath,
        GENERATED_FILE_COMMENT + '\n\n' + normalized
    )
}

export function findGroupByName (ast: Assignment[], name: string): Group | undefined {
    return ast.find((a: Assignment): a is Group => a.Type === 'group' && a.Name === name)
}
