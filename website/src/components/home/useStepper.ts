import { useEffect, useRef, useState } from 'react'

/**
 * Cycles through `count` steps while the element is on screen. With
 * `prefers-reduced-motion` the last step is shown immediately and nothing
 * animates.
 */
export function useStepper<T extends HTMLElement> (count: number, intervalMs: number, pauseSteps = 2) {
    const ref = useRef<T>(null)
    const [step, setStep] = useState(count)

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !ref.current) {
            return
        }
        let timer: ReturnType<typeof setInterval> | undefined
        let current = 0
        const start = () => {
            if (timer) {
                return
            }
            setStep(current)
            timer = setInterval(() => {
                current = (current + 1) % (count + pauseSteps)
                setStep(Math.min(current, count))
            }, intervalMs)
        }
        const stop = () => {
            clearInterval(timer)
            timer = undefined
        }
        const observer = new IntersectionObserver(([entry]) => entry.isIntersecting ? start() : stop(), { threshold: 0.3 })
        observer.observe(ref.current)
        return () => {
            observer.disconnect()
            stop()
        }
    }, [count, intervalMs, pauseSteps])

    return { ref, step }
}
