import { isUserCommandOutput, isUserResultOutput, pairUserCommandOutput, textsOf, userCommandError, userCommandTexts } from './utils.js'

const MAX_GROUP_SIZE = 4

/**
 * Joins the runs of identical items: a group of 1 to 4 items that repeats at least 2 times in a row. The run that
 * covers the most items wins, and the smaller group on a tie. `join` gets the first copy of the group, the
 * number of repeats and the dropped copies; the other items stay as they are.
 * @experimental the name and the rule may change
 */
export function joinRepeats<T>(
    items: readonly T[],
    keyOf: (item: T) => string,
    join: (group: readonly T[], count: number, repeats: readonly (readonly T[])[]) => T
): T[] {
    const keys = items.map(keyOf)
    const same = (a: number, b: number, size: number) => {
        for (let k = 0; k < size; k++) {
            if (keys[a + k] !== keys[b + k]) {
                return false
            }
        }
        return true
    }
    const joined: T[] = []
    for (let i = 0; i < items.length;) {
        let best = { size: 1, count: 1 }
        for (let size = 1; size <= MAX_GROUP_SIZE && i + 2 * size <= items.length; size++) {
            let count = 1
            while (i + (count + 1) * size <= items.length && same(i, i + count * size, size)) {
                count++
            }
            if (count > 1 && size * count > best.size * best.count) {
                best = { size, count }
            }
        }
        if (best.count === 1) {
            joined.push(items[i++])
            continue
        }
        const copy = (n: number) => items.slice(i + n * best.size, i + (n + 1) * best.size)
        joined.push(join(copy(0), best.count, Array.from({ length: best.count - 1 }, (_, n) => copy(n + 1))))
        i += best.size * best.count
    }
    return joined
}

/**
 * A user command or a protocol command of `output`, with its result entry, its one-line text and its children
 * @experimental the name and the fields may change
 */
export interface UserCommandNode {
    entry: object
    result?: object
    text?: string
    children: UserCommandNode[]
    /** the number of identical repeats that this node replaces */
    repeat?: number
    /** a joined group of 2 to 4 steps: one copy of the group */
    group?: UserCommandNode[]
}

/**
 * The tree of the user commands of `output`: each user command and protocol command with its result, linked to
 * the user command of its `parent`. A result with no command in `output` is a node of its own.
 * @experimental the name may change
 */
export function userCommandTree(output: ReadonlyArray<{ type: string }>): UserCommandNode[] {
    const pairing = pairUserCommandOutput(output)
    const texts = textsOf(output, pairing)
    const paired = new Set<object>(pairing.childResults.values())
    const userIds = new Set(output.filter(isUserCommandOutput).map((entry) => entry.id))
    const users = new Map<number, UserCommandNode>()
    const roots: UserCommandNode[] = []
    for (const entry of output) {
        if (paired.has(entry) || (isUserResultOutput(entry) && userIds.has(entry.id))) {
            continue
        }
        const result = isUserCommandOutput(entry) ? pairing.userResults.get(entry.id) : pairing.childResults.get(entry)
        const node: UserCommandNode = { entry, result, text: texts.get(entry), children: [] }
        if (isUserCommandOutput(entry)) {
            users.set(entry.id, node)
        }
        const parent = (entry as { parent?: number }).parent
        const owner = parent === undefined ? undefined : users.get(parent)
        ;(owner ? owner.children : roots).push(node)
    }
    return roots
}

const MAX_KEY_LENGTH = 4096
const TOO_BIG = Symbol('too big')

// the full value, so two results or bodies with the same cut text are not joined; `undefined` for a value that
// is too big to compare (the compare stops after 4 KB) or that cannot be written
function valueKey(value: unknown) {
    let length = 0
    try {
        return JSON.stringify(value, (key, item) => {
            length += key.length + (typeof item === 'string' ? item.length : 8)
            if (length > MAX_KEY_LENGTH) {
                throw TOO_BIG
            }
            return item instanceof Error || (item && typeof item === 'object' && 'stack' in item && 'message' in item)
                ? userCommandError(item)
                : typeof item === 'bigint' ? String(item) : item
        })
    } catch {
        return undefined
    }
}

/**
 * `userCommandTree` with the identical repeated siblings joined (see `joinRepeats`): one step gets `× N` at the
 * end of its text, a group of steps becomes one `× N` node with one copy of the group as its children
 * @experimental the name and the rule may change
 */
