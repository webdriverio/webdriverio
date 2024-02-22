import type { UploadType } from '../types.js'
import { DATA_ENDPOINT, DATA_EVENT_ENDPOINT, DATA_SCREENSHOT_ENDPOINT } from '../constants.js'
import { BStackLogger } from '../bstackLogger.js'
import RequestQueueHandler from '../request-handler.js'
import { DEFAULT_REQUEST_CONFIG, getLogTag } from '../util.js'

export async function uploadEventData (eventData: UploadType | Array<UploadType>, eventUrl: string = DATA_EVENT_ENDPOINT) {
    let logTag: string = 'BATCH_UPLOAD'
    if (!Array.isArray(eventData)) {
        logTag = getLogTag(eventData.event_type)
    }

    if (eventUrl === DATA_SCREENSHOT_ENDPOINT) {
        logTag = 'screenshot_upload'
    }

    if (!process.env.BS_TESTOPS_BUILD_COMPLETED) {
        return
    }

    if (!process.env.BS_TESTOPS_JWT) {
        BStackLogger.debug(`[${logTag}] Missing Authentication Token/ Build ID`)
        return {
            status: 'error',
            message: 'Token/buildID is undefined, build creation might have failed'
        }
    }

    try {
        const url = `${DATA_ENDPOINT}/${eventUrl}`
        RequestQueueHandler.getInstance().pendingUploads += 1
        const data = await fetch(url, {
            method: 'POST',
            headers: {
                ...DEFAULT_REQUEST_CONFIG.headers,
                'Authorization': `Bearer ${process.env.BS_TESTOPS_JWT}`
            },
            body: JSON.stringify(eventData)
        })
        BStackLogger.debug(`[${logTag}] Success response: ${JSON.stringify(await data.json())}`)
        RequestQueueHandler.getInstance().pendingUploads -= 1
    } catch (error) {
        BStackLogger.debug(`[${logTag}] Failed. Error: ${error}`)
        RequestQueueHandler.getInstance().pendingUploads -= 1
    }
}

export function sendScreenshots(eventData: Array<UploadType>) {
    return uploadEventData(eventData, DATA_SCREENSHOT_ENDPOINT)
}
