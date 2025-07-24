import url from 'node:url'
import path from 'node:path'

export function makeRelativeToCWD (files: (string | string[])[] = []): (string | string[])[] {
    const returnFiles: (string | string[])[] = []

    for (const file of files) {
        if (Array.isArray(file)) {
            returnFiles.push(makeRelativeToCWD(file) as string[])
            continue
        }

        returnFiles.push(file.startsWith('file:///')
            ? url.fileURLToPath(file)
            : file.includes('/') && !file.includes('*')
                ? path.resolve(process.cwd(), file)
                : file
        )
    }

    return returnFiles
}

