import { stopBuildUpstream } from './util.js'
import { BStackLogger } from './bstackLogger.js'

export default class BStackCleanup {
    static async startCleanup() {
        try {
            await this.executeObservabilityCleanup()
        } catch (err) {
            const error = err as string
            BStackLogger.error(error)
        }
    }
    static async executeObservabilityCleanup() {
        BStackLogger.debug('Executing observability cleanup')
        if (process.env.BS_TESTOPS_JWT) {
            await stopBuildUpstream()
            if (process.env.BS_TESTOPS_BUILD_HASHED_ID) {
                BStackLogger.info(`\nVisit https://observability.browserstack.com/builds/${process.env.BS_TESTOPS_BUILD_HASHED_ID} to view build report, insights, and many more debugging information all at one place!\n`)
            }
        }
    }
}

await BStackCleanup.startCleanup()
