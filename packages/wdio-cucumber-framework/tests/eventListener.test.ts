import { EventEmitter } from 'node:events'
import { test, expect, vi } from 'vitest'

import CucumberEventListener from '../src/cucumberEventListener'
import { gherkinDocument, pickle } from './fixtures/envelopes'

const pickleFilter = {
    matches: vi.fn().mockReturnValue(true)
}

test('getHookParams', () => {
    const eventBroadcaster = new EventEmitter()
    const listener = new CucumberEventListener(eventBroadcaster, pickleFilter as any)
    listener['_currentPickle'] = 'foobar' as any
    expect(listener.getHookParams()).toBe('foobar')
})

test('getCurrentStep', () => {
    const eventBroadcaster = new EventEmitter()
    const listener = new CucumberEventListener(eventBroadcaster, pickleFilter as any)
    listener.onGherkinDocument(gherkinDocument)
    listener.onPickleAccepted(pickle)
    expect(listener.getPickleIds({ browserName: 'chrome' })).toEqual(['13'])

    pickleFilter.matches.mockReturnValue(false)
    expect(listener.getPickleIds({ browserName: 'chrome' })).toEqual([])
})
