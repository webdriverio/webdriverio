import { usage } from '../errors.js'

/** lines a `find` block may have before it is cut to a window around the match */
const MAX_BLOCK_LINES = 12

const indentOf = (line: string) => line.length - line.trimStart().length

/**
 * Lines to print for a match: its parent node with everything under it, so
 * the answer next to the match (a default value, a price, a status) comes
 * along. A big parent is cut to a window around the match.
 */
export function blockAround (lines: string[], idx: number): [number, number] {
    const indent = indentOf(lines[idx])
    let start = idx
    while (start > 0 && indentOf(lines[start]) >= indent) {
        start--
    }
    const parentIndent = indentOf(lines[start])
    let end = idx
    while (end + 1 < lines.length && indentOf(lines[end + 1]) > parentIndent) {
        end++
    }
    if (end - start + 1 > MAX_BLOCK_LINES) {
        return [Math.max(start, idx - 2), Math.min(end, idx + MAX_BLOCK_LINES - 3)]
    }
    return [start, end]
}

const HEADING_LINE = /^\s*- heading\b/

/**
 * The nearest heading line above a block that holds no heading itself, so a
 * match says which section it is in: a heading of the block's own level or
 * of a container around it, never one inside another container. Undefined
 * when the block has one or there is none.
 */
export function headingAbove (lines: string[], start: number, end: number): number | undefined {
    if (lines.slice(start, end + 1).some((line) => HEADING_LINE.test(line))) {
        return undefined
    }
    // crossing out to a shallower line leaves the section the block is in: a heading deeper than that belongs to another one
    let limit = indentOf(lines[start])
    for (let i = start - 1; i >= 0; i--) {
        const indent = indentOf(lines[i])
        if (HEADING_LINE.test(lines[i]) && indent <= limit) {
            return i
        }
        limit = Math.min(limit, indent)
    }
    return undefined
}

const LINK_URL = / url=(\S+)$/

/** `https://en.wikipedia.org/wiki/World_Wide_Web` → `… World Wide Web` */
export function readableUrl (url: string) {
    let decoded = url
    try {
        decoded = decodeURIComponent(url)
    } catch {
        // keep it as is
    }
    return decoded.replace(/[_+]/g, ' ')
}

/**
 * Snapshot lines that match, from a snapshot taken with link URLs. A link's
 * target counts as well as its text: "World Wide Web" finds a link reading
 * "web technologies" to /wiki/World_Wide_Web. URLs are printed only on the
 * lines they made match.
 */
export function matchLines (withUrls: string[], test: (line: string) => boolean) {
    const lines = withUrls.map((line) => line.replace(LINK_URL, ''))
    const shown = [...lines]
    const matches: number[] = []
    lines.forEach((line, i) => {
        const url = withUrls[i].match(LINK_URL)?.[1]
        if (test(line)) {
            matches.push(i)
        } else if (url && test(readableUrl(url))) {
            matches.push(i)
            shown[i] = withUrls[i]
        }
    })
    return { lines, shown, matches }
}

const SUFFIXES = ['ations', 'ation', 'ions', 'ion', 'ing', 'ers', 'er', 'ed', 'es', 'e', 's']

/**
 * The stem of a search word, so that "give" finds "Giving" and "donate"
 * finds "Donation": the word without a common English ending, at least
 * three letters long.
 */
export function stem (word: string) {
    const lower = word.toLowerCase()
    for (const suffix of SUFFIXES) {
        if (lower.endsWith(suffix) && lower.length - suffix.length >= 3) {
            return lower.slice(0, -suffix.length)
        }
    }
    return lower
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The line test for a query: a case-insensitive regular expression or
 * substring. Throws a usage error for a pattern that does not compile.
 */
export function lineTest (query: string, regex: boolean): (line: string) => boolean {
    if (regex) {
        let re: RegExp
        try {
            re = new RegExp(query, 'i')
        } catch (err) {
            throw usage(`Invalid regular expression: ${(err as Error).message}`)
        }
        return (line) => re.test(line)
    }
    const needle = query.toLowerCase()
    return (line) => line.toLowerCase().includes(needle)
}

/**
 * The query as given, then without spaces, then all of its words, then
 * words like them ("give" finds "Giving"): agents search with keywords,
 * not with a line of the page.
 */
export function searchLines (snapshotText: string, query: string, test: (line: string) => boolean, regex: boolean) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    // "SO2" when the page says "SO 2" (a subscript), "1 Y" for "1Y"
    const squeezed = query.toLowerCase().replace(/\s+/g, '')
    const all = snapshotText.split('\n')
    let found = matchLines(all, test)
    if (found.matches.length || regex) {
        return { ...found, note: '' }
    }
    const tries: [boolean, (line: string) => boolean, string][] = [
        [squeezed.length > 1, (line) => line.toLowerCase().replace(/\s+/g, '').includes(squeezed), 'lines that do without the spaces'],
        [words.length > 1, (line) => words.every((w) => line.toLowerCase().includes(w)), 'lines with all of its words'],
        [words.length > 0, (line) => words.every((w) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(stem(w))}`, 'iu').test(line)), 'lines with words like it']
    ]
    for (const [applies, fallback, what] of tries) {
        if (applies && (found = matchLines(all, fallback)).matches.length) {
            return { ...found, note: `No line contains ${JSON.stringify(query)}; ${what}:\n` }
        }
    }
    return { ...found, note: '' }
}

/**
 * Where the query matched in a line: the query itself, else the spaces-free
 * form, else the first of its words (or their stems). 0 when nothing shows.
 */
export function matchIndex (line: string, query: string, regex: boolean) {
    if (regex) {
        return new RegExp(query, 'i').exec(line)?.index ?? 0
    }
    const lower = line.toLowerCase()
    const needle = query.toLowerCase()
    const direct = lower.indexOf(needle)
    if (direct >= 0) {
        return direct
    }
    const squeezed = [...needle.replace(/\s+/g, '')].map(escapeRegExp).join('\\s*')
    const spaced = squeezed ? new RegExp(squeezed, 'i').exec(line)?.index : undefined
    if (spaced !== undefined) {
        return spaced
    }
    const found = needle.split(/\s+/).filter(Boolean)
        .flatMap((w) => [lower.indexOf(w), lower.indexOf(stem(w))])
        .filter((i) => i >= 0)
    return found.length ? Math.min(...found) : 0
}
