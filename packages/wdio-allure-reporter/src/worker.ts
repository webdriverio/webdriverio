import { randomUUID } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { RuntimeAttachmentContentMessage, RuntimeAttachmentPathMessage, RuntimeGlobalAttachmentContentMessage, RuntimeGlobalAttachmentPathMessage } from 'allure-js-commons/sdk'

export const PENDING_ATTACHMENT_PREFIX = '.wdio-attachment-'
export const PENDING_ATTACHMENT_SUFFIX = '.tmp'

export function resolveResultsDir(options: { outputDir?: string, resultsDir?: string }) {
    return options.outputDir || options.resultsDir || 'allure-results'
}

// allure-js-commons does not export its content type table, so this covers the types the reporter and its users emit.
// The pending file is named .tmp, which ReporterRuntime would otherwise take as the extension of the final file.
const EXTENSIONS_BY_CONTENT_TYPE: Record<string, string> = {
    'text/plain': '.txt',
    'application/xml': '.xml',
    'text/html': '.html',
    'text/csv': '.csv',
    'text/tab-separated-values': '.tsv',
    'text/css': '.css',
    'text/uri-list': '.uri',
    'image/svg+xml': '.svg',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'application/json': '.json',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'video/webm': '.webm',
    'video/mp4': '.mp4'
}

function resolveExtension({ fileExtension, contentType }: { fileExtension?: string, contentType?: string }) {
    if (fileExtension) {
        return fileExtension.startsWith('.') ? fileExtension : `.${fileExtension}`
    }
    return EXTENSIONS_BY_CONTENT_TYPE[contentType ?? ''] ?? ''
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
    try {
        writeFileSync(path, Buffer.from(content, encoding))
    } catch (err) {
        rmSync(path, { force: true })
        throw err
    }
    return { type: type === 'attachment_content' ? 'attachment_path' : 'global_attachment_path', data: { ...rest, fileExtension: resolveExtension(rest), path } } as OffloadedMessage
}
