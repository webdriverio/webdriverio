/**
 * @wdio/deepagent — BYOK LangChain Deep Agent harness for WebdriverIO.
 *
 * CLI entry point dispatching the repl, run, diagnose, and mcp commands.
 */

import logger from '@wdio/logger'
import readline from 'node:readline'
import path from 'node:path'
import { loadDeepAgentConfig, findDefaultConfigPath, DEFAULT_MODEL_HINT, DEFAULT_TRACE_DIR } from './config/index.js'
import type { DeepAgentConfig } from './config/index.js'
import { createDeepAgentHarness, createToolSurface } from './agent.js'
import type { DeepAgentHarness } from './agent.js'
import { runDiagnosis } from './heal/index.js'
import type { DiagnosisReport } from './heal/index.js'
import { serveAsMcpServer } from './mcp/index.js'
import { parseFlags } from './commands/flags.js'
import type { CliFlags } from './commands/flags.js'
import { createInterruptResolver } from './commands/interrupt.js'
import { runRepl } from './commands/repl.js'
import { runMission } from './commands/run.js'

const log = logger('@wdio/deepagent')

const USAGE = `Usage: wdio-deepagent <command> [options]

Commands:
  repl                 interactive agent session
  run <prompt>         one-shot mission (CI-able)
  diagnose <trace.zip> reproduce + heal a failing run
  mcp                  serve the agent as an MCP server
  help                 show this help

Options:
  --config <path>   wdio.conf path (default: wdio.conf.ts in cwd)
  --heal <mode>     ask | propose | auto
  --model <str>     provider:model, e.g. openrouter:moonshotai/kimi-k3
  --trace-dir <dir> trace artifact directory (default: ${DEFAULT_TRACE_DIR})
  --no-mcp          run without the @wdio/mcp browser tool surface
`

const ASK_NON_TTY_ERROR = '[@wdio/deepagent] heal mode is "ask" but stdin is not a TTY — gated writes cannot be approved. Pass `--heal auto` for unattended CI, or use `wdio-deepagent repl` for interactive approval.'

const rejectWrite = (config: DeepAgentConfig, subject: string): string | undefined =>
    config.heal === 'propose'
        ? `[@wdio/deepagent] heal mode "propose" is read-only — ${subject} cannot write. Use \`wdio-deepagent diagnose <trace.zip>\` to produce a fix diff without writes.`
        : undefined

const rejectRun = (config: DeepAgentConfig): string | undefined =>
    config.heal === 'ask' && !process.stdin.isTTY ? ASK_NON_TTY_ERROR : rejectWrite(config, '`run`')

const rejectDiagnose = (config: DeepAgentConfig): string | undefined =>
    config.heal === 'ask' && !process.stdin.isTTY ? ASK_NON_TTY_ERROR : undefined

const rejectRepl = (config: DeepAgentConfig): string | undefined => rejectWrite(config, 'the REPL')

interface BuildHarnessResult {
    harness: DeepAgentHarness | undefined
    flags: CliFlags
    configPath?: string
    config: DeepAgentConfig
}

async function buildHarness(argv: string[], opts: { allowModelless?: boolean; skipPropose?: boolean; rejectIf?: (config: DeepAgentConfig) => string | undefined } = {}): Promise<BuildHarnessResult> {
    const flags = parseFlags(argv)
    const configPath = flags.config ?? findDefaultConfigPath()
    const config = await loadDeepAgentConfig({
        configPath,
        cli: { heal: flags.heal, model: flags.model, traceDir: flags.traceDir },
        modelOptional: opts.allowModelless,
    })
    const rejected = opts.rejectIf?.(config)
    if (rejected) {
        throw new Error(rejected)
    }
    if (config.model && !(opts.skipPropose && config.heal === 'propose')) {
        log.info(`Model: ${config.model.provider}:${config.model.model} · heal: ${config.heal}`)
        const harness = await createDeepAgentHarness({
            model: config.model,
            heal: config.heal,
            mcp: flags.noMcp ? null : config.mcp,
            traceDir: config.traceDir,
            projectRoot: path.resolve(config.permissions.projectRoot),
            configPath,
        })
        return { harness, flags, configPath, config }
    }
    return { harness: undefined, flags, configPath, config }
}

