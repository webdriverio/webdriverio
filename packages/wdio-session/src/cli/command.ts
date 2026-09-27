import fs from 'node:fs'
import path from 'node:path'

import yargs, { type Argv, type Options } from 'yargs'

import { ACTIONS, ACTION_MAP, actionTimeout, type ActionSpec } from '../actions/specs.js'
import { DEFAULT_SESSION, SESSION_NAME_PATTERN } from '../constants.js'
import { SessionError, usage } from '../errors.js'
import { getArtifactsDir, getRuntimeDir, isPidAlive, listStates, readState, removeStaleState } from '../daemon/state.js'
import { getLiveState, send } from './client.js'
import { printError, printResult, useColor, type OutputOptions } from './output.js'
import { spawnDaemon, waitForExit } from './spawn.js'
import type { ActionResult, StateFile } from '../types.js'

export interface CliIO {
    stdin?: NodeJS.ReadStream
    stdout?: NodeJS.WriteStream
    stderr?: NodeJS.WriteStream
    env?: NodeJS.ProcessEnv
    cwd?: string
}

const GLOBAL_OPTIONS: Record<string, Options> = {
    session: { alias: 's', type: 'string', desc: 'Session name (env WDIO_SESSION)', global: true },
    json: { type: 'boolean', desc: 'Print one JSON object (env WDIO_SESSION_JSON=1)', global: true },
    timeout: { type: 'number', desc: 'Request timeout in ms', global: true },
    quiet: { alias: 'q', type: 'boolean', desc: 'Print nothing on success except requested data', global: true },
    color: { type: 'boolean', desc: 'Use --no-color to disable colors', global: true }
}

const GLOBAL_VALUE_FLAGS = new Set(['-s', '--session', '--timeout'])

/**
 * `wdio session <<'JS' … JS` runs `exec` when no action is given and stdin
 * is piped.
 */
export function hasAction (args: string[]) {
    for (let i = 0; i < args.length; i++) {
        const arg = args[i]
        if (GLOBAL_VALUE_FLAGS.has(arg)) {
            i++
            continue
        }
        if (!arg.startsWith('-')) {
            return true
        }
        if (arg === '--help' || arg === '-h' || arg === '--version') {
            return true
        }
    }
    return false
}

function commandString (spec: ActionSpec) {
    const positionals = (spec.positionals || []).map((p) => p.required ? `<${p.name}${p.variadic ? '..' : ''}>` : `[${p.name}${p.variadic ? '..' : ''}]`)
    return [spec.name, ...positionals].join(' ')
}

export function buildParser (onAction: (spec: ActionSpec, argv: Record<string, unknown>) => void) {
    let parser: Argv = yargs()
        .scriptName('wdio session')
        .usage('$0 <action> [args] [flags]\n\nDrive a browser, mobile app or desktop app from the shell. Pipe WebdriverIO code on stdin to run it.')
        .options(GLOBAL_OPTIONS)
        .updateStrings({ 'Commands:': 'Actions:' })
        .strict()
        .exitProcess(false)
        .version(false)
        .help()
        .alias('h', 'help')
        .wrap(Math.min(120, process.stdout.columns || 100))
        .demandCommand(1, 'Specify an action, e.g. `wdio session open chrome`.')
        .epilogue('Docs: https://webdriver.io/docs/session')

    for (const spec of ACTIONS) {
        parser = parser.command(
            commandString(spec),
            `${spec.desc}${spec.group ? '' : ''}`,
            (y: Argv) => {
                for (const p of spec.positionals || []) {
                    y = y.positional(p.name, { desc: p.desc, type: 'string', ...(p.choices ? { choices: p.choices } : {}) })
                }
                if (spec.options) {
                    y = y.options(spec.options)
                }
                for (const [cmd, desc] of spec.examples || []) {
                    y = y.example(cmd, desc)
                }
                return y
            },
            (argv: Record<string, unknown>) => onAction(spec, argv)
        )
    }
    return parser
}

/**
 * Collect the arguments an action understands from parsed argv.
 */
