import { useEffect, useRef, useState } from 'react'

import SessionTerminal from './SessionTerminal.tsx'
import styles from './target.module.css'
import term from './terminal.module.css'

type Cue = { t: number, cmd: string, out?: string }

/**
 * `out` is what the command prints: the status line, then `→` and the
 * generated code. Browser versions, artifact paths and window URLs change
 * per machine, so those are left off.
 */

/**
 * Effect times are seconds in the cropped video. The command is typed
 * across the gap before `t`, and the window shows the result at `t`.
 */
const DEMOS: Record<string, { video: string, label: string, cues: readonly Cue[] }> = {
    browser: {
        video: '/img/session/browser.mp4',
        label: 'Headed Chrome running the WebdriverIO demo app',
        cues: [
            { t: 0, cmd: 'npx wdio session open chrome http://127.0.0.1:8081 --headed --viewport 430x900', out: 'Session "default" ready: chrome (headed) · http://127.0.0.1:8081/' },
            { t: 2.93, cmd: 'npx wdio session click "aria/Webview"', out: 'Clicked "aria/Webview"\nNavigated to http://127.0.0.1:8081/webview\n→ await $(\'aria/Webview\').click()' },
            { t: 5.71, cmd: 'npx wdio session click "aria/Login"', out: 'Clicked "aria/Login"\nNavigated to http://127.0.0.1:8081/login\n→ await $(\'aria/Login\').click()' },
            { t: 7.09, cmd: 'npx wdio session fill "aria/input-email" "alice@webdriver.io"', out: 'Filled "aria/input-email"\n→ await $(\'aria/input-email\').setValue(\'alice@webdriver.io\')' },
            { t: 8.20, cmd: 'npx wdio session fill "aria/input-password" "supersecret"', out: 'Filled "aria/input-password"\n→ await $(\'aria/input-password\').setValue(\'supersecret\')' },
            { t: 9.30, cmd: 'npx wdio session click "aria/button-LOGIN"', out: 'Clicked "aria/button-LOGIN"\n→ await $(\'aria/button-LOGIN\').click()' },
            { t: 11.18, cmd: 'npx wdio session dialog accept', out: 'Accepted dialog "Success\\nYou are logged in!"\n→ await browser.acceptAlert()' },
            { t: 12.66, cmd: 'npx wdio session click "aria/Swipe"', out: 'Clicked "aria/Swipe"\nNavigated to http://127.0.0.1:8081/swipe\n→ await $(\'aria/Swipe\').click()' },
            { t: 15.13, cmd: 'npx wdio session exec swipe-left.js', out: 'Swiped the carousel left' },
            { t: 17.38, cmd: 'npx wdio session exec swipe-left.js', out: 'Swiped the carousel left' },
            { t: 18.52, cmd: 'npx wdio session scroll down --px 1400', out: 'Scrolled down 1400px\n→ await browser.scroll(0, 1400)' },
            { t: 20.60, cmd: 'npx wdio session click "aria/Drag"', out: 'Clicked "aria/Drag"\nNavigated to http://127.0.0.1:8081/drag\n→ await $(\'aria/Drag\').click()' },
            { t: 22.05, cmd: 'npx wdio session drag "aria/drag-l2" "aria/drop-l2"', out: 'Dragged "aria/drag-l2" onto "aria/drop-l2"\n→ await $(\'aria/drag-l2\').dragAndDrop($(\'aria/drop-l2\'))' },
            { t: 23.24, cmd: 'npx wdio session drag "aria/drag-r3" "aria/drop-r3"', out: 'Dragged "aria/drag-r3" onto "aria/drop-r3"\n→ await $(\'aria/drag-r3\').dragAndDrop($(\'aria/drop-r3\'))' },
            { t: 24.40, cmd: 'npx wdio session drag "aria/drag-r1" "aria/drop-r1"', out: 'Dragged "aria/drag-r1" onto "aria/drop-r1"\n→ await $(\'aria/drag-r1\').dragAndDrop($(\'aria/drop-r1\'))' },
            { t: 25.61, cmd: 'npx wdio session drag "aria/drag-c1" "aria/drop-c1"', out: 'Dragged "aria/drag-c1" onto "aria/drop-c1"\n→ await $(\'aria/drag-c1\').dragAndDrop($(\'aria/drop-c1\'))' },
            { t: 26.81, cmd: 'npx wdio session drag "aria/drag-c3" "aria/drop-c3"', out: 'Dragged "aria/drag-c3" onto "aria/drop-c3"\n→ await $(\'aria/drag-c3\').dragAndDrop($(\'aria/drop-c3\'))' },
            { t: 27.99, cmd: 'npx wdio session drag "aria/drag-r2" "aria/drop-r2"', out: 'Dragged "aria/drag-r2" onto "aria/drop-r2"\n→ await $(\'aria/drag-r2\').dragAndDrop($(\'aria/drop-r2\'))' },
            { t: 29.16, cmd: 'npx wdio session drag "aria/drag-c2" "aria/drop-c2"', out: 'Dragged "aria/drag-c2" onto "aria/drop-c2"\n→ await $(\'aria/drag-c2\').dragAndDrop($(\'aria/drop-c2\'))' },
            { t: 30.38, cmd: 'npx wdio session drag "aria/drag-l1" "aria/drop-l1"', out: 'Dragged "aria/drag-l1" onto "aria/drop-l1"\n→ await $(\'aria/drag-l1\').dragAndDrop($(\'aria/drop-l1\'))' },
            { t: 31.70, cmd: 'npx wdio session drag "aria/drag-l3" "aria/drop-l3"', out: 'Dragged "aria/drag-l3" onto "aria/drop-l3"\n→ await $(\'aria/drag-l3\').dragAndDrop($(\'aria/drop-l3\'))' },
        ],
    },
    electron: {
        video: '/img/session/electron.mp4',
        label: 'Electron window running the WebdriverIO demo app',
        cues: [
            { t: 0, cmd: 'npx wdio session -s electron open electron ./main.js --app-arg=--no-sandbox', out: 'Electron sessions use the classic WebDriver protocol.\nSession "electron" ready: electron · http://127.0.0.1:8081/' },
            { t: 2.93, cmd: 'npx wdio session -s electron click "aria/Webview"', out: 'Clicked "aria/Webview"\nNavigated to http://127.0.0.1:8081/webview\n→ await $(\'aria/Webview\').click()' },
            { t: 5.76, cmd: 'npx wdio session -s electron click "aria/Login"', out: 'Clicked "aria/Login"\nNavigated to http://127.0.0.1:8081/login\n→ await $(\'aria/Login\').click()' },
            { t: 7.13, cmd: 'npx wdio session -s electron fill "aria/input-email" "alice@webdriver.io"', out: 'Filled "aria/input-email"\n→ await $(\'aria/input-email\').setValue(\'alice@webdriver.io\')' },
            { t: 8.28, cmd: 'npx wdio session -s electron fill "aria/input-password" "supersecret"', out: 'Filled "aria/input-password"\n→ await $(\'aria/input-password\').setValue(\'supersecret\')' },
            { t: 9.42, cmd: 'npx wdio session -s electron click "aria/button-LOGIN"', out: 'Clicked "aria/button-LOGIN"\n→ await $(\'aria/button-LOGIN\').click()' },
            { t: 11.32, cmd: 'npx wdio session -s electron dialog accept', out: 'Accepted dialog "Success\\nYou are logged in!"\n→ await browser.acceptAlert()' },
            { t: 12.80, cmd: 'npx wdio session -s electron click "aria/Swipe"', out: 'Clicked "aria/Swipe"\nNavigated to http://127.0.0.1:8081/swipe\n→ await $(\'aria/Swipe\').click()' },
            { t: 15.29, cmd: 'npx wdio session -s electron exec swipe-left.js', out: 'Swiped the carousel left' },
            { t: 17.55, cmd: 'npx wdio session -s electron exec swipe-left.js', out: 'Swiped the carousel left' },
            { t: 18.69, cmd: 'npx wdio session -s electron scroll down --px 1400', out: 'Scrolled down 1400px\n→ await browser.scroll(0, 1400)' },
            { t: 20.78, cmd: 'npx wdio session -s electron click "aria/Drag"', out: 'Clicked "aria/Drag"\nNavigated to http://127.0.0.1:8081/drag\n→ await $(\'aria/Drag\').click()' },
            { t: 22.32, cmd: 'npx wdio session -s electron drag "aria/drag-l2" "aria/drop-l2"', out: 'Dragged "aria/drag-l2" onto "aria/drop-l2"\n→ await $(\'aria/drag-l2\').dragAndDrop($(\'aria/drop-l2\'))' },
            { t: 23.62, cmd: 'npx wdio session -s electron drag "aria/drag-r3" "aria/drop-r3"', out: 'Dragged "aria/drag-r3" onto "aria/drop-r3"\n→ await $(\'aria/drag-r3\').dragAndDrop($(\'aria/drop-r3\'))' },
            { t: 24.86, cmd: 'npx wdio session -s electron drag "aria/drag-r1" "aria/drop-r1"', out: 'Dragged "aria/drag-r1" onto "aria/drop-r1"\n→ await $(\'aria/drag-r1\').dragAndDrop($(\'aria/drop-r1\'))' },
            { t: 26.15, cmd: 'npx wdio session -s electron drag "aria/drag-c1" "aria/drop-c1"', out: 'Dragged "aria/drag-c1" onto "aria/drop-c1"\n→ await $(\'aria/drag-c1\').dragAndDrop($(\'aria/drop-c1\'))' },
            { t: 27.42, cmd: 'npx wdio session -s electron drag "aria/drag-c3" "aria/drop-c3"', out: 'Dragged "aria/drag-c3" onto "aria/drop-c3"\n→ await $(\'aria/drag-c3\').dragAndDrop($(\'aria/drop-c3\'))' },
            { t: 28.66, cmd: 'npx wdio session -s electron drag "aria/drag-r2" "aria/drop-r2"', out: 'Dragged "aria/drag-r2" onto "aria/drop-r2"\n→ await $(\'aria/drag-r2\').dragAndDrop($(\'aria/drop-r2\'))' },
            { t: 29.94, cmd: 'npx wdio session -s electron drag "aria/drag-c2" "aria/drop-c2"', out: 'Dragged "aria/drag-c2" onto "aria/drop-c2"\n→ await $(\'aria/drag-c2\').dragAndDrop($(\'aria/drop-c2\'))' },
            { t: 31.24, cmd: 'npx wdio session -s electron drag "aria/drag-l1" "aria/drop-l1"', out: 'Dragged "aria/drag-l1" onto "aria/drop-l1"\n→ await $(\'aria/drag-l1\').dragAndDrop($(\'aria/drop-l1\'))' },
            { t: 32.67, cmd: 'npx wdio session -s electron drag "aria/drag-l3" "aria/drop-l3"', out: 'Dragged "aria/drag-l3" onto "aria/drop-l3"\n→ await $(\'aria/drag-l3\').dragAndDrop($(\'aria/drop-l3\'))' },
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
                    showOut={inspect || frame.showOut}
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
