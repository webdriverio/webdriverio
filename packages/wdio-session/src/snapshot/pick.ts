import { blockAround, headingAbove, stem } from './find.js'

export interface PickCandidate {
    ref: string
    role: string
    /**
     * the element's snapshot line without its ref
     */
    label: string
    /**
     * the node around it and the heading of its section, so two "Add to
     * cart" buttons can be told apart
     */
    context: string
    /**
     * position in the snapshot
     */
    line: number
}

/** roles an action applies to, matched case-insensitively against the start of the role */
const ACTION_ROLES: Record<string, string[]> = {
    click: ['button', 'link', 'checkbox', 'radio', 'tab', 'menuitem', 'option', 'switch', 'treeitem', 'combobox', 'summary', 'imagebutton'],
    fill: ['textbox', 'searchbox', 'combobox', 'spinbutton', 'textfield', 'edittext', 'securetextfield', 'textarea'],
    select: ['combobox', 'listbox'],
    check: ['checkbox', 'switch', 'radio', 'menuitemcheckbox', 'menuitemradio'],
    hover: ['button', 'link', 'menuitem', 'tab', 'img', 'image']
}

/** the labels a model answers with: one token each in common tokenizers */
export const PICK_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const REF = /\s*\[ref=(e\d+)\]/
const CONTEXT_CHARS = 120
const MAX_CONTEXT_LINES = 6
/** the page itself is around every element: no context */
const ROOT = /^- (?:document|application)\b/

const clean = (line: string) => line.replace(/\s*\[(?:ref|box)=[^\]]*\]/g, '').replace(/ url=\S+/, '').replace(/^\s*- /, '').trim()

/** the quoted names of a line, e.g. `"Red Shirt"` */
const namesOf = (text: string) => text.match(/"[^"]+"/g) ?? []

/**
 * The elements of a snapshot with a ref, with the text around them.
 */
export function pickCandidates (snapshotText: string): PickCandidate[] {
    const lines = snapshotText.split('\n')
    const candidates: PickCandidate[] = []
    lines.forEach((line, i) => {
        const ref = REF.exec(line)?.[1]
        if (!ref || / \[hidden\]/.test(line)) {
            return
        }
        const label = clean(line)
        const role = /^(\S+)/.exec(label)?.[1] ?? ''
        const [start, end] = blockAround(lines, i)
        // the text of the node around it, or only its name when that node is a whole region of the page;
        // other elements' lines are candidates of their own
        const near = (end - start + 1 > MAX_CONTEXT_LINES ? [lines[start]] : lines.slice(start, end + 1))
            .filter((other) => !REF.test(other) && !ROOT.test(other))
            .map(clean)
            // a bare role (`listitem`) tells nothing, and what the element's own line says already
            // (`∈ "Red Shirt"`) costs tokens
            .filter((text) => namesOf(text).some((name) => !label.includes(name)))
        const heading = headingAbove(lines, start, end)
        const context = [
            ...(near.length ? [`in ${near.join(' / ')}`] : []),
            ...(heading !== undefined ? [`under ${clean(lines[heading])}`] : [])
        ].join('; ')
        candidates.push({
            ref,
            role,
            label,
            context: context.length > CONTEXT_CHARS ? `${context.slice(0, CONTEXT_CHARS - 1)}…` : context,
            line: i + 1
        })
    })
    return candidates
}

/**
 * Candidates an action applies to. When the roles say nothing (an app
 * whose roles are named differently) all candidates stay.
 */
export function forAction (candidates: PickCandidate[], action?: string) {
    const roles = action ? ACTION_ROLES[action] : undefined
    if (!roles) {
        return { candidates, filtered: false }
    }
    const kept = candidates.filter((c) => roles.some((role) => c.role.toLowerCase().startsWith(role)))
    return kept.length ? { candidates: kept, filtered: true } : { candidates, filtered: false }
}

/**
 * How many of the intent's words (or words like them) a candidate has,
 * words in its own line count double.
 */
function overlap (intent: string, candidate: PickCandidate) {
    const words = [...new Set(intent.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1).map(stem))]
    const label = candidate.label.toLowerCase()
    const context = candidate.context.toLowerCase()
    return words.reduce((score, word) => score + (label.includes(word) ? 2 : context.includes(word) ? 1 : 0), 0)
}

/**
 * At most `max` candidates, the ones that share most words with the
 * intent, in page order: the order the model reads a page in, and no hint
 * of the ranking.
 */
export function shortlist (intent: string, candidates: PickCandidate[], max = PICK_LABELS.length) {
    if (candidates.length <= max) {
        return candidates
    }
    return candidates
        .map((candidate, index) => ({ candidate, index, score: overlap(intent, candidate) }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .slice(0, max)
        .sort((a, b) => a.index - b.index)
        .map(({ candidate }) => candidate)
}

export function describeCandidate (candidate: PickCandidate) {
    return candidate.context ? `${candidate.label} (${candidate.context})` : candidate.label
}
