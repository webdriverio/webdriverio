import React, { useState } from 'react'
import clsx from 'clsx'

import styles from './home.module.css'

const COMMANDS = {
    npm: 'npm init wdio@latest .',
    yarn: 'yarn create wdio .',
    pnpm: 'pnpm create wdio@latest .',
    bun: 'bun create wdio@latest .',
} as const

type Manager = keyof typeof COMMANDS

export default function InstallCommand () {
    const [manager, setManager] = useState<Manager>('npm')
    const [copied, setCopied] = useState(false)

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(COMMANDS[manager])
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            setCopied(false)
        }
    }

    return (
        <div className={styles.install}>
            <div className={styles.installTabs} role="tablist" aria-label="Package manager">
                {(Object.keys(COMMANDS) as Manager[]).map((name) => (
                    <button
                        key={name}
                        type="button"
                        role="tab"
                        aria-selected={manager === name}
                        className={clsx(styles.installTab, manager === name && styles.installTabActive)}
                        onClick={() => setManager(name)}
                    >
                        {name}
                    </button>
                ))}
            </div>
            <div className={styles.installCommand}>
                <code>
                    <span className={styles.prompt} aria-hidden="true">$</span> {COMMANDS[manager]}
                </code>
                <button type="button" className={styles.copyButton} onClick={copy} aria-label="Copy command">
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
        </div>
    )
}
