import type { Options } from 'yargs'

import { ACTIONS, ACTION_MAP, type ActionSpec } from '../actions/specs.js'
import type { Applies } from '../types.js'

export const GLOBAL_OPTIONS: Record<string, Options> = {
    session: { alias: 's', type: 'string', desc: 'Session name (env WDIO_SESSION, default "default")', global: true },
    json: { type: 'boolean', desc: 'Print one JSON object (env WDIO_SESSION_JSON=1)', global: true },
    timeout: { type: 'number', desc: 'Request timeout in ms', global: true },
    quiet: { alias: 'q', type: 'boolean', desc: 'Print nothing on success except requested data', global: true },
    color: { type: 'boolean', desc: 'Use --no-color to disable colors', global: true }
}

export const GLOBAL_VALUE_FLAGS = new Set(['-s', '--session', '--timeout'])
const HELP_FLAGS = new Set(['--help', '-h'])

const PLATFORMS: Record<Applies, string> = { W: 'web', M: 'native mobile', D: 'native desktop' }

const EXIT_CODES = [
    ['0', 'Success'],
    ['1', 'The action or your code failed'],
    ['2', 'Usage error'],
    ['3', 'Missing dependency or credentials'],
    ['4', 'No session with that name']
]

const WORKFLOW: [string, string][] = [
    ['wdio session open chrome http://localhost:3000', 'Start a session (once)'],
    ['wdio session snapshot -i', 'List interactive elements with refs like e3'],
    ['wdio session click e3 && wdio session wait --text "Cart (1)" && wdio session snapshot -i', 'Act, wait, look again in one shell call'],
    ['wdio session export --out test/specs/cart.e2e.ts', 'Turn the steps into a test'],
    ['wdio session close', 'End the session']
]

const TIPS = [
    'Chain steps with `&&`. A failing step exits non-zero and stops the chain.',
    'Wait for a condition (`wait <ref>`, `--text`, `--url`, `--load`) instead of `sleep`.',
    'Refs come from `snapshot` and `find`. They stay valid while the element exists; act on a fresh snapshot after the page changes.',
    'Every action prints the WebdriverIO code it ran (`→ …`). `export` turns those steps into a spec.',
    'For loops, conditions and assertions, pipe WebdriverIO code on stdin (see `exec --help`).'
]

export interface HelpRequest {
    /**
     * the action to describe, `undefined` for the overview
     */
    action?: string
}

/**
 * Find a help request: `--help`/`-h` anywhere before `--`, or a leading
 * `help` (`wdio session help click`). The action is the first positional.
 */
export function findHelpRequest (args: string[]): HelpRequest | undefined {
    const positionals: string[] = []
    let help = false
    for (let i = 0; i < args.length; i++) {
        const arg = args[i]
        if (arg === '--') {
            break
        }
        if (GLOBAL_VALUE_FLAGS.has(arg)) {
            i++
            continue
        }
        if (HELP_FLAGS.has(arg)) {
            help = true
        } else if (!arg.startsWith('-')) {
            positionals.push(arg)
        }
    }
    if (positionals[0] === 'help') {
        return { action: positionals[1] }
    }
    return help ? { action: positionals[0] } : undefined
}

function wrap (text: string, width: number, indent = 0) {
    const pad = ' '.repeat(indent)
    const lines: string[] = []
    for (const paragraph of text.split('\n')) {
        let line = ''
        for (const word of paragraph.split(' ')) {
            if (line && pad.length + line.length + 1 + word.length > width) {
                lines.push(pad + line)
                line = word
            } else {
                line = line ? `${line} ${word}` : word
            }
        }
        lines.push(pad + line)
    }
    return lines.join('\n')
}

/**
 * Two columns: the left one padded to the widest entry, the right one
 * wrapped and aligned under itself.
 */
function table (rows: [string, string][], width: number, indent = 2) {
    const left = Math.min(Math.max(...rows.map(([l]) => l.length)), 28)
    return rows.map(([l, r]) => {
        if (!r) {
            return ' '.repeat(indent) + l
        }
        const column = indent + left + 2
        const body = wrap(r, width, column).trimStart()
        return l.length > left
            ? `${' '.repeat(indent)}${l}\n${' '.repeat(column)}${body}`
            : `${' '.repeat(indent)}${l.padEnd(left)}  ${body}`
    }).join('\n')
}

