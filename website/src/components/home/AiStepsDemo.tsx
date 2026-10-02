import React, { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { translate } from '@docusaurus/Translate'

import { panelId, tabId } from './useRovingTabs'
import home from './home.module.css'
import styles from './aiSteps.module.css'

type PhaseId = 'record' | 'replay' | 'heal' | 'eject'
type LineStatus = 'hidden' | 'recorded' | 'running' | 'ok' | 'failed' | 'healed'
type Source = 'model' | 'cache' | 'healed' | 'code'

interface Beat {
    phase: PhaseId
    ms: number
    /** what the run log prints for this beat */
    log: string
    tone?: 'ok' | 'fail' | 'heal'
    refs?: boolean
    size?: boolean
    cart?: boolean
    cursor?: 'size' | 'add' | 'rest'
    ripple?: 'size' | 'add'
    lines: [LineStatus, LineStatus]
    /** the request the click sent, `checked` once it matches the recording */
    effect?: 'new' | 'checked'
    testId: 'old' | 'renamed'
    heal?: 'miss' | 'search' | 'found'
    evidence?: boolean
    ejected?: boolean
    source: Source
    calls: number
    tokens: number
}

const INSTRUCTION = 'Add the blue T-shirt in size M to the cart'
const SIZE_STEP = '$(\'role/button[name="M"]\').click()'
const ADD_STEP = '$(\'[data-testid="add-to-cart"]\').click()'
const ADD_HEALED = '$(\'role/button[name="Add to cart"]\').click()'
const REQUEST = 'POST /api/cart → 2xx'

/**
 * The storyboard: the model records the steps once, the cache replays them
 * without a model, a renamed test id is healed without a model and checked
 * against the request the step sent, and eject turns it all into code.
 */
const BEATS: readonly Beat[] = [
    { phase: 'record', ms: 1500, log: `▶ act('${INSTRUCTION}')`, lines: ['hidden', 'hidden'], testId: 'old', source: 'model', calls: 1, tokens: 400 },
    { phase: 'record', ms: 1500, log: 'snapshot  →  3 refs', refs: true, lines: ['hidden', 'hidden'], testId: 'old', source: 'model', calls: 1, tokens: 900 },
    { phase: 'record', ms: 1500, log: 'click e2  (button "M")', refs: true, size: true, cursor: 'size', ripple: 'size', lines: ['recorded', 'hidden'], testId: 'old', source: 'model', calls: 2, tokens: 1100 },
    { phase: 'record', ms: 1800, log: `click e3  (button "Add to cart")  ·  ${REQUEST}`, refs: true, size: true, cart: true, cursor: 'add', ripple: 'add', lines: ['recorded', 'recorded'], effect: 'new', testId: 'old', source: 'model', calls: 3, tokens: 1400 },
    { phase: 'record', ms: 2100, log: '✓ recorded 2 steps  →  __act__/cart.e2e.ts.json', tone: 'ok', size: true, cart: true, cursor: 'rest', lines: ['recorded', 'recorded'], effect: 'new', testId: 'old', source: 'model', calls: 3, tokens: 1400 },

    { phase: 'replay', ms: 1100, log: `▶ act('${INSTRUCTION}')  ·  from cache`, cursor: 'rest', lines: ['recorded', 'recorded'], testId: 'old', source: 'cache', calls: 0, tokens: 0 },
    { phase: 'replay', ms: 650, log: SIZE_STEP, size: true, cursor: 'size', ripple: 'size', lines: ['ok', 'running'], testId: 'old', source: 'cache', calls: 0, tokens: 0 },
    { phase: 'replay', ms: 900, log: `${ADD_STEP}  ·  ${REQUEST} ✓`, size: true, cart: true, cursor: 'add', ripple: 'add', lines: ['ok', 'ok'], effect: 'checked', testId: 'old', source: 'cache', calls: 0, tokens: 0 },
    { phase: 'replay', ms: 2200, log: '✓ 2 steps  ·  0 model calls  ·  0 tokens  ·  0.3s', tone: 'ok', size: true, cart: true, cursor: 'rest', lines: ['ok', 'ok'], effect: 'checked', testId: 'old', source: 'cache', calls: 0, tokens: 0 },

    { phase: 'heal', ms: 1600, log: `▶ act('${INSTRUCTION}')  ·  from cache`, cursor: 'rest', lines: ['ok', 'recorded'], size: true, testId: 'renamed', source: 'cache', calls: 0, tokens: 0 },
    { phase: 'heal', ms: 1500, log: '✗ step 2  [data-testid="add-to-cart"]  not found', tone: 'fail', size: true, cursor: 'add', lines: ['ok', 'failed'], testId: 'renamed', heal: 'miss', source: 'cache', calls: 0, tokens: 0 },
    { phase: 'heal', ms: 1600, log: '↻ healing without the model  ·  role/button[name="Add to cart"]', tone: 'heal', size: true, cursor: 'add', lines: ['ok', 'failed'], testId: 'renamed', heal: 'search', source: 'cache', calls: 0, tokens: 0 },
    { phase: 'heal', ms: 1700, log: `✓ healed step 2  ·  ${REQUEST}, same as recorded`, tone: 'ok', size: true, cart: true, cursor: 'add', ripple: 'add', lines: ['ok', 'healed'], effect: 'checked', testId: 'renamed', heal: 'found', source: 'healed', calls: 0, tokens: 0 },
    { phase: 'heal', ms: 2400, log: 'evidence  →  failed.png · step-1.png · heal.webm', tone: 'heal', size: true, cart: true, cursor: 'rest', lines: ['ok', 'healed'], effect: 'checked', testId: 'renamed', heal: 'found', evidence: true, source: 'healed', calls: 0, tokens: 0 },

    { phase: 'eject', ms: 1400, log: '$ npx wdio-ai eject test/specs/cart.e2e.ts', size: true, cart: true, lines: ['ok', 'healed'], testId: 'renamed', source: 'healed', calls: 0, tokens: 0 },
    { phase: 'eject', ms: 2800, log: '✓ ejected 1 act() call  ·  2 steps', tone: 'ok', size: true, cart: true, lines: ['ok', 'healed'], testId: 'renamed', ejected: true, source: 'code', calls: 0, tokens: 0 },
]

const PHASES: readonly PhaseId[] = ['record', 'replay', 'heal', 'eject']

const PHASE_LABEL: Record<PhaseId, string> = {
    record: translate({ id: 'homepage.ai.phase.record', message: 'Record' }),
    replay: translate({ id: 'homepage.ai.phase.replay', message: 'Replay' }),
    heal: translate({ id: 'homepage.ai.phase.heal', message: 'Heal' }),
    eject: translate({ id: 'homepage.ai.phase.eject', message: 'Eject' }),
}

const PHASE_CAPTION: Record<PhaseId, string> = {
    record: translate({ id: 'homepage.ai.caption.record', message: 'Your model performs the step once. WebdriverIO records the commands it ran and the request each one sent.' }),
    replay: translate({ id: 'homepage.ai.caption.replay', message: 'Every later run replays those commands. No model, no tokens, no waiting.' }),
    heal: translate({ id: 'homepage.ai.caption.heal', message: 'A refactor renamed the test id. The step heals without the model, only after it sends the same request, and leaves screenshots and a video to review.' }),
    eject: translate({ id: 'homepage.ai.caption.eject', message: 'Eject whenever you like. It was WebdriverIO code all along.' }),
}

const SOURCE_LABEL: Record<Source, string> = {
    model: 'model',
    cache: 'cache',
    healed: 'cache · healed',
    code: 'plain code',
}

const FIRST_BEAT: Record<PhaseId, number> = Object.fromEntries(PHASES.map((phase) => [phase, BEATS.findIndex((beat) => beat.phase === phase)])) as Record<PhaseId, number>
const LAST_BEAT: Record<PhaseId, number> = Object.fromEntries(PHASES.map((phase) => [phase, BEATS.map((beat) => beat.phase).lastIndexOf(phase)])) as Record<PhaseId, number>

/**
 * Walks the beats while the demo is on screen and lets the tabs jump to a
 * phase. With reduced motion nothing advances on its own: each phase shows
 * its last beat.
 */
function useBeats<T extends HTMLElement> () {
    const ref = useRef<T>(null)
    const [step, setStep] = useState(LAST_BEAT.heal)
    const [running, setRunning] = useState(false)
    const [reduced, setReduced] = useState(false)
    const started = useRef(false)

    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        setReduced(prefersReduced)
        if (prefersReduced || !ref.current) {
            return
        }
        let intersecting = false
        const sync = () => {
            const onScreen = intersecting && document.visibilityState !== 'hidden'
            if (onScreen && !started.current) {
                started.current = true
                setStep(0)
            }
            setRunning(onScreen)
        }
        const observer = new IntersectionObserver(([entry]) => {
            intersecting = (entry?.intersectionRatio ?? 0) >= 0.3
            sync()
        }, { threshold: [0, 0.3, 1] })
        observer.observe(ref.current)
        document.addEventListener('visibilitychange', sync)
        return () => {
            observer.disconnect()
            document.removeEventListener('visibilitychange', sync)
        }
    }, [])

    useEffect(() => {
        if (!running || reduced) {
            return
        }
        const timer = setTimeout(() => setStep((current) => (current + 1) % BEATS.length), BEATS[step].ms)
        return () => clearTimeout(timer)
    }, [step, running, reduced])

    const seek = (phase: PhaseId) => {
        started.current = true
        setStep(reduced ? LAST_BEAT[phase] : FIRST_BEAT[phase])
    }

    return { ref, step, running, reduced, seek }
}

