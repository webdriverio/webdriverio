import fs from 'fs'
import path from 'path'
import del from 'del'
import cheerio from 'cheerio'

export function getResults (resultsDir) {
    return getResultFiles(resultsDir, 'xml').map((file) => {
        const fileContent = fs.readFileSync(path.join(resultsDir, file), 'utf-8')
        return cheerio.load(fileContent)
    })
}

export function getResultFiles (resultsDir, patterns) {
    if (!Array.isArray(patterns)) {
        patterns = [patterns]
    }
    return fs.readdirSync(resultsDir).filter((file) =>
        patterns.some(pattern => file.endsWith('.' + pattern)))
}

export function clean (resultsDir) {
    return del(resultsDir, { force: true })
}
