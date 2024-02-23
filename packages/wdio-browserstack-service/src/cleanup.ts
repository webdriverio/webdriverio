import { stopBuildUpstream } from './util.js'
import { BStackLogger } from './bstackLogger.js'
import fs from 'node:fs'
import FunnelTestEvent from './instrumentation/funnelInstrumentation.js'

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
        if (!process.env.BS_TESTOPS_JWT) {
            return
        }
        BStackLogger.debug('Executing observability cleanup')
        await stopBuildUpstream()
        if (process.env.BS_TESTOPS_BUILD_HASHED_ID) {
            BStackLogger.info(`\nVisit https://observability.browserstack.com/builds/${process.env.BS_TESTOPS_BUILD_HASHED_ID} to view build report, insights, and many more debugging information all at one place!\n`)
        }
    }

    static async sendFunnelData() {
        const index = process.argv.indexOf('--funnelData')
        const filePath = process.argv[index + 1]
        if (!filePath) {
            BStackLogger.error('Invalid file path for funnel data')
            return
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        await FunnelTestEvent.fireRequest(data)
        BStackLogger.debug('funnel data from cleanup success')
    }
}

await BStackCleanup.startCleanup()
