import fs from 'node:fs/promises'
import path from 'node:path'

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

export function findGroupByName (ast: Assignment[], name: string): Group | undefined {
    return ast.find((a: Assignment): a is Group => a.Type === 'group' && a.Name === name)
}

/**
 * Validates and sanitizes a file path from a zip entry to prevent directory traversal attacks
 * @param entryPath - The path from the zip entry
 * @param targetDir - The target directory for extraction
 * @returns The safe path for extraction, or undefined if the path is invalid
 */
export function validateZipEntryPath(entryPath: string, targetDir: string): string | void {
    // Normalize the entry path and remove any leading slashes
    const normalizedPath = path.normalize(entryPath).replace(/^[/\\]+/, '')

    // Check for directory traversal attempts
    if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
        console.warn(`Skipping potentially dangerous path: ${entryPath}`)
        return
    }

    // Construct the full target path
    const fullPath = path.join(targetDir, normalizedPath)

    // Ensure the resolved path is still within the target directory
    const resolvedPath = path.resolve(fullPath)
    const resolvedTargetDir = path.resolve(targetDir)

    if (!resolvedPath.startsWith(resolvedTargetDir + path.sep) && resolvedPath !== resolvedTargetDir) {
        console.warn(`Path traversal attempt detected: ${entryPath}`)
        return
    }

    return fullPath
}