/** strings, keywords and comments of a line of the spec */
function Code ({ text }: { text: string }) {
    if (text.trimStart().startsWith('//')) {
        return <span className={styles.tokComment}>{text}</span>
    }
    const parts = text.split(/('(?:[^'\\]|\\.)*')/g)
    return (
        <>
            {parts.map((part, index) => part.startsWith('\'')
                ? <span key={index} className={styles.tokString}>{part}</span>
                : part.split(/\b(await|async|it|expect|browser)\b/g).map((word, i) => (
                    ['await', 'async'].includes(word)
                        ? <span key={`${index}-${i}`} className={styles.tokKeyword}>{word}</span>
                        : ['it', 'expect', 'browser'].includes(word)
                            ? <span key={`${index}-${i}`} className={styles.tokName}>{word}</span>
                            : <React.Fragment key={`${index}-${i}`}>{word}</React.Fragment>
                )))}
        </>
    )
}

function StatusIcon ({ status }: { status: LineStatus }) {
    if (status === 'ok' || status === 'healed') {
        return <i className={clsx(styles.lineIcon, styles.lineIconOk)} aria-hidden="true">✓</i>
    }
    if (status === 'failed') {
        return <i className={clsx(styles.lineIcon, styles.lineIconFail)} aria-hidden="true">✗</i>
    }
    if (status === 'running') {
        return <i className={clsx(styles.lineIcon, styles.lineIconRun)} aria-hidden="true" />
    }
    return <i className={styles.lineIcon} aria-hidden="true">↳</i>
}

