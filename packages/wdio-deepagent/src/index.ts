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
import { isLocalProvider, warmupModel } from './commands/warmup.js'

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

const rejectRun = (config: DeepAgentConfig, flags: CliFlags): string | undefined => {
    // `run ""` parses as one empty positional — reject it here, or the agent
    // receives a blank prompt
    if (!flags.positionals?.[0]) {
        return 'run requires a prompt: wdio-deepagent run "<prompt>"'
    }
    return config.heal === 'ask' && !process.stdin.isTTY ? ASK_NON_TTY_ERROR : rejectWrite(config, '`run`')
}

const rejectDiagnose = (config: DeepAgentConfig, flags: CliFlags): string | undefined => {
    // `diagnose ""` parses as one empty positional — reject it here, or
    // path.resolve('') silently yields cwd and AdmZip fails with EISDIR
    if (!flags.positionals?.[0]) {
        return 'diagnose requires a trace.zip path: wdio-deepagent diagnose <trace.zip> [--spec <path>]'
    }
    return config.heal === 'ask' && !process.stdin.isTTY ? ASK_NON_TTY_ERROR : undefined
}

const rejectRepl = (config: DeepAgentConfig): string | undefined => rejectWrite(config, 'the REPL')

/** Interactive approval interface for heal=ask, or undefined to run unattended. */
function createAskInterface(config: DeepAgentConfig): readline.Interface | undefined {
    if (config.heal !== 'ask') {
        return undefined
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    // Ctrl-C while a gated write awaits approval must abort the mission,
    // not hang it: closing the interface rejects the pending prompt (see
    // createInterruptResolver), unwinding the finally block so the MCP
    // server is closed.
    rl.on('SIGINT', () => rl?.close())
    return rl
}

interface BuildHarnessResult {
    harness: DeepAgentHarness | undefined
    flags: CliFlags
    configPath?: string
    config: DeepAgentConfig
}

async function loadConfigForFlags(rest: string[], opts: { allowModelless?: boolean } = {}): Promise<{ flags: CliFlags; configPath?: string; config: DeepAgentConfig }> {
    const flags = parseFlags(rest)
    const configPath = flags.config ?? findDefaultConfigPath()
    const config = await loadDeepAgentConfig({
        configPath,
        cli: { heal: flags.heal, model: flags.model, traceDir: flags.traceDir },
        modelOptional: opts.allowModelless,
    })
    return { flags, configPath, config }
}

async function buildHarness(argv: string[], opts: { allowModelless?: boolean; skipPropose?: boolean; rejectIf?: (config: DeepAgentConfig, flags: CliFlags) => string | undefined } = {}): Promise<BuildHarnessResult> {
    const { flags, configPath, config } = await loadConfigForFlags(argv, { allowModelless: opts.allowModelless })
    const rejected = opts.rejectIf?.(config, flags)
    if (rejected) {
        throw new Error(rejected)
    }
    if (config.llm && !(opts.skipPropose && config.heal === 'propose')) {
        log.info(`Model: ${config.llm.provider}:${config.llm.model} · heal: ${config.heal}`)
        const harness = await createDeepAgentHarness({
            model: config.llm,
            heal: config.heal,
            mcp: flags.noMcp ? null : config.mcp,
            traceDir: config.traceDir,
            projectRoot: path.resolve(config.permissions.projectRoot),
            configPath,
            instructionsPath: config.instructionsPath,
            appendInstructions: config.appendInstructions,
            appendInstructionsFile: config.appendInstructionsFile,
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
        log.error((err as Error).message)
        process.exitCode = 1
    }
}

async function dispatch(command: string | undefined, rest: string[]): Promise<void> {
    switch (command) {
    case 'repl': {
        const { harness, config } = await buildHarness(rest, { rejectIf: rejectRepl })
        const warmupAbort = new AbortController()
        // fire-and-forget: preload the model/tool schema while ink renders;
        // failures or slow servers must never block or break the repl.
        // Remote providers bill ~13k tokens per session — warmup is local-only.
        if (config.llm && isLocalProvider(config.llm.provider)) {
            warmupModel(harness!.model, harness!.tools, warmupAbort.signal).catch(() => {})
        }
        try {
            await runRepl(harness!.agent, harness!.close, async () => {
                if (!harness!.mcpClient) {
                    throw new Error('mcp: null config — no browser session')
                }
                await harness!.mcpClient.callTool('close_session', {})
            }, () => warmupAbort.abort())
        } finally {
            warmupAbort.abort()
        }
        break
    }
    case 'run': {
        const { harness, flags, config } = await buildHarness(rest, { rejectIf: rejectRun })
        const rl = createAskInterface(config)
        try {
            const prompt = flags.positionals!.join(' ')
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
        const tracePath = built.flags.positionals![0]
        if (built.config.heal !== 'propose' && !built.harness) {
            throw new Error(DEFAULT_MODEL_HINT)
        }
        const harness = built.harness
        const rl = createAskInterface(built.config)
        let report: DiagnosisReport
        try {
            report = await runDiagnosis({
                tracePath,
                configPath: built.configPath,
                spec: built.flags.spec,
                traceDir: built.config.traceDir,
                heal: built.config.heal,
                maxHealAttempts: built.config.maxHealAttempts,
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
            verification: report.verification,
            heal: report.heal,
            agentRan: report.agentRan,
            healAttempts: report.healAttempts,
            agentReply: report.agentReply,
        }, null, 2))
        // a post-heal rerun is the only truthful signal: report.diff describes the
        // pre-heal state, so it cannot tell whether the agent's edit worked
        const exitFailed = report.verification
            ? !report.verification.healed
            : (report.failedActions.length > 0 && (report.diff?.newHasFailures ?? true))
        process.exitCode = exitFailed ? 1 : 0
        console.error(`Diagnosis ${exitFailed ? 'failed' : 'passed'} — ${report.failedActions.length} failed action(s), ${report.networkErrors.length} network error(s)`)
        if (report.agentReply) {
            console.error(`Agent: ${report.agentReply.slice(0, 200)}${report.agentReply.length > 200 ? '…' : ''}`)
        }
        break
    }
    case 'mcp': {
        // nothing may land on stdout before the JSON-RPC framing clients parse from byte 0
        // setLogLevelsConfig silences all loggers (incl. @wdio/config's ConfigParser
        // during config load) and pins WDIO_LOG_LEVEL=silent for any created later
        logger.setLogLevelsConfig({}, 'silent')
        const { flags, configPath, config } = await loadConfigForFlags(rest, { allowModelless: true })
        // serve the surface without a model — resolving the chat model here would
        // fail for keyed providers without an API key, and the mcp command needs none
        const surface = await createToolSurface({
            mcp: flags.noMcp ? null : config.mcp,
            traceDir: config.traceDir,
            configPath,
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
        log.error(`Unknown command: ${command} — commands come first: wdio-deepagent <command> [options]`, USAGE)
        process.exitCode = 1
    }
}
