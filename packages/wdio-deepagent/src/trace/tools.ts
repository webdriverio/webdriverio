import fs from 'node:fs/promises'
import path from 'node:path'
import { tool } from 'langchain'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { parseTraceArchive } from './reader.js'
import { reproduceSpec } from './reproduce.js'
import { diffArtifacts } from './diff.js'

/**
 * Trace tools give the agent the devtools observability layer: ingest a
 * trace.zip, reproduce a spec to get a fresh trace, diff two traces.
 */

export interface TraceToolOptions {
    /** Project wdio.conf path (needed by reproduce_spec). */
    configPath?: string
    traceDir: string
    /** Injectable spawn override for tests (see reproduce.ts). */
    spawnCommand?: string
    spawnArgs?: string[]
}

function summarizeArtifact(source: string, buffer: Buffer): string {
    const artifact = parseTraceArchive(buffer, source, { keepResources: false })
    return JSON.stringify({
        source,
        actions: artifact.actions.map((a) => ({
            name: a.name,
            selector: a.selector,
            value: a.value,
            duration: a.duration,
            ok: a.ok,
            error: a.error,
        })),
        network: artifact.network.map((n) => ({ method: n.method, url: n.url, status: n.status })),
        transcript: artifact.transcript.slice(0, 2000),
        snapshots: [...artifact.snapshots.keys()],
        screenshots: [...artifact.screenshots.keys()],
    }, null, 2)
}

export function createTraceTools(options: TraceToolOptions): DynamicStructuredTool[] {
    const ingestTrace = tool(
        async ({ tracePath }) => {
            const abs = path.resolve(tracePath)
            let buffer: Buffer
            try {
                buffer = await fs.readFile(abs)
            } catch (err) {
                return `Cannot read trace at ${abs}: ${(err as Error).message}`
            }
            return summarizeArtifact(path.basename(abs), buffer)
        },
        {
            name: 'ingest_trace',
            description: 'Parse a devtools trace.zip and return its action timeline, network entries, transcript and resources.',
            schema: z.object({ tracePath: z.string().describe('Path to a trace.zip artifact') }),
        },
    )

    const reproduceSpecTool = tool(
        async ({ spec }) => {
            if (!options.configPath) {
                return 'No wdio.conf configured — cannot reproduce.'
            }
            const result = await reproduceSpec({
                configPath: options.configPath,
                spec: path.resolve(spec),
                traceDir: options.traceDir,
                spawnCommand: options.spawnCommand,
                spawnArgs: options.spawnArgs,
            })
            return JSON.stringify({
                artifactPath: result.artifactPath ?? null,
                exitCode: result.exitCode,
                durationMs: result.duration,
                stderrTail: result.stderr.slice(-2000),
            }, null, 2)
        },
        {
            name: 'reproduce_spec',
            description: 'Re-run a spec under a devtools trace-mode overlay and return the fresh trace artifact path + exit code.',
            schema: z.object({ spec: z.string().describe('Path to the spec file to reproduce') }),
        },
    )

    const diffTraces = tool(
        async ({ oldTrace, newTrace }) => {
            let oldBuffer: Buffer
            let newBuffer: Buffer
            try {
                ;[oldBuffer, newBuffer] = await Promise.all([
                    fs.readFile(path.resolve(oldTrace)),
                    fs.readFile(path.resolve(newTrace)),
                ])
            } catch (err) {
                return `Cannot read traces: ${(err as Error).message}`
            }
            const oldArtifact = parseTraceArchive(oldBuffer, path.basename(oldTrace))
            const newArtifact = parseTraceArchive(newBuffer, path.basename(newTrace))
            return JSON.stringify(diffArtifacts(oldArtifact, newArtifact), null, 2)
        },
        {
            name: 'diff_traces',
            description: 'Compare two trace.zip artifacts (old vs new run) and report added/removed actions and current failures.',
            schema: z.object({
                oldTrace: z.string(),
                newTrace: z.string(),
            }),
        },
    )

    return [ingestTrace, reproduceSpecTool, diffTraces]
}
