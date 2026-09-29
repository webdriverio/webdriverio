import { useEffect, useRef, useState } from 'react'

import SessionTerminal from './SessionTerminal.tsx'
import styles from './target.module.css'
import term from './terminal.module.css'

type Cue = { t: number, cmd: string }

/**
 * Effect times are seconds in the cropped video. The command is typed
 * across the gap before `t`, and the window shows the result at `t`.
 */
const DEMOS: Record<string, { video: string, label: string, cues: readonly Cue[] }> = {
    browser: {
        video: '/img/session/browser.mp4',
        label: 'Headed Chrome running the postcard demo',
        cues: [
            { t: 0, cmd: 'npx wdio session open chrome http://127.0.0.1:4173 --headed' },
            { t: 4.2, cmd: 'npx wdio session geolocation 35.6762 139.6503' },
            { t: 5.4, cmd: 'npx wdio session emulate color-scheme dark' },
            { t: 6.5, cmd: 'npx wdio session reload' },
            { t: 8.2, cmd: 'npx wdio session click "aria/Stamp the card"' },
            { t: 10.0, cmd: 'npx wdio session emulate clock 2026-12-31T15:00:00Z' },
            { t: 11.4, cmd: 'npx wdio session mock "**/api/weather" --body \'{"condition":"snow"}\'' },
            { t: 12.6, cmd: 'npx wdio session click "aria/Look outside"' },
            { t: 15.6, cmd: 'npx wdio session fill "aria/Message" "Wish you were here"' },
            { t: 17.4, cmd: 'npx wdio session click "aria/Send the card"' },
        ],
    },
    android: {
        video: '/img/session/android.mp4',
        label: 'Android boarding pass',
        cues: [
            { t: 0, cmd: 'npx wdio session open android --app app/build/outputs/apk/debug/app-debug.apk' },
            { t: 2.8, cmd: 'npx wdio session tap "~Board"' },
            { t: 5.6, cmd: 'npx wdio session swipe left' },
            { t: 8.4, cmd: 'npx wdio session rotate landscape' },
            { t: 11.4, cmd: 'npx wdio session deeplink "boardingpass://aurora" --package io.webdriver.boardingpass' },
        ],
    },
    electron: {
        video: '/img/session/electron.mp4',
        label: 'Electron launch console',
        cues: [
            { t: 0, cmd: 'npx wdio session open electron ./main.js --app-arg=--no-sandbox' },
            { t: 6.8, cmd: 'npx wdio session click "aria/Arm"' },
            { t: 7.6, cmd: 'npx wdio session press Space' },
            { t: 9.2, cmd: 'npx wdio session windows switch 1' },
        ],
    },
}

function frameAt (time: number, cues: readonly Cue[]) {
    let done = -1
    for (let i = 0; i < cues.length; i++) {
        if (time + 0.04 >= cues[i].t) {
            done = i
        }
    }
    if (done < 0) {
        return { count: 1, active: 0, typed: 0, showOut: false }
    }
    if (done >= cues.length - 1) {
        return { count: cues.length, active: done, typed: cues[done].cmd.length, showOut: true }
    }
    const next = done + 1
    const span = Math.max(0.05, cues[next].t - cues[done].t)
    const into = Math.min(1, Math.max(0, (time - cues[done].t) / span))
    const typed = Math.min(cues[next].cmd.length, Math.floor((into / 0.92) * cues[next].cmd.length))
    return { count: next + 1, active: next, typed, showOut: false }
}

function indexAt (time: number, cues: readonly Cue[]) {
    let idx = 0
    for (let i = 0; i < cues.length; i++) {
        if (time + 0.04 >= cues[i].t) {
            idx = i
        }
    }
    return idx
}

function IconPrev () {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M1.5 1.2h1.7v9.6H1.5zm9 0L4.4 6l6.1 4.8V1.2z" fill="currentColor" />
        </svg>
    )
}

function IconNext () {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M1.5 1.2v9.6L7.6 6 1.5 1.2zM8.8 1.2H10.5v9.6H8.8z" fill="currentColor" />
        </svg>
    )
}

function IconPlay () {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 1.4v9.2l7.4-4.6L3 1.4z" fill="currentColor" />
        </svg>
    )
}

function IconPause () {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 1.4h2.5v9.2H2zm5.5 0H10v9.2H7.5z" fill="currentColor" />
        </svg>
    )
}

