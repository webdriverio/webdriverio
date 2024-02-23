import FeatureStats from './featureStats.js'
import FeatureUsage from './featureUsage.js'
import { BStackLogger } from '../bstackLogger.js'
import path from 'node:path'
import fs from 'node:fs'
import TestOpsConfig from './testOpsConfig.js'

class UsageStats {
    public static instance: UsageStats
    public testStartedStats: FeatureStats
    public testFinishedStats: FeatureStats
    public hookStartedStats: FeatureStats
    public hookFinishedStats: FeatureStats
    public cbtSessionStats: FeatureStats
    public logStats: FeatureStats
    public launchBuildUsage: FeatureUsage
    public stopBuildUsage: FeatureUsage
    private _manuallySet: boolean = false

    public static getInstance(): UsageStats {
        if (!UsageStats.instance) {
            UsageStats.instance = new UsageStats()
        }
        return UsageStats.instance
    }

    constructor() {
        this.testStartedStats = new FeatureStats()
        this.testFinishedStats = new FeatureStats()
        this.hookStartedStats = new FeatureStats()
        this.hookFinishedStats = new FeatureStats()
        this.cbtSessionStats = new FeatureStats()
        this.logStats = new FeatureStats()
        this.launchBuildUsage = new FeatureUsage()
        this.stopBuildUsage = new FeatureUsage()
    }

    public add(usageStats: UsageStats): void {
        this.testStartedStats.add(usageStats.testStartedStats)
        this.testFinishedStats.add(usageStats.testFinishedStats)
        this.hookStartedStats.add(usageStats.hookStartedStats)
        this.hookFinishedStats.add(usageStats.hookFinishedStats)
        this.cbtSessionStats.add(usageStats.cbtSessionStats)
        this.logStats.add(usageStats.logStats)
    }

    public getFormattedData() {
        this.addDataFromWorkers()
        const testOpsConfig = TestOpsConfig.getInstance()
        const usage :any = {
            enabled: testOpsConfig.enabled,
            manuallySet: testOpsConfig.manuallySet,
            buildHashedId: testOpsConfig.buildHashedId
        }

        try {
            usage.events = this.getEventsData()
        } catch (e) {
            BStackLogger.debug('exception in getFormattedData: ' + e)

            throw e
        }
        return usage
    }

    public addDataFromWorkers() {
        const logFolderPath = path.join(process.cwd(), 'logs', 'worker_data')
        if (!fs.existsSync(logFolderPath)) {
            return []
        }

        const files = fs.readdirSync(logFolderPath)
        files.forEach((file) => {
            BStackLogger.debug('reading file ' + file)
            const filePath = path.join(logFolderPath, file)
            const fileContent = fs.readFileSync(filePath, 'utf8')
            const workerData = JSON.parse(fileContent)
            const usageStatsForWorker = UsageStats.fromJSON(workerData)
            this.add(usageStatsForWorker)
        })

        // Remove worker data
        fs.rmSync(logFolderPath, { recursive: true, force: true })

    }

    public getEventsData() {
        return {
            buildEvents: {
                started: this.launchBuildUsage.toJSON(),
                finished: this.stopBuildUsage.toJSON()
            },
            testEvents: {
                started: this.testStartedStats.toJSON(),
                finished: this.testFinishedStats.toJSON({ omitGroups: true }),
                ...this.testFinishedStats.toJSON({ onlyGroups: true })
            },
            hookEvents: {
                started: this.hookStartedStats.toJSON(),
                finished: this.hookFinishedStats.toJSON({ omitGroups: true }),
                ...this.hookFinishedStats.toJSON({ onlyGroups: true })
            },
            logEvents: this.logStats.toJSON(),
            cbtSessionEvents: this.cbtSessionStats.toJSON()
        }
    }

    public getDataToSave() {
        return {
            testEvents: {
                started: this.testStartedStats.toJSON(),
                finished: this.testFinishedStats.toJSON({ nestedGroups: true }),
                // groups: this.testFinishedStats.toJSON({onlyGroups: true})
            },
            hookEvents: {
                started: this.hookStartedStats.toJSON(),
                finished: this.hookFinishedStats.toJSON({ nestedGroups: true }),
                // groups: this.hookFinishedStats.toJSON({onlyGroups: true})
            },
            logEvents: this.logStats.toJSON({ nestedGroups: true }),
            cbtSessionEvents: this.cbtSessionStats.toJSON()
        }
    }

    public manuallySet(): void {
        this._manuallySet = true
    }

    public static fromJSON(data: any) {
        const usageStats = new UsageStats()
        usageStats.testStartedStats = FeatureStats.fromJSON(data.testEvents.started)
        usageStats.testFinishedStats = FeatureStats.fromJSON(data.testEvents.finished)
        usageStats.hookStartedStats = FeatureStats.fromJSON(data.hookEvents.started)
        usageStats.hookFinishedStats = FeatureStats.fromJSON(data.hookEvents.finished)
        usageStats.logStats = FeatureStats.fromJSON(data.logEvents)
        usageStats.cbtSessionStats = FeatureStats.fromJSON(data.cbtSessionStats)
        return usageStats
    }
}

export default UsageStats
