import { tool } from 'langchain'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { MAX_TIMEOUT_MS, projectRootForConfig, runSpecTool } from './trace/reproduce.js'
import type { SpawnOverride } from './trace/reproduce.js'

/**
 * run_spec executes the project's own spec suite without the trace
 * overlay, so the agent can run or verify any test spec directly.
 */

export interface RunSpecToolOptions extends SpawnOverride {
    /** Project wdio.conf path (needed to resolve specs against the project root). */
    configPath?: string
    /**
     * Kill the spawned run after this many ms and report a timeout
     * (default: 10 minutes) so a hung spec cannot hang the harness/CI
     * forever.
     */
    timeoutMs?: number
}

export function createRunSpecTool(options: RunSpecToolOptions): DynamicStructuredTool {
    const projectRoot = projectRootForConfig(options.configPath)
    return tool(
        // stdout is fully buffered for the run; only the tails go back
        // ponytail: ring-buffer stdout if memory pressure ever shows
        async ({ spec, timeoutMs }) => runSpecTool({
            configPath: options.configPath ?? '',
            spec,
            projectRoot,
            trace: false,
            missingAction: 'run specs',
            timeoutMs: timeoutMs ?? options.timeoutMs,
            spawnCommand: options.spawnCommand,
            spawnArgs: options.spawnArgs,
        }),
        {
            name: 'run_spec',
            description: 'Run a WebdriverIO spec with the project\'s own wdio.conf (no trace overlay) and return exit code, duration and output tails. Use this to run or verify any test spec.',
            schema: z.object({
                spec: z.string().describe('Spec file path, e.g. "/test/specs/login.spec.js" (project-rooted virtual) or "test/specs/login.spec.js"'),
                timeoutMs: z.number().int().positive().max(MAX_TIMEOUT_MS).optional().describe('Timeout override in ms (default 10 minutes)'),
            }),
        },
    )
}
