import { useEffect, useRef } from 'react'

import styles from './terminal.module.css'

export type TermLine = {
    cmd: string
    out?: string
}

/**
 * The homepage session terminal: traffic lights, a `$` prompt and a caret.
 * Callers own the typing clock. This view only paints the lines.
 */
export default function SessionTerminal ({ lines, active, typed, showOut }: {
    lines: readonly TermLine[]
    active: number
    typed: number
    showOut: boolean
}) {
    const bodyRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = bodyRef.current
        if (el) {
            el.scrollTop = el.scrollHeight
        }
    }, [typed, showOut, active, lines])

    return (
        <div className={styles.fill}>
            <div className={styles.bar}>
                <span /><span /><span />
                <em>terminal</em>
            </div>
            <div className={styles.body} ref={bodyRef}>
                {lines.map((line, index) => {
                    const current = index === active
                    const text = current ? line.cmd.slice(0, typed) : line.cmd
                    return (
                        <div key={`${index}-${line.cmd}`}>
                            <p className={styles.cmd}>
                                <span className={styles.prompt}>$</span> {text}
                                {current && typed < line.cmd.length && <span className={styles.caret} />}
                            </p>
                            {line.out && (!current || showOut) && <p className={styles.out}>{line.out}</p>}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
