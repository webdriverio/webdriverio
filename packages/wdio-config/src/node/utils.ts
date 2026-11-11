import url from 'node:url'
import path from 'node:path'
import { escape as escapeGlob } from 'glob'

/**
 * A CWD directory name is a literal filesystem segment, never a glob pattern.
 * Quote only components actually inherited from CWD, leaving every
 * caller-authored pattern (including bracket classes and '*') untouched. Escapes
 * survive ConfigParser's Windows separator normalization to forward slashes.
 */
function resolveSpecGlobFromCWD (file: string): string {
    let cwd = process.cwd()
    if (path.isAbsolute(file)) {
        return path.resolve(cwd, file)
    }

    // A drive-relative Windows path inherits that drive's working directory.
    // Let Node select it before recording which segments are literal.
    let relativeFile = file
    if (path.sep === '\\' && /^[A-Za-z]:/.test(file)) {
        cwd = path.resolve(cwd, file.slice(0, 2))
        relativeFile = file.slice(2)
    }

    // Windows accepts both separators, including mixed paths. On POSIX a
    // backslash is part of a filename, so it must not split a component.
    const separator = path.sep === '\\' ? /[\\/]/ : '/'
    const root = path.parse(cwd).root
    const parts = cwd.slice(root.length).split(separator)
        .filter(Boolean).map(value => ({ value, inherited: true }))
    for (const value of relativeFile.split(separator)) {
        if (!value || value === '.') {
            continue
        }
        if (value === '..') {
            parts.pop()
        } else {
            parts.push({ value, inherited: false })
        }
    }
    const escapeLiteral = (value: string) => escapeGlob(value, { windowsPathsNoEscape: true })
    return escapeLiteral(root) + parts.map(part => part.inherited
        ? escapeLiteral(part.value)
        : part.value
    ).join(path.sep)
}

/**
 * `--spec` values are resolved from the current working directory. A value with a
 * directory becomes an absolute path, the same for a file (`./specs/login.js`) and
 * for a glob pattern (`./specs/*.js`), see #14447. A value without a directory
 * (`login`, `*.spec.js`) stays as it is, as it matches spec files by name.
 */
export function makeRelativeToCWD (files: (string | string[])[] = [], escapeCwdGlob = true): (string | string[])[] {
    const returnFiles: (string | string[])[] = []

    for (const file of files) {
        if (Array.isArray(file)) {
            returnFiles.push(makeRelativeToCWD(file, escapeCwdGlob) as string[])
            continue
        }

        returnFiles.push(file.startsWith('file:///')
            ? url.fileURLToPath(file)
            : file.includes('/') || file.includes(path.sep) || (path.sep === '\\' && /^[A-Za-z]:/.test(file))
                ? (escapeCwdGlob ? resolveSpecGlobFromCWD(file) : path.resolve(process.cwd(), file))
                : file
        )
    }

    return returnFiles
}
