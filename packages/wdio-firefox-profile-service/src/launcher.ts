import Profile from 'firefox-profile'
import { promisify } from 'node:util'
import type { Capabilities } from '@wdio/types'

import type { FirefoxProfileOptions } from './types.js'

export default class FirefoxProfileLauncher {
    private _profile?: Profile
    constructor(private _options: FirefoxProfileOptions) {}

    async onPrepare(config: never, capabilities: Capabilities.TestrunnerCapabilities) {
        /**
         * Return if no profile options were specified
         */
        if (Object.keys(this._options).length === 0) {
            return
        }

        this._profile = this._options.profileDirectory
            ? await promisify(Profile.copy)(this._options.profileDirectory)
            : new Profile()

        if (!this._profile) {
            return
        }

        // Set preferences and proxy
        this._setPreferences()

        if (!Array.isArray(this._options.extensions)) {
            return this._buildExtension(capabilities)
        }

        // Add the extension
        await promisify(this._profile.addExtensions.bind(this._profile))(this._options.extensions)
        return this._buildExtension(capabilities)
    }

    /**
     * Sets any preferences and proxy
     */
    _setPreferences() {
        if (!this._profile) {
            return
        }

        for (const [preference, value] of Object.entries(this._options)) {
            if (['extensions', 'proxy', 'legacy', 'profileDirectory'].includes(preference)) {
                continue
            }

            this._profile.setPreference(preference, value as string)
        }

        if (this._options.proxy) {
            this._profile.setProxy(this._options.proxy)
        }

        this._profile.updatePreferences()
    }

    async _buildExtension(capabilities: Capabilities.TestrunnerCapabilities) {
        if (!this._profile) {
            return
        }

        const zippedProfile = await promisify(this._profile.encoded.bind(this._profile))()

        if (Array.isArray(capabilities)) {
            (capabilities as Capabilities.RequestedStandaloneCapabilities[] | Capabilities.RequestedMultiremoteCapabilities[])
                .flatMap((c: Capabilities.RequestedStandaloneCapabilities | Capabilities.RequestedMultiremoteCapabilities) => {
                    if (Object.values(c).length > 0 && Object.values(c).every(c => typeof c === 'object' && c.capabilities)) {
                        return Object.values(c).map((o) => o.capabilities)
                    }
                    return c
                })
                .filter((capability) => capability.browserName === 'firefox')
                .forEach((capability) => {
                    this._setProfile(capability, zippedProfile)
                })

            return
        }

        for (const browser in capabilities) {
            const capability = capabilities[browser].capabilities as Capabilities.RequestedMultiremoteCapabilities[string]['capabilities']
            const cap = capability && ('alwaysMatch' in capability ? capability.alwaysMatch : capability)
            if (!capability || cap.browserName !== 'firefox') {
                continue
            }

            this._setProfile(capability, zippedProfile)
        }
    }

    _setProfile(capability: Capabilities.RequestedStandaloneCapabilities, zippedProfile: string) {
        const cap = 'alwaysMatch' in capability ? capability.alwaysMatch : capability

        cap['moz:firefoxOptions'] = cap['moz:firefoxOptions'] || {}
        cap['moz:firefoxOptions'].profile = zippedProfile
    }
}
