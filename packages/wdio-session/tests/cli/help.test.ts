import { PassThrough } from 'node:stream'

import { describe, expect, it } from 'vitest'

import { ACTIONS, ACTION_MAP, type ActionSpec } from '../../src/actions/specs.js'
import { buildParser, runSessionCli } from '../../src/cli/command.js'
import { findHelpRequest, renderActionHelp, renderCommandsMarkdown, renderOverview } from '../../src/cli/help.js'

/**
 * Split one shell command into words. Handles the quoting the examples use:
 * single quotes, double quotes and backslash escapes.
 */
function shellWords (line: string) {
    const words: string[] = []
    let word: string | undefined
    let quote: string | undefined
    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (quote) {
            if (char === quote) {
                quote = undefined
            } else if (char === '\\' && quote === '"' && line[i + 1] === '"') {
                word += line[++i]
            } else {
                word += char
            }
        } else if (char === '\'' || char === '"') {
            quote = char
            word ??= ''
        } else if (char === ' ') {
            if (word !== undefined) {
                words.push(word)
            }
            word = undefined
        } else {
            word = (word ?? '') + char
        }
    }
    if (word !== undefined) {
        words.push(word)
    }
    return words
}

/**
 * Commands other than `wdio session` that an example may chain to.
 */
const OTHER_COMMANDS = ['npx wdio run ']

/**
 * The `wdio session` calls in an example, as argument lists. A heredoc runs
 * `exec`, as it does in `runSessionCli`. `url=$(wdio session …)` is the
 * call inside the substitution. Any other segment fails the example.
 */
function sessionCalls (example: string) {
    return example.split('\n')[0].split(/\s*(?:&&|\|\|)\s*/)
        .map((segment) => segment.replace(/^\w+=\$\((.*)\)$/, '$1'))
        .filter((segment) => {
            if (segment.startsWith('wdio session ')) {
                return true
            }
            expect(OTHER_COMMANDS.some((prefix) => segment.startsWith(prefix)), `unexpected command in example: ${segment}`).toBe(true)
            return false
        })
        .map((segment) => shellWords(segment.slice('wdio session '.length)).map((word) => word.startsWith('<<') ? 'exec' : word))
}

async function parse (args: string[]) {
    let selected: { spec: ActionSpec, argv: Record<string, unknown> } | undefined
    let error: Error | undefined
    await buildParser((spec, argv) => {
        selected = { spec, argv }
    }).parseAsync(args, {}, (err: Error | undefined) => {
        error = err || undefined
    })
    return { selected, error }
}

function capture () {
    const stream = new PassThrough() as unknown as NodeJS.WriteStream & PassThrough
    let text = ''
    stream.on('data', (chunk) => {
        text += chunk
    })
    return { stream, text: () => text }
}

describe('action specs', () => {
    it.each(ACTIONS.map((spec) => [spec.name, spec] as const))('%s has examples that parse', async (name, spec) => {
        expect(spec.examples.length).toBeGreaterThan(0)
        for (const [example, desc] of spec.examples) {
            expect(desc).toBeTruthy()
            const calls = sessionCalls(example)
            expect(calls.length, example).toBeGreaterThan(0)
            const actions: string[] = []
            for (const args of calls) {
                const { selected, error } = await parse(args)
                expect(error?.message, example).toBeUndefined()
                actions.push(selected!.spec.name)
            }
            expect(actions, example).toContain(name)
        }
    })

    it('rejects chained commands that are not wdio session', () => {
        expect(() => sessionCalls('wdio session click e3 && wdoi session snapshot')).toThrow('unexpected command')
    })

    it('only links to actions that exist', () => {
        for (const spec of ACTIONS) {
            for (const name of spec.seeAlso || []) {
                expect(ACTION_MAP.has(name), `${spec.name} → ${name}`).toBe(true)
            }
        }
    })
})

