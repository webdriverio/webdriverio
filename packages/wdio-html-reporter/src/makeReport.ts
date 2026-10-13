import { runCli } from './makeReportCli.js'

process.exitCode = await runCli(process.argv.slice(2))
