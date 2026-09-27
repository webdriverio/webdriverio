import React, { useEffect, useRef } from 'react'
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

/** Storyboard from RFC 0001 §15. Phone and desktop replay snapshot, click and check in 0.6s beats. */
export const SESSION_MARKS: readonly Mark[] = [
    { at: 0, device: 'browser', phase: 'paint', cmd: 'wdio session open chrome localhost:3000' },
    { at: 1600, device: 'browser', phase: 'refs', cmd: 'wdio session snapshot', out: 'button "Add to cart" [ref=e3]' },
    { at: 3000, device: 'browser', phase: 'click', cmd: 'wdio session click e3' },
    { at: 4200, device: 'browser', phase: 'check', cmd: 'wdio session visual check cart', out: 'mismatch 0.00%' },
    { at: 5600, device: 'phone', phase: 'paint', cmd: 'wdio session open android --app shop.apk' },
    { at: 6200, device: 'phone', phase: 'refs', cmd: 'wdio session snapshot', out: 'button "Add to cart" [ref=e3]' },
    { at: 6800, device: 'phone', phase: 'click', cmd: 'wdio session click e3' },
    { at: 7400, device: 'phone', phase: 'check', cmd: 'wdio session visual check cart', out: 'mismatch 0.00%' },
    { at: 8600, device: 'desktop', phase: 'paint', cmd: 'wdio session open electron ./dist/shop' },
    { at: 9200, device: 'desktop', phase: 'refs', cmd: 'wdio session snapshot', out: 'button "Add to cart" [ref=e3]' },
    { at: 9800, device: 'desktop', phase: 'click', cmd: 'wdio session click e3' },
    { at: 10400, device: 'desktop', phase: 'check', cmd: 'wdio session visual check cart', out: 'mismatch 0.00%' },
    { at: 11600, device: 'all', phase: 'fan', cmd: 'wdio session export > cart.e2e.ts', out: '✓ 1 spec · 3 platforms' },
]

const SESSION_TIMES = SESSION_MARKS.map((mark) => mark.at)
const LOOP_MS = 14000

const WIRES: Record<DeviceId, string> = {
    browser: 'M0 112 C 90 112, 120 144, 190 160',
    phone: 'M0 184 C 110 184, 200 168, 370 184',
    desktop: 'M0 256 C 80 256, 140 232, 230 248',
}

const FAN_WIRES: Record<DeviceId, string> = {
    browser: 'M0 168 C 40 168, 60 200, 100 200',
    phone: 'M0 200 C 80 200, 140 200, 245 200',
    desktop: 'M0 232 C 110 232, 240 200, 400 200',
}

const DEVICES: readonly DeviceId[] = ['browser', 'phone', 'desktop']

