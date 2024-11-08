import { getErrorString, stopBuildUpstream } from './util.js'
import { BStackLogger } from './bstackLogger.js'
import fs from 'node:fs'
import { fireFunnelRequest } from './instrumentation/funnelInstrumentation.js'
import { BROWSERSTACK_TESTHUB_UUID, BROWSERSTACK_TESTHUB_JWT, BROWSERSTACK_OBSERVABILITY } from './constants.js'

export default class BStackCleanup {
    static async startCleanup() {
        try {
            // Get funnel data object from saved file
            const funnelDataCleanup = process.argv.includes('--funnelData')
            let funnelData = null
            if (funnelDataCleanup) {
                const index = process.argv.indexOf('--funnelData')
                const filePath = process.argv[index + 1]
                funnelData = this.getFunnelDataFromFile(filePath)
            }

            if (process.argv.includes('--observability')) {
                await this.executeObservabilityCleanup(funnelData)
            }

            if (funnelDataCleanup && funnelData) {
                await this.sendFunnelData(funnelData)
            }
        } catch (err) {
            const error = err as string
            BStackLogger.error(error)
        }
    }
    static async executeObservabilityCleanup(funnelData: any) {
        if (!process.env[BROWSERSTACK_TESTHUB_JWT]) {
            return
        }
        BStackLogger.debug('Executing observability cleanup')
        try {
            const killSignal = funnelData?.event_properties?.finishedMetadata?.signal
            const result = await stopBuildUpstream(killSignal)
            if (process.env[BROWSERSTACK_OBSERVABILITY] && process.env[BROWSERSTACK_TESTHUB_UUID]) {
                BStackLogger.info(`\nVisit https://observability.browserstack.com/builds/${process.env[BROWSERSTACK_TESTHUB_UUID]} to view build report, insights, and many more debugging information all at one place!\n`)
            }
            const status = (result && result.status) || 'failed'
            const message = (result && result.message)
            this.updateO11yStopData(funnelData, status, status === 'failed' ? message : undefined)
        } catch (e: unknown) {
            BStackLogger.error('Error in stopping Observability build: ' + e)
            this.updateO11yStopData(funnelData, 'failed', e)
        }
    }

    static updateO11yStopData(funnelData: any, status: string, error: unknown = undefined) {
        const toData = funnelData?.event_properties?.productUsage?.testObservability
        // Return if no O11y data in funnel data
        if (!toData) {
            return
        }
        let existingStopData = toData.events.buildEvents.finished
        existingStopData = existingStopData || {}

        existingStopData = {
            ...existingStopData,
            status,
            error: getErrorString(error),
            stoppedFrom: 'exitHook'
        }
        toData.events.buildEvents.finished = existingStopData
    }

    static async sendFunnelData(funnelData: any) {
        try {
            await fireFunnelRequest(funnelData)
            BStackLogger.debug('Funnel data sent successfully from cleanup')
        } catch (e: unknown) {
            BStackLogger.error('Error in sending funnel data: ' + e)
        }
    }

    static getFunnelDataFromFile(filePath: string) {
        if (!filePath) {
            return null
        }

        const content = fs.readFileSync(filePath, 'utf8')

        const data = JSON.parse(content)
        this.removeFunnelDataFile(filePath)
        return data
    }

    static removeFunnelDataFile(filePath?: string) {
        if (!filePath) {
            return
        }
        fs.rmSync(filePath, { force: true })
    }
}

await BStackCleanup.startCleanup()