function Editor ({ beat }: { beat: Beat }) {
    const [sizeStatus, addStatus] = beat.lines
    const recording = beat.phase === 'record'
    const actActive = recording || beat.phase === 'heal'
    const addCode = addStatus === 'healed' ? ADD_HEALED : ADD_STEP
    return (
        <div className={styles.editor}>
            <div className={styles.editorBar}>
                <span /><span /><span />
                <em>test/specs/cart.e2e.ts</em>
            </div>
            <div className={clsx(styles.editorBody, beat.ejected && styles.ejected)}>
                <p className={styles.codeLine}><Code text={'it(\'adds a shirt to the cart\', async () => {'} /></p>
                <p className={styles.codeLine}><Code text={'    await browser.url(\'/shirts/blue\')'} /></p>
                {beat.ejected ? (
                    <>
                        <p className={clsx(styles.codeLine, styles.morph)}><Code text={`    // act: ${INSTRUCTION}`} /></p>
                        <p className={clsx(styles.codeLine, styles.morph)} style={{ animationDelay: '120ms' }}><Code text={`    await ${SIZE_STEP}`} /></p>
                        <p className={clsx(styles.codeLine, styles.morph)} style={{ animationDelay: '240ms' }}><Code text={`    await ${ADD_HEALED}`} /></p>
                    </>
                ) : (
                    <>
                        <p className={clsx(styles.codeLine, actActive && styles.actLine, recording && styles.actThinking)}>
                            <Code text={`    await browser.act('${INSTRUCTION}')`} />
                        </p>
                        <div className={styles.steps}>
                            {[{ status: sizeStatus, code: SIZE_STEP }, { status: addStatus, code: addCode }].map(({ status, code }, index) => status !== 'hidden' && (
                                <p key={index} className={clsx(styles.step, styles[`step_${status}`])}>
                                    {index === 1 && status === 'healed' && <s className={styles.stepOld}>{ADD_STEP}</s>}
                                    <StatusIcon status={status} />
                                    <code>{code}</code>
                                    {index === 1 && (beat.effect || status === 'healed') && (
                                        <span className={clsx(styles.effectTag, beat.effect === 'checked' && styles.effectTagChecked)}>{REQUEST}</span>
                                    )}
                                </p>
                            ))}
                        </div>
                    </>
                )}
                <p className={styles.codeLine}><Code text={'    await expect($(\'aria/Cart (1)\')).toBeDisplayed()'} /></p>
                <p className={styles.codeLine}><Code text={'})'} /></p>
            </div>
            <div className={clsx(styles.runLog, beat.tone && styles[`runLog_${beat.tone}`])}>
                <span key={beat.log} className={styles.runLogText}>{beat.log}</span>
            </div>
            <dl className={styles.hud}>
                <div>
                    <dt>{translate({ id: 'homepage.ai.hud.source', message: 'Steps from' })}</dt>
                    <dd className={styles[`source_${beat.source}`]}>{SOURCE_LABEL[beat.source]}</dd>
                </div>
                <div>
                    <dt>{translate({ id: 'homepage.ai.hud.calls', message: 'Model calls' })}</dt>
                    <dd>{beat.calls}</dd>
                </div>
                <div>
                    <dt>{translate({ id: 'homepage.ai.hud.tokens', message: 'Tokens' })}</dt>
                    <dd>{beat.tokens >= 1000 ? `${(beat.tokens / 1000).toFixed(1)}k` : beat.tokens}</dd>
                </div>
            </dl>
        </div>
    )
}

