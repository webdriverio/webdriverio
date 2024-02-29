import { describe, expect, it, beforeEach } from 'vitest'
import FeatureUsage from '../../src/testOps/featureUsage.js'

describe('FeatureUsage', () => {
    let featureUsage: FeatureUsage

    beforeEach(() => {
        featureUsage = new FeatureUsage()
    })

    it('setTriggered and getTriggered', () => {
        featureUsage.setTriggered(true)
        expect(featureUsage.getTriggered()).toBe(true)

        featureUsage.setTriggered(false)
        expect(featureUsage.getTriggered()).toBe(false)
    })

    it('setStatus and getStatus', () => {
        featureUsage.setStatus('status1')
        expect(featureUsage.getStatus()).toBe('status1')

        featureUsage.setStatus('status2')
        expect(featureUsage.getStatus()).toBe('status2')
    })

    it('setError and getError', () => {
        featureUsage.setError('error1')
        expect(featureUsage.getError()).toBe('error1')

        featureUsage.setError('error2')
        expect(featureUsage.getError()).toBe('error2')
    })

    it('triggered', () => {
        featureUsage.triggered()
        expect(featureUsage.getTriggered()).toBe(true)
    })

    it('failed', () => {
        featureUsage.failed('error message')
        expect(featureUsage.getStatus()).toBe('failed')
        expect(featureUsage.getError()).toBe('error message')
    })

    it('success', () => {
        featureUsage.success()
        expect(featureUsage.getStatus()).toBe('success')
    })

    it('toJSON', () => {
        featureUsage.setStatus('success')
        featureUsage.setTriggered(true)
        const json = featureUsage.toJSON()
        expect(json).toEqual({
            isTriggered: true,
            status: 'success',
            error: undefined
        })
    })
})

