import React, { useEffect, useId, useRef, useState } from 'react'
import clsx from 'clsx'
import useBaseUrl from '@docusaurus/useBaseUrl'
import { translate } from '@docusaurus/Translate'

import styles from './home.module.css'

const CLIPS = [
    {
        gif: '/img/devtools/home-live.gif',
        poster: '/img/devtools/home-live.png',
        title: translate({ id: 'homepage.devtools.clip.live.title', message: 'Live mode' }),
        text: translate({
            id: 'homepage.devtools.clip.live.text',
            message: 'The dashboard that opens while your tests run. Commands, the page, and source update as each step executes.',
        }),
        ms: 9000,
    },
    {
        gif: '/img/devtools/home-inspect.gif',
        poster: '/img/devtools/home-inspect.png',
        title: translate({ id: 'homepage.devtools.clip.inspect.title', message: 'After the run' }),
        text: translate({
            id: 'homepage.devtools.clip.inspect.text',
            message: 'Open any finished test to inspect its commands, snapshots, and network traffic.',
        }),
        ms: 8000,
    },
    {
        gif: '/img/devtools/home-trace.gif',
        poster: '/img/devtools/home-trace.png',
        title: translate({ id: 'homepage.devtools.clip.trace.title', message: 'Trace replay' }),
        text: translate({
            id: 'homepage.devtools.clip.trace.text',
            message: 'A portable trace.zip from CI, replayed step by step with the page, timeline, and source.',
        }),
        ms: 12000,
    },
] as const

/**
 * Cropped recordings of the real DevTools UI. Clips only start when the
 * card is on screen; reduced-motion users get a still frame. Click the
 * recording to open it larger.
 */
export default function DevToolsDemo () {
    const liveGif = useBaseUrl(CLIPS[0].gif)
    const livePoster = useBaseUrl(CLIPS[0].poster)
    const inspectGif = useBaseUrl(CLIPS[1].gif)
    const inspectPoster = useBaseUrl(CLIPS[1].poster)
    const traceGif = useBaseUrl(CLIPS[2].gif)
    const tracePoster = useBaseUrl(CLIPS[2].poster)
    const clips = [
        { ...CLIPS[0], gif: liveGif, poster: livePoster },
        { ...CLIPS[1], gif: inspectGif, poster: inspectPoster },
        { ...CLIPS[2], gif: traceGif, poster: tracePoster },
    ]
    const titleId = useId()
    const ref = useRef<HTMLDivElement>(null)
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [index, setIndex] = useState(0)
    const [playing, setPlaying] = useState(false)
    const [open, setOpen] = useState(false)
    const [reduceMotion, setReduceMotion] = useState(false)
    const clip = clips[index]

    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        setReduceMotion(reduce)
        const node = ref.current
        if (!node || reduce) {
            return
        }
        const observer = new IntersectionObserver(([entry]) => {
            setPlaying(entry.isIntersecting)
        }, { threshold: 0.35 })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!playing || open) {
            return
        }
        const timer = window.setTimeout(() => {
            setIndex((current) => (current + 1) % CLIPS.length)
        }, CLIPS[index].ms)
        return () => window.clearTimeout(timer)
    }, [playing, open, index])

    const openDialog = () => {
        setOpen(true)
        dialogRef.current?.showModal()
    }

    const closeDialog = () => {
        setOpen(false)
        if (dialogRef.current?.open) {
            dialogRef.current.close()
        }
    }

    const animate = playing && !open
    const srcFor = (i: number) => {
        const item = clips[i]
        const loadGif = (animate || open) && (i === index || i === (index + 1) % clips.length)
        return loadGif && !reduceMotion ? item.gif : item.poster
    }

    return (
        <div className={styles.devtools} ref={ref}>
            <button
                type="button"
                className={styles.devtoolsStage}
                onClick={openDialog}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={translate({
                    id: 'homepage.devtools.clip.enlarge',
                    message: 'Enlarge recording: {title}',
                }, { title: clip.title })}
            >
                {clips.map((item, i) => (
                    <img
                        key={item.gif}
                        className={clsx(styles.devtoolsClip, i === index && styles.devtoolsClipActive)}
                        src={srcFor(i)}
                        alt=""
                        width={800}
                        height={420}
                    />
                ))}
                <span className={styles.devtoolsHint}>
                    {translate({ id: 'homepage.devtools.clip.hint', message: 'Click to enlarge' })}
                </span>
            </button>
            <div className={styles.devtoolsCaption}>
                <div>
                    <strong>{clip.title}</strong>
                    <p>{clip.text}</p>
                </div>
                <div className={styles.devtoolsNav} role="tablist" aria-label={translate({
                    id: 'homepage.devtools.clip.pages',
                    message: 'DevTools recordings',
                })}>
                    {clips.map((item, i) => (
                        <button
                            key={item.gif}
                            type="button"
                            role="tab"
                            aria-label={item.title}
                            aria-selected={i === index}
                            className={clsx(styles.devtoolsDot, i === index && styles.devtoolsDotActive)}
                            onClick={() => setIndex(i)}
                        />
                    ))}
                </div>
            </div>
            <dialog
                ref={dialogRef}
                className={styles.devtoolsDialog}
                aria-labelledby={titleId}
                onClose={closeDialog}
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
                        <button
                            type="button"
                            className={styles.devtoolsDialogClose}
                            onClick={closeDialog}
                        >
                            {translate({ id: 'homepage.devtools.clip.close', message: 'Close' })}
                        </button>
                    </div>
                    <img
                        className={styles.devtoolsDialogImage}
                        src={reduceMotion ? clip.poster : clip.gif}
                        alt={clip.title}
                        width={800}
                        height={420}
                    />
                </div>
            </dialog>
        </div>
    )
}
