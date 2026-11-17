import { describe, it, expect } from 'vitest'

import { DEFAULT_SETTINGS } from '../src/constants.js'
import { getSettings, getWaitOptions } from '../src/settings.js'

describe('getSettings', () => {
    it('has the defaults without the capability mobilecli:options', () => {
        expect(getSettings()).toEqual(DEFAULT_SETTINGS)
        expect(getSettings({ platformName: 'iOS' })).toEqual({
            stabilityDelay: 50,
            stabilityWindow: 1000,
            screenFreshTime: 100,
            maxSearchesPerScreen: 2,
            focusTimeout: 3000,
            keyboardTimeout: 60000,
            installTimeout: 190000,
            appLaunchTimeout: 20000
        })
    })

    it('takes the settings of mobilecli:options before the defaults', () => {
        expect(getSettings({ 'mobilecli:options': { actionTimeout: 10000, pollInterval: 50, screenFreshTime: 0 } })).toEqual({
            ...DEFAULT_SETTINGS,
            actionTimeout: 10000,
            pollInterval: 50,
            screenFreshTime: 0
        })
    })

    it('does not change the defaults', () => {
        getSettings({ 'mobilecli:options': { stabilityDelay: 10 } })
        expect(DEFAULT_SETTINGS.stabilityDelay).toBe(50)
    })

    it('fails on a setting that it does not know', () => {
        expect(() => getSettings({ 'mobilecli:options': { actionTimout: 10000 } as object }))
            .toThrow(
                'The capability "mobilecli:options" has the unknown setting "actionTimout". @wdio/mobilecli-driver knows: ' +
                'actionTimeout, pollInterval, stabilityDelay, stabilityWindow, screenFreshTime, maxSearchesPerScreen, ' +
                'focusTimeout, keyboardTimeout, installTimeout, appLaunchTimeout.'
            )
    })

    it('fails on a setting that is not a number of 0 or more', () => {
        for (const value of ['5000', -1, NaN, Infinity, null]) {
            expect(() => getSettings({ 'mobilecli:options': { actionTimeout: value } as object }))
                .toThrow('The setting "actionTimeout" of the capability "mobilecli:options" has to be a number of 0 or more')
        }
    })

    it('fails if mobilecli:options is not an object', () => {
        expect(() => getSettings({ 'mobilecli:options': 5000 as unknown as object }))
            .toThrow('The capability "mobilecli:options" has to be an object, got: 5000')
        expect(() => getSettings({ 'mobilecli:options': [] as unknown as object }))
            .toThrow('The capability "mobilecli:options" has to be an object, got: []')
    })
})

describe('getWaitOptions', () => {
    const session = (settings = {}, timeouts = {}) => ({ settings: { ...DEFAULT_SETTINGS, ...settings }, timeouts })

    it('has the defaults of WebdriverIO and Mobilewright if nothing is set', () => {
        expect(getWaitOptions(session())).toEqual({ timeout: 5000, interval: 100 })
        expect(getWaitOptions(session(), { waitforTimeout: 'x' })).toEqual({ timeout: 5000, interval: 100 })
    })

    it('takes waitforTimeout and waitforInterval of WebdriverIO', () => {
        expect(getWaitOptions(session(), { waitforTimeout: 10000, waitforInterval: 250 })).toEqual({ timeout: 10000, interval: 250 })
        expect(getWaitOptions(session(), { waitforTimeout: 0 })).toEqual({ timeout: 0, interval: 100 })
    })

    it('takes the settings of the driver before the ones of WebdriverIO', () => {
        expect(getWaitOptions(session({ actionTimeout: 2000, pollInterval: 20 }), { waitforTimeout: 10000, waitforInterval: 250 }))
            .toEqual({ timeout: 2000, interval: 20 })
        expect(getWaitOptions(session({ actionTimeout: 0 }), { waitforTimeout: 10000 }).timeout).toBe(0)
    })

    it('takes the timeout of setTimeouts before the setting of the driver', () => {
        expect(getWaitOptions(session({ actionTimeout: 2000 }, { implicit: 8000 }), { waitforTimeout: 10000 }).timeout).toBe(8000)
        expect(getWaitOptions(session({ actionTimeout: 2000 }, { implicit: 0 })).timeout).toBe(0)
    })
})
