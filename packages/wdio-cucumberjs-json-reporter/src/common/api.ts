import type { AttachmentType, CucumberAttachmentData } from '../types.js'

/** Events that may be sent from workers to the CucumberJS JSON reporter */
export const events = {
    attachment: 'wdioCucumberJsReporter:attachment'
} as const

/**
 * Attach data to the current step in the CucumberJS JSON report
 * @param {string|object} data - data to attach
 * @param {string} type - mime type, defaults to `text/plain`
 */
export function attach(data: CucumberAttachmentData, type: AttachmentType = 'text/plain') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    process.emit(events.attachment as any, { data, type } as any)
}

export default {
    attach
}
