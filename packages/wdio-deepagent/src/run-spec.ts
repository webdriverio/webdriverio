import { tool } from 'langchain'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { formatRunResult, missingConfigMessage, projectRootForConfig, resolveSpecPath, runSpec } from './trace/reproduce.js'
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
    const projectRoot = options.configPath ? projectRootForConfig(options.configPath) : process.cwd()
    return tool(
        async ({ spec, timeoutMs }) => {
            if (!options.configPath) {
                return missingConfigMessage('run specs')
            }
            const result = await runSpec({
                configPath: options.configPath,
                spec: resolveSpecPath(projectRoot, spec),
                projectRoot,
                timeoutMs: timeoutMs ?? options.timeoutMs,
                spawnCommand: options.spawnCommand,
                spawnArgs: options.spawnArgs,
            })
            // stdout is fully buffered for the run; only the tails go back
            // ponytail: ring-buffer stdout if memory pressure ever shows
            return formatRunResult({
                exitCode: result.exitCode,
                durationMs: result.duration,
                stdout: result.stdout,
                stderr: result.stderr,
            })
        },
        {
            name: 'run_spec',
            description: 'Run a WebdriverIO spec with the project\'s own wdio.conf (no trace overlay) and return exit code, duration and output tails. Use this to run or verify any test spec.',
            schema: z.object({
                spec: z.string().describe('Spec file path, e.g. "/test/specs/login.spec.js" (project-rooted virtual) or "test/specs/login.spec.js"'),
                timeoutMs: z.number().int().positive().max(30 * 60 * 1000).optional().describe('Timeout override in ms (default 10 minutes)'),
            }),
        },
    )
}
