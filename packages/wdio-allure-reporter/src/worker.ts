import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { RuntimeAttachmentContentMessage, RuntimeAttachmentPathMessage, RuntimeGlobalAttachmentContentMessage, RuntimeGlobalAttachmentPathMessage } from 'allure-js-commons/sdk'

export const PENDING_ATTACHMENT_PREFIX = '.wdio-attachment-'
export const PENDING_ATTACHMENT_SUFFIX = '.tmp'

export function resolveResultsDir(options: { outputDir?: string, resultsDir?: string }) {
    return options.outputDir || options.resultsDir || 'allure-results'
}

type OffloadedMessage = RuntimeAttachmentPathMessage | RuntimeGlobalAttachmentPathMessage

/**
 * Runs in a process that only has the bytes (e.g. a test worker) and writes them where the reporter
 * will pick them up, so an `attachment_path` message can cross the process boundary instead of the content.
 * Synchronous so that attachments of a test are on disk before the test result is sent.
 */
export function offloadAttachment(message: unknown, resultsDir: string): OffloadedMessage | undefined {
    const { type, data } = message as RuntimeAttachmentContentMessage | RuntimeGlobalAttachmentContentMessage
    if (type !== 'attachment_content' && type !== 'global_attachment_content') {
        return undefined
    }
    const { content, encoding, ...rest } = data
    mkdirSync(resultsDir, { recursive: true })
    const path = join(resultsDir, PENDING_ATTACHMENT_PREFIX + randomUUID() + PENDING_ATTACHMENT_SUFFIX)
    writeFileSync(path, Buffer.from(content, encoding))
    return { type: type === 'attachment_content' ? 'attachment_path' : 'global_attachment_path', data: { ...rest, path } } as OffloadedMessage
}
