import fs from 'node:fs/promises'
import path from 'node:path'
import { tool } from 'langchain'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { DEFAULT_MAX_TRACE_BYTES, parseTraceArchive } from './reader.js'
import type { TraceArtifact, TraceParseOptions } from './reader.js'
import { projectRootForConfig, resolveModelPath, runSpecTool } from './reproduce.js'
import type { SpawnOverride } from './reproduce.js'
import { diffArtifacts } from './diff.js'
import { CappedMap } from '../capped-map.js'

/**
 * Trace tools give the agent the devtools observability layer: ingest a
 * trace.zip, reproduce a spec to get a fresh trace, diff two traces.
 */

export interface TraceToolOptions extends SpawnOverride {
    /** Project wdio.conf path (needed by reproduce_spec). */
    configPath?: string
    traceDir: string
}

/** Model-supplied trace paths must stay inside the trace dir. The fs tools
 * emit `/`-prefixed project-rooted virtual paths, but reproduce_spec also
 * hands the model a host-absolute artifactPath — accept both, host first. */
async function confineTracePath(traceDir: string, projectRoot: string, tracePath: string): Promise<string> {
    const dir = path.resolve(traceDir)
    const within = (abs: string) => abs === dir || abs.startsWith(dir + path.sep)
    const hostAbs = await resolveModelPath(projectRoot, tracePath)
    if (!within(hostAbs)) {
        throw new Error(`trace path "${tracePath}" is outside the trace directory`)
    }
    return hostAbs
}

export const MAX_ARCHIVE_CACHE = 4

export function readErr(what: string, err: unknown): string {
    if (!(err as NodeJS.ErrnoException).code) {
        throw err
    }
    return `Cannot read ${what}: ${(err as Error).message}`
}

export async function readTraceArchive(absPath: string, rawOpts: TraceParseOptions = {}, cache?: CappedMap<string, TraceArtifact>): Promise<TraceArtifact> {
    const opts = { ...rawOpts, keepResources: false }
    // compressed-size gate before buffering: the decompressed caps in
    // parseTraceArchive only bite once the archive is in memory
    const stat = await fs.stat(absPath)
    if (stat.size > DEFAULT_MAX_TRACE_BYTES) {
        throw new Error(
            `trace archive ${absPath} is ${stat.size} bytes — exceeds the ${DEFAULT_MAX_TRACE_BYTES} byte cap; refusing to parse untrusted archive.`
        )
    }
    const key = `${absPath}:${stat.mtimeMs}:${stat.size}`
    const cached = cache?.get(key)
    if (cached) {
        return cached
    }
    const buffer = await fs.readFile(absPath)
    const parsed = parseTraceArchive(buffer, path.basename(absPath), opts)
    cache?.set(key, parsed)
    return parsed
}

function summarizeArtifact(artifact: TraceArtifact): string {
    return JSON.stringify({
        source: artifact.source,
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

export function createTraceTools(options: TraceToolOptions, cache = new CappedMap<string, TraceArtifact>(MAX_ARCHIVE_CACHE)): DynamicStructuredTool[] {
    const projectRoot = projectRootForConfig(options.configPath)
    const ingestTrace = tool(
        async ({ tracePath }) => {
            const abs = await confineTracePath(options.traceDir, projectRoot, tracePath)
            try {
                const artifact = await readTraceArchive(abs, {}, cache)
                return summarizeArtifact(artifact)
            } catch (err) {
                // read failures (ENOENT etc.) are friendly messages; parse
                // failures (corrupt zip) stay loud — only read errors carry a code
                return readErr(`trace at ${abs}`, err)
            }
        },
        {
            name: 'ingest_trace',
            description: 'Parse a devtools trace.zip and return its action timeline, network entries, transcript and resources.',
            schema: z.object({ tracePath: z.string().describe('Path to a trace.zip artifact') }),
        },
    )

    const reproduceSpecTool = tool(
        async ({ spec }) => runSpecTool({
            configPath: options.configPath ?? '',
            spec,
            projectRoot,
            trace: true,
            traceDir: options.traceDir,
            missingAction: 'reproduce',
            spawnCommand: options.spawnCommand,
            spawnArgs: options.spawnArgs,
        }),
        {
            name: 'reproduce_spec',
            description: 'Re-run a spec under a devtools trace-mode overlay and return the fresh trace artifact path + exit code.',
            schema: z.object({ spec: z.string().describe('Path to the spec file to reproduce') }),
        },
    )

    const diffTraces = tool(
        async ({ oldTrace, newTrace }) => {
            try {
                const [oldArtifact, newArtifact] = await Promise.all([
                    readTraceArchive(await confineTracePath(options.traceDir, projectRoot, oldTrace), {}, cache),
                    readTraceArchive(await confineTracePath(options.traceDir, projectRoot, newTrace), {}, cache),
                ])
                return JSON.stringify(diffArtifacts(oldArtifact, newArtifact), null, 2)
            } catch (err) {
                return readErr('traces', err)
            }
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
