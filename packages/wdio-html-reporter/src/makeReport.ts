import { makeReport } from './makeReportCli.js'

makeReport(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error)
})
