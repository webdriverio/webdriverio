import React from 'react'
import clsx from 'clsx'

import { useStepper } from './useStepper'
import styles from './home.module.css'

const STEPS = [
    { command: 'url', args: '"/login"', time: '0.00s', target: undefined },
    { command: 'setValue', args: '"aria/Email"', time: '0.84s', target: 'email' },
    { command: 'setValue', args: '"aria/Password"', time: '1.12s', target: 'password' },
    { command: 'click', args: '"button=Log in"', time: '1.37s', target: 'button' },
    { command: 'expect', args: 'toHaveText("Welcome")', time: '2.05s', target: 'title' },
] as const

/**
 * A trace being replayed: every command of the test is listed with its
 * timing, and the snapshot highlights the element it acted on.
 */
export default function DevToolsDemo () {
    const { ref, step } = useStepper<HTMLDivElement>(STEPS.length, 1200, 2)
    const current = STEPS[Math.max(0, Math.min(step, STEPS.length) - 1)]
    const done = step >= STEPS.length

    return (
        <div className={styles.devtools} ref={ref} aria-label="WebdriverIO DevTools replaying a test trace">
            <div className={styles.windowBar}>
                <span /><span /><span />
                <em>WebdriverIO DevTools · trace-login.zip</em>
            </div>
            <div className={styles.devtoolsBody}>
                <ol className={styles.devtoolsSteps}>
                    {STEPS.map((s, i) => (
                        <li key={i} className={clsx(i < step && styles.devtoolsStepDone, current === s && styles.devtoolsStepActive)}>
                            <span className={styles.devtoolsTime}>{s.time}</span>
                            <code>{s.command}</code>
                            <span className={styles.devtoolsArgs}>{s.args}</span>
                        </li>
                    ))}
                </ol>
                <div className={styles.devtoolsSnapshot}>
                    <div className={clsx(styles.snapTitle, current.target === 'title' && styles.snapTarget)}>
                        {done ? 'Welcome' : 'Log in'}
                    </div>
                    <div className={clsx(styles.snapField, current.target === 'email' && styles.snapTarget)}>
                        {step >= 2 ? 'jane@example.com' : ''}
                    </div>
                    <div className={clsx(styles.snapField, current.target === 'password' && styles.snapTarget)}>
                        {step >= 3 ? '••••••••' : ''}
                    </div>
                    <div className={clsx(styles.snapButton, current.target === 'button' && styles.snapTarget)}>Log in</div>
                </div>
            </div>
            <div className={styles.devtoolsTimeline}>
                <div className={styles.devtoolsProgress} style={{ width: `${(Math.min(step, STEPS.length) / STEPS.length) * 100}%` }} />
            </div>
        </div>
    )
}