function Browser ({ beat, stageRef }: { beat: Beat, stageRef: React.RefObject<HTMLDivElement | null> }) {
    const cursorRef = useRef<HTMLSpanElement>(null)
    const target = beat.cursor === 'size' || beat.cursor === 'add' ? beat.cursor : undefined

    useEffect(() => {
        const stage = stageRef.current
        const cursor = cursorRef.current
        if (!stage || !cursor) {
            return
        }
        const place = () => {
            const box = stage.getBoundingClientRect()
            const el = target && stage.querySelector<HTMLElement>(`[data-target="${target}"]`)
            if (!el) {
                cursor.style.left = '78%'
                cursor.style.top = '86%'
                return
            }
            const rect = el.getBoundingClientRect()
            cursor.style.left = `${rect.left - box.left + rect.width * 0.55}px`
            cursor.style.top = `${rect.top - box.top + rect.height * 0.6}px`
        }
        place()
        const resize = new ResizeObserver(place)
        resize.observe(stage)
        return () => resize.disconnect()
    }, [target, stageRef, beat.testId])

    const refsOn = beat.refs
    return (
        <>
            <div className={styles.browser}>
                <div className={home.browserChrome}>
                    <div className={home.browserTabs}>
                        <span className={home.traffic} aria-hidden="true"><i /><i /><i /></span>
                        <span className={home.browserTab}>
                            <i className={home.tabFavicon} aria-hidden="true" />
                            Northline
                        </span>
                    </div>
                    <div className={home.browserToolbar}>
                        <span className={home.omnibox}>localhost:3000/shirts/blue</span>
                    </div>
                </div>
                <div className={clsx(home.shop, styles.shop)}>
                    <header className={home.shopBar}>
                        <strong className={home.shopMark}>Northline</strong>
                        <span className={home.cart} aria-hidden="true">
                            <svg viewBox="0 0 24 24"><path d="M6 7h15l-1.6 9.2a1 1 0 0 1-1 .8H9.2a1 1 0 0 1-1-.8L6.2 4H3" /><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></svg>
                            {beat.cart && <span key={beat.phase} className={clsx(home.cartBadge, styles.badgePop)}>1</span>}
                        </span>
                    </header>
                    <div className={clsx(home.productPhoto, styles.photo)}>
                        <img className={home.shirt} src="/img/session/blue-tshirt.jpg" alt="" />
                        {beat.effect && (
                            <div key={`${beat.phase}-${beat.effect}`} className={clsx(styles.request, beat.effect === 'checked' && styles.requestChecked)}>
                                <span className={styles.requestDot} />
                                {REQUEST}
                                {beat.effect === 'checked' && <b>✓</b>}
                            </div>
                        )}
                        {beat.evidence && (
                            <div className={styles.tray}>
                                <span className={clsx(styles.thumb, styles.thumbFail)}><i />failed.png</span>
                                <span className={clsx(styles.thumb, styles.thumbOk)} style={{ animationDelay: '140ms' }}><i />step-1.png</span>
                                <span className={clsx(styles.thumb, styles.thumbVideo)} style={{ animationDelay: '280ms' }}><i>▶</i>heal.webm</span>
                            </div>
                        )}
                    </div>
                    <div className={home.productCopy}>
                        <p className={home.productKicker}>Apparel</p>
                        <p className={home.productName}>
                            Blue T-Shirt
                            {refsOn && <i className={home.refBadge}>e1</i>}
                        </p>
                    </div>
                    <div className={home.sizes}>
                        <span>S</span>
                        <span data-target="size" className={clsx(beat.size && styles.sizeSelected, beat.ripple === 'size' && styles.tap)}>
                            M
                            {refsOn && <i className={clsx(home.refBadge, styles.sizeRef)} style={{ animationDelay: '80ms' }}>e2</i>}
                        </span>
                        <span>L</span>
                    </div>
                    <div className={styles.addWrap}>
                        <span className={clsx(styles.testId, beat.testId === 'renamed' && styles.testIdRenamed)} aria-hidden="true">
                            data-testid=
                            {beat.testId === 'renamed' && <s>"add-to-cart"</s>}
                            <b key={beat.testId}>{beat.testId === 'renamed' ? '"cart-add"' : '"add-to-cart"'}</b>
                        </span>
                        <button
                            type="button"
                            tabIndex={-1}
                            data-target="add"
                            className={clsx(
                                home.addButton,
                                styles.addButton,
                                beat.ripple === 'add' && home.addRipple,
                                beat.heal === 'miss' && styles.miss,
                                beat.heal === 'search' && styles.search,
                                beat.heal === 'found' && !beat.evidence && styles.found,
                            )}>
                            Add to cart
                            {refsOn && <i className={home.refBadge} style={{ animationDelay: '160ms' }}>e3</i>}
                            {beat.heal === 'search' && <span className={styles.searchLabel}>role=button · name="Add to cart"</span>}
                        </button>
                    </div>
                </div>
                {beat.evidence && <div className={styles.flash} />}
            </div>
            <span ref={cursorRef} className={clsx(styles.cursor, beat.ripple && styles.cursorClick, (!beat.cursor || beat.phase === 'eject') && styles.cursorHidden)}>
                <svg viewBox="0 0 16 20" width="16" height="20" aria-hidden="true">
                    <path d="M1 1v15.5l4.2-3.8 2.7 6.1 2.6-1.1-2.7-6h5.6z" fill="#fff" stroke="#17171a" strokeWidth="1.3" strokeLinejoin="round" />
                </svg>
            </span>
        </>
    )
}

