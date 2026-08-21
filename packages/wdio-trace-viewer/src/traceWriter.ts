import * as fs from 'node:fs'
import * as path from 'node:path'

export function writeTraceData(trace: any[]) {
    const targetDir = process.env.INIT_CWD || process.cwd()
    const traceDir = path.join(targetDir, '.wdio-trace')

    if (!fs.existsSync(traceDir)) {
        fs.mkdirSync(traceDir)
    }

    fs.writeFileSync(
        path.join(traceDir, 'report.json'),
        JSON.stringify(trace, null, 2),
        'utf-8'
    )
}
