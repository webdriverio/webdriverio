import logger from '@wdio/logger'
import type { Options } from '@wdio/types'

const log = logger('@wdio/utils:userCommands')

type Mode = 'default' | 'none' | 'all'
type Matcher = (command: string) => boolean

interface NestedRule {
    mode: Mode
    expand: Matcher
    collapse: Matcher
    exclude: Matcher
}

const MODES: readonly string[] = ['default', 'none', 'all']
const DEFAULT_EXPANDED = matcherOf(['waitUntil', 'waitFor*', 'expect.*'])
const NONE: Matcher = () => false
const rules = new WeakMap<object, NestedRule>()

// an exact name, or a prefix when the name ends with `*`
function matcherOf (names: readonly string[]): Matcher {
    const exact = new Set(names.filter((name) => !name.endsWith('*')))
    const prefixes = names.filter((name) => name.endsWith('*')).map((name) => name.slice(0, -1))
    return (command) => exact.has(command) || prefixes.some((prefix) => command.startsWith(prefix))
}

const isNameList = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((name) => typeof name === 'string')

function parse (option: Exclude<Options.Testrunner['userCommandEvents'], boolean | undefined>): NestedRule {
    const exclude = isNameList(option.exclude) ? matcherOf(option.exclude) : NONE
    const nested: unknown = option.nested
    const fallback = { mode: 'default' as const, expand: NONE, collapse: NONE, exclude }
    if (nested === undefined) {
        return fallback
    }
    if (typeof nested === 'string' && MODES.includes(nested)) {
        return { ...fallback, mode: nested as Mode }
    }
    const value = nested as { mode?: unknown, expand?: unknown, collapse?: unknown }
    const valid = Boolean(nested) && typeof nested === 'object' && !Array.isArray(nested) &&
        (value.mode === undefined || (typeof value.mode === 'string' && MODES.includes(value.mode))) &&
        (value.expand === undefined || isNameList(value.expand)) &&
        (value.collapse === undefined || isNameList(value.collapse))
    if (!valid) {
        log.warn(`userCommandEvents.nested has a value that is not valid (${JSON.stringify(nested)}), the default is used`)
        return fallback
    }
    return {
        mode: (value.mode as Mode | undefined) ?? 'default',
        expand: value.expand ? matcherOf(value.expand as string[]) : NONE,
        collapse: value.collapse ? matcherOf(value.collapse as string[]) : NONE,
        exclude
    }
}

const DEFAULT_RULE: NestedRule = { mode: 'default', expand: NONE, collapse: NONE, exclude: NONE }

/**
 * Whether the direct calls of a user command send their own user command events (`userCommandEvents.nested`).
 * The order: the top-level `exclude`, then `collapse`, then `expand`, then the mode.
 * @param option  the `userCommandEvents` option of the session
 * @param command the name of the user command
 * @param custom  `true` for a custom command (`addCommand`, `overwriteCommand`)
 * @experimental
 */
export function expandsUserCommand (option: Options.Testrunner['userCommandEvents'], command: string, custom: boolean): boolean {
    let rule = DEFAULT_RULE
    if (option && typeof option === 'object') {
        rule = rules.get(option) ?? parse(option)
        rules.set(option, rule)
    }
    if (rule.exclude(command) || rule.collapse(command)) {
        return false
    }
    if (rule.expand(command) || rule.mode === 'all') {
        return true
    }
    return rule.mode === 'default' && (custom || DEFAULT_EXPANDED(command))
}
