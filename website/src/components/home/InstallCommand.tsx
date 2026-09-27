import React, { useState } from 'react'
import clsx from 'clsx'

import styles from './home.module.css'
import { panelId, tabId, useRovingTabs } from './useRovingTabs'

const COMMANDS = {
    npm: 'npm init wdio@latest .',
    yarn: 'yarn create wdio .',
    pnpm: 'pnpm create wdio@latest .',
    bun: 'bun create wdio@latest .',
} as const

type Manager = keyof typeof COMMANDS

const MANAGERS = Object.keys(COMMANDS) as Manager[]

export default function InstallCommand () {
    const { active: manager, setActive: setManager, onKeyDown } = useRovingTabs(MANAGERS, 'npm')
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
            <div className={styles.installTabs} role="tablist" aria-label="Package manager" onKeyDown={onKeyDown}>
                {MANAGERS.map((name) => (
                    <button
                        key={name}
                        id={tabId(name)}
                        type="button"
                        role="tab"
                        aria-selected={manager === name}
                        aria-controls={panelId(name)}
                        tabIndex={manager === name ? 0 : -1}
                        className={clsx(styles.installTab, manager === name && styles.installTabActive)}
                        onClick={() => setManager(name)}
                    >
                        {name}
                    </button>
                ))}
            </div>
            <div id={panelId(manager)} className={styles.installCommand} role="tabpanel" aria-labelledby={tabId(manager)}>
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
