import Profile from 'firefox-profile'
import { promisify } from 'util'

export default class FirefoxProfileLauncher {
    constructor(options) {
        this.options = options
    }

    async onPrepare(config, capabilities) {
        /**
         * Return if no profile options were specified
         */
        if (Object.keys(this.options).length === 0) {
            return
        }

        if (this.options.profileDirectory) {
            this.profile = await promisify(Profile.copy)(this.options.profileDirectory)
        } else {
            this.profile = new Profile()
        }

        // Set preferences and proxy
        this._setPreferences()

        if (!Array.isArray(this.options.extensions)) {
            return this._buildExtension(capabilities)
        }

        // Add the extension
        await promisify(this.profile.addExtensions.bind(this.profile))(this.options.extensions)
        return this._buildExtension(capabilities)
    }

    /**
     * Sets any preferences and proxy
     */
    _setPreferences() {
        for (const [preference, value] of Object.entries(this.options)) {
            if (['extensions', 'proxy', 'legacy', 'profileDirectory'].includes(preference)) {
                continue
            }

            this.profile.setPreference(preference, value)
        }

        if (this.options.proxy) {
            this.profile.setProxy(this.options.proxy)
        }

        this.profile.updatePreferences()
    }

    async _buildExtension(capabilities) {
        const zippedProfile = await promisify(this.profile.encoded.bind(this.profile))()

        if (Array.isArray(capabilities)) {
            capabilities
                .filter((capability) => capability.browserName === 'firefox')
                .forEach((capability) => {
                    this._setProfile(capability, zippedProfile)
                })

            return
        }

        for (const browser in capabilities) {
            const capability = capabilities[browser].capabilities

            if (!capability || capability.browserName !== 'firefox') {
                continue
            }

            this._setProfile(capability, zippedProfile)
        }
    }

    _setProfile(capability, zippedProfile) {
        if (this.options.legacy) {
            // for older firefox and geckodriver versions
            capability.firefox_profile = zippedProfile
        } else {
            // for firefox >= 56.0 and geckodriver >= 0.19.0
            capability['moz:firefoxOptions'] = capability['moz:firefoxOptions'] || {}
            capability['moz:firefoxOptions'].profile = zippedProfile
        }
    }
}