describe('findHelpRequest', () => {
    it('finds the overview and the action', () => {
        expect(findHelpRequest(['--help'])).toEqual({ action: undefined })
        expect(findHelpRequest(['-h'])).toEqual({ action: undefined })
        expect(findHelpRequest(['click', '--help'])).toEqual({ action: 'click' })
        expect(findHelpRequest(['-s', 'shop', 'wait', '-h'])).toEqual({ action: 'wait' })
        expect(findHelpRequest(['help'])).toEqual({ action: undefined })
        expect(findHelpRequest(['help', 'fill'])).toEqual({ action: 'fill' })
    })

    it('ignores normal calls and arguments after --', () => {
        expect(findHelpRequest(['click', 'e3'])).toBeUndefined()
        expect(findHelpRequest(['fill', 'e2', '--', '--help'])).toBeUndefined()
        expect(findHelpRequest(['-s', 'help', 'snapshot'])).toBeUndefined()
    })
})

describe('help output', () => {
    it('groups every action in the overview and explains the loop', () => {
        const text = renderOverview()
        for (const spec of ACTIONS) {
            expect(text).toMatch(new RegExp(`\\b${spec.name}\\b`))
        }
        expect(text).toContain('wdio session click e3 && wdio session wait')
        expect(text).toContain('Run `wdio session <action> --help`')
        expect(text).toContain('4  No session with that name')
    })

    it('prefixes every chained call with npx in the docs', () => {
        const markdown = renderCommandsMarkdown()
        expect(markdown).toContain('npx wdio session status || npx wdio session open chrome')
        expect(markdown).toContain('url=$(npx wdio session get url -q)')
        expect(markdown).not.toMatch(/(^|&& |\|\| |\$\()wdio session/m)
    })

    it('marks a repeatable flag once', () => {
        expect(renderActionHelp(ACTION_MAP.get('mock')!)).toMatch(/Header k:v \(repeatable\)\n/)
    })

    it('describes one action with its own flags, examples and links', () => {
        const text = renderActionHelp(ACTION_MAP.get('click')!)
        expect(text.split('\n')[0]).toBe('wdio session click <target>')
        expect(text).toContain('Platforms: web, native mobile, native desktop')
        expect(text).toContain('--new-tab')
        expect(text).toContain('  wdio session click e3\n')
        expect(text).toContain('See also: tap, fill, wait, snapshot')
        expect(text).not.toContain('wdio session session')
        expect(text).not.toContain('Request timeout in ms')
    })

    it('prints help without a session and exits 0', async () => {
        const stdout = capture()
        const stderr = capture()
        const code = await runSessionCli(['click', '--help'], { stdout: stdout.stream, stderr: stderr.stream, env: {} })
        expect(code).toBe(0)
        expect(stdout.text()).toContain('wdio session click <target>')
        expect(stderr.text()).toBe('')
    })

    describe('--timeout cap', () => {
        const run = async (args: string[]) => {
            const stderr = capture()
            await runSessionCli(args, { stdout: capture().stream, stderr: stderr.stream, env: { WDIO_SESSION_DIR: '/nonexistent-wdio-session-dir' } })
            return stderr.text()
        }

        it('caps an action timeout at 60000 ms and says so once', async () => {
            const text = await run(['click', 'e1', '--timeout', '120000'])
            expect(text.match(/is capped at 60000 ms/g)).toHaveLength(1)
            expect(text).toContain('--timeout 120000')
        })

        it('leaves a timeout within the cap and wait alone', async () => {
            expect(await run(['click', 'e1', '--timeout', '60000'])).not.toContain('capped')
            expect(await run(['wait', 'e1', '--timeout', '120000'])).not.toContain('capped')
        })
    })

    it('rejects help for an unknown action', async () => {
        const stdout = capture()
        const stderr = capture()
        const code = await runSessionCli(['clik', '--help'], { stdout: stdout.stream, stderr: stderr.stream, env: {} })
        expect(code).toBe(2)
        expect(stderr.text()).toContain('Unknown action "clik"')
    })
})
