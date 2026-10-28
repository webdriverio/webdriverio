type Op = { kind: ' ' | '-' | '+', line: string, a: number, b: number }

/**
 * Line operations of the longest common subsequence between `a` and `b`.
 */
export function diffLines (a: string[], b: string[]): Op[] {
    let prefix = 0
    while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) {
        prefix++
    }
    let suffix = 0
    while (suffix < a.length - prefix && suffix < b.length - prefix && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) {
        suffix++
    }
    const head: Op[] = a.slice(0, prefix).map((line, i) => ({ kind: ' ', line, a: i, b: i }))
    const tail: Op[] = a.slice(a.length - suffix).map((line, i) => ({ kind: ' ', line, a: a.length - suffix + i, b: b.length - suffix + i }))
    const middle = lcsOps(a.slice(prefix, a.length - suffix), b.slice(prefix, b.length - suffix))
        .map((op) => ({ ...op, a: op.a + prefix, b: op.b + prefix }))
    return [...head, ...middle, ...tail]
}

function lcsOps (a: string[], b: string[]): Op[] {
    const n = a.length
    const m = b.length
    const lcs: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
        }
    }
    const ops: Op[] = []
    let i = 0
    let j = 0
    while (i < n && j < m) {
        if (a[i] === b[j]) {
            ops.push({ kind: ' ', line: a[i], a: i++, b: j++ })
        } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
            ops.push({ kind: '-', line: a[i], a: i++, b: j })
        } else {
            ops.push({ kind: '+', line: b[j], a: i, b: j++ })
        }
    }
    while (i < n) {
        ops.push({ kind: '-', line: a[i], a: i++, b: j })
    }
    while (j < m) {
        ops.push({ kind: '+', line: b[j], a: i, b: j++ })
    }
    return ops
}

/**
 * Unified diff with `context` lines around changes and `@@` hunk headers
 * (RFC §8.6). Returns an empty string when both texts are equal.
 */
export function unifiedDiff (before: string, after: string, context = 2) {
    const ops = diffLines(before.split('\n'), after.split('\n'))
    const changed = ops.map((op, i) => op.kind !== ' ' ? i : -1).filter((i) => i >= 0)
    if (!changed.length) {
        return ''
    }
    const hunks: [number, number][] = []
    for (const idx of changed) {
        const start = Math.max(0, idx - context)
        const end = Math.min(ops.length - 1, idx + context)
        const last = hunks.at(-1)
        if (last && start <= last[1] + 1) {
            last[1] = Math.max(last[1], end)
        } else {
            hunks.push([start, end])
        }
    }
    const out: string[] = []
    for (const [start, end] of hunks) {
        const slice = ops.slice(start, end + 1)
        const aLines = slice.filter((o) => o.kind !== '+').length
        const bLines = slice.filter((o) => o.kind !== '-').length
        const aStart = slice[0].a + (aLines ? 1 : 0)
        const bStart = slice[0].b + (bLines ? 1 : 0)
        out.push(`@@ -${aStart},${aLines} +${bStart},${bLines} @@`)
        for (const op of slice) {
            out.push(`${op.kind}${op.line}`)
        }
    }
    return out.join('\n')
}
