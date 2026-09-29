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
            { t: 0, cmd: 'npx wdio session open chrome http://127.0.0.1:8081 --headed --viewport 1280x800', out: 'Session "default" ready: chrome (headed) · http://127.0.0.1:8081/' },
            { t: 2.28, cmd: 'npx wdio session geolocation 35.6762 139.6503', out: 'Location set to 35.6762, 139.6503. Reload the page to apply (`wdio session reload`).\n→ await browser.emulate(\'geolocation\', { latitude: 35.6762, longitude: 139.6503 })' },
            { t: 4.16, cmd: 'npx wdio session reload', out: 'Reloaded → http://127.0.0.1:8081/\n→ await browser.refresh()' },
            { t: 6.2, cmd: 'npx wdio session click "aria/Weather"', out: 'Clicked "aria/Weather"\nNavigated to http://127.0.0.1:8081/weather\n→ await $(\'aria/Weather\').click()' },
            { t: 8.8, cmd: 'npx wdio session emulate clock 2026-06-21T23:30:00Z', out: 'Clock set to 2026-06-21T23:30:00.000Z\n→ await browser.execute((now) => { /* Date returns \'2026-06-21T23:30:00.000Z\' */ }, 1782084600000)' },
            { t: 10.55, cmd: 'npx wdio session click "aria/Webview"', out: 'Clicked "aria/Webview"\nNavigated to http://127.0.0.1:8081/webview\n→ await $(\'aria/Webview\').click()' },
            { t: 12.77, cmd: 'npx wdio session click "aria/Login"', out: 'Clicked "aria/Login"\nNavigated to http://127.0.0.1:8081/login\n→ await $(\'aria/Login\').click()' },
            { t: 14.07, cmd: 'npx wdio session fill "aria/input-email" "alice@webdriver.io"', out: 'Filled "aria/input-email"\n→ await $(\'aria/input-email\').setValue(\'alice@webdriver.io\')' },
            { t: 15.23, cmd: 'npx wdio session fill "aria/input-password" "supersecret"', out: 'Filled "aria/input-password"\n→ await $(\'aria/input-password\').setValue(\'supersecret\')' },
            { t: 16.47, cmd: 'npx wdio session click "aria/button-LOGIN"', out: 'Clicked "aria/button-LOGIN"\n→ await $(\'aria/button-LOGIN\').click()' },
            { t: 20.2, cmd: 'npx wdio session dialog accept', out: 'Accepted alert "Success\\nYou are logged in!"\n→ browser.once(\'dialog\', (dialog) => dialog.accept())' },
            { t: 21.4, cmd: 'npx wdio session click "aria/Swipe"', out: 'Clicked "aria/Swipe"\nNavigated to http://127.0.0.1:8081/swipe\n→ await $(\'aria/Swipe\').click()' },
            { t: 23.01, cmd: 'npx wdio session drag "[data-testid=Carousel]" "aria/Next card"', out: 'Dragged "[data-testid=Carousel]" onto "aria/Next card"\n→ await $(\'[data-testid=Carousel]\').dragAndDrop($(\'aria/Next card\'))' },
            { t: 24.46, cmd: 'npx wdio session drag "[data-testid=Carousel]" "aria/Next card"', out: 'Dragged "[data-testid=Carousel]" onto "aria/Next card"\n→ await $(\'[data-testid=Carousel]\').dragAndDrop($(\'aria/Next card\'))' },
            { t: 25.87, cmd: 'npx wdio session scroll down --px 560', out: 'Scrolled down 560px\n→ await browser.scroll(0, 560)' },
            { t: 27.61, cmd: 'npx wdio session click "aria/Drag"', out: 'Clicked "aria/Drag"\nNavigated to http://127.0.0.1:8081/drag\n→ await $(\'aria/Drag\').click()' },
            { t: 28.74, cmd: 'npx wdio session drag "aria/drag-l2" "aria/drop-l2"', out: 'Dragged "aria/drag-l2" onto "aria/drop-l2"\n→ await $(\'aria/drag-l2\').dragAndDrop($(\'aria/drop-l2\'))' },
            { t: 29.88, cmd: 'npx wdio session drag "aria/drag-r3" "aria/drop-r3"', out: 'Dragged "aria/drag-r3" onto "aria/drop-r3"\n→ await $(\'aria/drag-r3\').dragAndDrop($(\'aria/drop-r3\'))' },
            { t: 31.08, cmd: 'npx wdio session drag "aria/drag-r1" "aria/drop-r1"', out: 'Dragged "aria/drag-r1" onto "aria/drop-r1"\n→ await $(\'aria/drag-r1\').dragAndDrop($(\'aria/drop-r1\'))' },
            { t: 32.28, cmd: 'npx wdio session drag "aria/drag-c1" "aria/drop-c1"', out: 'Dragged "aria/drag-c1" onto "aria/drop-c1"\n→ await $(\'aria/drag-c1\').dragAndDrop($(\'aria/drop-c1\'))' },
            { t: 33.42, cmd: 'npx wdio session drag "aria/drag-c3" "aria/drop-c3"', out: 'Dragged "aria/drag-c3" onto "aria/drop-c3"\n→ await $(\'aria/drag-c3\').dragAndDrop($(\'aria/drop-c3\'))' },
            { t: 34.55, cmd: 'npx wdio session drag "aria/drag-r2" "aria/drop-r2"', out: 'Dragged "aria/drag-r2" onto "aria/drop-r2"\n→ await $(\'aria/drag-r2\').dragAndDrop($(\'aria/drop-r2\'))' },
            { t: 35.75, cmd: 'npx wdio session drag "aria/drag-c2" "aria/drop-c2"', out: 'Dragged "aria/drag-c2" onto "aria/drop-c2"\n→ await $(\'aria/drag-c2\').dragAndDrop($(\'aria/drop-c2\'))' },
            { t: 36.92, cmd: 'npx wdio session drag "aria/drag-l1" "aria/drop-l1"', out: 'Dragged "aria/drag-l1" onto "aria/drop-l1"\n→ await $(\'aria/drag-l1\').dragAndDrop($(\'aria/drop-l1\'))' },
            { t: 38.18, cmd: 'npx wdio session drag "aria/drag-l3" "aria/drop-l3"', out: 'Dragged "aria/drag-l3" onto "aria/drop-l3"\n→ await $(\'aria/drag-l3\').dragAndDrop($(\'aria/drop-l3\'))' },
        ],
    },
    android: {
        video: '/img/session/android.mp4',
        label: 'Android emulator running the WebdriverIO demo app',
        cues: [
            { t: 0, cmd: 'npx wdio session -s android open android --package com.wdiodemoapp --activity com.wdiodemoapp.MainActivity --no-reset', out: 'Session "android" ready: android (UiAutomator2)' },
            { t: 5, cmd: 'npx wdio session -s android tap "~Login"', out: 'Tapped "~Login"\n→ await $(\'~Login\').tap()' },
            { t: 8, cmd: 'npx wdio session -s android fill "~input-email" "alice@webdriver.io"', out: 'Filled "~input-email"\n→ await $(\'~input-email\').setValue(\'alice@webdriver.io\')' },
            { t: 11, cmd: 'npx wdio session -s android fill "~input-password" "supersecret"', out: 'Filled "~input-password"\n→ await $(\'~input-password\').setValue(\'supersecret\')' },
            { t: 16, cmd: 'npx wdio session -s android exec -e \'await browser.execute("mobile: scrollGesture", { elementId: (await $("~Login-screen")).elementId, direction: "down", percent: 0.75 }); return "scrolled the login form"\'', out: 'scrolled the login form' },
            { t: 24, cmd: 'npx wdio session -s android tap "~button-LOGIN"', out: 'Tapped "~button-LOGIN"\n→ await $(\'~button-LOGIN\').tap()' },
            { t: 33, cmd: 'npx wdio session -s android dialog accept', out: 'Accepted the dialog\n→ await browser.acceptAlert()' },
            { t: 35, cmd: 'npx wdio session -s android tap "~Swipe"', out: 'Tapped "~Swipe"\n→ await $(\'~Swipe\').tap()' },
            { t: 43, cmd: 'npx wdio session -s android exec -e \'for (let i = 0; i < 6; i++) { await browser.execute("mobile: swipeGesture", { left: 80, top: 180, width: 560, height: 320, direction: "up", percent: 0.95 }) } for (let i = 0; i < 4; i++) { await browser.execute("mobile: swipeGesture", { left: 40, top: 700, width: 640, height: 280, direction: "up", percent: 0.9 }) } return "revealed the robot"\'', out: 'revealed the robot' },
            { t: 50, cmd: 'npx wdio session -s android tap "~Drag"', out: 'Tapped "~Drag"\n→ await $(\'~Drag\').tap()' },
            { t: 58, cmd: 'npx wdio session -s android drag "~drag-l2" "~drop-l2"', out: 'Dragged "~drag-l2" onto "~drop-l2"\n→ await $(\'~drag-l2\').dragAndDrop($(\'~drop-l2\'))' },
            { t: 65, cmd: 'npx wdio session -s android drag "~drag-r3" "~drop-r3"', out: 'Dragged "~drag-r3" onto "~drop-r3"\n→ await $(\'~drag-r3\').dragAndDrop($(\'~drop-r3\'))' },
            { t: 72, cmd: 'npx wdio session -s android drag "~drag-r1" "~drop-r1"', out: 'Dragged "~drag-r1" onto "~drop-r1"\n→ await $(\'~drag-r1\').dragAndDrop($(\'~drop-r1\'))' },
            { t: 79, cmd: 'npx wdio session -s android drag "~drag-c1" "~drop-c1"', out: 'Dragged "~drag-c1" onto "~drop-c1"\n→ await $(\'~drag-c1\').dragAndDrop($(\'~drop-c1\'))' },
            { t: 86, cmd: 'npx wdio session -s android drag "~drag-c3" "~drop-c3"', out: 'Dragged "~drag-c3" onto "~drop-c3"\n→ await $(\'~drag-c3\').dragAndDrop($(\'~drop-c3\'))' },
            { t: 93, cmd: 'npx wdio session -s android drag "~drag-r2" "~drop-r2"', out: 'Dragged "~drag-r2" onto "~drop-r2"\n→ await $(\'~drag-r2\').dragAndDrop($(\'~drop-r2\'))' },
            { t: 100, cmd: 'npx wdio session -s android drag "~drag-c2" "~drop-c2"', out: 'Dragged "~drag-c2" onto "~drop-c2"\n→ await $(\'~drag-c2\').dragAndDrop($(\'~drop-c2\'))' },
            { t: 106, cmd: 'npx wdio session -s android drag "~drag-l1" "~drop-l1"', out: 'Dragged "~drag-l1" onto "~drop-l1"\n→ await $(\'~drag-l1\').dragAndDrop($(\'~drop-l1\'))' },
            { t: 112, cmd: 'npx wdio session -s android drag "~drag-l3" "~drop-l3"', out: 'Dragged "~drag-l3" onto "~drop-l3"\n→ await $(\'~drag-l3\').dragAndDrop($(\'~drop-l3\'))' },
        ],
    },
    electron: {
        video: '/img/session/electron.mp4',
        label: 'Electron window running the WebdriverIO demo app',
        cues: [
            { t: 0, cmd: 'npx wdio session -s electron open electron ./main.js --app-arg=--no-sandbox', out: 'Electron sessions use the classic WebDriver protocol.\nSession "electron" ready: electron · http://127.0.0.1:8081/' },
            { t: 1.74, cmd: 'npx wdio session -s electron geolocation 35.6762 139.6503', out: 'Location set to 35.6762, 139.6503\n→ await browser.sendCommand(\'Emulation.setGeolocationOverride\', { latitude: 35.6762, longitude: 139.6503, accuracy: 1 })' },
            { t: 3.21, cmd: 'npx wdio session -s electron reload', out: 'Reloaded → http://127.0.0.1:8081/\n→ await browser.refresh()' },
            { t: 6.2, cmd: 'npx wdio session -s electron click "aria/Weather"', out: 'Clicked "aria/Weather"\nNavigated to http://127.0.0.1:8081/weather\n→ await $(\'aria/Weather\').click()' },
            { t: 8.4, cmd: 'npx wdio session -s electron emulate clock 2026-06-21T23:30:00Z', out: 'Clock set to 2026-06-21T23:30:00.000Z\n→ await browser.execute((now) => { /* Date returns \'2026-06-21T23:30:00.000Z\' */ }, 1782084600000)' },
            { t: 9.94, cmd: 'npx wdio session -s electron click "aria/Webview"', out: 'Clicked "aria/Webview"\nNavigated to http://127.0.0.1:8081/webview\n→ await $(\'aria/Webview\').click()' },
            { t: 11.75, cmd: 'npx wdio session -s electron click "aria/Login"', out: 'Clicked "aria/Login"\nNavigated to http://127.0.0.1:8081/login\n→ await $(\'aria/Login\').click()' },
            { t: 12.98, cmd: 'npx wdio session -s electron fill "aria/input-email" "alice@webdriver.io"', out: 'Filled "aria/input-email"\n→ await $(\'aria/input-email\').setValue(\'alice@webdriver.io\')' },
            { t: 14.21, cmd: 'npx wdio session -s electron fill "aria/input-password" "supersecret"', out: 'Filled "aria/input-password"\n→ await $(\'aria/input-password\').setValue(\'supersecret\')' },
            { t: 15.7, cmd: 'npx wdio session -s electron click "aria/button-LOGIN"', out: 'Clicked "aria/button-LOGIN"\n→ await $(\'aria/button-LOGIN\').click()' },
            { t: 18.05, cmd: 'npx wdio session -s electron click "aria/OK"', out: 'Clicked "aria/OK"\n→ await $(\'aria/OK\').click()' },
            { t: 18.97, cmd: 'npx wdio session -s electron click "aria/Swipe"', out: 'Clicked "aria/Swipe"\nNavigated to http://127.0.0.1:8081/swipe\n→ await $(\'aria/Swipe\').click()' },
            { t: 20.51, cmd: 'npx wdio session -s electron drag "[data-testid=Carousel]" "aria/Next card"', out: 'Dragged "[data-testid=Carousel]" onto "aria/Next card"\n→ await $(\'[data-testid=Carousel]\').dragAndDrop($(\'aria/Next card\'))' },
            { t: 21.92, cmd: 'npx wdio session -s electron drag "[data-testid=Carousel]" "aria/Next card"', out: 'Dragged "[data-testid=Carousel]" onto "aria/Next card"\n→ await $(\'[data-testid=Carousel]\').dragAndDrop($(\'aria/Next card\'))' },
            { t: 23.6, cmd: 'npx wdio session -s electron scroll down --px 560', out: 'Scrolled down 560px\n→ await browser.scroll(0, 560)' },
            { t: 24.91, cmd: 'npx wdio session -s electron click "aria/Drag"', out: 'Clicked "aria/Drag"\nNavigated to http://127.0.0.1:8081/drag\n→ await $(\'aria/Drag\').click()' },
            { t: 26.14, cmd: 'npx wdio session -s electron drag "aria/drag-l2" "aria/drop-l2"', out: 'Dragged "aria/drag-l2" onto "aria/drop-l2"\n→ await $(\'aria/drag-l2\').dragAndDrop($(\'aria/drop-l2\'))' },
            { t: 27.34, cmd: 'npx wdio session -s electron drag "aria/drag-r3" "aria/drop-r3"', out: 'Dragged "aria/drag-r3" onto "aria/drop-r3"\n→ await $(\'aria/drag-r3\').dragAndDrop($(\'aria/drop-r3\'))' },
            { t: 28.51, cmd: 'npx wdio session -s electron drag "aria/drag-r1" "aria/drop-r1"', out: 'Dragged "aria/drag-r1" onto "aria/drop-r1"\n→ await $(\'aria/drag-r1\').dragAndDrop($(\'aria/drop-r1\'))' },
            { t: 29.72, cmd: 'npx wdio session -s electron drag "aria/drag-c1" "aria/drop-c1"', out: 'Dragged "aria/drag-c1" onto "aria/drop-c1"\n→ await $(\'aria/drag-c1\').dragAndDrop($(\'aria/drop-c1\'))' },
            { t: 30.93, cmd: 'npx wdio session -s electron drag "aria/drag-c3" "aria/drop-c3"', out: 'Dragged "aria/drag-c3" onto "aria/drop-c3"\n→ await $(\'aria/drag-c3\').dragAndDrop($(\'aria/drop-c3\'))' },
            { t: 32.09, cmd: 'npx wdio session -s electron drag "aria/drag-r2" "aria/drop-r2"', out: 'Dragged "aria/drag-r2" onto "aria/drop-r2"\n→ await $(\'aria/drag-r2\').dragAndDrop($(\'aria/drop-r2\'))' },
            { t: 33.32, cmd: 'npx wdio session -s electron drag "aria/drag-c2" "aria/drop-c2"', out: 'Dragged "aria/drag-c2" onto "aria/drop-c2"\n→ await $(\'aria/drag-c2\').dragAndDrop($(\'aria/drop-c2\'))' },
            { t: 34.55, cmd: 'npx wdio session -s electron drag "aria/drag-l1" "aria/drop-l1"', out: 'Dragged "aria/drag-l1" onto "aria/drop-l1"\n→ await $(\'aria/drag-l1\').dragAndDrop($(\'aria/drop-l1\'))' },
            { t: 35.85, cmd: 'npx wdio session -s electron drag "aria/drag-l3" "aria/drop-l3"', out: 'Dragged "aria/drag-l3" onto "aria/drop-l3"\n→ await $(\'aria/drag-l3\').dragAndDrop($(\'aria/drop-l3\'))' },
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
        // Stepping is for reading the command. Leave playback paused on that frame.
        userPaused.current = true
        video.pause()
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
