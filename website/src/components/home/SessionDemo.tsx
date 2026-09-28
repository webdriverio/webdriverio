import React, { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import Translate from '@docusaurus/Translate'

import { useTimeline } from './useTimeline'
import styles from './home.module.css'

type DeviceId = 'browser' | 'phone' | 'desktop'
type Phase = 'paint' | 'refs' | 'click' | 'check' | 'fan'

type Mark = {
    at: number
    device: DeviceId | 'all'
    phase: Phase
    cmd: string
    out?: string
}

type Beat = Omit<Mark, 'at'>

/** Storyboard from RFC 0001 §15. Slots are derived so each command can be typed before the next one starts. */
const SCRIPT: readonly Beat[] = [
    { device: 'browser', phase: 'paint', cmd: 'wdio session --session browser open chrome localhost:3000' },
    { device: 'browser', phase: 'refs', cmd: 'wdio session --session browser snapshot', out: 'button "Add to cart" [ref=e3]' },
    { device: 'browser', phase: 'click', cmd: 'wdio session --session browser click e3' },
    { device: 'browser', phase: 'check', cmd: 'wdio session --session browser visual check cart', out: 'Baseline created' },
    { device: 'phone', phase: 'paint', cmd: 'wdio session --session phone open android --app shop.apk' },
    { device: 'phone', phase: 'refs', cmd: 'wdio session --session phone snapshot', out: 'button "Add to cart" [ref=e3]' },
    { device: 'phone', phase: 'click', cmd: 'wdio session --session phone click e3' },
    { device: 'phone', phase: 'check', cmd: 'wdio session --session phone visual check cart', out: 'Baseline created' },
    { device: 'desktop', phase: 'paint', cmd: 'wdio session --session desktop open electron ./dist/shop' },
    { device: 'desktop', phase: 'refs', cmd: 'wdio session --session desktop snapshot', out: 'button "Add to cart" [ref=e3]' },
    { device: 'desktop', phase: 'click', cmd: 'wdio session --session desktop click e3' },
    { device: 'desktop', phase: 'check', cmd: 'wdio session --session desktop visual check cart', out: 'Baseline created' },
    { device: 'all', phase: 'fan', cmd: 'wdio session --session browser export --out cart.e2e.ts', out: 'Wrote cart.e2e.ts' },
]

/** Beat before the first character, like a hand settling on the keys. */
const TYPE_LEAD = 80

const FAMILIAR_PREFIX = 'wdio session --session '

function charDelay(ch: string, index: number) {
    // The repeated prefix is muscle memory. The rest of the line is read as it lands.
    const familiar = index < FAMILIAR_PREFIX.length
    const wobble = (index % 4) * (familiar ? 4 : 8)
    if (ch === ' ') {
        return familiar ? 26 : 68
    }
    if (ch === '-' || ch === '.' || ch === '/' || ch === '"') {
        return (familiar ? 20 : 46) + (index % 3) * (familiar ? 4 : 8)
    }
    return (familiar ? 14 : 32) + wobble
}

function typeMs(cmd: string) {
    let total = TYPE_LEAD
    for (let i = 0; i < cmd.length; i++) {
        total += charDelay(cmd[i], i)
    }
    return total
}

/** Pause after the last character, then the shell prints and the screen reacts. */
const ENTER_PAUSE = 260
const READ_OUTPUT = 480
const READ_BARE = 380
const END_HOLD = 1100

function slotMs(beat: Beat, last: boolean) {
    const typed = typeMs(beat.cmd) + ENTER_PAUSE
    if (last) {
        return typed + END_HOLD
    }
    return typed + (beat.out ? READ_OUTPUT : READ_BARE)
}

function buildStoryboard() {
    let at = 0
    const marks = SCRIPT.map((beat, index) => {
        const mark = { ...beat, at }
        at += slotMs(beat, index === SCRIPT.length - 1)
        return mark
    })
    return { marks, loop: at }
}

const storyboard = buildStoryboard()
export const SESSION_MARKS: readonly Mark[] = storyboard.marks
const SESSION_TIMES = SESSION_MARKS.map((mark) => mark.at)
const LOOP_MS = storyboard.loop

const DEVICES: readonly DeviceId[] = ['browser', 'phone', 'desktop']

/** Where each cable leaves the left edge of the stage, in the 500×400 wire viewBox. */
const WIRE_ORIGIN_Y: Record<DeviceId, number> = {
    browser: 118,
    phone: 200,
    desktop: 282,
}

/** Curve from the stage edge to a device. Narrow layouts drop in from the top, under the terminal. */
function wirePath(stage: DOMRect, device: DOMRect, id: DeviceId, fromTop: boolean) {
    if (fromTop) {
        const endX = ((device.left + device.width / 2 - stage.left) / stage.width) * 500
        const endY = ((device.top - stage.top + 6) / stage.height) * 400
        const x = Math.min(490, Math.max(10, endX))
        const y = Math.min(388, Math.max(36, endY))
        const drop = y * 0.55
        return `M${x} 0 C ${x} ${drop}, ${x} ${drop}, ${x} ${y}`
    }
    const endX = ((device.left - stage.left + 8) / stage.width) * 500
    const endY = ((device.top + device.height / 2 - stage.top) / stage.height) * 400
    const x = Math.min(492, Math.max(28, endX))
    const y = Math.min(388, Math.max(12, endY))
    const y0 = WIRE_ORIGIN_Y[id]
    const bend = x * 0.62
    return `M0 ${y0} C ${bend} ${y0}, ${bend} ${y}, ${x} ${y}`
}

function Check() {
    return (
        <span className={styles.deviceCheck}>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <circle cx="8" cy="8" r="8" fill="#22c55e" />
                <path d="M4.4 8.2 6.7 10.4 11.6 5.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    )
}

function TrafficLights() {
    return (
        <span className={styles.traffic} aria-hidden="true">
            <i /><i /><i />
        </span>
    )
}

function BrowserChrome() {
    return (
        <div className={styles.browserChrome}>
            <div className={styles.browserTabs}>
                <TrafficLights />
                <span className={styles.browserTab}>
                    <i className={styles.tabFavicon} aria-hidden="true" />
                    <Translate id="homepage.session.shop">Shop</Translate>
                </span>
            </div>
            <div className={styles.browserToolbar}>
                <span className={styles.browserNav} aria-hidden="true">
                    <svg viewBox="0 0 12 12"><path d="M8 2 4 6l4 4" /></svg>
                    <svg viewBox="0 0 12 12"><path d="M4 2l4 4-4 4" /></svg>
                    <svg viewBox="0 0 12 12"><path d="M9.5 6A3.5 3.5 0 1 1 7 2.7" /><path d="M7 1.2V3h1.8" /></svg>
                </span>
                <span className={styles.omnibox}>
                    <svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2.4" y="5.4" width="7.2" height="5" rx="1" /><path d="M4 5.4V3.8a2 2 0 0 1 4 0v1.6" /></svg>
                    localhost:3000
                </span>
            </div>
        </div>
    )
}

function DesktopChrome() {
    return (
        <div className={styles.desktopChrome}>
            <TrafficLights />
            <em><Translate id="homepage.session.shop">Shop</Translate></em>
        </div>
    )
}

function PhoneStatus() {
    return (
        <div className={styles.phoneStatus} aria-hidden="true">
            <span>9:41</span>
            <span className={styles.phoneRadios}>
                <svg className={styles.phoneWifi} viewBox="0 0 16 16"><path d="M8 12.4a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z" /><path d="M4.7 9a4.7 4.7 0 0 1 6.6 0" /><path d="M2.3 6.6a8 8 0 0 1 11.4 0" /></svg>
                <svg className={styles.phoneSignal} viewBox="0 0 16 16"><path d="M1.4 12.6h2.1V9.4H1.4zm3.5 0h2.1V6.8H4.9zm3.5 0h2.1V4.4H8.4zm3.5 0h2.1V2H11.9z" /></svg>
                <svg className={styles.phoneBattery} viewBox="0 0 18 12"><rect x="0.7" y="1.2" width="14" height="9.6" rx="1.6" /><path d="M15.4 4.2h1.1a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-1.1" /><rect x="2.2" y="2.7" width="9" height="6.6" rx="0.6" /></svg>
            </span>
        </div>
    )
}

function Shop({ phase }: { phase: Phase | 'idle' }) {
    const refs = phase === 'refs' || phase === 'click' || phase === 'check'
    const added = phase === 'click' || phase === 'check' || phase === 'fan'
    const scan = phase === 'check'
    return (
        <div className={clsx(styles.shop, added && styles.shopAdded)}>
            {scan && <div className={styles.scanLine} />}
            <header className={styles.shopBar}>
                <strong className={styles.shopMark}>Northline</strong>
                <span className={styles.cart} aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M6 7h15l-1.6 9.2a1 1 0 0 1-1 .8H9.2a1 1 0 0 1-1-.8L6.2 4H3" /><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></svg>
                    {added && <span className={styles.cartBadge}>1</span>}
                </span>
            </header>
            <div className={styles.productPhoto}>
                {/* Crop of https://unsplash.com/photos/assorted-color-folded-shirts-on-wooden-panel-tWOz2_EK5EQ */}
                <img className={styles.shirt} src="/img/session/blue-tshirt.jpg" alt="" />
            </div>
            <div className={styles.productCopy}>
                <p className={styles.productKicker}>Apparel</p>
                <p className={styles.productName}>
                    <Translate id="homepage.session.product">Blue T-Shirt</Translate>
                    {refs && <i className={styles.refBadge} style={{ animationDelay: '0ms' }}>e1</i>}
                </p>
                <p className={styles.productPrice}>
                    $24
                    {refs && <i className={styles.refBadge} style={{ animationDelay: '80ms' }}>e2</i>}
                </p>
            </div>
            <div className={styles.sizes} aria-hidden="true">
                <span>S</span>
                <span className={styles.sizeOn}>M</span>
                <span>L</span>
            </div>
            <button type="button" className={clsx(styles.addButton, phase === 'click' && styles.addRipple)} tabIndex={-1}>
                <Translate id="homepage.session.add">Add to cart</Translate>
                {refs && <i className={styles.refBadge} style={{ animationDelay: '160ms' }}>e3</i>}
            </button>
        </div>
    )
}

function face(id: DeviceId, mark: Mark): Phase | 'idle' {
    if (mark.device === 'all') {
        return 'fan'
    }
    let phase: Phase | 'idle' = 'idle'
    for (const item of SESSION_MARKS) {
        if (item.at > mark.at) {
            break
        }
        if (item.device === id) {
            phase = item.phase
        }
    }
    if (mark.device !== id && (phase === 'click' || phase === 'check')) {
        return 'click'
    }
    return phase
}

/**
 * Types the newest command. Earlier lines stay complete. Calls `onEnter`
 * when the command is finished so the stage reacts as if Enter was pressed.
 * Typing state stays here so the device frames do not re-render per character.
 */
function Terminal({ step, onEnter }: { step: number, onEnter: (index: number) => void }) {
    const bodyRef = useRef<HTMLDivElement>(null)
    const onEnterRef = useRef(onEnter)
    const started = useRef(false)
    const seenStep = useRef(step)
    const mark = SESSION_MARKS[Math.min(step, SESSION_MARKS.length - 1)]
    const lines = SESSION_MARKS.slice(0, step + 1)
    const [count, setCount] = useState(mark.cmd.length)
    const [showOut, setShowOut] = useState(true)
    onEnterRef.current = onEnter

    // Reset in render so a new command never flashes fully typed before the effect runs.
    if (seenStep.current !== step) {
        seenStep.current = step
        setCount(0)
        setShowOut(false)
    }

    useEffect(() => {
        const el = bodyRef.current
        if (el) {
            el.scrollTop = el.scrollHeight
        }
    }, [count, showOut, step])

    useEffect(() => {
        const cmd = mark.cmd
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        // The timeline's first paint is the finished loop. Leave it complete, then type once it starts.
        if (!started.current && (step === SESSION_MARKS.length - 1 || reduced)) {
            return
        }
        started.current = true
        if (reduced) {
            setCount(cmd.length)
            setShowOut(true)
            onEnterRef.current(step)
            return
        }
        setCount(0)
        setShowOut(false)
        let i = 0
        let timer: ReturnType<typeof setTimeout>
        const typeNext = () => {
            i += 1
            setCount(i)
            if (i >= cmd.length) {
                timer = setTimeout(() => {
                    setShowOut(true)
                    onEnterRef.current(step)
                }, ENTER_PAUSE)
                return
            }
            timer = setTimeout(typeNext, charDelay(cmd[i], i))
        }
        timer = setTimeout(typeNext, TYPE_LEAD + charDelay(cmd[0], 0))
        return () => clearTimeout(timer)
    }, [step, mark.cmd])

    return (
        <div className={styles.sessionTerminal} aria-hidden="true">
            <div className={styles.sessionTermFill}>
                <div className={styles.windowBar}>
                    <span /><span /><span />
                    <em>terminal</em>
                </div>
                <div className={styles.sessionTermBody} ref={bodyRef}>
                    {lines.map((line, index) => {
                        const current = index === lines.length - 1
                        const text = current ? line.cmd.slice(0, count) : line.cmd
                        return (
                            <div key={`${line.at}-${line.cmd}`}>
                                <p className={styles.termCmd}>
                                    <span className={styles.termPrompt}>$</span> {text}
                                    {current && count < line.cmd.length && <span className={styles.termCaret} />}
                                </p>
                                {line.out && (!current || showOut) && <p className={styles.termOut}>{line.out}</p>}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

/**
 * Terminal plus three device frames. The stage is decorative: the section
 * description next to it is what assistive tech reads.
 */
export default function SessionDemo() {
    const { ref, step } = useTimeline<HTMLDivElement>(SESSION_TIMES, LOOP_MS)
    // The stage follows the command that was just entered, so the UI reacts after the typing.
    const [committed, setCommitted] = useState(step)
    const typing = SESSION_MARKS[Math.min(step, SESSION_MARKS.length - 1)]
    const mark = SESSION_MARKS[Math.min(committed, SESSION_MARKS.length - 1)]
    const stageRef = useRef<HTMLDivElement>(null)
    const [wireFromTop, setWireFromTop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 996px)').matches)
    const seenFocus = useRef(mark.device)
    // Wires wait out the 480ms frame move, so a cable appears only once its device is in front.
    const [settled, setSettled] = useState<DeviceId | null>(mark.device === 'all' ? null : mark.device)
    const shown: readonly DeviceId[] = settled ? [settled] : []

    useEffect(() => {
        if (seenFocus.current === mark.device) {
            return
        }
        seenFocus.current = mark.device
        if (mark.device === 'all') {
            setSettled(null)
            return
        }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setSettled(mark.device)
            return
        }
        setSettled(null)
        const timer = setTimeout(() => setSettled(mark.device), 480)
        return () => clearTimeout(timer)
    }, [mark.device])

    useEffect(() => {
        const stage = stageRef.current
        if (!stage) {
            return
        }
        let timers: Array<ReturnType<typeof setTimeout>> = []
        const fromTop = () => window.matchMedia('(max-width: 996px)').matches
        const update = () => {
            const stageBox = stage.getBoundingClientRect()
            if (stageBox.width < 1) {
                return
            }
            const drop = fromTop()
            setWireFromTop((current) => current === drop ? current : drop)
            for (const id of DEVICES) {
                const path = stage.querySelector(`#session-path-${id}`)
                const device = stage.querySelector(`[data-device="${id}"]`)
                if (!path || !device) {
                    continue
                }
                const box = device.getBoundingClientRect()
                path.setAttribute('d', box.width < 1 ? 'M-20 -20' : wirePath(stageBox, box, id, drop))
            }
        }
        const follow = () => {
            timers.forEach(clearTimeout)
            update()
            // The frames ease into place over 480ms. Sample along that move.
            timers = [90, 220, 500].map((ms) => setTimeout(update, ms))
        }
        follow()
        const resize = new ResizeObserver(update)
        resize.observe(stage)
        const focus = new MutationObserver(follow)
        focus.observe(stage, { attributes: true, attributeFilter: ['data-focus'] })
        return () => {
            resize.disconnect()
            focus.disconnect()
            timers.forEach(clearTimeout)
        }
    }, [])

    return (
        <div className={styles.sessionDemo} ref={ref} data-session-step={typing.at}>
            <Terminal step={Math.min(step, SESSION_MARKS.length - 1)} onEnter={setCommitted} />
            <div className={styles.sessionStage} ref={stageRef} aria-hidden="true" data-focus={mark.device} data-phase={mark.phase}>
                <svg className={styles.sessionWires} viewBox="0 0 500 400">
                    <defs>
                        <linearGradient id="session-wire" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="var(--ifm-color-primary)" stopOpacity="0.35" />
                            <stop offset="14%" stopColor="var(--ifm-color-primary)" stopOpacity="1" />
                        </linearGradient>
                        <linearGradient id="session-wire-down" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="400">
                            <stop offset="0%" stopColor="var(--ifm-color-primary)" stopOpacity="0.35" />
                            <stop offset="22%" stopColor="var(--ifm-color-primary)" stopOpacity="1" />
                        </linearGradient>
                        {DEVICES.map((id) => (
                            <path key={id} id={`session-path-${id}`} d="M0 200" />
                        ))}
                    </defs>
                    {shown.map((id) => (
                        <use
                            key={id}
                            href={`#session-path-${id}`}
                            className={styles.sessionWireOn}
                            fill="none"
                            stroke={wireFromTop ? 'url(#session-wire-down)' : 'url(#session-wire)'}
                            strokeWidth={3}
                            strokeDasharray="5 7"
                        />
                    ))}
                    {shown.map((id) => (
                        <circle key={id} r="5" className={styles.sessionPacket} fill="var(--ifm-color-primary)">
                            <animateMotion dur="1.5s" repeatCount="indefinite" calcMode="linear">
                                <mpath href={`#session-path-${id}`} />
                            </animateMotion>
                        </circle>
                    ))}
                </svg>
                {DEVICES.map((id) => {
                    const phase = face(id, mark)
                    const frame = id === 'browser' ? styles.deviceBrowser : id === 'phone' ? styles.devicePhone : styles.deviceDesktop
                    return (
                        <div key={id} data-device={id} className={clsx(styles.device, frame)}>
                            <div className={styles.deviceScale}>
                                {phase === 'fan' && <Check />}
                                {phase === 'check' && <Check />}
                                {id === 'browser' && <BrowserChrome />}
                                {id === 'desktop' && <DesktopChrome />}
                                {id === 'phone' ? (
                                    <div className={styles.phoneScreen}>
                                        <PhoneStatus />
                                        <Shop phase={phase} />
                                        <div className={styles.phoneHome} aria-hidden="true" />
                                    </div>
                                ) : (
                                    <Shop phase={phase} />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
