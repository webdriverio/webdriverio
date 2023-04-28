import logger from '@wdio/logger'
import type { Capabilities, Options } from '@wdio/types'
import got from 'got'
// @ts-ignore
import { version as bstackServiceVersion } from '../package.json'

import { DATA_ENDPOINT } from './constants'
import type { BrowserstackConfig, CredentialsForCrashReportUpload, UserConfigforReporting } from './types'
import { DEFAULT_REQUEST_CONFIG, getObservabilityKey, getObservabilityUser } from './util'

const log = logger('@wdio/browserstack-service')

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

    static setConfigDetails(userConfig: Options.Testrunner, capabilities: Capabilities.RemoteCapability, options: BrowserstackConfig & Options.Testrunner) {
        const configWithoutPII = this.filterPII(userConfig)
        this.userConfigForReporting = {
            framework: userConfig.framework,
            services: configWithoutPII.services,
            capabilities: capabilities,
            env: {
                'BROWSERSTACK_BUILD': process.env.BROWSERSTACK_BUILD,
                'BROWSERSTACK_BUILD_NAME': process.env.BROWSERSTACK_BUILD_NAME,
                'BUILD_TAG': process.env.BUILD_TAG
            }
        }
        process.env.USER_CONFIG_FOR_REPORTING = JSON.stringify(this.userConfigForReporting)
        this.setCredentialsForCrashReportUpload(options, userConfig)
    }

    static async uploadCrashReport(exception: any, stackTrace: string) {
        try {
            if (!this.credentialsForCrashReportUpload.username || !this.credentialsForCrashReportUpload.password) {
                this.credentialsForCrashReportUpload = process.env.CREDENTIALS_FOR_CRASH_REPORTING !== undefined ? JSON.parse(process.env.CREDENTIALS_FOR_CRASH_REPORTING) : this.credentialsForCrashReportUpload
            }
        } catch (error) {
            return log.error(`[Crash_Report_Upload] Failed to parse user credentials while reporting crash due to ${error}`)
        }
        if (!this.credentialsForCrashReportUpload.username || !this.credentialsForCrashReportUpload.password) {
            return log.error('[Crash_Report_Upload] Failed to parse user credentials while reporting crash')
        }

        try {
            if (Object.keys(this.userConfigForReporting).length === 0) {
                this.userConfigForReporting = process.env.USER_CONFIG_FOR_REPORTING !== undefined ? JSON.parse(process.env.USER_CONFIG_FOR_REPORTING) : {}
            }
        } catch (error) {
            log.error(`[Crash_Report_Upload] Failed to parse user config while reporting crash due to ${error}`)
            this.userConfigForReporting = {}
        }

        const data = {
            hashed_id: process.env.BS_TESTOPS_BUILD_HASHED_ID,
            observability_version: {
                frameworkName: 'WebdriverIO-' + (this.userConfigForReporting.framework || 'null'),
                sdkVersion: bstackServiceVersion
            },
            exception: {
                error: exception.toString(),
                stackTrace: stackTrace
            },
            config: this.userConfigForReporting
        }
        const url = `${DATA_ENDPOINT}/api/v1/analytics`
        got.post(url, {
            ...DEFAULT_REQUEST_CONFIG,
            ...this.credentialsForCrashReportUpload,
            json: data
        }).text().then(response => {
            log.debug(`[Crash_Report_Upload] Success response: ${JSON.stringify(response)}`)
        }).catch((error) => {
            log.error(`[Crash_Report_Upload] Failed due to ${error}`)
        })
    }

    static deletePIIKeysFromObject(obj: { [key: string]: any }) {
        if (!obj) {
            return
        }
        ['user', 'username', 'key', 'accessKey'].forEach(key => delete obj[key])
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
                        serviceArray[idx] && this.deletePIIKeysFromObject(serviceArray[idx].testObservabilityOptions)
                    }
                    finalServices.push(serviceArray)
                    break
                }
            }
        } catch (err: any) {
            /* Wrong configuration like strings instead of json objects could break this method, needs no action */
            log.error(`Error in parsing user config PII with error ${err ? (err.stack || err) : err}`)
            return configWithoutPII
        }
        configWithoutPII.services = finalServices
        return configWithoutPII
    }
}