/**
 * The AI steps demo: a spec with a `browser.act()` call next to the page it
 * drives, through record, replay, heal and eject. The tabs jump to a phase.
 * The stage is decorative, the section text describes it.
 */
export default function AiStepsDemo () {
    const { ref, step, running, reduced, seek } = useBeats<HTMLDivElement>()
    const beat = BEATS[step]
    const stageRef = useRef<HTMLDivElement>(null)

    /**
     * WAI-ARIA tabs: arrow keys, Home and End move to a phase and focus its tab
     */
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        const index = PHASES.indexOf(beat.phase)
        const next = event.key === 'ArrowRight' || event.key === 'ArrowDown'
            ? (index + 1) % PHASES.length
            : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                ? (index - 1 + PHASES.length) % PHASES.length
                : event.key === 'Home' ? 0 : event.key === 'End' ? PHASES.length - 1 : -1
        if (next < 0) {
            return
        }
        event.preventDefault()
        seek(PHASES[next])
        event.currentTarget.querySelector<HTMLElement>(`#${tabId(`ai-${PHASES[next]}`)}`)?.focus()
    }

    const progress = useMemo(() => {
        const first = FIRST_BEAT[beat.phase]
        const total = LAST_BEAT[beat.phase] - first + 1
        return (step - first + 1) / total
    }, [beat.phase, step])

    return (
        <div className={styles.demo} ref={ref} data-ai-step={step}>
            <div
                className={styles.tabs}
                role="tablist"
                aria-label={translate({ id: 'homepage.ai.tabs', message: 'Phases of an AI step' })}
                onKeyDown={onKeyDown}>
                {PHASES.map((phase, index) => {
                    const selected = phase === beat.phase
                    return (
                        <button
                            key={phase}
                            id={tabId(`ai-${phase}`)}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            aria-controls={panelId('ai-steps')}
                            tabIndex={selected ? 0 : -1}
                            className={clsx(styles.tab, selected && styles.tabActive)}
                            onClick={() => seek(phase)}>
                            <span className={styles.tabIndex}>{String(index + 1).padStart(2, '0')}</span>
                            {PHASE_LABEL[phase]}
                            <span className={styles.tabTrack} aria-hidden="true">
                                <span
                                    className={styles.tabFill}
                                    style={selected
                                        ? { width: `${progress * 100}%`, transitionDuration: running && !reduced ? `${beat.ms}ms` : '0ms' }
                                        : { width: '0%', transitionDuration: '0ms' }}
                                />
                            </span>
                        </button>
                    )
                })}
            </div>
            <div className={styles.panel} id={panelId('ai-steps')} role="tabpanel" aria-labelledby={tabId(`ai-${beat.phase}`)}>
                <p className={styles.caption}>{PHASE_CAPTION[beat.phase]}</p>
                <div className={styles.grid} aria-hidden="true">
                    <Editor beat={beat} />
                    <div className={styles.stage} ref={stageRef} data-phase={beat.phase}>
                        <Browser beat={beat} stageRef={stageRef} />
                    </div>
                </div>
            </div>
        </div>
    )
}
