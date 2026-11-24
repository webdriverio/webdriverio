import url from 'node:url'
import path from 'node:path'

import FileSystemPathService from './FileSystemPathService.js'
import { SUPPORTED_FILE_EXTENSIONS } from '../constants.js'
import { removeLineNumbers } from '../utils.js'
import type { PathService } from '../types.js'

const GLOB_CHARACTERS = /[*?{}[\]]/

/**
 * Resolve a CLI `--spec` or `--exclude` entry relative to the current working directory
 * when it matches a file or glob under `process.cwd()`. Unmatched entries stay as-is so
 * config-relative paths or regex/keyword filters continue to work.
 */
export function resolveFromCwd(
    entry: string,
    pathService: PathService = new FileSystemPathService()
): string {
    if (entry.startsWith('file://') || path.isAbsolute(entry)) {
        return entry
    }

    const file = removeLineNumbers(entry)
    const fromCwd = path.resolve(process.cwd(), file)
    const matches = pathService.isFile(fromCwd) || (
        GLOB_CHARACTERS.test(file) &&
        pathService.glob(fromCwd.replace(/\\/g, '/'), process.cwd())
            .some((matched) => SUPPORTED_FILE_EXTENSIONS.some((ext) => matched.endsWith(ext)))
    )
    return matches ? fromCwd + entry.slice(file.length) : entry
}

export function makeRelativeToCWD (
    files: (string | string[])[] = [],
    pathService: PathService = new FileSystemPathService()
): (string | string[])[] {
    const returnFiles: (string | string[])[] = []

    for (const file of files) {
        if (Array.isArray(file)) {
            returnFiles.push(makeRelativeToCWD(file, pathService) as string[])
            continue
        }

        returnFiles.push(
            file.startsWith('file:///')
                ? url.fileURLToPath(file)
                : resolveFromCwd(file, pathService)
        )
    }

    return returnFiles
}