function Check () {
    return (
        <span className={styles.deviceCheck}>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <circle cx="8" cy="8" r="8" fill="#22c55e" />
                <path d="M4.4 8.2 6.7 10.4 11.6 5.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    )
}

function Shop ({ phase }: { phase: Phase | 'idle' }) {
    const refs = phase === 'refs' || phase === 'click' || phase === 'check'
    const added = phase === 'click' || phase === 'check' || phase === 'fan'
    const scan = phase === 'check'
    return (
        <div className={clsx(styles.shop, added && styles.shopAdded)}>
            {scan && <div className={styles.scanLine} />}
            <header className={styles.shopBar}>
                <strong><Translate id="homepage.session.shop">Shop</Translate></strong>
                <span className={styles.cartBadge}>{added ? '1' : '0'}</span>
            </header>
            <div className={styles.product}>
                <span className={styles.swatch} />
                <div>
                    <p className={styles.productName}>
                        <Translate id="homepage.session.product">Blue T-Shirt</Translate>
                        {refs && <i className={styles.refBadge} style={{ animationDelay: '0ms' }}>e1</i>}
                    </p>
                    <p className={styles.productPrice}>
                        $24
                        {refs && <i className={styles.refBadge} style={{ animationDelay: '80ms' }}>e2</i>}
                    </p>
                </div>
            </div>
            <button type="button" className={clsx(styles.addButton, phase === 'click' && styles.addRipple)} tabIndex={-1}>
                <Translate id="homepage.session.add">Add to cart</Translate>
                {refs && <i className={styles.refBadge} style={{ animationDelay: '160ms' }}>e3</i>}
            </button>
        </div>
    )
}

function face (id: DeviceId, mark: Mark): Phase | 'idle' {
    if (mark.device === 'all') {
        return 'fan'
    }
    return mark.device === id ? mark.phase : 'idle'
}

/**
 * Terminal plus three device frames. The stage is decorative: the section
 * description next to it is what assistive tech reads.
 */
export default function SessionDemo () {
    const { ref, step } = useTimeline<HTMLDivElement>(SESSION_TIMES, LOOP_MS)
    const bodyRef = useRef<HTMLDivElement>(null)
    const mark = SESSION_MARKS[Math.min(step, SESSION_MARKS.length - 1)]
    const lines = SESSION_MARKS.slice(0, Math.min(step, SESSION_MARKS.length - 1) + 1)
    const fan = mark.device === 'all'
    const wires = fan ? FAN_WIRES : WIRES
    const active: readonly DeviceId[] = mark.device === 'all' ? DEVICES : [mark.device]

    useEffect(() => {
        const el = bodyRef.current
        if (el) {
            el.scrollTop = el.scrollHeight
        }
    }, [step])

    return (
        <div className={styles.sessionDemo} ref={ref} data-session-step={mark.at}>
            <div className={styles.sessionTerminal} aria-hidden="true">
                <div className={styles.windowBar}>
                    <span /><span /><span />
                    <em>terminal</em>
                </div>
                <div className={styles.sessionTermBody} ref={bodyRef}>
                    {lines.map((line) => (
                        <div key={`${line.at}-${line.cmd}`}>
                            <p className={styles.termCmd}><span className={styles.termPrompt}>$</span> {line.cmd}</p>
                            {line.out && <p className={styles.termOut}>{line.out}</p>}
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.sessionStage} aria-hidden="true" data-focus={mark.device} data-phase={mark.phase}>
                <svg className={styles.sessionWires} viewBox="0 0 500 400">
                    <defs>
                        <linearGradient id="session-wire" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="var(--ifm-color-primary)" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="var(--ifm-color-primary)" stopOpacity="0.7" />
                        </linearGradient>
                        {DEVICES.map((id) => (
                            <path key={id} id={`session-path-${id}`} d={wires[id]} />
                        ))}
                    </defs>
                    {DEVICES.map((id) => (
                        <use
                            key={id}
                            href={`#session-path-${id}`}
                            className={clsx(active.includes(id) && styles.sessionWireOn, fan && styles.sessionWireFan)}
                            fill="none"
                            stroke="url(#session-wire)"
                            strokeWidth={active.includes(id) ? 3 : 1.5}
                            strokeDasharray="5 7"
                            opacity={active.includes(id) ? 0.95 : 0.22}
                        />
                    ))}
                    {!fan && active.map((id) => (
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
                        <div key={id} className={clsx(styles.device, frame)}>
                            {phase === 'fan' && <Check />}
                            {phase === 'check' && <Check />}
                            {id === 'browser' && (
                                <div className={styles.deviceChrome}>
                                    <span /><span /><span />
                                    <em>localhost:3000</em>
                                </div>
                            )}
                            {id === 'phone' && <div className={styles.phoneNotch} />}
                            {id === 'desktop' && (
                                <div className={styles.deviceChrome}>
                                    <span /><span /><span />
                                    <em><Translate id="homepage.session.shop">Shop</Translate></em>
                                </div>
                            )}
                            <Shop phase={phase} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
