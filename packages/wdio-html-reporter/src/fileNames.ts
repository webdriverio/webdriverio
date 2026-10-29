import path from 'node:path'

/**
 * The file with the same folder and name, and another extension. Only the file
 * name changes, also when a folder name has `.html` in it.
 */
export function withExtension (file: string, extension: string) {
    const { dir, name } = path.parse(file)
    return path.join(dir, `${name}${extension}`)
}

/**
 * The HTML file of a worker: `report.html` → `report-0-0.html` (`.html` when the
 * file name has no extension). The retry of a spec file (`specFileRetries`) has the
 * same cid: `report-0-0-retry1.html`
 */
export function workerFile (file: string, cid: string, retry = 0) {
    const { dir, name, ext } = path.parse(file)
    return path.join(dir, `${name}-${cid}${retry ? `-retry${retry}` : ''}${ext || '.html'}`)
}

/**
 * The worker file of the first attempt: all the attempts of a spec file (`workerFile` with a retry) have it
 */
export function firstAttemptFile (file: string) {
    return file.replace(/-retry\d+(\.[^./\\]+)$/, '$1')
}