function flagNames (key: string, option: Options) {
    const aliases = option.alias === undefined ? [] : Array.isArray(option.alias) ? option.alias : [option.alias]
    return [key, ...aliases]
        .sort((a, b) => a.length - b.length)
        .map((name) => name.length === 1 ? `-${name}` : `--${name}`)
        .join(', ')
}

function flagValue (option: Options) {
    if (option.choices) {
        return ` <${(option.choices as string[]).join('|')}>`
    }
    if (option.type === 'number') {
        return ' <n>'
    }
    if (option.type === 'string') {
        return ' <value>'
    }
    return ''
}

function flagLabel (key: string, option: Options) {
    return flagNames(key, option) + flagValue(option)
}

function flagDesc (option: Options) {
    return `${option.desc ?? ''}${option.array ? ' (repeatable)' : ''}`
}

export function commandString (spec: ActionSpec) {
    const positionals = (spec.positionals || []).map((p) => p.required ? `<${p.name}${p.variadic ? '..' : ''}>` : `[${p.name}${p.variadic ? '..' : ''}]`)
    return [spec.name, ...positionals].join(' ')
}

function platforms (spec: ActionSpec) {
    return spec.applies ? spec.applies.map((a) => PLATFORMS[a]).join(', ') : undefined
}

function sentence (text: string) {
    return /[.!?]$/.test(text) ? text : `${text}.`
}

function groups () {
    const map = new Map<string, ActionSpec[]>()
    for (const spec of ACTIONS as readonly ActionSpec[]) {
        map.set(spec.group, [...(map.get(spec.group) || []), spec])
    }
    return map
}

export function helpWidth (columns?: number) {
    return Math.min(100, columns || 100)
}

/**
 * `wdio session --help`: what the tool is, the loop an agent follows, the
 * actions by group and where to look next.
 */
export function renderOverview (width = helpWidth()) {
    const out = [
        'wdio session <action> [args] [flags]',
        '',
        wrap('Keep a WebdriverIO session alive between shell commands. Drive a browser, mobile app or desktop app one action at a time, then export the steps as a test.', width),
        '',
        'Workflow:',
        WORKFLOW.map(([cmd, desc]) => `  # ${desc}\n  ${cmd}`).join('\n'),
        '',
        'Tips:',
        TIPS.map((tip) => wrap(`- ${tip}`, width, 2).replace(/^( {2})- /, '  - ').replace(/\n {2}/g, '\n    ')).join('\n'),
        '',
        'Actions:',
        table([...groups()].map(([group, specs]) => [group, specs.map((s) => s.name).join(' ')]), width),
        '',
        'Global flags:',
        table(Object.entries(GLOBAL_OPTIONS).map(([key, option]) => [flagLabel(key, option), String(option.desc)]), width),
        '',
        'Exit codes:',
        table(EXIT_CODES as [string, string][], width),
        '',
        'Run `wdio session <action> --help` for arguments, flags, platforms and examples.',
        'Docs: https://webdriver.io/docs/session'
    ]
    return out.join('\n')
}

/**
 * `wdio session <action> --help`: usage, details, the action's own flags,
 * examples and related actions. Global flags are one line.
 */
export function renderActionHelp (spec: ActionSpec, width = helpWidth()) {
    const out = [`wdio session ${commandString(spec)}`, '', wrap(sentence(spec.desc), width)]
    if (spec.details) {
        out.push('', spec.details.split('\n').map((paragraph) => wrap(paragraph, width)).join('\n\n'))
    }
    const applies = platforms(spec)
    if (applies) {
        out.push('', `Platforms: ${applies}`)
    }
    if (spec.positionals?.length) {
        out.push('', 'Arguments:', table(spec.positionals.map((p) => [p.name, `${p.desc}${p.required ? ' (required)' : ''}`]), width))
    }
    const options = Object.entries(spec.options || {})
    if (options.length) {
        out.push('', 'Flags:', table(options.map(([key, option]) => [flagLabel(key, option), flagDesc(option)]), width))
    }
    if (spec.examples?.length) {
        out.push('', 'Examples:', spec.examples.map(([cmd, desc]) => `  # ${desc}\n${cmd.split('\n').map((line) => `  ${line}`).join('\n')}`).join('\n\n'))
    }
    if (spec.seeAlso?.length) {
        out.push('', `See also: ${spec.seeAlso.join(', ')}`)
    }
    out.push('', 'Global flags: -s, --session <name> · --json · -q, --quiet · --timeout <ms> · --no-color (see `wdio session --help`)')
    return out.join('\n')
}

