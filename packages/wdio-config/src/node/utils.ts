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
    const cwd = process.cwd()
    const resolved = path.resolve(cwd, file)
    if (path.isAbsolute(file)) {
        return resolved
    }

    // On Windows, C:specs\\*.js is relative to the C: drive's current
    // directory, not a folder literally named C:specs. Preserve this native
    // path.resolve behavior and quote inherited CWD segments only when the
    // drive matches. A different drive uses its own per-drive working dir.
    let relativeFile = file
    if (path.sep === '\\' && /^[A-Za-z]:[^\\/]/.test(file)) {
        const requestedDrive = file.slice(0, 2).toLowerCase()
        const cwdDrive = path.parse(cwd).root.slice(0, 2).toLowerCase()
        if (requestedDrive !== cwdDrive) {
            return resolved
        }
        relativeFile = file.slice(2)
    }

    // Keep provenance through normalization: a user-authored ../[app] is
    // a glob class, even if it happens to match an inherited CWD folder.
    const root = path.parse(cwd).root
    const parts = cwd.slice(root.length).split(path.sep)
        .filter(Boolean).map(value => ({ value, inherited: true }))
    for (const value of relativeFile.split(path.sep)) {
        if (!value || value === '.') {
            continue
        }
        if (value === '..') {
            parts.pop()
        } else {
            parts.push({ value, inherited: false })
        }
    }
    return root + parts.map(part => part.inherited
        ? escapeGlob(part.value, { windowsPathsNoEscape: true })
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
            : file.includes('/') || file.includes(path.sep)
                ? (escapeCwdGlob ? resolveSpecGlobFromCWD(file) : path.resolve(process.cwd(), file))
                : file
        )
    }

    return returnFiles
}

