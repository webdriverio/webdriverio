import { resolveDecider, type Decider } from '../decider.js'
import { SessionError } from '../errors.js'
import { describeCandidate, forAction, pickCandidates, PICK_LABELS, shortlist, type PickCandidate } from '../snapshot/pick.js'
import { takeSnapshot } from './observe.js'
import type { ActionFn, Session } from '../session.js'

const DEFAULT_TOP = 3
const DEFAULT_MIN_CONFIDENCE = 0.6
const DEFAULT_MIN_MARGIN = 0.2

/** the store key of the decider an agent session was created with */
export const DECIDER_KEY = 'decider'

const percent = (p: number) => `${Math.round(p * 100)}%`.padStart(4)

/** the command that acts on a picked ref */
function actHint (session: Session, action: string | undefined, ref: string) {
    const name = action || (session.isWeb ? 'click' : 'tap')
    const args: Record<string, unknown> = name === 'fill' ? { target: ref, text: '<text>' } : name === 'select' ? { target: ref, value: '<value>' } : { target: ref }
    const cli = name === 'fill' ? `wdio session fill ${ref} <text>` : name === 'select' ? `wdio session select ${ref} <value>` : `wdio session ${name} ${ref}`
    return session.cmd(name, args, cli)
}

export const pick: ActionFn = async (session, args) => {
    const intent = String(args.intent ?? '').trim()
    if (!intent) {
        throw new SessionError('USAGE', 'Say what the element is for, e.g. `pick "add the blue shirt to the cart"`.')
    }
    const action = typeof args.action === 'string' ? args.action : undefined
    const scope = typeof args.scope === 'string' ? args.scope : undefined
    const top = typeof args.top === 'number' && args.top > 0 ? Math.floor(args.top) : DEFAULT_TOP
    const minConfidence = typeof args.minConfidence === 'number' ? args.minConfidence : DEFAULT_MIN_CONFIDENCE
    const minMargin = typeof args.minMargin === 'number' ? args.minMargin : DEFAULT_MIN_MARGIN
    const decider = resolveDecider(session.get<Decider>(DECIDER_KEY), args, session.cmd)

    const { text } = await takeSnapshot(session, { scope })
    const all = pickCandidates(text)
    if (!all.length) {
        throw new SessionError('NO_MATCH', 'The snapshot has no element with a ref to pick from.', {
            hint: 'Elements that only appear after a click (menus, popovers) are not on the page yet.'
        })
    }
    const { candidates: applicable, filtered } = forAction(all, action)
    const asked = shortlist(intent, applicable)
    const options: Record<string, string> = {}
    const byLabel = new Map<string, PickCandidate>()
    asked.forEach((candidate, i) => {
        options[PICK_LABELS[i]] = describeCandidate(candidate)
        byLabel.set(PICK_LABELS[i], candidate)
    })
    const page = session.isWeb ? await session.currentUrl() : undefined
    const decision = await decider.decide({
        context: page ? `Page: ${page}` : undefined,
        instructions: `Which option is the element a user means by: "${intent}"${action ? ` (to ${action} it)` : ''}?`,
        options
    })

    const chosen = byLabel.get(decision.choice)!
    // scored: by probability; unscored: the model's choice, then page order
    const ranked = [...byLabel.entries()]
        .map(([label, candidate]) => ({ candidate, p: decision.probabilities?.[label] }))
        .sort((a, b) => decision.probabilities ? b.p! - a.p! : Number(b.candidate === chosen) - Number(a.candidate === chosen))
    const best = ranked[0]
    const next = ranked[1]?.p ?? 0
    const scored = best.p !== undefined
    const confident = scored && best.p! >= minConfidence && best.p! - next >= minMargin

    const notes: string[] = []
    if (asked.length < applicable.length) {
        notes.push(`Asked about the ${asked.length} of ${applicable.length} elements${filtered ? ` \`${action}\` applies to` : ''} that share most words with the intent.`)
    } else if (filtered) {
        notes.push(`Asked about the ${asked.length} element${asked.length === 1 ? '' : 's'} \`${action}\` applies to.`)
    }
    const listed = ranked.slice(0, top).map(({ candidate, p }) => `${candidate.ref.padEnd(5)} ${p === undefined ? '   ?' : percent(p)}  ${describeCandidate(candidate)}`)
    const data = {
        picked: chosen.ref,
        candidates: ranked.slice(0, top).map(({ candidate, p }) => ({ ref: candidate.ref, label: candidate.label, context: candidate.context, ...(p === undefined ? {} : { probability: p }) })),
        asked: asked.length,
        total: all.length,
        model: decider.name
    }
    if (!confident) {
        const why = !scored
            ? `${decider.name} returned no token probabilities, so its choice ${chosen.ref} is unscored`
            : best.p! < minConfidence
                ? `the best match has ${percent(best.p!).trim()}, below ${percent(minConfidence).trim()}`
                : `the best two are ${percent(best.p! - next).trim()} apart, closer than ${percent(minMargin).trim()}`
        throw new SessionError('NO_MATCH', `No confident pick for ${JSON.stringify(intent)}: ${why}.\n${listed.join('\n')}`, {
            hint: `Check the candidates with \`${session.cmd('snapshot', { scope: '<ref>' }, 'snapshot --scope <ref>')}\`, describe the element more precisely, or search with \`${session.cmd('find', { text: '<text>' }, 'find <text>')}\`.`
        })
    }
    return {
        text: [
            ...notes,
            `Picked ${chosen.ref} for ${JSON.stringify(intent)} (${percent(best.p!).trim()}, next ${percent(next).trim()}, ${decider.name}):`,
            ...listed,
            `\`${actHint(session, action, chosen.ref)}\` acts on it.`
        ].join('\n'),
        data
    }
}
