import fs from 'node:fs/promises'
import path from 'node:path'
import type { DeepAgent } from 'deepagents'
import type { HealMode } from '../config/index.js'
import { parseTraceArchive } from '../trace/reader.js'
import type { TraceAction, TraceArtifact, TraceNetworkEntry } from '../trace/reader.js'
import { reproduceSpec } from '../trace/reproduce.js'
import { diffArtifacts, summarizeFailures } from '../trace/diff.js'
import type { TraceDiff } from '../trace/diff.js'
import { extractAgentReply } from '../commands/turn.js'

/**
 * The `diagnose` pipeline: ingest → reproduce → diff → heal. Mode
 * enforcement lives in the harness (permissions + interrupts built from
 * the heal mode); this engine only decides whether the agent runs.
 */

export interface DiagnosisOptions {
    /** Path to the failing run's trace.zip. */
    tracePath: string
    /** Project wdio.conf path (needed for reproduction). */
    configPath?: string
    /** Spec to reproduce; required when `reproduce` is true. */
    spec?: string
    traceDir: string
    heal: HealMode
    /** Re-run the spec to capture a fresh trace (default: spec provided). */
    reproduce?: boolean
    /** Injectable spawn override for tests (see reproduce.ts). */
    spawnCommand?: string
    spawnArgs?: string[]
    /** Agent used for the heal step (mode-gated). */
    agent?: DeepAgent
    /** Heal prompt template (injectable for tests). */
    healPrompt?: (report: DiagnosisReport) => string
}

export interface ReproductionInfo {
    artifactPath?: string
    exitCode: number
    durationMs: number
}

export interface DiagnosisReport {
    source: string
    actionCount: number
    failedActions: TraceAction[]
    networkErrors: TraceNetworkEntry[]
    transcript: string
    reproduction?: ReproductionInfo
    diff?: TraceDiff
    heal: HealMode
    /** Whether the agent was invoked to fix (ask/auto only). */
    agentRan: boolean
    agentReply?: string
}

const DEFAULT_HEAL_PROMPT = (report: DiagnosisReport) =>
    `A WebdriverIO run failed. Diagnose and fix the spec.

Actions: ${JSON.stringify(report.failedActions.map((a) => ({ name: a.name, selector: a.selector, error: a.error })))}
Network errors: ${JSON.stringify(report.networkErrors.map((n) => ({ url: n.url, status: n.status })))}
Run transcript (what the run actually did):
${report.transcript}
${report.diff ? `Diff vs previous run: ${JSON.stringify(report.diff)}` : ''}

Heal mode: ${report.heal}${report.heal === 'propose' ? ' — do NOT write files, produce a diff instead.' : ''}
Fix the failing spec or page object so the run passes, then summarize what you changed and why.`

/**
 * Runs the full diagnose pipeline. The heal step (agent invocation) only
 * happens in `ask`/`auto` modes; `propose` never invokes the agent
 * (its harness would also be read-only).
 */
export async function runDiagnosis(options: DiagnosisOptions): Promise<DiagnosisReport> {
    const absTrace = path.resolve(options.tracePath)
    const buffer = await fs.readFile(absTrace)
    const oldArtifact: TraceArtifact = parseTraceArchive(buffer, path.basename(absTrace))

    const report: DiagnosisReport = {
        source: oldArtifact.source,
        actionCount: oldArtifact.actions.length,
        ...summarizeFailures(oldArtifact),
        transcript: oldArtifact.transcript,
        heal: options.heal,
        agentRan: false,
    }

    const reproduce = options.reproduce ?? Boolean(options.spec)
    if (reproduce) {
        if (!options.configPath || !options.spec) {
            throw new Error('Reproduction requires both configPath and spec.')
        }
        const reproduction = await reproduceSpec({
            configPath: options.configPath,
            spec: options.spec,
            traceDir: options.traceDir,
            spawnCommand: options.spawnCommand,
            spawnArgs: options.spawnArgs,
        })
        report.reproduction = {
            artifactPath: reproduction.artifactPath,
            exitCode: reproduction.exitCode,
            durationMs: reproduction.duration,
        }
        if (reproduction.artifactPath) {
            const newBuffer = await fs.readFile(reproduction.artifactPath)
            const newArtifact = parseTraceArchive(newBuffer, path.basename(reproduction.artifactPath))
            report.diff = diffArtifacts(oldArtifact, newArtifact)
        }
    }

    if (options.heal !== 'propose' && options.agent) {
        const prompt = (options.healPrompt ?? DEFAULT_HEAL_PROMPT)(report)
        const run = await options.agent.invoke({ messages: [{ role: 'user', content: prompt }] })
        report.agentRan = true
        report.agentReply = extractAgentReply((run as { messages: unknown[] }).messages)
    }

    return report
}