export function pickArgs (spec: ActionSpec, argv: Record<string, unknown>) {
    const args: Record<string, unknown> = {}
    const camel = (s: string) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    for (const p of spec.positionals || []) {
        if (argv[p.name] !== undefined) {
            args[camel(p.name)] = argv[p.name]
        }
    }
    for (const key of Object.keys(spec.options || {})) {
        const name = camel(key)
        if (argv[name] !== undefined) {
            args[name] = argv[name]
        }
    }
    return args
}

async function readStdin (stdin: NodeJS.ReadStream) {
    const chunks: Buffer[] = []
    for await (const chunk of stdin) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks).toString('utf-8')
}

interface RunContext {
    name: string
    runtimeDir: string
    cwd: string
    env: NodeJS.ProcessEnv
    io: Required<Pick<CliIO, 'stdin' | 'stdout' | 'stderr'>>
    output: OutputOptions
    timeout?: number
    rawArgs: string[]
}

/**
 * Run `wdio session` with the given arguments (without `wdio session`).
 * Returns the exit code.
 */
export async function runSessionCli (rawArgs: string[], io: CliIO = {}): Promise<number> {
    const stdin = io.stdin || process.stdin
    const stdout = io.stdout || process.stdout
    const stderr = io.stderr || process.stderr
    const env = io.env || process.env
    const cwd = io.cwd || process.cwd()

    let args = [...rawArgs]
    if (!hasAction(args) && !stdin.isTTY) {
        args = ['exec', ...args]
    }

    let selected: { spec: ActionSpec, argv: Record<string, unknown> } | undefined
    const parser = buildParser((spec, argv) => {
        selected = { spec, argv }
    })
    let helpOutput = ''
    let parseError: Error | undefined
    try {
        await parser.parseAsync(args, {}, (err: Error | undefined, _argv: unknown, output: string) => {
            parseError = err || undefined
            helpOutput = output
        })
    } catch (err) {
        parseError = err as Error
    }

    const json = args.includes('--json') || env.WDIO_SESSION_JSON === '1'
    if (parseError || !selected) {
        if (helpOutput && !parseError) {
            stdout.write(helpOutput + '\n')
            return 0
        }
        const message = parseError?.message || 'Specify an action.'
        return printError(usage(message, 'Run `wdio session --help` for the list of actions.'), {
            json, session: DEFAULT_SESSION, action: args[0] || '', stdout, stderr
        })
    }
    const { spec, argv } = selected
    const name = String(argv.session || env.WDIO_SESSION || DEFAULT_SESSION)
    const output: OutputOptions = {
        json: Boolean(argv.json) || env.WDIO_SESSION_JSON === '1',
        quiet: Boolean(argv.quiet),
        color: useColor(argv.color, stdout, env),
        session: name,
        action: spec.name,
        mutation: spec.mutation,
        stdout,
        stderr
    }
    if (!SESSION_NAME_PATTERN.test(name)) {
        return printError(usage(`Invalid session name "${name}", use letters, digits, "_" and "-" (max 64).`), output)
    }

    const ctx: RunContext = {
        name,
        runtimeDir: getRuntimeDir({ env }),
        cwd,
        env,
        io: { stdin, stdout, stderr },
        output,
        timeout: typeof argv.timeout === 'number' ? argv.timeout : undefined,
        rawArgs
    }

    try {
        const result = await runAction(spec, pickArgs(spec, argv), ctx)
        printResult(result, output)
        return typeof (result.data as { exitCode?: number })?.exitCode === 'number' ? (result.data as { exitCode: number }).exitCode : 0
    } catch (err) {
        return printError(err, output)
    }
}

