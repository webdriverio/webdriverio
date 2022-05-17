import fs from 'node:fs'
import path from 'node:path'
import del from 'del'
import { load } from 'cheerio'

export function getResults (resultsDir: any) {
    return getResultFiles(resultsDir, 'xml').map((file) => {
        const fileContent = fs.readFileSync(path.join(resultsDir, file), 'utf-8')
        return load(fileContent)
    })
}

export function getResultFiles (resultsDir: any, patterns: any) {
    if (!Array.isArray(patterns)) {
        patterns = [patterns]
    }
    return fs.readdirSync(resultsDir).filter((file) =>
        patterns.some((pattern: any) => file.endsWith('.' + pattern)))
}

export function clean (resultsDir: any) {
    return del(resultsDir, { force: true })
}
