import PercyCaptureMap from '../src/Percy/PercyCaptureMap'

describe('PercyCaptureMap', () => {
    let percyCaptureMap: PercyCaptureMap

    beforeEach(() => {
        percyCaptureMap = new PercyCaptureMap()
    })

    it('increment method should increase the count', () => {
        percyCaptureMap.increment('session1', 'event1')
        expect(percyCaptureMap.get('session1', 'event1')).toBe(0)
    })

    it('decrement method should decrease the count', () => {
        percyCaptureMap.increment('session1', 'event1')
        percyCaptureMap.decrement('session1', 'event1')
        expect(percyCaptureMap.get('session1', 'event1')).toBe(0)
    })

    it('getName method should return the correct name', () => {
        percyCaptureMap.increment('session1', 'event1')
        expect(percyCaptureMap.getName('session1', 'event1')).toBe('session1-event1-0')
    })

    it('get method should return the correct count', () => {
        percyCaptureMap.increment('session1', 'event1')
        expect(percyCaptureMap.get('session1', 'event1')).toBe(0)
    })

    it('get method should return 0 for non-existing session and event', () => {
        expect(percyCaptureMap.get('nonexistentSession', 'nonexistentEvent')).toBe(0)
    })

    it('decrement method should not decrease count below 0', () => {
        percyCaptureMap.decrement('session1', 'event1')
        expect(percyCaptureMap.get('session1', 'event1')).toBe(0)
    })
})