export async function run(): Promise<void> {
    const [command, ...rest] = process.argv.slice(2)

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
        const { harness } = await buildHarness(rest, { rejectIf: rejectRepl })
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
        const { harness, flags, config } = await buildHarness(rest, { rejectIf: rejectRun })
        if (!flags.positionals?.length) {
            throw new Error('run requires a prompt: wdio-deepagent run "<prompt>"')
        }
        let rl: readline.Interface | undefined
        if (config.heal === 'ask') {
            rl = readline.createInterface({ input: process.stdin, output: process.stdout })
            // Ctrl-C while a gated write awaits approval must abort the
            // mission, not hang it: closing the interface rejects the pending
            // prompt (see createInterruptResolver), unwinding the finally
            // block so the MCP server is closed.
            rl.on('SIGINT', () => rl?.close())
        }
        try {
            const prompt = flags.positionals.join(' ')
            const result = rl
                ? await runMission(harness!.agent, prompt, { resolveInterrupt: createInterruptResolver(rl) })
                : await runMission(harness!.agent, prompt)
            process.exitCode = result.exitCode
        } finally {
            rl?.close()
            await harness!.close()
        }
        break
    }
    case 'diagnose': {
        const built = await buildHarness(rest, { allowModelless: true, skipPropose: true, rejectIf: rejectDiagnose })
        const tracePath = built.flags.positionals?.[0]
        if (!tracePath) {
            throw new Error('diagnose requires a trace.zip path: wdio-deepagent diagnose <trace.zip> [--spec <path>]')
        }
        if (built.config.heal !== 'propose' && !built.harness) {
            throw new Error(DEFAULT_MODEL_HINT)
        }
        const harness = built.harness
        let rl: readline.Interface | undefined
        if (built.config.heal === 'ask') {
            rl = readline.createInterface({ input: process.stdin, output: process.stdout })
            // Ctrl-C while a gated write awaits approval must abort the
            // diagnosis, not hang it: closing the interface rejects the
            // pending prompt (see createInterruptResolver), unwinding the
            // finally block so the MCP server is closed.
            rl.on('SIGINT', () => rl?.close())
        }
        let report: DiagnosisReport
        try {
            report = await runDiagnosis({
                tracePath,
                configPath: built.configPath,
                spec: built.flags.spec,
                traceDir: built.config.traceDir,
                heal: built.config.heal,
                agent: harness?.agent,
                ...(rl ? { resolveInterrupt: createInterruptResolver(rl) } : {}),
            })
        } finally {
            rl?.close()
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
        // nothing may land on stdout before the JSON-RPC framing clients parse from byte 0
        // setLogLevelsConfig silences all loggers (incl. @wdio/config's ConfigParser
        // during buildHarness) and pins WDIO_LOG_LEVEL=silent for any created later
        logger.setLogLevelsConfig({}, 'silent')
        const built = await buildHarness(rest, { allowModelless: true })
        const surface = built.harness ?? await createToolSurface({
            mcp: built.flags.noMcp ? null : built.config.mcp,
            traceDir: built.config.traceDir,
            configPath: built.configPath,
        })
        if (surface.mcpClient === null) {
            log.warn('mcp: null config — serving the trace/knowledge-base tool surface only (no browser tools)')
        }
        try {
            await serveAsMcpServer(surface)
        } finally {
            await surface.close()
        }
        process.exitCode = 0
        break
    }
    case 'help':
    case undefined:
        console.log(USAGE)
        process.exitCode = 0
        break
    default:
        console.error(`Unknown command: ${command} — commands come first: wdio-deepagent <command> [options]`)
        console.log(USAGE)
        process.exitCode = 1
    }
}
