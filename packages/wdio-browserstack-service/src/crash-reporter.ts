import type { Capabilities, Options } from '@wdio/types'

import { BSTACK_SERVICE_VERSION, DATA_ENDPOINT, BROWSERSTACK_TESTHUB_UUID } from './constants.js'
import type { BrowserstackConfig, CredentialsForCrashReportUpload, UserConfigforReporting } from './types.js'
import { DEFAULT_REQUEST_CONFIG, getObservabilityKey, getObservabilityUser } from './util.js'
import { BStackLogger } from './bstackLogger.js'

import { _fetch as fetch } from './fetchWrapper.js'

type Dict = Record<string, string>

export default class CrashReporter {
    /* User test config for build run minus PII */
    public static userConfigForReporting: UserConfigforReporting = {}
    /* User credentials used for reporting crashes in browserstack service */
    private static credentialsForCrashReportUpload: CredentialsForCrashReportUpload = {}

    static setCredentialsForCrashReportUpload(options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner) {
        this.credentialsForCrashReportUpload = {
            username: getObservabilityUser(options, config),
            password: getObservabilityKey(options, config)
        }
        process.env.CREDENTIALS_FOR_CRASH_REPORTING = JSON.stringify(this.credentialsForCrashReportUpload)
    }

    static setConfigDetails(userConfig: Options.Testrunner, capabilities: Capabilities.TestrunnerCapabilities, options: BrowserstackConfig & Options.Testrunner) {
        const configWithoutPII = this.filterPII(userConfig)
        const filteredCapabilities = this.filterCapabilities(capabilities)
        this.userConfigForReporting = {
            framework: userConfig.framework,
            services: configWithoutPII.services,
            capabilities: filteredCapabilities,
            env: {
                'BROWSERSTACK_BUILD': process.env.BROWSERSTACK_BUILD,
                'BROWSERSTACK_BUILD_NAME': process.env.BROWSERSTACK_BUILD_NAME,
                'BUILD_TAG': process.env.BUILD_TAG
            }
        }
        process.env.USER_CONFIG_FOR_REPORTING = JSON.stringify(this.userConfigForReporting)
        this.setCredentialsForCrashReportUpload(options, userConfig)
    }

    static async uploadCrashReport(exception: string, stackTrace: string) {
        try {
            if (!this.credentialsForCrashReportUpload.username || !this.credentialsForCrashReportUpload.password) {
                this.credentialsForCrashReportUpload = process.env.CREDENTIALS_FOR_CRASH_REPORTING !== undefined ? JSON.parse(process.env.CREDENTIALS_FOR_CRASH_REPORTING) : this.credentialsForCrashReportUpload
            }
        } catch (error) {
            return BStackLogger.error(`[Crash_Report_Upload] Failed to parse user credentials while reporting crash due to ${error}`)
        }
        if (!this.credentialsForCrashReportUpload.username || !this.credentialsForCrashReportUpload.password) {
            return BStackLogger.error('[Crash_Report_Upload] Failed to parse user credentials while reporting crash')
        }

        try {
            if (Object.keys(this.userConfigForReporting).length === 0) {
                this.userConfigForReporting = process.env.USER_CONFIG_FOR_REPORTING !== undefined ? JSON.parse(process.env.USER_CONFIG_FOR_REPORTING) : {}
            }
        } catch (error) {
            BStackLogger.error(`[Crash_Report_Upload] Failed to parse user config while reporting crash due to ${error}`)
            this.userConfigForReporting = {}
        }

        const data = {
            hashed_id: process.env[BROWSERSTACK_TESTHUB_UUID],
            observability_version: {
                frameworkName: 'WebdriverIO-' + (this.userConfigForReporting.framework || 'null'),
                sdkVersion: BSTACK_SERVICE_VERSION
            },
            exception: {
                error: exception.toString(),
                stackTrace: stackTrace
            },
            config: this.userConfigForReporting
        }
        const url = `${DATA_ENDPOINT}/api/v1/analytics`

        const encodedAuth = Buffer.from(`${this.credentialsForCrashReportUpload.username}:${this.credentialsForCrashReportUpload.password}`, 'utf8').toString('base64')
        const headers: Record<string, string> = {
            ...DEFAULT_REQUEST_CONFIG.headers,
            Authorization: `Basic ${encodedAuth}`,
        }

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers
        })

        if (response.ok) {
            BStackLogger.debug(`[Crash_Report_Upload] Success response: ${JSON.stringify(await response.json())}`)
        } else {
            BStackLogger.error(`[Crash_Report_Upload] Failed due to ${response.body}`)
        }
    }

    static recursivelyRedactKeysFromObject(obj: Dict | Array<Dict>, keys: string[]) {
        if (!obj) {
            return
        }
        if (Array.isArray(obj)) {
            obj.map(ele => this.recursivelyRedactKeysFromObject(ele, keys))
        } else {
            for (const prop in obj) {
                if (keys.includes(prop.toLowerCase())) {
                    obj[prop] = '[REDACTED]'
                } else if (typeof obj[prop] === 'object') {
                    this.recursivelyRedactKeysFromObject(obj[prop], keys)
                }
            }
        }
    }

    static deletePIIKeysFromObject(obj: { [key: string]: unknown }) {
        if (!obj) {
            return
        }
        ['user', 'username', 'key', 'accessKey'].forEach(key => delete obj[key])
    }

    static filterCapabilities(capabilities: Capabilities.TestrunnerCapabilities) {
        const capsCopy = JSON.parse(JSON.stringify(capabilities))
        this.recursivelyRedactKeysFromObject(capsCopy, ['extensions'])
        return capsCopy
    }

    static filterPII(userConfig: Options.Testrunner) {
        const configWithoutPII = JSON.parse(JSON.stringify(userConfig))
        this.deletePIIKeysFromObject(configWithoutPII)
        const finalServices = []
        const initialServices = configWithoutPII.services
        delete configWithoutPII.services
        try {
            for (const serviceArray of initialServices) {
                if (Array.isArray(serviceArray) && serviceArray.length >= 2 && serviceArray[0] === 'browserstack') {
                    for (let idx = 1; idx < serviceArray.length; idx++) {
                        this.deletePIIKeysFromObject(serviceArray[idx])
                        if (serviceArray[idx]) {
                            // Handle both new testReportingOptions and legacy testObservabilityOptions
                            this.deletePIIKeysFromObject(serviceArray[idx].testReportingOptions)
                            this.deletePIIKeysFromObject(serviceArray[idx].testObservabilityOptions)
                        }
                    }
                    finalServices.push(serviceArray)
                    break
                }
            }
        } catch (err) {
            /* Wrong configuration like strings instead of json objects could break this method, needs no action */
            BStackLogger.error(`Error in parsing user config PII with error ${err ? ((err as Error).stack || err) : err}`)
            return configWithoutPII
        }
        configWithoutPII.services = finalServices
        return configWithoutPII
    }
}
