import url from 'node:url'
import path from 'node:path'
import { escape as escapeGlob } from 'glob'

/**
 * A CWD directory name is a literal filesystem segment, never a glob pattern.
 * Quote only components shared with the resolved target, leaving the
 * caller-supplied pattern (including its '*' / '**') untouched. Class escapes
 * survive ConfigParser's Windows separator normalization to forward slashes.
 */
function resolveSpecGlobFromCWD (file: string): string {
    const cwd = process.cwd()
    const resolved = path.resolve(cwd, file)
    if (path.isAbsolute(file)) {
        return resolved
    }

    const root = path.parse(resolved).root
    const cwdRoot = path.parse(cwd).root
    if (root.toLowerCase() !== cwdRoot.toLowerCase()) {
        return resolved
    }

    const cwdParts = cwd.slice(cwdRoot.length).split(path.sep)
    const parts = resolved.slice(root.length).split(path.sep)
    const same = (a: string, b: string) => path.sep === '\\'
        ? a.toLowerCase() === b.toLowerCase()
        : a === b
    let common = 0
    while (common < cwdParts.length && common < parts.length &&
        same(cwdParts[common], parts[common])) {
        common++
    }
    return root + parts.map((part, index) => index < common
        ? escapeGlob(part, { windowsPathsNoEscape: true })
        : part
    ).join(path.sep)
}

/**
 * `--spec` values are resolved from the current working directory. A value with a
 * directory becomes an absolute path, the same for a file (`./specs/login.js`) and
 * for a glob pattern (`./specs/*.js`), see #14447. A value without a directory
 * (`login`, `*.spec.js`) stays as it is, as it matches spec files by name.
 */
export function makeRelativeToCWD (files: (string | string[])[] = []): (string | string[])[] {
    const returnFiles: (string | string[])[] = []

    for (const file of files) {
        if (Array.isArray(file)) {
            returnFiles.push(makeRelativeToCWD(file) as string[])
            continue
        }

        returnFiles.push(file.startsWith('file:///')
            ? url.fileURLToPath(file)
            : file.includes('/') || file.includes(path.sep)
                ? resolveSpecGlobFromCWD(file)
                : file
        )
    }

    return returnFiles
}

