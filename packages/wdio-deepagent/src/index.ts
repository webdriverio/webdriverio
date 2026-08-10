/**
 * @wdio/deepagent — BYOK LangChain Deep Agent harness for WebdriverIO.
 *
 * CLI entry point. Command implementations: repl + run (this phase);
 * init / diagnose / mcp are wired in the final phase.
 */

import logger from '@wdio/logger'
import path from 'node:path'
import { loadDeepAgentConfig, findDefaultConfigPath, DEFAULT_MODEL_HINT } from './config/index.js'
import type { DeepAgentConfig } from './config/index.js'
import { createDeepAgentHarness } from './agent.js'
import type { DeepAgentHarness } from './agent.js'
import { runInit } from './init/index.js'
import { runDiagnosis } from './heal/index.js'
import type { DiagnosisReport } from './heal/index.js'
import { serveAsMcpServer } from './mcp/index.js'
import { parseFlags } from './commands/flags.js'
import type { CliFlags } from './commands/flags.js'
import { runRepl } from './commands/repl.js'
import { runMission } from './commands/run.js'

const log = logger('@wdio/deepagent')

const USAGE = `Usage: wdio-deepagent <command> [options]

Commands:
  repl                 interactive agent session
  run <prompt>         one-shot mission (CI-able)
  init                 framework interview → write wdio.conf.ts
  diagnose <trace.zip> reproduce + heal a failing run
  mcp                  serve the agent as an MCP server
  help                 show this help

Options:
  --config <path>   wdio.conf path (default: wdio.conf.ts in cwd)
  --heal <mode>     ask | propose | auto
  --model <str>     provider:model, e.g. openrouter:moonshotai/kimi-k3
  --trace-dir <dir> trace artifact directory (default: test-results)
`

interface BuildHarnessResult {
    harness: DeepAgentHarness | undefined
    flags: CliFlags
    configPath?: string
    config: DeepAgentConfig
}

async function buildHarness(argv: string[], opts: { allowModelless?: boolean; skipPropose?: boolean } = {}): Promise<BuildHarnessResult> {
    const flags = parseFlags(argv)
    const configPath = flags.config ?? findDefaultConfigPath()
    const config = await loadDeepAgentConfig({
        configPath,
        cli: { heal: flags.heal, model: flags.model, traceDir: flags.traceDir },
        modelOptional: opts.allowModelless,
    })
    if (!config.model && !opts.allowModelless) {
        throw new Error(DEFAULT_MODEL_HINT)
    }
    if (config.model && !(opts.skipPropose && config.heal === 'propose')) {
        log.info(`Model: ${config.model.provider}:${config.model.model} · heal: ${config.heal}`)
        const harness = await createDeepAgentHarness({
            model: config.model,
            heal: config.heal,
            mcp: config.mcp,
            traceDir: config.traceDir,
            projectRoot: path.resolve(config.permissions.projectRoot),
            configPath,
        })
        return { harness, flags, configPath, config }
    }
    return { harness: undefined, flags, configPath, config }
}

export async function run(): Promise<void> {
    // strip a leading `deepagent` arg when invoked as `wdio deepagent …`
    const raw = process.argv.slice(2)
    const [command, ...rest] = raw[0] === 'deepagent' ? raw.slice(1) : raw

    try {
        await dispatch(command, rest)
    } catch (err) {
        // Surface failures with a clear exit code — the bin shim does not
        // catch, and an unhandled rejection is invisible in scripts.
        console.error((err as Error).message)
        process.exitCode = 1
    }
}

async function dispatch(command: string | undefined, rest: string[]): Promise<void> {
    switch (command) {
    case 'repl': {
        const { harness } = await buildHarness(rest)
        console.log('wdio-deepagent REPL — type a mission, or "exit" to quit. "close session" closes the browser session.')
        await runRepl(harness!.agent, harness!.close, async () => {
            if (!harness!.mcpClient) {
                throw new Error('mcp: null config — no browser session')
            }
            await harness!.mcpClient.callTool('close_session', {})
        })
        break
    }
    case 'run': {
        const { harness, flags } = await buildHarness(rest)
        if (!flags.positionals?.length) {
            throw new Error('run requires a prompt: wdio-deepagent run "<prompt>"')
        }
        const result = await runMission(harness!.agent, flags.positionals.join(' '))
        await harness!.close()
        process.exitCode = result.exitCode
        break
    }
    case 'init': {
        const result = await runInit()

        console.log(`Wrote ${result.configPath}. Next: set your LLM key (e.g. OPENROUTER_API_KEY) and run \`wdio-deepagent repl\`.`)
        break
    }
    case 'diagnose': {
        const built = await buildHarness(rest, { allowModelless: true, skipPropose: true })
        const tracePath = built.flags.positionals?.[0]
        if (!tracePath) {
            throw new Error('diagnose requires a trace.zip path: wdio-deepagent diagnose <trace.zip> [--spec <path>]')
        }
        if (built.config.heal !== 'propose' && !built.harness) {
            throw new Error(DEFAULT_MODEL_HINT)
        }
        const harness = built.harness
        let report: DiagnosisReport
        try {
            report = await runDiagnosis({
                tracePath,
                configPath: built.configPath,
                spec: built.flags.spec,
                traceDir: built.config.traceDir,
                heal: built.config.heal,
                agent: harness?.agent,
            })
        } finally {
            // a thrown diagnosis must not leak the harness's MCP server process
            await harness?.close()
        }
        console.log(JSON.stringify({
            source: report.source,
            actionCount: report.actionCount,
            failedActions: report.failedActions.length,
            networkErrors: report.networkErrors.length,
            reproduction: report.reproduction,
            diff: report.diff,
            heal: report.heal,
            agentRan: report.agentRan,
            agentReply: report.agentReply,
        }, null, 2))
        process.exitCode = report.failedActions.length > 0 ? 1 : 0
        break
    }
    case 'mcp': {
        const { harness } = await buildHarness(rest)
        if (harness!.mcpClient === null) {
            log.warn('mcp: null config — serving the trace/knowledge-base tool surface only (no browser tools)')
        }
        await serveAsMcpServer(harness!)
        await harness!.close()
        break
    }
    case 'help':
    case undefined:
        console.log(USAGE)
        process.exitCode = 0
        break
    default:
        console.error(`Unknown command: ${command}`)
        console.log(USAGE)
        process.exitCode = 1
    }
}
