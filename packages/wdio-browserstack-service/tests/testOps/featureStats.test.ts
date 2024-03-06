import FeatureStats from '../../src/testOps/featureStats.js'
import { describe, expect, it, beforeEach } from 'vitest'

describe('FeatureStats', () => {
    let featureStats: FeatureStats

    beforeEach(() => {
        featureStats = new FeatureStats()
    })

    it('initial state', () => {
        expect(featureStats.getTriggeredCount()).toBe(0)
        expect(featureStats.getSentCount()).toBe(0)
        expect(featureStats.getFailedCount()).toBe(0)
        expect(featureStats.getGroups()).toEqual({})
    })

    describe('mark', () => {
        it('triggered', () => {
            const groupId = 'group1'
            featureStats.mark('triggered', groupId)
            expect(featureStats.getTriggeredCount()).toBe(1)
            expect(featureStats.getGroups()[groupId].getTriggeredCount()).toBe(1)
        })

        it('sent', () => {
            const groupId = 'group1'
            featureStats.mark('sent', groupId)
            expect(featureStats.getSentCount()).toBe(1)
            expect(featureStats.getGroups()[groupId].getSentCount()).toBe(1)
        })

        it('failed', () => {
            const groupId = 'group1'
            featureStats.mark('failed', groupId)
            expect(featureStats.getFailedCount()).toBe(1)
            expect(featureStats.getGroups()[groupId].getFailedCount()).toBe(1)
        })
    })

    it('triggered', () => {
        const groupId = 'group1'
        featureStats.triggered(groupId)
        expect(featureStats.getTriggeredCount()).toBe(1)
        expect(featureStats.getGroups()[groupId].getTriggeredCount()).toBe(1)
    })

    it('sent', () => {
        const groupId = 'group1'
        featureStats.sent(groupId)
        expect(featureStats.getSentCount()).toBe(1)
        expect(featureStats.getGroups()[groupId].getSentCount()).toBe(1)
    })

    it('failed', () => {
        const groupId = 'group1'
        featureStats.failed(groupId)
        expect(featureStats.getFailedCount()).toBe(1)
        expect(featureStats.getGroups()[groupId].getFailedCount()).toBe(1)
    })

    it('success', () => {
        const groupId = 'group1'
        featureStats.success(groupId)
        expect(featureStats.getSentCount()).toBe(1)
        expect(featureStats.getGroups()[groupId].getSentCount()).toBe(1)
    })

    it('createGroup', () => {
        const groupId = 'group1'
        const groupStats = featureStats.createGroup(groupId)
        expect(featureStats.getGroups()[groupId]).toBe(groupStats)
    })

    it('getUsageForGroup', () => {
        const groupId = 'group1'
        const groupStats = featureStats.createGroup(groupId)
        const usageStats = featureStats.getUsageForGroup(groupId)
        expect(usageStats).toBe(groupStats)
    })

    it('getOverview', () => {
        featureStats.mark('triggered', 'group1')
        featureStats.mark('sent', 'group2')
        featureStats.mark('failed', 'group3')
        const overview = featureStats.getOverview()
        expect(overview).toEqual({
            triggeredCount: 1,
            sentCount: 1,
            failedCount: 1
        })
    })

    describe('toJSON', () => {
        it('toJSON - default', () => {
            featureStats.mark('triggered', 'group1')
            featureStats.mark('sent', 'group2')
            featureStats.mark('failed', 'group3')
            const json = featureStats.toJSON()
            expect(json).toEqual({
                triggeredCount: 1,
                sentCount: 1,
                failedCount: 1,
                group1: { triggeredCount: 1, sentCount: 0, failedCount: 0 },
                group2: { triggeredCount: 0, sentCount: 1, failedCount: 0 },
                group3: { triggeredCount: 0, sentCount: 0, failedCount: 1 }
            })
        })

        it('toJSON with omitGroups', () => {
            featureStats.mark('triggered', 'group1')
            const json = featureStats.toJSON({ omitGroups: true })
            expect(json).toEqual({
                triggeredCount: 1,
                sentCount: 0,
                failedCount: 0
            })
        })

        it('toJSON with onlyGroups', () => {
            featureStats.mark('triggered', 'group1')
            const json = featureStats.toJSON({ onlyGroups: true })
            expect(json).toEqual({
                group1: { triggeredCount: 1, sentCount: 0, failedCount: 0 }
            })
        })

        it('toJSON with nestedGroups', () => {
            featureStats.mark('triggered', 'group1')
            const json = featureStats.toJSON({ nestedGroups: true })
            expect(json).toEqual({
                triggeredCount: 1,
                sentCount: 0,
                failedCount: 0,
                groups: {
                    group1: { triggeredCount: 1, sentCount: 0, failedCount: 0 }
                }
            })
        })
    })

    describe('fromJSON', () => {

        it('creates instance', () => {
            const json = {
                triggeredCount: 2,
                sentCount: 3,
                failedCount: 1,
                groups: {
                    group1: { triggeredCount: 1, sentCount: 1, failedCount: 0 },
                    group2: { triggeredCount: 1, sentCount: 2, failedCount: 1 }
                }
            }
            const stats = FeatureStats.fromJSON(json)
            expect(stats.getTriggeredCount()).toBe(2)
            expect(stats.getSentCount()).toBe(3)
            expect(stats.getFailedCount()).toBe(1)
            expect(stats.getGroups()['group1'].getTriggeredCount()).toBe(1)
            expect(stats.getGroups()['group1'].getSentCount()).toBe(1)
            expect(stats.getGroups()['group1'].getFailedCount()).toBe(0)
            expect(stats.getGroups()['group2'].getTriggeredCount()).toBe(1)
            expect(stats.getGroups()['group2'].getSentCount()).toBe(2)
            expect(stats.getGroups()['group2'].getFailedCount()).toBe(1)
        })

        it('with empty JSON', () => {
            const stats = FeatureStats.fromJSON({})
            expect(stats.getTriggeredCount()).toBe(0)
            expect(stats.getSentCount()).toBe(0)
            expect(stats.getFailedCount()).toBe(0)
            expect(stats.getGroups()).toEqual({})
        })
    })
})