export function joinUserCommandTree(nodes: UserCommandNode[]): UserCommandNode[] {
    let unique = 0
    const uniqueKey = () => `\u0000${unique++}`
    const memo = (compute: (node: UserCommandNode) => string) => {
        const keys = new WeakMap<UserCommandNode, string>()
        return (node: UserCommandNode) => {
            let key = keys.get(node)
            if (key === undefined) {
                key = compute(node)
                keys.set(node, key)
            }
            return key
        }
    }
    // the text, the result and the children; a node with no text (a WebDriver Classic entry) is never joined
    const cheapKey = memo((node) => {
        const result = valueKey((node.result as { result?: unknown } | undefined)?.result)
        return node.text === undefined || (node.result && result === undefined)
            ? uniqueKey()
            : JSON.stringify([node.text, result, node.children.map(cheapKey)])
    })
    // also the bodies: read only for a node that can be in a run
    const fullKey = memo((node) => {
        const body = (node.entry as { body?: unknown }).body
        const bodyKey = valueKey(body)
        return body !== undefined && bodyKey === undefined
            ? uniqueKey()
            : JSON.stringify([cheapKey(node), bodyKey, node.children.map(fullKey)])
    })
    const joinLevel = (level: UserCommandNode[]): UserCommandNode[] => {
        const joined = level.map((node) => ({ ...node, children: joinLevel(node.children) }))
        const cheap = joined.map(cheapKey)
        // a node can be in a run only when a sibling at most 4 places away has the same cheap key
        const nearMatch = (i: number) => {
            for (let j = Math.max(0, i - MAX_GROUP_SIZE); j <= Math.min(cheap.length - 1, i + MAX_GROUP_SIZE); j++) {
                if (j !== i && cheap[j] === cheap[i]) {
                    return true
                }
            }
            return false
        }
        const keys = new Map(joined.map((node, i) => [node, nearMatch(i) ? fullKey(node) : uniqueKey()]))
        return joinRepeats(
            joined,
            (node) => keys.get(node)!,
            (group, count) => group.length === 1
                ? { ...group[0], text: `${group[0].text} × ${count}`, repeat: count }
                : { entry: group[0].entry, text: `× ${count}`, repeat: count, group: [...group], children: [...group] }
        )
    }
    return joinLevel(nodes)
}

/**
 * A `JSON.stringify` replacer for a report of `TestStats.output`: the error of a `userResult` gets its name and
 * message (see `userCommandError`), and each user command entry and protocol command entry that a user command
 * runs gets its one-line `text` (see `userCommandTexts`). Other values stay as they are.
 * @experimental the name and the rule may change
 */
export function userOutputReplacer(this: unknown, key: string, value: unknown): unknown {
    if ((this as { type?: unknown } | undefined)?.type === 'userResult' && key === 'result' && value && typeof value === 'object' && 'error' in value) {
        return { error: userCommandError((value as { error: unknown }).error) }
    }
    if (key === 'output' && Array.isArray(value) && value.some((entry) => entry && isUserCommandOutput(entry))) {
        const texts = userCommandTexts(value)
        return value.map((entry) => texts.has(entry) ? { ...entry, text: texts.get(entry) } : entry)
    }
    return value
}

/**
 * `userOutputReplacer` for a report that shows the user commands as a tree: an output with user commands becomes
 * the entries of its joined tree (see `joinUserCommandTree`). The entries of joined repeats are removed, and the
 * first entry of a joined step or group gets `repeat: { count, size }`.
 * @experimental the name and the rule may change
 */
export function joinedOutputReplacer(this: unknown, key: string, value: unknown): unknown {
    if (!(key === 'output' && Array.isArray(value) && value.some((entry) => entry && isUserCommandOutput(entry)))) {
        return userOutputReplacer.call(this, key, value)
    }
    const entries: object[] = []
    const flatten = (nodes: UserCommandNode[], repeatOf?: { count: number, size: number }) => {
        for (const [index, node] of nodes.entries()) {
            if (node.group) {
                flatten(node.group, { count: node.repeat!, size: node.group.length })
                continue
            }
            const repeat = index === 0 && repeatOf ? repeatOf : node.repeat ? { count: node.repeat, size: 1 } : undefined
            entries.push({ ...node.entry, ...(node.text === undefined ? {} : { text: node.text }), ...(repeat ? { repeat } : {}) })
            flatten(node.children)
            if (node.result) {
                entries.push(node.result)
            }
        }
    }
    flatten(joinUserCommandTree(userCommandTree(value)))
    return entries
}
