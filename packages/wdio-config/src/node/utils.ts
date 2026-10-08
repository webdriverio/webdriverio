import url from 'node:url'
import path from 'node:path'

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
                ? path.resolve(process.cwd(), file)
                : file
        )
    }

    return returnFiles
}

