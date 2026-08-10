/**
 * @wdio/deepagent — BYOK LangChain Deep Agent harness for WebdriverIO.
 *
 * CLI entry point. Command implementations: repl + run (this phase);
 * init / diagnose / mcp are wired in the final phase.
 */

import logger from '@wdio/logger'
import path from 'node:path'
import { loadDeepAgentConfig, findDefaultConfigPath, DEFAULT_MODEL_HINT } from './config/index.js'
import { createDeepAgentHarness } from './agent.js'
import { runInit } from './init/index.js'
import { runDiagnosis } from './heal/index.js'
import { serveAsMcpServer } from './mcp/index.js'
import { parseFlags } from './commands/flags.js'
import { runRepl } from './commands/repl.js'
import { runMission } from './commands/run.js'

const log = logger('wdio-deepagent')

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

async function buildHarnessFromFlags(argv: string[]) {
    const flags = parseFlags(argv)
    const configPath = flags.config ?? findDefaultConfigPath()
    const config = await loadDeepAgentConfig({
        configPath,
        cli: { heal: flags.heal, model: flags.model, traceDir: flags.traceDir },
    })
    // loadDeepAgentConfig throws DEFAULT_MODEL_HINT when no model resolves,
    // so config.model is guaranteed here.
    if (!config.model) {
        throw new Error(DEFAULT_MODEL_HINT)
    }
    log.info(`Model: ${config.model.provider}:${config.model.model} · heal: ${config.heal}`)
    const harness = await createDeepAgentHarness({
        model: config.model,
        heal: config.heal,
        mcp: config.mcp,
        traceDir: config.traceDir,
        projectRoot: path.resolve(config.permissions.projectRoot),
        configPath,
    })
    return { harness, flags }
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
        const { harness } = await buildHarnessFromFlags(rest)
        console.log('wdio-deepagent REPL — type a mission, or "exit" to quit.')
        await runRepl(harness.agent, harness.close)
        break
    }
    case 'run': {
        const { harness, flags } = await buildHarnessFromFlags(rest)
        if (!flags.prompt) {
            throw new Error('run requires a prompt: wdio-deepagent run "<prompt>"')
        }
        const result = await runMission(harness.agent, flags.prompt)
        await harness.close()
        process.exitCode = result.exitCode
        break
    }
    case 'init': {
        const result = await runInit()

        console.log(`Wrote ${result.configPath}. Next: set your LLM key (e.g. OPENROUTER_API_KEY) and run \`wdio-deepagent repl\`.`)
        break
    }
    case 'diagnose': {
        const flags = parseFlags(rest)
        const configPath = flags.config ?? findDefaultConfigPath()
        const tracePath = flags.positionals?.[0] ?? flags.prompt
        if (!tracePath) {
            throw new Error('diagnose requires a trace.zip path: wdio-deepagent diagnose <trace.zip> [--spec <path>]')
        }
        const config = await loadDeepAgentConfig({
            configPath,
            cli: { heal: flags.heal, model: flags.model, traceDir: flags.traceDir },
            // propose mode builds no agent, so read-only diagnosis works
            // even without any model configured
            modelOptional: true,
        })
        if (config.heal !== 'propose' && !config.model) {
            throw new Error(DEFAULT_MODEL_HINT)
        }
        const harness = config.heal !== 'propose' && config.model
            ? await createDeepAgentHarness({
                model: config.model,
                heal: config.heal,
                mcp: config.mcp,
                traceDir: config.traceDir,
                projectRoot: path.resolve(config.permissions.projectRoot),
                configPath,
            })
            : undefined
        const report = await runDiagnosis({
            tracePath,
            configPath,
            spec: flags.spec,
            traceDir: config.traceDir,
            heal: config.heal,
            agent: harness?.agent,
        })
        await harness?.close()
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
        const { harness } = await buildHarnessFromFlags(rest)
        if (harness.mcpClient === null) {
            log.warn('mcp: null config — serving the trace/knowledge-base tool surface only (no browser tools)')
        }
        await serveAsMcpServer(harness)
        await harness.close()
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
