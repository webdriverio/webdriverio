import { useEffect, useRef, useState } from 'react'

/**
 * Walks `marks` (absolute milliseconds from the start of the loop) while the
 * element is on screen. `setTimeout` drives the steps so `browser.emulate('clock')`
 * can fast-forward them. The last mark stays on screen when the visitor prefers
 * reduced motion, and the timeline pauses while the element or the tab is hidden.
 */
export function useTimeline<T extends HTMLElement> (marks: readonly number[], loopMs: number) {
    const ref = useRef<T>(null)
    const finalStep = Math.max(0, marks.length - 1)
    const [step, setStep] = useState(finalStep)

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !ref.current || marks.length === 0) {
            return
        }
        let timer: ReturnType<typeof setTimeout> | undefined
        let index = 0
        let running = false
        let intersecting = false

        const clear = () => {
            if (timer !== undefined) {
                clearTimeout(timer)
                timer = undefined
            }
        }
        const arm = () => {
            clear()
            const nextAt = index + 1 < marks.length ? marks[index + 1] : loopMs
            const delay = Math.max(0, nextAt - marks[index])
            timer = setTimeout(() => {
                index = index + 1 < marks.length ? index + 1 : 0
                setStep(index)
                arm()
            }, delay)
        }
        const sync = () => {
            const onScreen = intersecting && document.visibilityState !== 'hidden'
            if (onScreen && !running) {
                running = true
                setStep(index)
                arm()
            } else if (!onScreen && running) {
                running = false
                clear()
            }
        }
        const observer = new IntersectionObserver(([entry]) => {
            intersecting = Boolean(entry?.isIntersecting)
            sync()
        }, { threshold: 0.3 })
        observer.observe(ref.current)
        document.addEventListener('visibilitychange', sync)
        return () => {
            observer.disconnect()
            document.removeEventListener('visibilitychange', sync)
            clear()
        }
    }, [marks, loopMs])

    return { ref, step }
}
