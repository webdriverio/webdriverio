import FeatureStats from './featureStats.js'
import FeatureUsage from './featureUsage.js'
import { BStackLogger } from '../bstackLogger.js'
import TestOpsConfig from './testOpsConfig.js'
import type { TOUsageStats } from '../types.js'

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

    public getFormattedData(workersData: any[]) {
        this.addDataFromWorkers(workersData)
        const testOpsConfig = TestOpsConfig.getInstance()
        const usage: TOUsageStats = {
            enabled: testOpsConfig.enabled,
            manuallySet: testOpsConfig.manuallySet,
            buildHashedId: testOpsConfig.buildHashedId
        }

        if (!usage.enabled) {
            return usage
        }

        try {
            usage.events = this.getEventsData()
        } catch (e) {
            BStackLogger.debug('exception in getFormattedData: ' + e)

        }
        return usage
    }

    public addDataFromWorkers(workersData: any[]) {
        workersData.map(workerData => {
            try {
                const usageStatsForWorker = UsageStats.fromJSON(workerData.usageStats)
                this.add(usageStatsForWorker)
            } catch (e) {
                BStackLogger.debug('Exception in adding workerData: ' + e)
            }
        })
    }

    public getEventsData(){
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

    public getDataToSave(){
        return {
            testEvents: {
                started: this.testStartedStats.toJSON(),
                finished: this.testFinishedStats.toJSON({ nestedGroups: true }),
            },
            hookEvents: {
                started: this.hookStartedStats.toJSON(),
                finished: this.hookFinishedStats.toJSON({ nestedGroups: true }),
            },
            logEvents: this.logStats.toJSON({ nestedGroups: true }),
            cbtSessionEvents: this.cbtSessionStats.toJSON()
        }
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