export function renderHelp (request: HelpRequest, width = helpWidth()) {
    if (!request.action) {
        return renderOverview(width)
    }
    const spec = ACTION_MAP.get(request.action)
    return spec ? renderActionHelp(spec, width) : undefined
}

/**
 * MDX reads `<select>` as a tag. Wrap angle-bracket words that are not in a
 * code span in backticks.
 */
function mdx (text: string) {
    return text.split(/(`[^`]*`)/).map((part, i) => i % 2 ? part : part.replace(/<[^<>\s]+(?: [^<>]*)?>/g, (tag) => `\`${tag}\``)).join('')
}

function cell (text: string) {
    return mdx(text).replace(/\|/g, '\\|')
}

/**
 * `website/docs/session/commands.md`, generated from the same specs as
 * `--help` by `pnpm run docs:session-commands`.
 */
export function renderCommandsMarkdown () {
    const out = [
        '---',
        'id: session-commands',
        'title: wdio session commands',
        'description: Every wdio session action and flag, from open through doctor and skill.',
        'slug: /session-commands',
        '---',
        '',
        '<!-- Generated from packages/wdio-session/src/actions/specs.ts by `pnpm run docs:session-commands`. Do not edit by hand. -->',
        '',
        'Every `wdio session` action. Global flags apply to all of them. The same text is printed by `npx wdio session <action> --help`. The rest of the [WebdriverIO Session](/docs/session) section covers [targets](/docs/session/targets), [snapshots](/docs/session/snapshots), [`exec`](/docs/session/exec), [export](/docs/session/export) and [debugging](/docs/session/debug).',
        '',
        '```sh',
        'npx wdio session <action> [arguments] [flags]',
        '```',
        '',
        '## Global flags',
        '',
        '| Flag | Description |',
        '| --- | --- |',
        ...Object.entries(GLOBAL_OPTIONS).map(([key, option]) => `| \`${flagNames(key, option)}\` | ${cell(String(option.desc))} |`),
        '',
        `Exit codes: ${EXIT_CODES.map(([code, desc]) => `${code} ${desc.charAt(0).toLowerCase()}${desc.slice(1)}`).join(', ')}.`
    ]
    for (const spec of ACTIONS as readonly ActionSpec[]) {
        const applies = platforms(spec)
        out.push('', `## \`${spec.name}\``, '', `${mdx(sentence(spec.desc))}${applies ? ` Applies to ${applies}.` : ''}`)
        if (spec.details) {
            out.push('', mdx(spec.details).split('\n').join('\n\n'))
        }
        out.push('', '```sh', `npx wdio session ${commandString(spec)}`, '```')
        if (spec.positionals?.length) {
            out.push('', '**Arguments**', '', '| Name | Required | Description |', '| --- | --- | --- |',
                ...spec.positionals.map((p) => `| \`${p.name}\` | ${p.required ? 'yes' : 'no'} | ${cell(p.desc)} |`))
        }
        const options = Object.entries(spec.options || {})
        if (options.length) {
            out.push('', '**Flags**', '', '| Flag | Description |', '| --- | --- |',
                ...options.map(([key, option]) => `| ${cell(`\`${flagLabel(key, option)}\``)} | ${cell(flagDesc(option))} |`))
        }
        if (spec.examples?.length) {
            out.push('', '**Examples**', '', '```sh', spec.examples.map(([cmd, desc]) => `# ${desc}\n${cmd.replace(/(^|&& |\|\| |\$\()wdio session/g, '$1npx wdio session')}`).join('\n\n'), '```')
        }
        if (spec.seeAlso?.length) {
            out.push('', `See also: ${spec.seeAlso.map((name) => `[\`${name}\`](#${name})`).join(', ')}.`)
        }
    }
    return out.join('\n') + '\n'
}
