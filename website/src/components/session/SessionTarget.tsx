import { useEffect, useRef, useState } from 'react'

import SessionTerminal from './SessionTerminal.tsx'
import styles from './target.module.css'

type Cue = { t: number, cmd: string }

/**
 * Effect times are seconds in the cropped video. The command is typed
 * across the gap before `t`, and the window shows the result at `t`.
 */
const DEMOS: Record<string, { video: string, cues: readonly Cue[] }> = {
    browser: {
        video: '/img/session/browser.mp4',
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

export default function SessionTarget ({ id }: { id: string }) {
    const demo = DEMOS[id]
    const videoRef = useRef<HTMLVideoElement>(null)
    const [time, setTime] = useState(0)
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
        if (reduced) {
            video.pause()
            return
        }
        const box = video.parentElement
        if (!box) {
            return
        }
        const observer = new IntersectionObserver((entries) => {
            const visible = entries.some((entry) => entry.isIntersecting)
            if (visible) {
                video.play().catch(() => {})
            } else {
                video.pause()
            }
        }, { threshold: 0.25 })
        observer.observe(box)
        return () => observer.disconnect()
    }, [reduced])

    useEffect(() => {
        if (reduced) {
            return
        }
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
    }, [reduced])

    if (!demo) {
        return null
    }

    const cues = demo.cues
    const played = reduced ? cues[cues.length - 1].t : time
    const frame = frameAt(played, cues)
    const lines = cues.slice(0, frame.count)

    return (
        <div className={styles.demo}>
            <div className={styles.terminal} aria-hidden="true">
                <SessionTerminal
                    lines={lines}
                    active={frame.active}
                    typed={frame.typed}
                    showOut={frame.showOut}
                />
            </div>
            <div className={styles.stage}>
                <video
                    ref={videoRef}
                    src={demo.video}
                    muted
                    playsInline
                    loop
                    controls
                    preload="metadata"
                    aria-label={id === 'browser' ? 'Headed Chrome running the postcard demo' : id === 'android' ? 'Android boarding pass' : 'Electron launch console'}
                />
            </div>
        </div>
    )
}