async function runAction (spec: ActionSpec, args: Record<string, unknown>, ctx: RunContext): Promise<ActionResult> {
    switch (spec.name) {
    case 'open':
        return open(args, ctx)
    case 'close':
        return close(args, ctx)
    case 'list':
        return list(ctx)
    case 'status':
        return status(ctx)
    case 'restart':
        return restart(ctx)
    case 'doctor': {
        const { runDoctor } = await import('../doctor.js')
        return runDoctor(args, ctx)
    }
    case 'skill': {
        const { skill } = await import('../skill.js')
        return skill(args, ctx)
    }
    case 'exec':
        return send(ctx.name, 'exec', await execArgs(args, ctx), { runtimeDir: ctx.runtimeDir, timeout: ctx.timeout ?? actionTimeout('exec'), cwd: ctx.cwd })
    default:
        if (spec.name === 'visual') {
            const { checkVisualDependency } = await import('../deps.js')
            await checkVisualDependency(ctx.cwd, getLiveState(ctx.name, ctx.runtimeDir).cwd)
        }
        return send(ctx.name, spec.name, args, { runtimeDir: ctx.runtimeDir, timeout: ctx.timeout ?? actionTimeout(spec.name), cwd: ctx.cwd })
    }
}

async function execArgs (args: Record<string, unknown>, ctx: RunContext) {
    let code: string
    let filename: string | undefined
    if (typeof args.e === 'string') {
        code = args.e
    } else if (typeof args.file === 'string') {
        filename = path.resolve(ctx.cwd, args.file)
        if (!fs.existsSync(filename)) {
            throw usage(
                `File ${filename} does not exist.`,
                /[\s(;]/.test(args.file) ? `To run inline code use -e: wdio session exec -e ${JSON.stringify(args.file)}` : undefined
            )
        }
        code = fs.readFileSync(filename, 'utf-8')
    } else if (!ctx.io.stdin.isTTY) {
        code = await readStdin(ctx.io.stdin)
    } else {
        throw usage('No code given.', 'Pass code with -e, a file, or pipe it on stdin: wdio session <<\'JS\' … JS')
    }
    if (!code.trim()) {
        throw usage('No code given.', 'Pass code with -e, a file, or pipe it on stdin.')
    }
    return { code, filename, history: args.history !== false }
}

function describe (state: StateFile) {
    const version = state.browserVersion ? ` ${state.browserVersion}` : ''
    return `${state.label || state.target}${version}`
}

async function open (args: Record<string, unknown>, ctx: RunContext): Promise<ActionResult> {
    const { buildPlan } = await import('../targets/index.js')
    const plan = await buildPlan(args as { target: string }, {
        name: ctx.name,
        cwd: ctx.cwd,
        runtimeDir: ctx.runtimeDir,
        artifactsDir: getArtifactsDir(ctx.name, ctx.cwd, ctx.env),
        argv: ctx.rawArgs,
        env: ctx.env
    })
    if (args.keepHistory) {
        plan.keepHistory = true
    }
    const existing = readState(ctx.runtimeDir, ctx.name)
    if (existing && isPidAlive(existing.pid) && existing.status !== 'failed') {
        if (!args.replace) {
            throw new SessionError('SESSION_EXISTS', `Session "${ctx.name}" is already running (${describe(existing)}).`, {
                hint: `Use it, close it with \`wdio session close${ctx.name === DEFAULT_SESSION ? '' : ` -s ${ctx.name}`}\`, or pass --replace.`
            })
        }
        await closeOne(ctx.name, ctx)
    }
    for (const note of plan.notes) {
        ctx.io.stderr.write(`${note}\n`)
    }
    const showProgress = Boolean(ctx.io.stderr.isTTY) && !ctx.output.json
    const state = await spawnDaemon(plan, {
        onLog: showProgress ? (line) => ctx.io.stderr.write(`… ${line}\n`) : undefined
    })
    const mode = plan.platform === 'browser' ? (plan.headless ? ' (headless)' : ' (headed)') : ''
    const url = state.url ? ` · ${state.url}` : ''
    return {
        text: `Session "${ctx.name}" ready: ${describe(state)}${mode}${url}\nArtifacts: ${state.artifactsDir}`,
        data: {
            name: ctx.name,
            sessionId: state.sessionId,
            target: state.target,
            platform: state.platform,
            browserName: state.browserName,
            browserVersion: state.browserVersion,
            bidi: state.bidi,
            url: state.url,
            artifactsDir: state.artifactsDir,
            pid: state.pid
        },
        files: [state.artifactsDir]
    }
}

async function closeOne (name: string, ctx: RunContext, clean = false) {
    const state = getLiveState(name, ctx.runtimeDir)
    await send(name, 'close', {}, { runtimeDir: ctx.runtimeDir, timeout: 30_000, cwd: ctx.cwd })
    if (!state.debug) {
        await waitForExit(ctx.runtimeDir, name, state.pid)
    }
    if (clean) {
        fs.rmSync(state.artifactsDir, { recursive: true, force: true })
    }
    return state
}

async function close (args: Record<string, unknown>, ctx: RunContext): Promise<ActionResult> {
    if (args.all) {
        const names: string[] = []
        for (const state of listStates(ctx.runtimeDir)) {
            try {
                await closeOne(state.name, ctx, Boolean(args.clean))
                names.push(state.name)
            } catch (err) {
                if ((err as SessionError).code !== 'SESSION_NOT_FOUND') {
                    throw err
                }
            }
        }
        return { text: names.length ? names.map((n) => `Closed "${n}"`).join('\n') : 'No sessions running.', data: { closed: names } }
    }
    await closeOne(ctx.name, ctx, Boolean(args.clean))
    return { text: `Closed "${ctx.name}"`, data: { closed: [ctx.name] } }
}

function age (iso?: string) {
    if (!iso) {
        return ''
    }
    const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000))
    if (s < 60) {
        return `${s}s`
    }
    if (s < 3600) {
        return `${Math.round(s / 60)}m`
    }
    return `${Math.round(s / 3600)}h`
}

