import React from 'react'
import clsx from 'clsx'

import { useStepper } from './useStepper'
import styles from './home.module.css'

type Line =
    | { kind: 'user' | 'agent', text: string }
    | { kind: 'tool', server: string, tool: string, args: string }
    | { kind: 'result', text: string }

const LINES: Line[] = [
    { kind: 'user', text: 'Write a login test for localhost:3000 and make sure it passes.' },
    { kind: 'tool', server: 'webdriverio-docs', tool: 'search_docs', args: '"selectors best practices"' },
    { kind: 'tool', server: 'wdio-mcp', tool: 'start_session', args: '{ platform: "browser", browser: "chrome" }' },
    { kind: 'tool', server: 'wdio-mcp', tool: 'navigate', args: '"http://localhost:3000/login"' },
    { kind: 'tool', server: 'wdio-mcp', tool: 'get_elements', args: '{ }' },
    { kind: 'agent', text: 'Found the form. Writing test/specs/login.e2e.ts with aria selectors.' },
    { kind: 'tool', server: 'terminal', tool: 'npx wdio run', args: 'wdio.conf.ts --spec test/specs/login.e2e.ts' },
    { kind: 'result', text: '1 passing (2.4s)' },
]

/**
 * A coding agent solving a task with the WebdriverIO MCP server and the docs
 * MCP server, revealed line by line.
 */
export default function AgentDemo () {
    const { ref, step } = useStepper<HTMLDivElement>(LINES.length, 1100, 4)
    return (
        <div className={styles.agentWindow} ref={ref} aria-label="A coding agent writing a WebdriverIO test using MCP">
            <div className={styles.windowBar}>
                <span /><span /><span />
                <em>agent</em>
            </div>
            <div className={styles.agentBody}>
                {LINES.map((line, i) => (
                    <div key={i} className={clsx(styles.agentLine, i < step && styles.agentLineVisible)}>
                        {line.kind === 'user' && <p className={styles.agentUser}>{line.text}</p>}
                        {line.kind === 'agent' && <p className={styles.agentText}>{line.text}</p>}
                        {line.kind === 'tool' && (
                            <p className={styles.agentTool}>
                                <span className={styles.agentServer}>{line.server}</span>
                                <span className={styles.agentToolName}>{line.tool}</span>
                                <span className={styles.agentArgs}>{line.args}</span>
                            </p>
                        )}
                        {line.kind === 'result' && <p className={styles.agentResult}>✓ {line.text}</p>}
                    </div>
                ))}
            </div>
        </div>
    )
}
