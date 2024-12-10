import type { UploadType } from '../types.js'
import {
    DATA_ENDPOINT,
    DATA_EVENT_ENDPOINT,
    DATA_SCREENSHOT_ENDPOINT,
    TESTOPS_BUILD_COMPLETED_ENV, BROWSERSTACK_TESTHUB_JWT
} from '../constants.js'
import { BStackLogger } from '../bstackLogger.js'
import { DEFAULT_REQUEST_CONFIG, getLogTag } from '../util.js'
import fetchWrap from '../fetchWrapper.js'
import { format } from 'node:util'

export async function uploadEventData (eventData: UploadType | Array<UploadType>, eventUrl: string = DATA_EVENT_ENDPOINT) {
    let logTag: string = 'BATCH_UPLOAD'
    if (!Array.isArray(eventData)) {
        logTag = getLogTag(eventData.event_type)
    }

    if (eventUrl === DATA_SCREENSHOT_ENDPOINT) {
        logTag = 'screenshot_upload'
    }

    if (!process.env[TESTOPS_BUILD_COMPLETED_ENV]) {
        throw new Error('Build start not completed yet')
    }

    if (!process.env[BROWSERSTACK_TESTHUB_JWT]) {
        BStackLogger.debug(`[${logTag}] Missing Authentication Token/ Build ID`)
        throw new Error('Token/buildID is undefined, build creation might have failed')
    }

    try {
        const url = `${DATA_ENDPOINT}/${eventUrl}`
        const data = await fetchWrap(url, {
            method: 'POST',
            headers: {
                ...DEFAULT_REQUEST_CONFIG.headers,
                'Authorization': `Bearer ${process.env[BROWSERSTACK_TESTHUB_JWT]}`
            },
            body: JSON.stringify(eventData)
        })
        BStackLogger.debug(`[${logTag}] Success response: ${JSON.stringify(await data.json())}`)
    } catch (error) {
        BStackLogger.debug(`[${logTag}] Failed. Error: ${format(error)}`)
        throw error
    }
}

export function sendScreenshots(eventData: Array<UploadType>) {
    return uploadEventData(eventData, DATA_SCREENSHOT_ENDPOINT)
}
