import { BStackLogger } from '../bstackLogger.js'

interface FeatureStatsMap {
    [groupId: string]: FeatureStats;
}

class FeatureStats {
    private triggeredCount: number = 0
    private sentCount: number = 0
    private failedCount: number = 0
    private groups: FeatureStatsMap = {}

    public mark(status: string, groupId: string): void {
        switch (status) {
        case 'triggered':
            this.triggered(groupId)
            break
        case 'success':
        case 'sent':
            this.sent(groupId)
            break
        case 'failed':
            this.failed(groupId)
            break
        default:
            BStackLogger.debug('Request to mark usage for unknown status - ' + status)
            break
        }
    }

    public triggered(groupId?: string): void {
        this.triggeredCount += 1
        if (groupId) {
            this.createGroup(groupId).triggered()
        }
    }

    public sent(groupId?: string): void {
        this.sentCount += 1
        if (groupId) {
            this.createGroup(groupId).sent()
        }
    }

    public failed(groupId?: string): void {
        BStackLogger.debug('')

        this.failedCount += 1
        if (groupId) {
            this.createGroup(groupId).failed()
        }
    }

    public success(groupId?: string): void {
        this.sent(groupId)
    }

    public createGroup(groupId: string): FeatureStats {
        if (!this.groups[groupId]) {
            this.groups[groupId] = new FeatureStats()
        }
        return this.groups[groupId]
    }

    public getTriggeredCount(): number {
        return this.triggeredCount
    }

    public getSentCount(): number {
        return this.sentCount
    }

    public getFailedCount(): number {
        return this.failedCount
    }

    public getUsageForGroup(groupId: string): FeatureStats {
        return this.groups[groupId] || new FeatureStats()
    }

    public getOverview(): { triggeredCount: number, sentCount: number, failedCount: number } {
        return { triggeredCount: this.triggeredCount, sentCount: this.sentCount, failedCount: this.failedCount }
    }

    public getGroups(): FeatureStatsMap {
        return this.groups
    }

    public add(featureStats: FeatureStats): void {
        this.triggeredCount += featureStats.getTriggeredCount()
        this.sentCount += featureStats.getSentCount()
        this.failedCount += featureStats.getFailedCount()

        Object.entries(featureStats.getGroups()).forEach(([groupId, group]) => {
            this.createGroup(groupId).add(group)
        })
    }

    // omitGroups: true/false -> Include groups or not
    // onlyGroups: true/false -> data includes only groups
    // nestedGroups: true/false -> groups will be nested in groups if true
    public toJSON(config: any = {}) { // # TODO: remove any
        const overviewData: any = !config.onlyGroups ? { // TODO
            triggeredCount: this.triggeredCount,
            sentCount: this.sentCount,
            failedCount: this.failedCount
        } : {}
        const groupsData: any = {}
        if (!config.omitGroups) {
            Object.entries(this.groups).forEach(([groupId, group]) => {
                groupsData[groupId] = group.toJSON()
            })
        }
        const group = config.nestedGroups ? { groups: groupsData } : groupsData

        return {
            ...overviewData,
            ...group
        }
    }

    // Don't use this function yet
    public static fromJSON(json: any): FeatureStats {
        const stats = new FeatureStats()

        if (!json) {
            return stats
        }
        stats.triggeredCount = json.triggeredCount
        stats.sentCount = json.sentCount
        stats.failedCount = json.failedCount

        if (!json.groups) {
            return stats
        }
        Object.entries(json.groups).forEach(([groupId, group]) => {
            stats.groups[groupId] = FeatureStats.fromJSON(group)
        })
        return stats
    }
}

export default FeatureStats
