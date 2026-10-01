import React, { useEffect, useId, useRef, useState } from 'react'
import clsx from 'clsx'
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl'
import { translate } from '@docusaurus/Translate'

import styles from './home.module.css'

const CLIPS = [
    {
        video: '/img/devtools/home-live.mp4',
        poster: '/img/devtools/home-live.png',
        title: translate({ id: 'homepage.devtools.clip.live.title', message: 'Live mode' }),
        text: translate({
            id: 'homepage.devtools.clip.live.text',
            message: 'The dashboard that opens while your tests run. Commands, the page, and source update as each step executes.',
        }),
    },
    {
        video: '/img/devtools/home-inspect.mp4',
        poster: '/img/devtools/home-inspect.png',
        title: translate({ id: 'homepage.devtools.clip.inspect.title', message: 'After the run' }),
        text: translate({
            id: 'homepage.devtools.clip.inspect.text',
            message: 'Open any finished test to inspect its commands, snapshots, and network traffic.',
        }),
    },
    {
        video: '/img/devtools/home-trace.mp4',
        poster: '/img/devtools/home-trace.png',
        title: translate({ id: 'homepage.devtools.clip.trace.title', message: 'Trace replay' }),
        text: translate({
            id: 'homepage.devtools.clip.trace.text',
            message: 'A portable trace.zip from CI, replayed step by step with the page, timeline, and source.',
        }),
    },
    {
        video: '/img/devtools/mobile-tests.mp4',
        poster: '/img/devtools/mobile-tests.png',
        title: translate({ id: 'homepage.devtools.clip.mobile.title', message: 'Mobile tests' }),
        text: translate({
            id: 'homepage.devtools.clip.mobile.text',
            message: 'A native iOS test on a simulator, with each Appium command next to a live view of the device.',
        }),
    },
    {
        video: '/img/devtools/test-runner.mp4',
        poster: '/img/devtools/test-runner.png',
        title: translate({ id: 'homepage.devtools.clip.testRunner.title', message: 'Test runner' }),
        text: translate({
            id: 'homepage.devtools.clip.testRunner.text',
            message: 'Watch tests run with a live browser preview and a screenshot after every command.',
        }),
    },
    {
        video: '/img/devtools/test-rerunner.mp4',
        poster: '/img/devtools/test-rerunner.png',
        title: translate({ id: 'homepage.devtools.clip.testRerunner.title', message: 'Rerun a single test' }),
        text: translate({
            id: 'homepage.devtools.clip.testRerunner.text',
            message: 'Click any test or suite in the sidebar to run it again, without restarting the test runner.',
        }),
    },
    {
        video: '/img/devtools/stop-runner.mp4',
        poster: '/img/devtools/stop-runner.png',
        title: translate({ id: 'homepage.devtools.clip.stopRunner.title', message: 'Stop the run' }),
        text: translate({
            id: 'homepage.devtools.clip.stopRunner.text',
            message: 'Stop a running test from the UI as soon as you have seen enough.',
        }),
    },
    {
        video: '/img/devtools/actions-command-logs.mp4',
        poster: '/img/devtools/actions-command-logs.png',
        title: translate({ id: 'homepage.devtools.clip.actions.title', message: 'Actions and command logs' }),
        text: translate({
            id: 'homepage.devtools.clip.actions.text',
            message: 'Every WebDriver command with its arguments, result, and timing, next to the page state it produced.',
        }),
    },
    {
        video: '/img/devtools/console-logs.mp4',
        poster: '/img/devtools/console-logs.png',
        title: translate({ id: 'homepage.devtools.clip.console.title', message: 'Console logs' }),
        text: translate({
            id: 'homepage.devtools.clip.console.text',
            message: 'Browser console output and WebdriverIO framework logs, with the time each message was logged.',
        }),
    },
    {
        video: '/img/devtools/network-logs.mp4',
        poster: '/img/devtools/network-logs.png',
        title: translate({ id: 'homepage.devtools.clip.network.title', message: 'Network logs' }),
        text: translate({
            id: 'homepage.devtools.clip.network.text',
            message: 'Every request and response of the test, with headers, payloads, status, and timing.',
        }),
    },
    {
        video: '/img/devtools/metadata.mp4',
        poster: '/img/devtools/metadata.png',
        title: translate({ id: 'homepage.devtools.clip.metadata.title', message: 'Metadata' }),
        text: translate({
            id: 'homepage.devtools.clip.metadata.text',
            message: 'The capabilities, environment, and timing of each browser session the test opened.',
        }),
    },
    {
        video: '/img/devtools/screencast.mp4',
        poster: '/img/devtools/screencast.png',
        title: translate({ id: 'homepage.devtools.clip.screencast.title', message: 'Session screencast' }),
        text: translate({
            id: 'homepage.devtools.clip.screencast.text',
            message: 'A video recording of the browser session, shown next to the snapshot and DOM views.',
        }),
    },
    {
        video: '/img/devtools/preserve-rerun.mp4',
        poster: '/img/devtools/preserve-rerun.png',
        title: translate({ id: 'homepage.devtools.clip.preserveRerun.title', message: 'Preserve and rerun' }),
        text: translate({
            id: 'homepage.devtools.clip.preserveRerun.text',
            message: 'Snapshot a failing run, rerun it in one click, and compare both runs command by command.',
        }),
    },
    {
        video: '/img/devtools/testlens.mp4',
        poster: '/img/devtools/testlens.png',
        title: translate({ id: 'homepage.devtools.clip.testLens.title', message: 'TestLens' }),
        text: translate({
            id: 'homepage.devtools.clip.testLens.text',
            message: 'Jump from a test in the UI straight to its line in your editor.',
        }),
    },
    {
        video: '/img/devtools/trace-player.mp4',
        poster: '/img/devtools/trace-player.png',
        title: translate({ id: 'homepage.devtools.clip.tracePlayer.title', message: 'Trace player' }),
        text: translate({
            id: 'homepage.devtools.clip.tracePlayer.text',
            message: 'Open a trace.zip with npx show-trace to replay it offline, review it, or hand it to an agent.',
        }),
    },
] as const

