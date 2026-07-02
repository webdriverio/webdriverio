import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import handler from 'serve-handler'
import open from 'open'

const ROOT = process.cwd()

function findReportJson(dir: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            const found = findReportJson(fullPath)
            if (found) {return found}
        } else if (
            entry.isFile() &&
            entry.name === 'report.json' &&
            fullPath.includes('.wdio-trace')
        ) {
            return fullPath
        }
    }
    return null
}

export async function showTraceViewer() {
    const reportPath = findReportJson(ROOT)
    if (!reportPath) {
        console.error('No trace report found under .wdio-trace')
        process.exit(1)
    }

    const buildPath = path.resolve(new URL(import.meta.url).pathname, '../../')
    const server = http.createServer((req, res) => {
        if (req.url === '/__trace_data/report.json') {
            res.setHeader('Content-Type', 'application/json')
            fs.createReadStream(reportPath).pipe(res)
            return
        }

        return handler(req, res, { public: buildPath })
    })

    server.listen(5173, () => {
        console.log('Viewer running at http://localhost:5173')
        void open('http://localhost:5173')
    })
}
