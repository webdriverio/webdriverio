import { stopBuildUpstream } from './util.js'
import { BStackLogger } from './bstackLogger.js'
import fs from 'node:fs'
import { fireFunnelRequest } from './instrumentation/funnelInstrumentation.js'
import { TESTOPS_BUILD_ID_ENV, TESTOPS_JWT_ENV } from './constants.js'

export default class BStackCleanup {
    static async startCleanup() {
        try {
            if (process.argv.includes('--observability')) {
                await this.executeObservabilityCleanup()
            }
            if (process.argv.includes('--funnelData')) {
                await this.sendFunnelData()
            }
        } catch (err) {
            const error = err as string
            BStackLogger.error(error)
        }
    }
    static async executeObservabilityCleanup() {
        if (!process.env[TESTOPS_JWT_ENV]) {
            return
        }
        BStackLogger.debug('Executing observability cleanup')
        try {
            await stopBuildUpstream()
            if (process.env[TESTOPS_BUILD_ID_ENV]) {
                BStackLogger.info(`\nVisit https://observability.browserstack.com/builds/${process.env[TESTOPS_BUILD_ID_ENV]} to view build report, insights, and many more debugging information all at one place!\n`)
            }
        } catch (e: unknown) {
            BStackLogger.error('Error in stopping Observability build: ' + e)
        }
    }

    static async sendFunnelData() {
        let filePath
        try {
            const index = process.argv.indexOf('--funnelData')
            filePath = process.argv[index + 1]
            if (!filePath) {
                BStackLogger.error('Invalid file path for funnel data')
                return
            }

            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
            await fireFunnelRequest(data)
            BStackLogger.debug('Funnel data sent successfully from cleanup')
        } catch (e: unknown) {
            BStackLogger.error('Error in sending funnel data: ' + e)
        } finally {
            this.removeFunnelDataFile(filePath)
        }
    }

    static removeFunnelDataFile(filePath?: string) {
        if (!filePath) {
            return
        }
        fs.rmSync(filePath, { force: true })
    }
}

await BStackCleanup.startCleanup()
