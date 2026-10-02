import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { HealedStep } from './replay.js'
import type { TokenUsage } from './errors.js'

/**
 * set by the launcher, the directory workers write their records to
 */
export const RUN_DIR_ENV = 'WDIO_AI_RUN_DIR'

/**
 * event every `act` call emits on `process`, for reporters
 */
export const ACT_EVENT = 'ai:act'

export interface ActRecord {
    /**
     * `extract` calls are recorded too, `act` when not set
     */
    kind?: 'act' | 'extract'
    /**
     * refs, selectors or files an `extract` value came from
     */
    evidence?: string[]
    /**
     * how thoroughly the effects of replayed and healed steps were checked
     */
    effects?: 'checked' | 'partial' | 'off'
    spec?: string
    test?: string
    instruction: string
    source: 'cache' | 'model'
    healed?: 'cache' | 'model'
    /**
     * steps healed without the model
     */
    healedSteps?: HealedStep[]
    /**
     * set when the call failed
     */
    error?: string
    usage: TokenUsage
    durationMs: number
}

export function emitRecord (record: ActRecord) {
    (process.emit as unknown as (event: string, payload: ActRecord) => boolean)(ACT_EVENT, record)
}

export async function writeRecords (records: ActRecord[], dir = process.env[RUN_DIR_ENV]) {
    if (!dir || !records.length) {
        return
    }
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, `worker-${process.pid}-${crypto.randomUUID()}.json`), JSON.stringify(records))
}

export async function readRecords (dir: string): Promise<ActRecord[]> {
    let files: string[]
    try {
        files = await fs.readdir(dir)
    } catch {
        return []
    }
    const records: ActRecord[] = []
    for (const file of files.filter((name) => name.endsWith('.json'))) {
        records.push(...JSON.parse(await fs.readFile(path.join(dir, file), 'utf-8')) as ActRecord[])
    }
    return records
}

function tokens (count: number) {
    return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)
}

function where (record: ActRecord) {
    return [record.spec ? path.basename(record.spec) : undefined, record.test].filter(Boolean).join(' › ')
}

/**
 * The end-of-run summary: how many calls came from the cache, were healed,
 * recorded or failed, the tokens used, and every heal in detail.
 */
export function formatSummary (records: ActRecord[], { mode, outputDir }: { mode?: string, outputDir?: string } = {}) {
    if (!records.length) {
        return ''
    }
    const used = records.reduce((total, record) => total + record.usage.input + record.usage.output, 0)
    const extracts = records.filter((record) => record.kind === 'extract')
    records = records.filter((record) => record.kind !== 'extract')
    const count = (predicate: (record: ActRecord) => boolean) => records.filter(predicate).length
    const parts = [
        `${records.length} act call${records.length === 1 ? '' : 's'}`,
        `${count((r) => !r.error && r.source === 'cache' && !r.healed)} from cache`,
        `${count((r) => r.healed === 'cache')} healed without the model`,
        `${count((r) => r.healed === 'model')} healed by the model`,
        `${count((r) => !r.error && r.source === 'model' && !r.healed)} recorded by the model`,
        ...(count((r) => Boolean(r.error)) ? [`${count((r) => Boolean(r.error))} failed`] : []),
        ...(extracts.length ? [`${extracts.length} extract call${extracts.length === 1 ? '' : 's'}`] : []),
        `${tokens(used)} tokens`
    ]
    const lines = [`@wdio/ai-service: ${parts.join(' · ')}`]

    const healed = records.filter((record) => record.healed)
    if (healed.length) {
        lines.push('Healed:')
        for (const record of healed) {
            const steps = (record.healedSteps || []).map((step) => `step ${step.index + 1} ${step.from} → ${step.to}`).join(', ')
            lines.push(`  ${where(record)} "${record.instruction}": ${record.healed === 'cache' ? `${steps} (without the model)` : 'continued by the model'}`)
        }
    }
    const partial = records.filter((record) => record.effects === 'partial' && record.source === 'cache').length
    if (partial) {
        lines.push(`Effects were only partly checked for ${partial} replayed call${partial === 1 ? '' : 's'}: WebDriver Classic sessions see navigation and page changes, but not requests, new windows or dialogs.`)
    }
    const changed = records.some((record) => !record.error && (record.healed || record.source === 'model'))
    if (changed && mode === 'heal') {
        lines.push(`Updated cache entries: ${path.join(outputDir ? path.resolve(outputDir) : path.join(process.cwd(), '.wdio'), 'act-cache')}`)
    } else if (changed && mode === 'write') {
        lines.push('Cache files changed, review and commit the __act__ directories.')
    }
    return lines.join('\n')
}