export default function SessionTarget ({ id }: { id: string }) {
    const demo = DEMOS[id]
    const videoRef = useRef<HTMLVideoElement>(null)
    const userPaused = useRef(false)
    const [time, setTime] = useState(0)
    const [paused, setPaused] = useState(true)
    const [reduced, setReduced] = useState(false)

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)')
        const apply = () => setReduced(media.matches)
        apply()
        media.addEventListener('change', apply)
        return () => media.removeEventListener('change', apply)
    }, [])

    useEffect(() => {
        const video = videoRef.current
        if (!video) {
            return
        }
        const onPlay = () => setPaused(false)
        const onPause = () => setPaused(true)
        video.addEventListener('play', onPlay)
        video.addEventListener('pause', onPause)
        return () => {
            video.removeEventListener('play', onPlay)
            video.removeEventListener('pause', onPause)
        }
    }, [demo])

    useEffect(() => {
        const video = videoRef.current
        if (!video || !demo) {
            return
        }
        if (reduced) {
            const end = demo.cues[demo.cues.length - 1].t
            const park = () => {
                video.pause()
                userPaused.current = true
                if (Math.abs(video.currentTime - end) > 0.05) {
                    video.currentTime = end
                    setTime(end)
                }
            }
            if (video.readyState >= 1) {
                park()
            } else {
                video.addEventListener('loadedmetadata', park, { once: true })
            }
            return () => video.removeEventListener('loadedmetadata', park)
        }
        const box = video.parentElement
        if (!box) {
            return
        }
        const observer = new IntersectionObserver((entries) => {
            const visible = entries.some((entry) => entry.isIntersecting)
            if (visible && !userPaused.current) {
                video.play().catch(() => {})
            } else if (!visible) {
                video.pause()
            }
        }, { threshold: 0.25 })
        observer.observe(box)
        return () => observer.disconnect()
    }, [reduced, demo])

    useEffect(() => {
        let handle = 0
        const tick = () => {
            const video = videoRef.current
            if (video) {
                const next = video.currentTime
                setTime((prev) => (Math.abs(prev - next) < 0.03 ? prev : next))
            }
            handle = requestAnimationFrame(tick)
        }
        handle = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(handle)
    }, [])

    if (!demo) {
        return null
    }

    const cues = demo.cues
    const frame = frameAt(time, cues)
    const atBoundary = frame.typed === 0 && !frame.showOut
    const inspect = paused && atBoundary
    const lines = inspect ? cues.slice(0, Math.max(1, frame.active)) : cues.slice(0, frame.count)
    const active = inspect ? lines.length - 1 : frame.active
    const typed = inspect ? lines[active].cmd.length : frame.typed
    const idx = indexAt(time, cues)
    const atCueStart = time - cues[idx].t < 0.4
    const prevDisabled = idx === 0 && atCueStart
    const nextDisabled = idx >= cues.length - 1

    const seek = (index: number) => {
        const video = videoRef.current
        if (!video) {
            return
        }
        const next = Math.max(0, Math.min(cues.length - 1, index))
        const t = cues[next].t
        video.currentTime = t
        setTime(t)
    }

    const jump = (dir: -1 | 1) => {
        const target = dir < 0 ? (atCueStart ? idx - 1 : idx) : idx + 1
        if (target < 0 || target >= cues.length) {
            return
        }
        seek(target)
    }

    const toggle = () => {
        const video = videoRef.current
        if (!video) {
            return
        }
        if (video.paused) {
            userPaused.current = false
            video.play().catch(() => {})
        } else {
            userPaused.current = true
            video.pause()
        }
    }

    return (
        <div className={styles.demo}>
            <div className={styles.terminal}>
                <SessionTerminal
                    lines={lines}
                    active={active}
                    typed={typed}
                    showOut={inspect ? false : frame.showOut}
                    controls={(
                        <div className={term.controls}>
                            <button type="button" aria-label="Previous command" disabled={prevDisabled} onClick={() => jump(-1)}>
                                <IconPrev />
                            </button>
                            <button type="button" aria-label={paused ? 'Play' : 'Pause'} onClick={toggle}>
                                {paused ? <IconPlay /> : <IconPause />}
                            </button>
                            <button type="button" aria-label="Next command" disabled={nextDisabled} onClick={() => jump(1)}>
                                <IconNext />
                            </button>
                        </div>
                    )}
                />
            </div>
            <div className={styles.stage}>
                <video
                    ref={videoRef}
                    src={demo.video}
                    muted
                    playsInline
                    loop
                    preload="metadata"
                    aria-label={demo.label}
                />
            </div>
        </div>
    )
}
