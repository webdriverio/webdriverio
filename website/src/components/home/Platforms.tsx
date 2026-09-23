import React, { useState } from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import CodeBlock from '@theme/CodeBlock'
import { translate } from '@docusaurus/Translate'

import styles from './home.module.css'

const PLATFORMS = [{
    id: 'browser',
    label: 'Browser',
    title: translate({ id: 'homepage.platforms.browser.title', message: 'End-to-end and component tests in real browsers' }),
    points: [
        translate({ id: 'homepage.platforms.browser.p1', message: 'Chrome, Firefox, Safari and Edge through WebDriver and WebDriver BiDi' }),
        translate({ id: 'homepage.platforms.browser.p2', message: 'Component tests for React, Vue, Svelte, Solid, Preact, Lit and Stencil' }),
        translate({ id: 'homepage.platforms.browser.p3', message: 'Network mocking, emulation and auto-waiting built in' }),
    ],
    link: '/docs/platforms/web',
    file: 'test/specs/search.e2e.ts',
    code: `import { browser, $, expect } from '@wdio/globals'

describe('webdriver.io', () => {
    it('finds the docs search', async () => {
        await browser.url('https://webdriver.io')
        await $('.DocSearch-Button').click()
        await expect($('.DocSearch-Modal')).toBeDisplayed()
    })
})`
}, {
    id: 'mobile',
    label: 'Mobile',
    title: translate({ id: 'homepage.platforms.mobile.title', message: 'Native, hybrid and mobile web apps' }),
    points: [
        translate({ id: 'homepage.platforms.mobile.p1', message: 'iOS and Android via Appium, on simulators, emulators and real devices' }),
        translate({ id: 'homepage.platforms.mobile.p2', message: 'Switch between native and webview contexts in hybrid apps' }),
        translate({ id: 'homepage.platforms.mobile.p3', message: 'Gestures like tap, swipe and long press as first-class commands' }),
    ],
    link: '/docs/platforms/mobile',
    file: 'test/specs/login.e2e.ts',
    code: `import { $, expect } from '@wdio/globals'

describe('My app', () => {
    it('logs in', async () => {
        await $('~username').setValue('jane')
        await $('~password').setValue('s3cret')
        await $('~login').click()
        await expect($('~welcome')).toBeDisplayed()
    })
})`
}, {
    id: 'desktop',
    label: 'Desktop',
    title: translate({ id: 'homepage.platforms.desktop.title', message: 'Desktop apps on macOS, Windows and Linux' }),
    points: [
        translate({ id: 'homepage.platforms.desktop.p1', message: 'Electron, Tauri and Dioxus apps with dedicated services' }),
        translate({ id: 'homepage.platforms.desktop.p2', message: 'Native macOS apps through Appium Mac2' }),
        translate({ id: 'homepage.platforms.desktop.p3', message: 'Call main-process APIs and mock them from your tests' }),
    ],
    link: '/docs/platforms/desktop',
    file: 'test/specs/app.e2e.ts',
    code: `import { browser, expect } from '@wdio/globals'

describe('Electron app', () => {
    it('has the right name', async () => {
        const name = await browser.electron.execute(
            (electron) => electron.app.getName()
        )
        expect(name).toBe('My App')
    })
})`
}, {
    id: 'extensions',
    label: 'VS Code & Extensions',
    title: translate({ id: 'homepage.platforms.extensions.title', message: 'VS Code and browser extensions' }),
    points: [
        translate({ id: 'homepage.platforms.extensions.p1', message: 'Launch VS Code with your extension and drive the workbench' }),
        translate({ id: 'homepage.platforms.extensions.p2', message: 'Load Chrome and Firefox extensions into real browser sessions' }),
        translate({ id: 'homepage.platforms.extensions.p3', message: 'Page objects for the VS Code UI out of the box' }),
    ],
    link: '/docs/platforms/apps-and-extensions',
    file: 'test/specs/extension.e2e.ts',
    code: `import { browser, expect } from '@wdio/globals'

describe('My VS Code extension', () => {
    it('opens the workbench', async () => {
        const workbench = await browser.getWorkbench()
        expect(await workbench.getTitleBar().getTitle())
            .toContain('Visual Studio Code')
    })
})`
}, {
    id: 'visual',
    label: 'Visual',
    title: translate({ id: 'homepage.platforms.visual.title', message: 'Visual regression testing, everywhere' }),
    points: [
        translate({ id: 'homepage.platforms.visual.p1', message: 'Compare screens, elements and full pages against baselines' }),
        translate({ id: 'homepage.platforms.visual.p2', message: 'Works for web, mobile web, hybrid and native apps' }),
        translate({ id: 'homepage.platforms.visual.p3', message: 'Local, open source and free, with an HTML diff report' }),
    ],
    link: '/docs/visual-testing',
    file: 'test/specs/visual.e2e.ts',
    code: `import { browser, $, expect } from '@wdio/globals'

describe('Homepage', () => {
    it('looks right', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toMatchScreenSnapshot('homepage')
        await expect($('.navbar')).toMatchElementSnapshot('navbar')
    })
})`
}] as const

export default function Platforms () {
    const [active, setActive] = useState<string>(PLATFORMS[0].id)
    const platform = PLATFORMS.find((p) => p.id === active)!

    return (
        <div className={styles.platforms}>
            <div className={styles.platformTabs} role="tablist" aria-label="Platforms">
                {PLATFORMS.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        role="tab"
                        aria-selected={p.id === active}
                        className={clsx(styles.platformTab, p.id === active && styles.platformTabActive)}
                        onClick={() => setActive(p.id)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
            <div className={styles.platformPanel} role="tabpanel">
                <div className={styles.platformText}>
                    <h3>{platform.title}</h3>
                    <ul>
                        {platform.points.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                    <Link to={platform.link} className={styles.textLink}>
                        {translate({ id: 'homepage.platforms.learnMore', message: 'Read the guide' })} →
                    </Link>
                </div>
                <div className={styles.platformCode}>
                    <CodeBlock language="ts" title={platform.file}>{platform.code}</CodeBlock>
                </div>
            </div>
        </div>
    )
}