/**
 * Short clips replay until they have been on screen at least this long.
 */
const MIN_SLOT_MS = 6000

/**
 * Data saver or a 2G connection: show stills and let the reader opt in.
 */
/**
 * Autoplay blocked (e.g. iOS low power mode): fall back to the play button.
 * Other rejections only mean a pause or a new source interrupted play().
 */
const blockedAutoplay = (onBlocked: () => void) => (err: unknown) => {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
        onBlocked()
    }
}

function prefersLightData () {
    const connection = (navigator as Navigator & {
        connection?: { saveData?: boolean, effectiveType?: string }
    }).connection
    return Boolean(connection?.saveData) || ['slow-2g', '2g'].includes(connection?.effectiveType ?? '')
}

/**
 * Recordings of the real DevTools UI, shared by the home page and the
 * v10 release post. Clips are muted videos: only the current and the next
 * one load, a clip advances when it has played, and the active dot fills
 * as it plays (and pulses while it buffers). Reduced-motion readers get
 * still frames; on data saver, or when autoplay is blocked, readers get
 * still frames and a play button. Click the recording to open it larger.
 */
export default function DevToolsDemo () {
    const { withBaseUrl } = useBaseUrlUtils()
    const clips = CLIPS.map((item) => ({
        ...item,
        video: withBaseUrl(item.video),
        poster: withBaseUrl(item.poster),
    }))
    const titleId = useId()
    const ref = useRef<HTMLDivElement>(null)
    const dialogRef = useRef<HTMLDialogElement>(null)
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
    const fillRef = useRef<HTMLSpanElement>(null)
    const playsRef = useRef(0)
    const [index, setIndex] = useState(0)
    const [inView, setInView] = useState(false)
    const [open, setOpen] = useState(false)
    const [reduceMotion, setReduceMotion] = useState(false)
    const [manual, setManual] = useState(false)
    const [started, setStarted] = useState(false)
    const [buffering, setBuffering] = useState(true)
    const clip = clips[index]
    const next = (index + 1) % clips.length
    const autoplay = !reduceMotion && !manual
    const active = inView && !open && autoplay

    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        setReduceMotion(reduce)
        setManual(prefersLightData())
        const node = ref.current
        if (!node || reduce) {
            return
        }
        const observer = new IntersectionObserver(([entry]) => {
            setInView(entry.isIntersecting)
        }, { threshold: 0.35 })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (active) {
            setStarted(true)
        }
    }, [active])

    // Play the current clip from the start; park every other one.
    useEffect(() => {
        playsRef.current = 0
        setBuffering(true)
        videoRefs.current.forEach((video, i) => {
            if (video && i !== index) {
                video.pause()
                video.currentTime = 0
            }
        })
    }, [index])

    const playCurrent = (video: HTMLVideoElement) => {
        video.muted = true
        video.play().catch(blockedAutoplay(() => setManual(true)))
    }

    // play() before the source is attached would be aborted by the load
    // that follows, so wait for a source; onCanPlay covers late loads.
    useEffect(() => {
        const video = videoRefs.current[index]
        if (!video) {
            return
        }
        if (!active) {
            video.pause()
            return
        }
        if (video.getAttribute('src')) {
            playCurrent(video)
        }
    }, [active, index, started])

    // The active dot doubles as the progress bar for the current clip.
    useEffect(() => {
        const fill = fillRef.current
        if (!fill) {
            return
        }
        if (!autoplay) {
            fill.style.transform = 'scaleX(1)'
            return
        }
        fill.style.transform = 'scaleX(0)'
        if (!active) {
            return
        }
        let frame = 0
        const tick = () => {
            const video = videoRefs.current[index]
            if (video && video.duration > 0) {
                const plays = Math.max(1, Math.ceil(MIN_SLOT_MS / (video.duration * 1000)))
                const progress = (playsRef.current * video.duration + video.currentTime) / (plays * video.duration)
                fill.style.transform = `scaleX(${Math.min(progress, 1)})`
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [active, autoplay, index])

    const onEnded = (i: number) => {
        const video = videoRefs.current[i]
        if (i !== index || !video) {
            return
        }
        playsRef.current += 1
        const plays = Math.max(1, Math.ceil(MIN_SLOT_MS / (video.duration * 1000)))
        if (playsRef.current < plays) {
            video.currentTime = 0
            playCurrent(video)
            return
        }
        setIndex(next)
    }

    const step = (by: number) => setIndex((current) => (current + by + clips.length) % clips.length)
    const goPrev = () => step(-1)
    const goNext = () => step(1)

    const onArrowKey = (event: React.KeyboardEvent) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return
        }
        event.preventDefault()
        const target = (index + (event.key === 'ArrowLeft' ? -1 : 1) + clips.length) % clips.length
        setIndex(target)
        // Keep focus on the selected dot when moving through the tab list.
        const tabs = event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')
        if (tabs.length) {
            tabs[target]?.focus()
        }
    }

    // A horizontal swipe changes the clip and must not also open the dialog.
    const touchX = useRef<number | null>(null)
    const swiped = useRef(false)
    const swipeHandlers = {
        onTouchStart: (event: React.TouchEvent) => {
            touchX.current = event.touches[0].clientX
            swiped.current = false
        },
        onTouchEnd: (event: React.TouchEvent) => {
            if (touchX.current === null) {
                return
            }
            const dx = event.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) > 40) {
                swiped.current = true
                if (dx < 0) {
                    goNext()
                } else {
                    goPrev()
                }
            }
        },
    }

    const prevLabel = translate({ id: 'homepage.devtools.clip.previous', message: 'Previous recording' })
    const nextLabel = translate({ id: 'homepage.devtools.clip.next', message: 'Next recording' })
    const prevButton = (
        <button type="button" className={styles.devtoolsArrow} onClick={goPrev} aria-label={prevLabel} title={prevLabel}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
    )
    const nextButton = (
        <button type="button" className={styles.devtoolsArrow} onClick={goNext} aria-label={nextLabel} title={nextLabel}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
    )

    const openDialog = () => {
        if (swiped.current) {
            swiped.current = false
            return
        }
        setOpen(true)
        dialogRef.current?.showModal()
    }

    const closeDialog = () => {
        setOpen(false)
        if (dialogRef.current?.open) {
            dialogRef.current.close()
        }
    }

    // Two rows that lay out independently, so the wider active dot only
    // shifts the dots in its own row.
    const order = clips.map((_, i) => i)
    const half = Math.ceil(clips.length / 2)
    const rows = [order.slice(0, half), order.slice(half)]
    // Wide enough for a full row with the active pill (8px dots, 22px pill,
    // 8px gaps), so the block does not jump when the pill changes rows.
    const navWidth = (half - 1) * 16 + 22

    const srcFor = (i: number) => started && (i === index || i === next) ? clips[i].video : undefined

    return (
        <div className={styles.devtools} ref={ref}>
            <div className={styles.devtoolsStageWrap}>
                <button
                    type="button"
                    className={styles.devtoolsStage}
                    onClick={openDialog}
                    {...swipeHandlers}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-label={translate({
                        id: 'homepage.devtools.clip.enlarge',
                        message: 'Enlarge recording: {title}',
                    }, { title: clip.title })}
                >
                    {clips.map((item, i) => (
                        <video
                            key={item.video}
                            ref={(node) => {
                                videoRefs.current[i] = node
                            }}
                            className={clsx(styles.devtoolsClip, i === index && styles.devtoolsClipActive)}
                            src={srcFor(i)}
                            poster={item.poster}
                            preload={srcFor(i) ? 'auto' : 'none'}
                            width={800}
                            height={497}
                            muted
                            playsInline
                            disablePictureInPicture
                            aria-hidden="true"
                            tabIndex={-1}
                            onCanPlay={(event) => {
                                if (i === index && active && event.currentTarget.paused && !event.currentTarget.ended) {
                                    playCurrent(event.currentTarget)
                                }
                            }}
                            onPlaying={() => i === index && setBuffering(false)}
                            onWaiting={() => i === index && setBuffering(true)}
                            onEnded={() => onEnded(i)}
                        />
                    ))}
                    <span className={styles.devtoolsHint}>
                        {translate({ id: 'homepage.devtools.clip.hint', message: 'Click to enlarge' })}
                    </span>
                </button>
                {manual && !reduceMotion && (
                    <button
                        type="button"
                        className={styles.devtoolsPlay}
                        onClick={() => setManual(false)}
                    >
                        {translate({ id: 'homepage.devtools.clip.play', message: 'Play recordings' })}
                    </button>
                )}
            </div>
            <div className={styles.devtoolsCaption}>
                <div>
                    <strong>{clip.title}</strong>
                    <p>{clip.text}</p>
                </div>
                <div className={styles.devtoolsNavWrap}>
                    {prevButton}
                    <div className={styles.devtoolsNav} style={{ width: navWidth }} role="tablist" onKeyDown={onArrowKey} aria-label={translate({
                        id: 'homepage.devtools.clip.pages',
                        message: 'DevTools recordings',
                    })}>
                        {rows.map((row, r) => (
                            <div key={r} className={styles.devtoolsNavRow} role="presentation">
                                {row.map((i) => (
                                    <button
                                        key={clips[i].video}
                                        type="button"
                                        role="tab"
                                        aria-label={clips[i].title}
                                        aria-selected={i === index}
                                        className={clsx(
                                            styles.devtoolsDot,
                                            i === index && styles.devtoolsDotActive,
                                            i === index && active && buffering && styles.devtoolsDotLoading,
                                        )}
                                        onClick={() => setIndex(i)}
                                    >
                                        {i === index && <span ref={fillRef} className={styles.devtoolsDotFill} />}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                    {nextButton}
                </div>
            </div>
            <dialog
                ref={dialogRef}
                className={styles.devtoolsDialog}
                aria-labelledby={titleId}
                onClose={closeDialog}
                onKeyDown={onArrowKey}
                onClick={(event) => {
                    if (event.target === event.currentTarget) {
                        closeDialog()
                    }
                }}
            >
                <div className={styles.devtoolsDialogInner}>
                    <div className={styles.devtoolsDialogBar}>
                        <div>
                            <strong id={titleId}>{clip.title}</strong>
                            <p>{clip.text}</p>
                        </div>
                        <div className={styles.devtoolsDialogActions}>
                            <span className={styles.devtoolsCounter} aria-live="polite">
                                {index + 1} / {clips.length}
                            </span>
                            {prevButton}
                            {nextButton}
                            <button
                                type="button"
                                className={styles.devtoolsDialogClose}
                                onClick={closeDialog}
                            >
                                {translate({ id: 'homepage.devtools.clip.close', message: 'Close' })}
                            </button>
                        </div>
                    </div>
                    {open && (
                        <video
                            key={clip.video}
                            className={styles.devtoolsDialogImage}
                            src={clip.video}
                            poster={clip.poster}
                            width={800}
                            height={497}
                            muted
                            loop
                            playsInline
                            autoPlay={autoplay}
                            controls={!autoplay}
                            aria-label={clip.title}
                            {...swipeHandlers}
                        />
                    )}
                </div>
            </dialog>
        </div>
    )
}
