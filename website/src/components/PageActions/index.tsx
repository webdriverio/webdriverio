import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from '@docusaurus/router'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

import styles from './styles.module.css'

type CopyState = 'idle' | 'copied' | 'failed'

export function useMarkdownUrl () {
    const { pathname } = useLocation()
    const { siteConfig } = useDocusaurusContext()
    const markdownPath = `${pathname.replace(/\/$/, '')}.md`
    return { markdownPath, markdownUrl: `${siteConfig.url}${markdownPath}` }
}

const agentPrompt = (url: string) => `Read ${url} and help me with WebdriverIO based on it.`

export default function PageActions () {
    const { markdownPath, markdownUrl } = useMarkdownUrl()
    const [open, setOpen] = useState(false)
    const [copyState, setCopyState] = useState<CopyState>('idle')
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) {
            return
        }
        const close = (event: MouseEvent | KeyboardEvent) => {
            if (event instanceof KeyboardEvent ? event.key === 'Escape' : !ref.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', close)
        document.addEventListener('keydown', close)
        return () => {
            document.removeEventListener('mousedown', close)
            document.removeEventListener('keydown', close)
        }
    }, [open])

    const copy = async () => {
        try {
            const response = await fetch(markdownPath)
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }
            await navigator.clipboard.writeText(await response.text())
            setCopyState('copied')
        } catch {
            setCopyState('failed')
        }
        setTimeout(() => setCopyState('idle'), 2000)
    }

    const prompt = encodeURIComponent(agentPrompt(markdownUrl))
    const links = [
        { label: 'View as Markdown', description: 'Open this page as plain text', href: markdownPath },
        { label: 'Open in ChatGPT', description: 'Ask questions about this page', href: `https://chatgpt.com/?hints=search&q=${prompt}` },
        { label: 'Open in Claude', description: 'Ask questions about this page', href: `https://claude.ai/new?q=${prompt}` },
        { label: 'Open in Cursor', description: 'Use this page in your editor', href: `https://cursor.com/link/prompt?text=${prompt}` },
    ]

    return (
        <div className={styles.pageActions} ref={ref}>
            <div className={styles.buttonGroup}>
                <button type="button" className={styles.button} onClick={copy} title="Copy this page as Markdown for your coding agent">
                    <CopyIcon />
                    {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy page'}
                </button>
                <button
                    type="button"
                    className={styles.toggle}
                    aria-label="More page actions"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                >
                    <ChevronIcon />
                </button>
            </div>
            {open && (
                <ul className={styles.menu} role="menu">
                    {links.map((link) => (
                        <li key={link.label} role="none">
                            <a
                                role="menuitem"
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.menuItem}
                                onClick={() => setOpen(false)}
                            >
                                <span className={styles.menuLabel}>{link.label}</span>
                                <span className={styles.menuDescription}>{link.description}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

function CopyIcon () {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    )
}

function ChevronIcon () {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}