async function list (ctx: RunContext): Promise<ActionResult> {
    const sessions: StateFile[] = []
    const stale: string[] = []
    for (const state of listStates(ctx.runtimeDir)) {
        const spawning = state.status === 'starting' && (state.pid === null || isPidAlive(state.pid))
        if (spawning || (state.status === 'ready' && isPidAlive(state.pid))) {
            sessions.push(state)
        } else {
            removeStaleState(ctx.runtimeDir, state)
            stale.push(state.name)
        }
    }
    const lines = sessions.map((s) => {
        const what = s.debug ? `wdio run (${s.debug.spec || ''})` : describe(s)
        return [s.name.padEnd(12), what.padEnd(20), (s.url || '').padEnd(30), s.status === 'starting' ? 'starting' : age(s.startedAt)].join('  ').trimEnd()
    })
    for (const name of stale) {
        lines.push(`Removed stale session "${name}"`)
    }
    return {
        text: lines.length ? lines.join('\n') : 'No sessions running.',
        data: {
            sessions: sessions.map(({ token: _token, socket: _socket, ...rest }) => rest),
            stale
        }
    }
}

async function status (ctx: RunContext): Promise<ActionResult> {
    try {
        getLiveState(ctx.name, ctx.runtimeDir)
        return { text: 'running', data: { running: true } }
    } catch (err) {
        if ((err as SessionError).code === 'SESSION_NOT_FOUND') {
            if (ctx.output.json) {
                return { text: 'not running', data: { running: false, exitCode: 4 } }
            }
            ctx.io.stdout.write('not running\n')
            return { data: { running: false, exitCode: 4 } }
        }
        throw err
    }
}

async function restart (ctx: RunContext): Promise<ActionResult> {
    const state = getLiveState(ctx.name, ctx.runtimeDir)
    if (!state.argv?.length) {
        throw new SessionError('NOT_SUPPORTED', `Session "${ctx.name}" cannot be restarted.`)
    }
    await closeOne(ctx.name, ctx)
    const openArgs = state.argv.filter((a) => a !== '--replace')
    const parser = buildParser(() => {})
    let parsed: Record<string, unknown> = {}
    await parser.parseAsync(openArgs, {}, (_err: unknown, argv: Record<string, unknown>) => {
        parsed = argv
    })
    const args = pickArgs(ACTION_MAP.get('open')!, parsed)
    return open({ ...args, keepHistory: true }, { ...ctx, rawArgs: state.argv })
}
